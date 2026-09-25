import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError, formatarErroZod } from "../errors/index.js";
import { ZodError } from "zod";
import { authService } from "../services/index.js";
import { LoginInvalidoError } from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../schemas/index.js";
import { adminMiddleware } from "../middleware/auth.js";
import {
  COOKIE_REFRESH,
  contextoDe,
  encerrarSessao,
  iniciarSessao,
  iniciarSessaoMobile,
  limparCookies,
  renovarSessao,
  renovarSessaoMobile,
} from "../lib/sessao.js";
import { z } from "zod";
import { limparFalhas, registrarFalha, segundosBloqueado } from "../lib/limite-login.js";
import { auditar } from "../lib/auditoria.js";

const refreshBodySchema = z.object({ refreshToken: z.string().min(20).max(200) });

type UsuarioLogin = Awaited<ReturnType<typeof authService.login>>;

export async function authRoutes(app: FastifyInstance) {
  const limiteLogin = {
    config: { rateLimit: { max: Number(process.env.LOGIN_MAX_POR_IP ?? 60), timeWindow: "15 minutes" } },
  };
  const limiteRefresh = { config: { rateLimit: { max: 120, timeWindow: "15 minutes" } } };

  /**
   * Valida credenciais com bloqueio de força bruta e auditoria. Compartilhado
   * pelo login web (cookies) e mobile (tokens no corpo). Devolve o usuário ou
   * null quando a resposta de erro já foi enviada.
   */
  async function autenticar(
    request: FastifyRequest,
    reply: FastifyReply,
    cliente: "web" | "mobile"
  ): Promise<UsuarioLogin | null> {
    let email = "";
    try {
      const data = loginSchema.parse(request.body);
      email = data.email;
      const espera = segundosBloqueado(request.ip, email);
      if (espera > 0) {
        reply
          .status(429)
          .header("Retry-After", String(espera))
          .send({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
        return null;
      }
      const user = await authService.login(data);
      limparFalhas(request.ip, email);
      await auditar(request, {
        acao: "LOGIN_SUCESSO",
        userId: user.id,
        userRole: user.role,
        detalhes: { cliente },
      });
      return user;
    } catch (error: unknown) {
      if (error instanceof LoginInvalidoError) {
        registrarFalha(request.ip, email);
        await auditar(request, {
          acao: "LOGIN_FALHA",
          userId: error.userId,
          userRole: null,
          detalhes: { motivo: error.motivo, cliente },
        });
        reply.status(401).send({ error: error.message });
        return null;
      }
      if (error instanceof ZodError) {
        reply.status(400).send(formatarErroZod(error));
        return null;
      }
      throw error;
    }
  }

  const usuarioSessao = (user: UsuarioLogin) => ({
    id: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    escolaId: user.escolaId ?? null,
  });

  // Registro de usuário — restrito a ADMIN/SEMEC (o schema aceita role,
  // então registro público permitiria criar contas ADMIN).
  // Não devolve token: quem cria a conta é o admin, não o novo usuário.
  app.post("/register", { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);
      const user = await authService.register(data);
      return reply.status(201).send({ user });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply.status(400).send(formatarErroZod(error));
      }
      const message =
        error instanceof Error ? error.message : "Erro ao registrar usuário";
      return reply.status(400).send({ error: message });
    }
  });

  // Login web — cria a sessão em cookies httpOnly. O corpo traz só o usuário
  // e o csrfToken (nunca o token de acesso).
  app.post("/login", limiteLogin, async (request, reply) => {
    try {
      const user = await autenticar(request, reply, "web");
      if (!user) return reply;
      const { csrfToken } = await iniciarSessao(app, reply, usuarioSessao(user), contextoDe(request));
      return reply.send({ user, csrfToken });
    } catch (error: unknown) {
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao fazer login" });
    }
  });

  // Renova a sessão (rotação do refresh token). Autenticada pelo cookie de refresh.
  app.post(
    "/refresh",
    limiteRefresh,
    async (request, reply) => {
      const r = await renovarSessao(app, reply, request.cookies[COOKIE_REFRESH], contextoDe(request));
      if (r.ok) {
        return reply.send({ user: r.user, csrfToken: r.csrfToken });
      }
      if (r.motivo === "CONCORRENTE") {
        // Outra aba acabou de renovar: o cookie novo já está no navegador
        return reply.status(409).send({ error: "Sessão renovada por outra aba", code: "RETRY" });
      }
      if (r.motivo === "REUSO_DETECTADO") {
        await auditar(request, { acao: "SESSAO_REUSO_DETECTADO", userId: r.userId, userRole: null });
      }
      limparCookies(reply);
      return reply.status(401).send({ error: "Sessão expirada" });
    }
  );

  // Logout — revoga a sessão no servidor (o refresh token deixa de valer).
  app.post("/logout", async (request, reply) => {
    const userId = await encerrarSessao(request.cookies[COOKIE_REFRESH]);
    if (userId) {
      await auditar(request, { acao: "LOGOUT", userId, userRole: null });
    }
    limparCookies(reply);
    return reply.status(204).send();
  });

  // ==================== APP MOBILE ====================
  // Sem cookies: os tokens vão no corpo e o app os guarda no expo-secure-store.
  // O access token é usado como Bearer (sem CSRF); o refresh é rotativo com a
  // mesma detecção de reuso da sessão web.

  app.post("/mobile/login", limiteLogin, async (request, reply) => {
    try {
      const user = await autenticar(request, reply, "mobile");
      if (!user) return reply;
      const tokens = await iniciarSessaoMobile(app, usuarioSessao(user), contextoDe(request));
      return reply.send({ user, ...tokens });
    } catch (error: unknown) {
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao fazer login" });
    }
  });

  app.post("/mobile/refresh", limiteRefresh, async (request, reply) => {
    const parsed = refreshBodySchema.safeParse(request.body);
    if (!parsed.success) return reply.status(401).send({ error: "Sessão expirada" });
    const r = await renovarSessaoMobile(app, parsed.data.refreshToken, contextoDe(request));
    if (r.ok) return reply.send({ user: r.user, ...r.tokens });
    if (r.motivo === "CONCORRENTE") {
      return reply.status(409).send({ error: "Sessão renovada em outra requisição", code: "RETRY" });
    }
    if (r.motivo === "REUSO_DETECTADO") {
      await auditar(request, { acao: "SESSAO_REUSO_DETECTADO", userId: r.userId, userRole: null });
    }
    return reply.status(401).send({ error: "Sessão expirada" });
  });

  app.post("/mobile/logout", async (request, reply) => {
    const parsed = refreshBodySchema.safeParse(request.body);
    const userId = parsed.success ? await encerrarSessao(parsed.data.refreshToken) : null;
    if (userId) await auditar(request, { acao: "LOGOUT", userId, userRole: null });
    return reply.status(204).send();
  });

  // Usuário logado + csrfToken da sessão (reidrata o dashboard após reload)
  app.get("/me", async (request, reply) => {
    try {
      const user = await authService.getUserById(request.user.id);
      if (!user || !user.ativo) {
        return reply.status(401).send({ error: "Não autorizado" });
      }
      return reply.send({ user, csrfToken: request.user.csrf ?? null });
    } catch (error: unknown) {
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao buscar usuário" });
    }
  });
}
