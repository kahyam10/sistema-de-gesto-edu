// Sessão: access token revogado deixa de valer na hora, reemissão do refresh
// com resposta perdida (app mobile), limite de login persistente + teto por
// conta, e expurgo de refresh tokens. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin, hashEmailLogin, MAX_FALHAS_CONTA } from "../src/lib/limite-login.js";
import { expurgarSessoesAntigas, RETENCAO_SESSOES_DIAS } from "../src/lib/expurgo-sessoes.js";
import { hashToken } from "../src/lib/sessao.js";

const SENHA = "senha-de-teste-forte-fa-2";
let app: FastifyInstance;

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

async function criarUsuario(email: string, role = "SEMEC") {
  return prisma.user.create({
    data: { email, nome: "Usuário Fictício FA", role, password: await bcrypt.hash(SENHA, 10) },
  });
}

async function loginMobile(email: string, password = SENHA, remoteAddress?: string) {
  return app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password }, remoteAddress });
}

const refreshMobile = (refreshToken: string) =>
  app.inject({ method: "POST", url: "/api/auth/mobile/refresh", payload: { refreshToken } });

const me = (token: string) => app.inject({ method: "GET", url: "/api/auth/me", headers: bearer(token) });

beforeAll(async () => {
  await prisma.sessaoRefresh.deleteMany();
  await prisma.auditLog.deleteMany();
  // Só os usuários deste arquivo: outros arquivos deixam dados que referenciam os deles
  await prisma.user.deleteMany({ where: { email: { startsWith: "fa-" } } });
  app = await buildApp();
  await app.ready();
  await criarUsuario("fa-sessao@teste.local");
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  _resetarLimiteLogin();
});

describe("access token conferido contra a sessão a cada requisição", () => {
  it("logout mobile → o access token antigo passa a dar 401", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    expect((await me(l.accessToken)).statusCode).toBe(200);
    const out = await app.inject({ method: "POST", url: "/api/auth/mobile/logout", payload: { refreshToken: l.refreshToken } });
    expect(out.statusCode).toBe(204);
    expect((await me(l.accessToken)).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/api/escolas", headers: bearer(l.accessToken) })).statusCode).toBe(401);
  });

  it("logout web → o cookie de acesso antigo passa a dar 401", async () => {
    const l = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "fa-sessao@teste.local", password: SENHA } });
    const ck = Object.fromEntries((l.cookies as Array<{ name: string; value: string }>).map((c) => [c.name, c.value]));
    const antes = await app.inject({ method: "GET", url: "/api/auth/me", cookies: { ge_access: ck.ge_access } });
    expect(antes.statusCode).toBe(200);
    await app.inject({ method: "POST", url: "/api/auth/logout", cookies: { ge_refresh: ck.ge_refresh } });
    const depois = await app.inject({ method: "GET", url: "/api/auth/me", cookies: { ge_access: ck.ge_access } });
    expect(depois.statusCode).toBe(401);
  });

  it("usuário desativado → 401 imediato com token ainda dentro da validade", async () => {
    const u = await criarUsuario("fa-desativar@teste.local");
    const l = (await loginMobile("fa-desativar@teste.local")).json();
    expect((await me(l.accessToken)).statusCode).toBe(200);
    await prisma.user.update({ where: { id: u.id }, data: { ativo: false } });
    expect((await me(l.accessToken)).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/api/escolas", headers: bearer(l.accessToken) })).statusCode).toBe(401);
  });

  it("reuso detectado → access tokens da família (antigo e novo) dão 401", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    const r1 = await refreshMobile(l.refreshToken);
    expect(r1.statusCode).toBe(200);
    const novoAccess = r1.json().accessToken;
    expect((await me(novoAccess)).statusCode).toBe(200);
    // token antigo reapresentado fora da janela de tolerância
    await prisma.sessaoRefresh.update({
      where: { tokenHash: hashToken(l.refreshToken) },
      data: { rotacionadoEm: new Date(Date.now() - 60_000) },
    });
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(401);
    expect((await me(novoAccess)).statusCode).toBe(401);
    expect((await me(l.accessToken)).statusCode).toBe(401);
  });

  it("JWT assinado sem sid (ou com sid de outra pessoa) → 401", async () => {
    const u = await prisma.user.findUniqueOrThrow({ where: { email: "fa-sessao@teste.local" } });
    const semSid = app.jwt.sign({ id: u.id, email: u.email, nome: u.nome, role: u.role });
    expect((await me(semSid)).statusCode).toBe(401);
    const outro = await criarUsuario("fa-outro@teste.local");
    const l = (await loginMobile("fa-outro@teste.local")).json();
    const sidAlheio = (app.jwt.decode(l.accessToken) as { sid: string }).sid;
    const forjado = app.jwt.sign({ id: u.id, email: u.email, nome: u.nome, role: u.role, sid: sidAlheio });
    expect((await me(forjado)).statusCode).toBe(401);
    expect(outro.id).not.toBe(u.id);
  });

  it("sessão com limite absoluto vencido → 401", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    const sid = (app.jwt.decode(l.accessToken) as { sid: string }).sid;
    await prisma.sessaoRefresh.updateMany({ where: { familia: sid }, data: { familiaExpiraEm: new Date(Date.now() - 1000) } });
    expect((await me(l.accessToken)).statusCode).toBe(401);
  });
});

