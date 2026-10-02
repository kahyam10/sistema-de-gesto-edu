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
import type { Prisma } from "@prisma/client";
import { prisma, prismaSemEscopo } from "./prisma.js";

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

/** Cria uma nova família de sessão (login) e devolve os tokens em claro. */
async function criarFamilia(
  app: FastifyInstance,
  user: UsuarioSessao,
  ctx: ContextoRequisicao
) {
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
  return { access: assinarAccess(app, user, csrfToken, familia), refresh, csrfToken };
}

/** Login web: cria a sessão e grava os cookies httpOnly. */
export async function iniciarSessao(
  app: FastifyInstance,
  reply: FastifyReply,
  user: UsuarioSessao,
  ctx: ContextoRequisicao
): Promise<{ csrfToken: string }> {
  const t = await criarFamilia(app, user, ctx);
  gravarCookies(reply, t.access, t.refresh);
  return { csrfToken: t.csrfToken };
}

export interface TokensMobile {
  accessToken: string;
  refreshToken: string;
  /** segundos até o access token expirar */
  expiresIn: number;
}

/**
 * Login do app mobile: mesmos tokens, entregues no CORPO (não há cookie no app).
 * O app guarda os dois no expo-secure-store (Keychain/Keystore) e usa o access
 * como "Authorization: Bearer" — requisições Bearer não passam pelo CSRF.
 */
export async function iniciarSessaoMobile(
  app: FastifyInstance,
  user: UsuarioSessao,
  ctx: ContextoRequisicao
): Promise<TokensMobile> {
  const t = await criarFamilia(app, user, ctx);
  return { accessToken: t.access, refreshToken: t.refresh, expiresIn: ACCESS_MIN * 60 };
}

export type ResultadoRenovacao =
  | { ok: true; csrfToken: string; user: UsuarioSessao }
  | { ok: false; motivo: "AUSENTE" | "INVALIDO" | "EXPIRADO" | "REVOGADO" | "USUARIO_INATIVO" }
  | { ok: false; motivo: "CONCORRENTE" }
  | { ok: false; motivo: "REUSO_DETECTADO"; userId: string };

type ResultadoRotacao =
  | { ok: true; access: string; refresh: string; csrfToken: string; user: UsuarioSessao }
  | Exclude<ResultadoRenovacao, { ok: true }>;

// Motivo gravado no sucessor descartado por uma reemissão (resposta perdida
// no app). Esse token nunca chegou ao app: se alguém o apresentar, é cópia.
const MOTIVO_REEMITIDO = "REEMITIDO";

function usuarioDe(u: { id: string; email: string; nome: string; role: string; escolaId: string | null }): UsuarioSessao {
  // papel atualizado a cada renovação
  return { id: u.id, email: u.email, nome: u.nome, role: u.role, escolaId: u.escolaId };
}

type RegistroComUsuario = Prisma.SessaoRefreshGetPayload<{ include: { user: true } }>;

/**
 * App mobile: o servidor rotacionou, mas a resposta se perdeu (rede caiu, app
 * morto) e o app reapresenta o token antigo dentro da janela de tolerância.
 * Se o sucessor criado por aquela rotação AINDA NÃO FOI USADO, ele é revogado
 * (motivo REEMITIDO) e um novo par é emitido no lugar dele. O novo registro
 * herda o createdAt do sucessor (= rotacionadoEm do token antigo), então novas
 * repetições continuam presas à MESMA janela, que não se estende.
 * Devolve null quando não dá para reemitir (sucessor já usado ou corrida).
 */
async function reemitirSucessor(
  app: FastifyInstance,
  registro: RegistroComUsuario,
  ctx: ContextoRequisicao,
  agora: Date
): Promise<Extract<ResultadoRotacao, { ok: true }> | null> {
  const marco = registro.rotacionadoEm!;
  const sucessores = await prisma.sessaoRefresh.findMany({
    where: {
      familia: registro.familia,
      id: { not: registro.id },
      createdAt: marco,
      rotacionadoEm: null,
      revogadoEm: null,
    },
    select: { id: true },
    take: 2,
  });
  if (sucessores.length !== 1) return null;

  const novo = tokenAleatorio();
  const expiraEm = new Date(
    Math.min(agora.getTime() + dias(REFRESH_DIAS), registro.familiaExpiraEm.getTime())
  );
  const trocou = await prisma.$transaction(async (tx) => {
    const marcado = await tx.sessaoRefresh.updateMany({
      where: { id: sucessores[0].id, rotacionadoEm: null, revogadoEm: null },
      data: { revogadoEm: agora, motivoRevogacao: MOTIVO_REEMITIDO },
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
        createdAt: marco,
      },
    });
    return true;
  });
  if (!trocou) return null;
  const user = usuarioDe(registro.user);
  return {
    ok: true,
    access: assinarAccess(app, user, registro.csrfToken, registro.familia),
    refresh: novo,
    csrfToken: registro.csrfToken,
    user,
  };
}

