// Testes HTTP da sessão web (cookies httpOnly + CSRF + refresh com rotação),
// do bloqueio de força bruta e da trilha de auditoria — via app.inject.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;

type Cookie = { name: string; value: string; path?: string; httpOnly?: boolean; secure?: boolean; sameSite?: string; maxAge?: number };

async function criarUsuario(email: string, role = "ADMIN", ativo = true) {
  return prisma.user.create({
    data: { email, nome: "Usuário de Teste", role, ativo, password: await bcrypt.hash(SENHA, 10) },
  });
}

function cookiesDe(res: { cookies: Cookie[] }) {
  const map: Record<string, Cookie> = {};
  for (const c of res.cookies) map[c.name] = c;
  return map;
}

async function login(email: string, password = SENHA) {
  const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password } });
  return { res, cookies: cookiesDe(res as never), body: res.json() };
}

beforeAll(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.sessaoRefresh.deleteMany();
  await prisma.user.deleteMany();
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("login e cookies de sessão", () => {
  it("login correto grava cookies httpOnly/Secure/Strict e NÃO devolve token no corpo", async () => {
    await criarUsuario("admin@teste.local");
    const { res, cookies, body } = await login("admin@teste.local");
    expect(res.statusCode).toBe(200);
    expect(body.token).toBeUndefined();
    expect(typeof body.csrfToken).toBe("string");
    expect(body.user.password).toBeUndefined();

    const access = cookies.ge_access;
    const refresh = cookies.ge_refresh;
    expect(access.httpOnly).toBe(true);
    expect(access.secure).toBe(true);
    expect(access.sameSite).toBe("Strict");
    expect(access.path).toBe("/");
    expect(refresh.httpOnly).toBe(true);
    expect(refresh.path).toBe("/api/auth");

    // Só o hash do refresh token vai para o banco
    const sessoes = await prisma.sessaoRefresh.findMany();
    expect(sessoes).toHaveLength(1);
    expect(sessoes[0].tokenHash).not.toBe(refresh.value);
  });

  it("senha errada → 401 genérico e LOGIN_FALHA auditado", async () => {
    const { res } = await login("admin@teste.local", "senha-errada-000");
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("Credenciais inválidas");
    const falha = await prisma.auditLog.findFirst({ where: { acao: "LOGIN_FALHA" } });
    expect(falha).not.toBeNull();
  });

  it("e-mail inexistente → mesma mensagem de senha errada", async () => {
    const { res } = await login("ninguem@teste.local");
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("Credenciais inválidas");
  });

  it("usuário inativo só descobre que está inativo acertando a senha", async () => {
    await criarUsuario("inativo@teste.local", "SECRETARIA", false);
    expect((await login("inativo@teste.local", "errada-errada-1")).res.json().error).toBe("Credenciais inválidas");
    expect((await login("inativo@teste.local")).res.json().error).toBe("Usuário inativo");
  });

  it("5 falhas seguidas bloqueiam a conta naquele IP (429), mesmo com a senha certa", async () => {
    _resetarLimiteLogin();
    await criarUsuario("alvo@teste.local");
    for (let i = 0; i < 5; i++) {
      expect((await login("alvo@teste.local", `tentativa-errada-${i}`)).res.statusCode).toBe(401);
    }
    const bloqueado = await login("alvo@teste.local");
    expect(bloqueado.res.statusCode).toBe(429);
    expect(bloqueado.res.headers["retry-after"]).toBeDefined();
    // Outras contas no mesmo IP seguem funcionando
    expect((await login("admin@teste.local")).res.statusCode).toBe(200);
    _resetarLimiteLogin();
  });
});

describe("autenticação por cookie + CSRF", () => {
  it("GET /api/auth/me com cookie devolve usuário e o mesmo csrfToken", async () => {
    const { cookies, body } = await login("admin@teste.local");
    const me = await app.inject({ method: "GET", url: "/api/auth/me", cookies: { ge_access: cookies.ge_access.value } });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("admin@teste.local");
    expect(me.json().csrfToken).toBe(body.csrfToken);
  });

  it("sem cookie e sem Bearer → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/escolas" });
    expect(res.statusCode).toBe(401);
  });

  it("escrita por cookie SEM X-CSRF-Token → 403; com token errado → 403; com o certo → passa", async () => {
    const { cookies, body } = await login("admin@teste.local");
    const c = { ge_access: cookies.ge_access.value };
    const sem = await app.inject({ method: "POST", url: "/api/escolas", cookies: c, payload: {} });
    expect(sem.statusCode).toBe(403);
    expect(sem.json().code).toBe("CSRF");

    const errado = await app.inject({
      method: "POST", url: "/api/escolas", cookies: c, payload: {},
      headers: { "x-csrf-token": "x".repeat(body.csrfToken.length) },
    });
    expect(errado.statusCode).toBe(403);

    const certo = await app.inject({
      method: "POST", url: "/api/escolas", cookies: c, payload: {},
      headers: { "x-csrf-token": body.csrfToken },
    });
    // Passou do guard: cai na validação do corpo vazio
    expect(certo.statusCode).toBe(400);
  });

  it("Bearer (app mobile/integrações) funciona sem CSRF", async () => {
    // Token de verdade (com "sid" de uma sessão viva): JWT sem sessão agora é 401
    const mob = await app.inject({
      method: "POST", url: "/api/auth/mobile/login", payload: { email: "admin@teste.local", password: SENHA },
    });
    expect(mob.statusCode).toBe(200);
    const token = mob.json().accessToken as string;
    const res = await app.inject({
      method: "POST", url: "/api/escolas", payload: {},
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("access token adulterado → 401", async () => {
    const { cookies } = await login("admin@teste.local");
    const adulterado = cookies.ge_access.value.slice(0, -3) + "abc";
    const res = await app.inject({ method: "GET", url: "/api/auth/me", cookies: { ge_access: adulterado } });
    expect(res.statusCode).toBe(401);
  });
});

describe("refresh token com rotação", () => {
  it("renova, rotaciona e mantém o mesmo csrfToken", async () => {
    const { cookies, body } = await login("admin@teste.local");
    const r = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: cookies.ge_refresh.value } });
    expect(r.statusCode).toBe(200);
    const novos = cookiesDe(r as never);
    expect(novos.ge_refresh.value).not.toBe(cookies.ge_refresh.value);
    expect(novos.ge_access.value).toBeTruthy();
    expect(r.json().csrfToken).toBe(body.csrfToken);
  });

  it("reuso imediato (duas abas) → 409 RETRY, sem derrubar a sessão", async () => {
    const { cookies } = await login("admin@teste.local");
    const antigo = cookies.ge_refresh.value;
    const r1 = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: antigo } });
    expect(r1.statusCode).toBe(200);
    const r2 = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: antigo } });
    expect(r2.statusCode).toBe(409);
    expect(r2.json().code).toBe("RETRY");
    const novo = cookiesDe(r1 as never).ge_refresh.value;
    const r3 = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: novo } });
    expect(r3.statusCode).toBe(200);
  });

  it("reuso de token antigo fora da janela → revoga a família inteira e audita", async () => {
    const { cookies } = await login("admin@teste.local");
    const antigo = cookies.ge_refresh.value;
    const r1 = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: antigo } });
    const novo = cookiesDe(r1 as never).ge_refresh.value;

    // Simula que o token antigo foi rotacionado há 1 minuto
    await prisma.sessaoRefresh.updateMany({
      where: { rotacionadoEm: { not: null }, revogadoEm: null },
      data: { rotacionadoEm: new Date(Date.now() - 60_000) },
    });

    const ataque = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: antigo } });
    expect(ataque.statusCode).toBe(401);
    // O token legítimo (novo) também deixa de valer
    const legitimo = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: novo } });
    expect(legitimo.statusCode).toBe(401);
    expect(await prisma.auditLog.count({ where: { acao: "SESSAO_REUSO_DETECTADO" } })).toBeGreaterThan(0);
  });

  it("usuário desativado não renova a sessão", async () => {
    const u = await criarUsuario("vai-sair@teste.local", "SECRETARIA");
    const { cookies } = await login("vai-sair@teste.local");
    await prisma.user.update({ where: { id: u.id }, data: { ativo: false } });
    const r = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: cookies.ge_refresh.value } });
    expect(r.statusCode).toBe(401);
  });

  it("refresh sem cookie → 401", async () => {
    const r = await app.inject({ method: "POST", url: "/api/auth/refresh" });
    expect(r.statusCode).toBe(401);
  });
});

