// Frente J: exportações, licenças e ponto só para ADMIN, SEMEC e COORDENADOR,
// o coordenador limitado à própria escola (escopo da sessão, nunca o parâmetro).
// DIRETOR, SECRETARIA e PROFESSOR recebem 403 em leitura e escrita.
// Dados fictícios (sufixo fj57).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { cenarioDuasEscolas, entrar, itens, SENHA } from "./fb-cenario.js";

const ANO = 2057; // ano letivo exclusivo deste arquivo
let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
let anoLetivoId: string;
const em: Record<string, string> = {}; // papel → e-mail
const ids: Record<string, string> = {};
const tokens = new Map<string, { authorization: string }>();
const req = async (email: string, method: string, url: string, payload?: unknown) => {
  if (!tokens.has(email)) tokens.set(email, await entrar(app, email));
  return app.inject({ method: method as "GET", url, headers: tokens.get(email)!, ...(payload ? { payload: payload as object } : {}) });
};
const licenca = (profissionalId: string) =>
  prisma.licenca.create({
    data: { profissionalId, tipo: "FERIAS", dataInicio: new Date("2026-07-01"), dataFim: new Date("2026-07-05"), diasCorridos: 5 },
  });

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas("fj57");
  const hash = await bcrypt.hash(SENHA, 4);
  const user = (chave: string, role: string, escolaId?: string) =>
    prisma.user.create({
      data: { email: `${chave}-fj57@teste.local`, nome: `${chave} fj57`, role, password: hash, ...(escolaId ? { escolaId } : {}) },
    });
  em.ADMIN = c.uAdmin.email;
  em.SECRETARIA = c.uSecA.email;
  em.PROFESSOR = c.uProfA.email;
  em.SEMEC = (await user("semec", "SEMEC")).email;
  em.DIRETOR = (await user("dir-a", "DIRETOR", c.escolaA.id)).email;
  em.COORDENADOR = (await user("coord-a", "COORDENADOR", c.escolaA.id)).email;

  for (const k of ["licA", "licA2", "licA3", "licB", "licB2"]) {
    ids[k] = (await licenca(k.startsWith("licA") ? c.profA.id : c.profB.id)).id;
  }
  ids.pontoA = (await prisma.ponto.create({ data: { profissionalId: c.profA.id, escolaId: c.escolaA.id, data: new Date("2026-03-02"), entrada: "07:00" } })).id;
  ids.pontoB = (await prisma.ponto.create({ data: { profissionalId: c.profB.id, escolaId: c.escolaB.id, data: new Date("2026-03-02"), entrada: "07:00" } })).id;
  anoLetivoId = (await prisma.anoLetivo.upsert({ where: { ano: ANO }, update: {}, create: { ano: ANO } })).id;

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const leituras = () => [
  "/api/licencas",
  `/api/licencas/${ids.licA}`,
  "/api/licencas/status/ativas",
  `/api/licencas/relatorio/${c.profA.id}`,
  "/api/pontos",
  `/api/pontos/${ids.pontoA}`,
  `/api/pontos/relatorio/${c.profA.id}/3/2026`,
  `/api/exportacao/educacenso?anoLetivoId=${anoLetivoId}&formato=json`,
  `/api/exportacao/sistema-presenca?anoLetivoId=${anoLetivoId}&mes=3&formato=json`,
];

describe("DIRETOR, SECRETARIA e PROFESSOR: 403 em leitura e escrita", () => {
  it.each(["DIRETOR", "SECRETARIA", "PROFESSOR"])("%s", async (papel) => {
    for (const url of leituras()) {
      expect((await req(em[papel], "GET", url)).statusCode, `GET ${url}`).toBe(403);
    }
    const escritas: Array<[string, string, unknown]> = [
      ["POST", "/api/licencas", { profissionalId: c.profA.id, tipo: "FERIAS", dataInicio: "2026-08-03", dataFim: "2026-08-07" }],
      ["PUT", `/api/licencas/${ids.licA}`, { motivo: "ajuste" }],
      ["POST", `/api/licencas/${ids.licA}/aprovar`, { aprovado: true }],
      ["POST", `/api/licencas/${ids.licA}/cancelar`, {}],
      ["DELETE", `/api/licencas/${ids.licA}`, undefined],
      ["POST", "/api/pontos", { profissionalId: c.profA.id, data: "2026-03-03", entrada: "07:00" }],
      ["POST", "/api/pontos/registrar", { profissionalId: c.profA.id, escolaId: c.escolaA.id, tipo: "ENTRADA", horario: "07:00" }],
      ["PUT", `/api/pontos/${ids.pontoA}`, { observacoes: "x" }],
      ["DELETE", `/api/pontos/${ids.pontoA}`, undefined],
    ];
    for (const [m, url, body] of escritas) {
      expect((await req(em[papel], m, url, body)).statusCode, `${m} ${url}`).toBe(403);
    }
    // Nada mudou
    expect((await prisma.licenca.findUnique({ where: { id: ids.licA } }))?.status).toBe("PENDENTE");
    expect(await prisma.ponto.findUnique({ where: { id: ids.pontoA } })).not.toBeNull();
  });
});

