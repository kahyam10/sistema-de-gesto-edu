// Sessão web: access token (JWT curto) + refresh token opaco com rotação,
// ambos em cookies httpOnly + Secure + SameSite=Strict. O navegador nunca
// enxerga nenhum dos dois tokens (proteção contra roubo por XSS).
//
// CSRF: todo login gera um csrfToken aleatório por sessão (família). Ele vai
// no claim "csrf" do access token e no CORPO das respostas de login/refresh/me
// (legível apenas pelas origens liberadas no CORS). O dashboard o mantém em
// memória e o reenvia no header X-CSRF-Token em toda escrita autenticada por
// cookie. Um site de terceiros consegue fazer o navegador mandar o cookie, mas
// não consegue ler o token — então a escrita falha.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CookieSerializeOptions } from "@fastify/cookie";
import { prisma } from "./prisma.js";

export const COOKIE_ACCESS = "ge_access";
export const COOKIE_REFRESH = "ge_refresh";
export const HEADER_CSRF = "x-csrf-token";

const minutos = (n: number) => n * 60 * 1000;
const dias = (n: number) => n * 24 * 60 * 60 * 1000;

const ACCESS_MIN = Number(process.env.ACCESS_TOKEN_MINUTOS ?? 15);
const REFRESH_DIAS = Number(process.env.REFRESH_TOKEN_DIAS ?? 7);
const SESSAO_MAX_DIAS = Number(process.env.SESSAO_MAX_DIAS ?? 30);
// Duas abas renovando ao mesmo tempo mandam o mesmo refresh token: dentro
// desta janela o reuso NÃO é tratado como roubo (a outra aba já recebeu o novo cookie).
const TOLERANCIA_REUSO_MS = 15_000;

const baseCookie: CookieSerializeOptions = {
  httpOnly: true,
  secure: true, // navegadores aceitam Secure em http://localhost
  sameSite: "strict",
};

export const cookieAccess = (): CookieSerializeOptions => ({
  ...baseCookie,
  path: "/",
  maxAge: Math.floor(minutos(ACCESS_MIN) / 1000),
});

export const cookieRefresh = (): CookieSerializeOptions => ({
  ...baseCookie,
  // Só trafega nas rotas de sessão (/api/auth/refresh e /api/auth/logout)
  path: "/api/auth",
  maxAge: Math.floor(dias(REFRESH_DIAS) / 1000),
});

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const tokenAleatorio = () => randomBytes(32).toString("base64url");

export function csrfConfere(esperado: string | undefined, recebido: unknown): boolean {
  if (!esperado || typeof recebido !== "string" || recebido.length !== esperado.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido));
}

export interface UsuarioSessao {
  id: string;
  email: string;
  nome: string;
  role: string;
  escolaId: string | null;
}

export interface ContextoRequisicao {
  ip?: string;
  userAgent?: string;
}

export const contextoDe = (request: FastifyRequest): ContextoRequisicao => ({
  ip: request.ip,
  userAgent: request.headers["user-agent"]?.slice(0, 300),
});

function assinarAccess(app: FastifyInstance, user: UsuarioSessao, csrf: string, sid: string) {
  return app.jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      escolaId: user.escolaId,
      csrf,
      sid,
    },
    { expiresIn: `${ACCESS_MIN}m` }
  );
}

function gravarCookies(reply: FastifyReply, access: string, refresh: string) {
  reply.setCookie(COOKIE_ACCESS, access, cookieAccess());
  reply.setCookie(COOKIE_REFRESH, refresh, cookieRefresh());
}

export function limparCookies(reply: FastifyReply) {
  reply.clearCookie(COOKIE_ACCESS, { ...baseCookie, path: "/" });
  reply.clearCookie(COOKIE_REFRESH, { ...baseCookie, path: "/api/auth" });
}

/** Login bem-sucedido: cria uma nova família de sessão e grava os cookies. */
export async function iniciarSessao(
  app: FastifyInstance,
  reply: FastifyReply,
  user: UsuarioSessao,
  ctx: ContextoRequisicao
): Promise<{ csrfToken: string }> {
  const refresh = tokenAleatorio();
  const csrfToken = tokenAleatorio();
  const familia = randomBytes(16).toString("hex");
  const agora = Date.now();
  await prisma.sessaoRefresh.create({
    data: {
      familia,
      tokenHash: hashToken(refresh),
      csrfToken,
      expiraEm: new Date(agora + dias(REFRESH_DIAS)),
      familiaExpiraEm: new Date(agora + dias(SESSAO_MAX_DIAS)),
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    },
  });
  gravarCookies(reply, assinarAccess(app, user, csrfToken, familia), refresh);
  return { csrfToken };
}