describe("logout", () => {
  it("revoga no servidor: o refresh token deixa de valer", async () => {
    const { cookies } = await login("admin@teste.local");
    const out = await app.inject({ method: "POST", url: "/api/auth/logout", cookies: { ge_refresh: cookies.ge_refresh.value } });
    expect(out.statusCode).toBe(204);
    const r = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: cookies.ge_refresh.value } });
    expect(r.statusCode).toBe(401);
    expect(await prisma.auditLog.count({ where: { acao: "LOGOUT" } })).toBeGreaterThan(0);
  });

  it("RESPONSAVEL também consegue sair (rota pública de sessão)", async () => {
    await criarUsuario("resp@teste.local", "RESPONSAVEL");
    const { cookies } = await login("resp@teste.local");
    const out = await app.inject({ method: "POST", url: "/api/auth/logout", cookies: { ge_refresh: cookies.ge_refresh.value } });
    expect(out.statusCode).toBe(204);
  });
});

describe("register e auditoria", () => {
  it("register (admin) cria a conta e NÃO devolve token; exige senha ≥ 10", async () => {
    const { cookies, body } = await login("admin@teste.local");
    const headers = { "x-csrf-token": body.csrfToken };
    const c = { ge_access: cookies.ge_access.value };
    const curta = await app.inject({
      method: "POST", url: "/api/auth/register", cookies: c, headers,
      payload: { email: "nova@teste.local", password: "123456789", nome: "Nova" },
    });
    expect(curta.statusCode).toBe(400);
    const ok = await app.inject({
      method: "POST", url: "/api/auth/register", cookies: c, headers,
      payload: { email: "nova@teste.local", password: "senha-longa-123", nome: "Nova", role: "SECRETARIA" },
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.json().token).toBeUndefined();
  });

  it("GET /api/auditoria: ADMIN lê, SECRETARIA não", async () => {
    const admin = await login("admin@teste.local");
    const res = await app.inject({ method: "GET", url: "/api/auditoria?acao=LOGIN_SUCESSO", cookies: { ge_access: admin.cookies.ge_access.value } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThan(0);
    expect(res.json().data[0].acao).toBe("LOGIN_SUCESSO");

    const sec = await login("nova@teste.local", "senha-longa-123");
    const negado = await app.inject({ method: "GET", url: "/api/auditoria", cookies: { ge_access: sec.cookies.ge_access.value } });
    expect(negado.statusCode).toBe(403);
  });

  it("não existe rota para apagar eventos de auditoria", async () => {
    const admin = await login("admin@teste.local");
    const res = await app.inject({
      method: "DELETE", url: "/api/auditoria",
      cookies: { ge_access: admin.cookies.ge_access.value },
      headers: { "x-csrf-token": admin.body.csrfToken },
    });
    expect(res.statusCode).toBe(404);
  });
});