describe("ADMIN e SEMEC: 200 em tudo (rede inteira)", () => {
  it.each(["ADMIN", "SEMEC"])("%s lê tudo e vê as duas escolas", async (papel) => {
    for (const url of leituras()) {
      expect((await req(em[papel], "GET", url)).statusCode, `GET ${url}`).toBe(200);
    }
    const lic = itens<{ id: string }>((await req(em[papel], "GET", "/api/licencas?page=1&limit=50")).json()).map((l) => l.id);
    expect(lic).toEqual(expect.arrayContaining([ids.licA, ids.licB]));
    const pts = itens<{ id: string }>((await req(em[papel], "GET", "/api/pontos?page=1&limit=50")).json()).map((p) => p.id);
    expect(pts).toEqual(expect.arrayContaining([ids.pontoA, ids.pontoB]));
    expect((await req(em[papel], "GET", `/api/exportacao/educacenso?anoLetivoId=${anoLetivoId}&escolaId=${c.escolaB.id}&formato=json`)).statusCode).toBe(200);
  });

  it("SEMEC aprova licença de qualquer escola", async () => {
    const r = await req(em.SEMEC, "POST", `/api/licencas/${ids.licB2}/aprovar`, { aprovado: true });
    expect(r.statusCode).toBe(200);
    expect(r.json().status).toBe("APROVADA");
  });
});