/**
 * Troca o refresh token por um novo (rotação) e emite novo access token.
 * `reemitir`: só o app mobile (ver reemitirSucessor). Na web, duas abas
 * dividem o mesmo cookie e o 409 basta — reemitir lá revogaria o cookie que a
 * outra aba acabou de gravar.
 */
async function rotacionar(
  app: FastifyInstance,
  refreshAtual: string | undefined,
  ctx: ContextoRequisicao,
  reemitir = false
): Promise<ResultadoRotacao> {
  if (!refreshAtual) return { ok: false, motivo: "AUSENTE" };
  const registro = await prisma.sessaoRefresh.findUnique({
    where: { tokenHash: hashToken(refreshAtual) },
    include: { user: true },
  });
  if (!registro) return { ok: false, motivo: "INVALIDO" };
  if (registro.revogadoEm) {
    if (registro.motivoRevogacao === MOTIVO_REEMITIDO) {
      // Sucessor que nunca chegou ao app legítimo sendo usado: alguém o copiou
      await revogarFamilia(registro.familia, "REUSO_DETECTADO");
      return { ok: false, motivo: "REUSO_DETECTADO", userId: registro.userId };
    }
    return { ok: false, motivo: "REVOGADO" };
  }

  const agora = new Date();
  if (registro.rotacionadoEm) {
    if (agora.getTime() - registro.rotacionadoEm.getTime() <= TOLERANCIA_REUSO_MS) {
      if (
        reemitir &&
        registro.familiaExpiraEm > agora &&
        registro.user.ativo
      ) {
        const r = await reemitirSucessor(app, registro, ctx, agora);
        if (r) return r;
      }
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
        // = rotacionadoEm do antecessor: identifica o sucessor numa reemissão
        createdAt: agora,
      },
    });
    return true;
  });
  if (!trocou) return { ok: false, motivo: "CONCORRENTE" };

  const user = usuarioDe(registro.user);
  return {
    ok: true,
    access: assinarAccess(app, user, registro.csrfToken, registro.familia),
    refresh: novo,
    csrfToken: registro.csrfToken,
    user,
  };
}

/** Renovação web: grava os novos cookies. */
export async function renovarSessao(
  app: FastifyInstance,
  reply: FastifyReply,
  refreshAtual: string | undefined,
  ctx: ContextoRequisicao
): Promise<ResultadoRenovacao> {
  const r = await rotacionar(app, refreshAtual, ctx);
  if (!r.ok) return r;
  gravarCookies(reply, r.access, r.refresh);
  return { ok: true, csrfToken: r.csrfToken, user: r.user };
}

/** Renovação mobile: devolve os novos tokens no corpo. */
export async function renovarSessaoMobile(
  app: FastifyInstance,
  refreshAtual: string | undefined,
  ctx: ContextoRequisicao
): Promise<
  | { ok: true; tokens: TokensMobile; user: UsuarioSessao }
  | Exclude<ResultadoRenovacao, { ok: true }>
> {
  const r = await rotacionar(app, refreshAtual, ctx, true);
  if (!r.ok) return r;
  return {
    ok: true,
    user: r.user,
    tokens: { accessToken: r.access, refreshToken: r.refresh, expiresIn: ACCESS_MIN * 60 },
  };
}

/**
 * O access token (JWT) sozinho continuaria valendo até expirar mesmo depois
 * de logout, reuso detectado ou desativação do usuário. O guard chama isto em
 * TODA requisição autenticada: a família do claim "sid" precisa existir, não
 * estar revogada nem expirada, pertencer ao usuário do token e o usuário estar
 * ativo. Uma consulta por chave (familia é indexada), select mínimo.
 */
export async function sessaoValida(sid: unknown, userId: unknown): Promise<boolean> {
  if (typeof sid !== "string" || sid.length === 0 || typeof userId !== "string") return false;
  const registro = await prismaSemEscopo.sessaoRefresh.findFirst({
    where: {
      familia: sid,
      userId,
      revogadoEm: null,
      familiaExpiraEm: { gt: new Date() },
      user: { ativo: true },
    },
    select: { id: true },
  });
  return registro !== null;
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