export type ResultadoRenovacao =
  | { ok: true; csrfToken: string; user: UsuarioSessao }
  | { ok: false; motivo: "AUSENTE" | "INVALIDO" | "EXPIRADO" | "REVOGADO" | "USUARIO_INATIVO" }
  | { ok: false; motivo: "CONCORRENTE" }
  | { ok: false; motivo: "REUSO_DETECTADO"; userId: string };

/** Troca o refresh token por um novo (rotação) e emite novo access token. */
export async function renovarSessao(
  app: FastifyInstance,
  reply: FastifyReply,
  refreshAtual: string | undefined,
  ctx: ContextoRequisicao
): Promise<ResultadoRenovacao> {
  if (!refreshAtual) return { ok: false, motivo: "AUSENTE" };
  const registro = await prisma.sessaoRefresh.findUnique({
    where: { tokenHash: hashToken(refreshAtual) },
    include: { user: true },
  });
  if (!registro) return { ok: false, motivo: "INVALIDO" };
  if (registro.revogadoEm) return { ok: false, motivo: "REVOGADO" };

  const agora = new Date();
  if (registro.rotacionadoEm) {
    if (agora.getTime() - registro.rotacionadoEm.getTime() <= TOLERANCIA_REUSO_MS) {
      return { ok: false, motivo: "CONCORRENTE" };
    }
    // Token antigo reapresentado depois da janela: alguém guardou uma cópia.
    await revogarFamilia(registro.familia, "REUSO_DETECTADO");
    return { ok: false, motivo: "REUSO_DETECTADO", userId: registro.userId };
  }
  if (registro.expiraEm <= agora || registro.familiaExpiraEm <= agora) {
    return { ok: false, motivo: "EXPIRADO" };
  }
  if (!registro.user.ativo) {
    await revogarFamilia(registro.familia, "USUARIO_INATIVO");
    return { ok: false, motivo: "USUARIO_INATIVO" };
  }

  const novo = tokenAleatorio();
  const expiraEm = new Date(
    Math.min(agora.getTime() + dias(REFRESH_DIAS), registro.familiaExpiraEm.getTime())
  );
  // Rotação atômica: só um request consegue marcar o token atual como rotacionado
  const trocou = await prisma.$transaction(async (tx) => {
    const marcado = await tx.sessaoRefresh.updateMany({
      where: { id: registro.id, rotacionadoEm: null, revogadoEm: null },
      data: { rotacionadoEm: agora },
    });
    if (marcado.count === 0) return false;
    await tx.sessaoRefresh.create({
      data: {
        familia: registro.familia,
        tokenHash: hashToken(novo),
        csrfToken: registro.csrfToken,
        expiraEm,
        familiaExpiraEm: registro.familiaExpiraEm,
        userId: registro.userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });
    return true;
  });
  if (!trocou) return { ok: false, motivo: "CONCORRENTE" };

  const u = registro.user;
  const user: UsuarioSessao = {
    id: u.id,
    email: u.email,
    nome: u.nome,
    role: u.role, // papel atualizado a cada renovação
    escolaId: u.escolaId,
  };
  gravarCookies(reply, assinarAccess(app, user, registro.csrfToken, registro.familia), novo);
  return { ok: true, csrfToken: registro.csrfToken, user };
}

export async function revogarFamilia(familia: string, motivo: string) {
  await prisma.sessaoRefresh.updateMany({
    where: { familia, revogadoEm: null },
    data: { revogadoEm: new Date(), motivoRevogacao: motivo },
  });
}

/** Logout: revoga a família do refresh token apresentado (se houver). */
export async function encerrarSessao(refreshAtual: string | undefined): Promise<string | null> {
  if (!refreshAtual) return null;
  const registro = await prisma.sessaoRefresh.findUnique({
    where: { tokenHash: hashToken(refreshAtual) },
    select: { familia: true, userId: true },
  });
  if (!registro) return null;
  await revogarFamilia(registro.familia, "LOGOUT");
  return registro.userId;
}