describe("COORDENADOR: 200 só na própria escola", () => {
  it("lê o RH e as exportações da escola dele", async () => {
    for (const url of leituras()) {
      expect((await req(em.COORDENADOR, "GET", url)).statusCode, `GET ${url}`).toBe(200);
    }
  });

  it("licenças: lista só profissionais da escola; licença de outra escola = 404", async () => {
    const lic = itens<{ id: string }>((await req(em.COORDENADOR, "GET", "/api/licencas?page=1&limit=50")).json()).map((l) => l.id);
    expect(lic).toContain(ids.licA);
    expect(lic).not.toContain(ids.licB);
    expect((await req(em.COORDENADOR, "GET", `/api/licencas/${ids.licB}`)).statusCode).toBe(404);
    const rel = await req(em.COORDENADOR, "GET", `/api/licencas/relatorio/${c.profB.id}`);
    expect(rel.statusCode).toBe(200);
    expect(rel.json().licencas).toEqual([]);
  });

  it("aprova licença da escola dele, não a de outra escola", async () => {
    const outra = await req(em.COORDENADOR, "POST", `/api/licencas/${ids.licB}/aprovar`, { aprovado: true });
    expect([403, 404]).toContain(outra.statusCode);
    expect((await prisma.licenca.findUnique({ where: { id: ids.licB } }))?.status).toBe("PENDENTE");

    const propria = await req(em.COORDENADOR, "POST", `/api/licencas/${ids.licA2}/aprovar`, { aprovado: true });
    expect(propria.statusCode).toBe(200);
    expect(propria.json().status).toBe("APROVADA");
  });

  it("cria licença só para profissional da escola dele e não exclui licença", async () => {
    const base = { tipo: "FERIAS", dataInicio: "2026-09-01", dataFim: "2026-09-03" };
    expect((await req(em.COORDENADOR, "POST", "/api/licencas", { ...base, profissionalId: c.profA.id })).statusCode).toBe(201);
    expect((await req(em.COORDENADOR, "POST", "/api/licencas", { ...base, profissionalId: c.profB.id })).statusCode).toBe(403);
    expect((await req(em.COORDENADOR, "PUT", `/api/licencas/${ids.licB}`, { motivo: "x" })).statusCode).toBe(404);
    expect((await req(em.COORDENADOR, "POST", `/api/licencas/${ids.licB}/cancelar`, {})).statusCode).toBe(404);
    // Excluir continua só da gestão da rede
    expect((await req(em.COORDENADOR, "DELETE", `/api/licencas/${ids.licA3}`)).statusCode).toBe(403);
  });

  it("ponto: só profissionais da escola dele; ponto de outra escola = 404", async () => {
    const pts = itens<{ id: string }>((await req(em.COORDENADOR, "GET", "/api/pontos?page=1&limit=50")).json()).map((p) => p.id);
    expect(pts).toContain(ids.pontoA);
    expect(pts).not.toContain(ids.pontoB);
    expect((await req(em.COORDENADOR, "GET", `/api/pontos/${ids.pontoB}`)).statusCode).toBe(404);
    expect((await req(em.COORDENADOR, "PUT", `/api/pontos/${ids.pontoB}`, { observacoes: "x" })).statusCode).toBe(404);
    const rel = await req(em.COORDENADOR, "GET", `/api/pontos/relatorio/${c.profB.id}/3/2026`);
    expect(rel.statusCode).toBe(200);
    expect(rel.json().pontos).toEqual([]);
  });

  it("registra ponto só de profissional da escola dele e só na escola dele", async () => {
    const reg = (profissionalId: string, escolaId: string) =>
      req(em.COORDENADOR, "POST", "/api/pontos/registrar", { profissionalId, escolaId, tipo: "ENTRADA", horario: "07:10" });
    const deB = await reg(c.profB.id, c.escolaB.id);
    expect(deB.statusCode, deB.body).toBe(403);
    // Profissional da escola dele, mas ponto "registrado" em outra escola: 403 (antes passava)
    expect((await reg(c.profA.id, c.escolaB.id)).statusCode).toBe(403);
    expect(await prisma.ponto.count({ where: { profissionalId: c.profA.id, escolaId: c.escolaB.id } })).toBe(0);
    const criar = await req(em.COORDENADOR, "POST", "/api/pontos", {
      profissionalId: c.profA.id, escolaId: c.escolaB.id, data: "2026-03-10", entrada: "07:00", tipoRegistro: "NORMAL",
    });
    expect(criar.statusCode).toBe(403);
    expect((await req(em.COORDENADOR, "PUT", `/api/pontos/${ids.pontoA}`, { escolaId: c.escolaB.id })).statusCode).toBe(403);
    expect((await prisma.ponto.findUnique({ where: { id: ids.pontoA } }))?.escolaId).toBe(c.escolaA.id);

    expect((await reg(c.profA.id, c.escolaA.id)).statusCode).toBe(201);
  });

  it("exportação: sem escolaId sai só a escola dele; escolaId de outra escola = 404", async () => {
    const r = await req(em.COORDENADOR, "GET", `/api/exportacao/educacenso?anoLetivoId=${anoLetivoId}&formato=json`);
    expect(r.statusCode).toBe(200);
    expect(r.json().resumo.totalEscolas).toBe(1);
    expect(JSON.stringify(r.json())).not.toContain(c.escolaB.nome);

    const outra = await req(em.COORDENADOR, "GET", `/api/exportacao/educacenso?anoLetivoId=${anoLetivoId}&escolaId=${c.escolaB.id}&formato=json`);
    expect(outra.statusCode).toBe(404);
    const outraPres = await req(
      em.COORDENADOR, "GET", `/api/exportacao/sistema-presenca?anoLetivoId=${anoLetivoId}&mes=3&escolaId=${c.escolaB.id}&formato=json`
    );
    expect(outraPres.statusCode).toBe(404);

    const propria = await req(em.COORDENADOR, "GET", `/api/exportacao/educacenso?anoLetivoId=${anoLetivoId}&escolaId=${c.escolaA.id}&formato=json`);
    expect(propria.statusCode).toBe(200);
    expect(propria.json().resumo.totalEscolas).toBe(1);
  });
});