describe("refresh mobile com resposta perdida", () => {
  it("reapresentar o token antigo na janela, com sucessor intacto → novo par válido", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    const perdida = await refreshMobile(l.refreshToken); // resposta "perdida"
    expect(perdida.statusCode).toBe(200);
    const r = await refreshMobile(l.refreshToken);
    expect(r.statusCode).toBe(200);
    const par = r.json();
    expect(par.refreshToken).not.toBe(perdida.json().refreshToken);
    expect((await me(par.accessToken)).statusCode).toBe(200);
    // o sucessor perdido foi revogado como REEMITIDO
    const suc = await prisma.sessaoRefresh.findUniqueOrThrow({ where: { tokenHash: hashToken(perdida.json().refreshToken) } });
    expect(suc.motivoRevogacao).toBe("REEMITIDO");
    // o novo par segue rotacionando normalmente
    const seguinte = await refreshMobile(par.refreshToken);
    expect(seguinte.statusCode).toBe(200);
    expect((await me(seguinte.json().accessToken)).statusCode).toBe(200);
  });

  it("várias perdas seguidas dentro da janela continuam recuperáveis", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(200);
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(200);
    const ultimo = await refreshMobile(l.refreshToken);
    expect(ultimo.statusCode).toBe(200);
    expect((await refreshMobile(ultimo.json().refreshToken)).statusCode).toBe(200);
  });

  it("sucessor descartado reaparecendo (cópia) → reuso: revoga a família inteira", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    const perdida = (await refreshMobile(l.refreshToken)).json();
    const legitimo = (await refreshMobile(l.refreshToken)).json();
    const ataque = await refreshMobile(perdida.refreshToken);
    expect(ataque.statusCode).toBe(401);
    expect((await me(legitimo.accessToken)).statusCode).toBe(401);
    expect((await refreshMobile(legitimo.refreshToken)).statusCode).toBe(401);
    expect(await prisma.auditLog.count({ where: { acao: "SESSAO_REUSO_DETECTADO" } })).toBeGreaterThan(0);
  });

  it("sucessor já usado → 409 (sem novo par), e fora da janela → reuso detectado", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    const r1 = (await refreshMobile(l.refreshToken)).json();
    const r2 = await refreshMobile(r1.refreshToken);
    expect(r2.statusCode).toBe(200);
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(409);
    await prisma.sessaoRefresh.update({
      where: { tokenHash: hashToken(l.refreshToken) },
      data: { rotacionadoEm: new Date(Date.now() - 60_000) },
    });
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(401);
    expect((await me(r2.json().accessToken)).statusCode).toBe(401);
  });

  it("a janela não se estende com as repetições", async () => {
    const l = (await loginMobile("fa-sessao@teste.local")).json();
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(200);
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(200);
    // passou a janela contada da PRIMEIRA rotação
    await prisma.sessaoRefresh.update({
      where: { tokenHash: hashToken(l.refreshToken) },
      data: { rotacionadoEm: new Date(Date.now() - 60_000) },
    });
    expect((await refreshMobile(l.refreshToken)).statusCode).toBe(401);
  });

  it("web (cookie) mantém o 409 para abas concorrentes", async () => {
    const l = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "fa-sessao@teste.local", password: SENHA } });
    const ref = (l.cookies as Array<{ name: string; value: string }>).find((c) => c.name === "ge_refresh")!.value;
    expect((await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: ref } })).statusCode).toBe(200);
    expect((await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { ge_refresh: ref } })).statusCode).toBe(409);
  });
});

