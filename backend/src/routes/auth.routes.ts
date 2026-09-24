import { FastifyInstance } from "fastify";
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
  limparCookies,
  renovarSessao,
} from "../lib/sessao.js";
import { limparFalhas, registrarFalha, segundosBloqueado } from "../lib/limite-login.js";
import { auditar } from "../lib/auditoria.js";

export async function authRoutes(app: FastifyInstance) {
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

  // Login — cria a sessão em cookies httpOnly. O corpo traz só o usuário e o
  // csrfToken (nunca o token de acesso).
  app.post(
    "/login",
    // Teto por IP (inclui acertos); o bloqueio fino por conta é o limite-login
    { config: { rateLimit: { max: Number(process.env.LOGIN_MAX_POR_IP ?? 60), timeWindow: "15 minutes" } } },
    async (request, reply) => {
      let email = "";
      try {
        const data = loginSchema.parse(request.body);
        email = data.email;

        const espera = segundosBloqueado(request.ip, email);
        if (espera > 0) {
          return reply
            .status(429)
            .header("Retry-After", String(espera))
            .send({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
        }

        const user = await authService.login(data);
        limparFalhas(request.ip, email);

        const { csrfToken } = await iniciarSessao(
          app,
          reply,
          {
            id: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role,
            escolaId: user.escolaId ?? null,
          },
          contextoDe(request)
        );
        await auditar(request, { acao: "LOGIN_SUCESSO", userId: user.id, userRole: user.role });

        return reply.send({ user, csrfToken });
      } catch (error: unknown) {
        if (error instanceof LoginInvalidoError) {
          registrarFalha(request.ip, email);
          await auditar(request, {
            acao: "LOGIN_FALHA",
            userId: error.userId,
            userRole: null,
            detalhes: { motivo: error.motivo },
          });
          return reply.status(401).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        request.log.error(error);
        return reply.status(500).send({ error: "Erro ao fazer login" });
      }
    }
  );

  // Renova a sessão (rotação do refresh token). Autenticada pelo cookie de refresh.
  app.post(
    "/refresh",
    { config: { rateLimit: { max: 120, timeWindow: "15 minutes" } } },
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