describe("limite de login persistente", () => {
  it("falhas já gravadas na trilha (antes de um restart) continuam bloqueando", async () => {
    await criarUsuario("fa-restart@teste.local");
    const h = hashEmailLogin("fa-restart@teste.local");
    await prisma.auditLog.createMany({
      data: Array.from({ length: 5 }, () => ({
        acao: "LOGIN_FALHA", ip: "10.9.9.9", detalhes: { motivo: "CREDENCIAIS", cliente: "web", emailHash: h },
      })),
    });
    const r = await loginMobile("fa-restart@teste.local", SENHA, "10.9.9.9");
    expect(r.statusCode).toBe(429);
    expect(Number(r.headers["retry-after"])).toBeGreaterThan(0);
    // outra origem não é afetada pelo limite IP+e-mail
    expect((await loginMobile("fa-restart@teste.local", SENHA, "10.9.9.8")).statusCode).toBe(200);
  });

  it("e-mail em claro não vai para a trilha; o hash sim", async () => {
    await loginMobile("FA-Sessao@teste.local", "errada-errada-1", "10.1.1.1");
    const falha = await prisma.auditLog.findFirst({ where: { acao: "LOGIN_FALHA", ip: "10.1.1.1" }, orderBy: { createdAt: "desc" } });
    expect(JSON.stringify(falha?.detalhes)).not.toContain("teste.local");
    expect((falha?.detalhes as { emailHash?: string }).emailHash).toBe(hashEmailLogin("fa-sessao@teste.local"));
  });

  it("5 falhas no mesmo IP bloqueiam; sucesso anterior zera a contagem", async () => {
    await criarUsuario("fa-ip@teste.local");
    for (let i = 0; i < 4; i++) expect((await loginMobile("fa-ip@teste.local", `errada-${i}-xx`, "10.2.2.2")).statusCode).toBe(401);
    expect((await loginMobile("fa-ip@teste.local", SENHA, "10.2.2.2")).statusCode).toBe(200);
    // depois do sucesso, mais 4 falhas ainda não bloqueiam
    for (let i = 0; i < 4; i++) expect((await loginMobile("fa-ip@teste.local", `errada-${i}-yy`, "10.2.2.2")).statusCode).toBe(401);
    expect((await loginMobile("fa-ip@teste.local", "errada-final", "10.2.2.2")).statusCode).toBe(401);
    expect((await loginMobile("fa-ip@teste.local", SENHA, "10.2.2.2")).statusCode).toBe(429);
  });

  it("teto por conta: falhas espalhadas por vários IPs bloqueiam todas as origens", async () => {
    await criarUsuario("fa-conta@teste.local");
    for (let i = 0; i < MAX_FALHAS_CONTA; i++) {
      const ip = `10.3.${Math.floor(i / 4)}.${(i % 4) + 1}`; // 4 por IP: abaixo do limite IP+e-mail
      expect((await loginMobile("fa-conta@teste.local", `errada-${i}-zz`, ip)).statusCode).toBe(401);
    }
    const r = await loginMobile("fa-conta@teste.local", SENHA, "10.4.4.4");
    expect(r.statusCode).toBe(429);
    expect(Number(r.headers["retry-after"])).toBeGreaterThan(0);
    expect(r.json().error).toMatch(/Muitas tentativas/);
  });

  it("teto por conta não revela se o e-mail existe (mesma resposta)", async () => {
    for (let i = 0; i < MAX_FALHAS_CONTA; i++) {
      const ip = `10.5.${Math.floor(i / 4)}.${(i % 4) + 1}`;
      expect((await loginMobile("fa-ninguem@teste.local", `errada-${i}-ww`, ip)).statusCode).toBe(401);
    }
    const r = await loginMobile("fa-ninguem@teste.local", SENHA, "10.6.6.6");
    expect(r.statusCode).toBe(429);
    expect(r.json().error).toMatch(/Muitas tentativas/);
  });
});

describe("expurgo de refresh tokens", () => {
  it("apaga só sessões expiradas/revogadas há mais de RETENCAO_SESSOES_DIAS", async () => {
    await prisma.sessaoRefresh.deleteMany();
    const u = await prisma.user.findUniqueOrThrow({ where: { email: "fa-sessao@teste.local" } });
    const agora = new Date();
    const d = (dias: number) => new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
    const base = { csrfToken: "csrf-ficticio", userId: u.id, expiraEm: d(1), familiaExpiraEm: d(10) };
    const linhas = [
      { familia: "fa-exp-velha", familiaExpiraEm: d(-RETENCAO_SESSOES_DIAS - 1), expiraEm: d(-RETENCAO_SESSOES_DIAS - 5) },
      { familia: "fa-exp-recente", familiaExpiraEm: d(-RETENCAO_SESSOES_DIAS + 1), expiraEm: d(-RETENCAO_SESSOES_DIAS) },
      { familia: "fa-rev-velha", revogadoEm: d(-RETENCAO_SESSOES_DIAS - 1) },
      { familia: "fa-rev-recente", revogadoEm: d(-2) },
      { familia: "fa-viva" },
      { familia: "fa-viva", rotacionadoEm: d(-1) },
    ];
    let n = 0;
    for (const l of linhas) await prisma.sessaoRefresh.create({ data: { ...base, ...l, tokenHash: `fa-hash-${n++}` } });

    expect(await expurgarSessoesAntigas(agora)).toBe(2);
    const restantes = (await prisma.sessaoRefresh.findMany({ select: { familia: true } })).map((r) => r.familia).sort();
    expect(restantes).toEqual(["fa-exp-recente", "fa-rev-recente", "fa-viva", "fa-viva"]);
  });
});
