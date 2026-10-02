// Frente C — validação de entrada nas rotas: paginação com teto, datas
// inválidas, dadosCenso com schema e aprovação/rejeição de licença.
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-fc-2";
let app: FastifyInstance;
let token = "";
const ids: Record<string, string> = {};
const VAZAMENTO = /prisma|invocation|\/app\/|dist\//i;
const get = (url: string) => app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}` } });
const send = (method: "PUT" | "POST", url: string, payload: unknown) =>
  app.inject({ method, url, payload: payload as object, headers: { authorization: `Bearer ${token}` } });

beforeAll(async () => {
  _resetarLimiteLogin();
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular FC" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental FC", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais FC", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "3º Ano FC", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia FC", codigo: "FC-01" } });
  const turma = await prisma.turma.create({
    data: { nome: "3A-FC", turno: "MATUTINO", anoLetivo: 2033, escolaId: escola.id, serieId: serie.id },
  });
  const prof = await prisma.profissionalEducacao.create({ data: { nome: "Prof FC", cpf: "00000002929", tipo: "PROFESSOR" } });
  const lic = (motivo: string) =>
    prisma.licenca.create({
      data: {
        profissionalId: prof.id,
        tipo: "FERIAS",
        dataInicio: new Date("2033-07-01"),
        dataFim: new Date("2033-07-10"),
        diasCorridos: 10,
        motivo,
      },
    });
  const [l1, l2, l3] = await Promise.all([lic("FC-1"), lic("FC-2"), lic("FC-3")]);
  await prisma.user.create({
    data: { email: "semec-fc-val@teste.local", nome: "SEMEC FC", role: "SEMEC", password: await bcrypt.hash(SENHA, 10) },
  });
  Object.assign(ids, { escola: escola.id, turma: turma.id, prof: prof.id, l1: l1.id, l2: l2.id, l3: l3.id });

  app = await buildApp();
  await app.ready();
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/mobile/login",
    payload: { email: "semec-fc-val@teste.local", password: SENHA },
  });
  token = login.json().accessToken;
  expect(token).toBeTruthy();
});

afterAll(async () => {
  await app.close();
});

describe("listas com paginação: teto e page >= 1", () => {
  const rotas = ["/api/frequencia", "/api/notas", "/api/estoque/movimentacoes", "/api/licencas"];

  it.each(rotas)("%s?page=0 → 400 sem detalhe interno", async (rota) => {
    const res = await get(`${rota}?page=0&limit=10`);
    expect(res.statusCode).toBe(400);
    expect(res.body).not.toMatch(VAZAMENTO);
  });

  it.each(rotas)("%s?limit=1000000 → 400", async (rota) => {
    const res = await get(`${rota}?page=1&limit=1000000`);
    expect(res.statusCode).toBe(400);
  });

  it.each(rotas)("%s?page=1&limit=100 (maior valor das telas) → 200 paginado", async (rota) => {
    const res = await get(`${rota}?page=1&limit=100`);
    expect(res.statusCode).toBe(200);
    expect(res.json().pagination).toMatchObject({ page: 1, limit: 100 });
  });

  it("sem page/limit o contrato continua (lista simples)", async () => {
    const res = await get("/api/notas");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });
});

describe("datas inválidas na query/params", () => {
  it.each([
    "/api/frequencia?dataInicio=abc",
    "/api/estoque/movimentacoes?dataFim=abc",
    "/api/licencas?dataInicio=2033-99-99",
  ])("%s → 400", async (url) => {
    const res = await get(url);
    expect(res.statusCode).toBe(400);
    expect(res.body).not.toMatch(VAZAMENTO);
  });

  it("data inválida no path → 400", async () => {
    const res = await get(`/api/frequencia/turma/${ids.turma}/data/abc`);
    expect(res.statusCode).toBe(400);
    expect(res.body).not.toMatch(VAZAMENTO);
  });

  it("data válida continua funcionando", async () => {
    expect((await get("/api/frequencia?dataInicio=2033-01-01&dataFim=2033-12-31")).statusCode).toBe(200);
    expect((await get(`/api/frequencia/turma/${ids.turma}/data/2033-03-10`)).statusCode).toBe(200);
  });
});

describe("dadosCenso com schema", () => {
  it("escola: grava só os campos do questionário", async () => {
    const res = await send("PUT", `/api/escolas/${ids.escola}/censo`, {
      codigoEscola: "29000001",
      localizacao: "Rural",
      dependenciasFisicas: ["Biblioteca", "Cozinha"],
      campoInventado: "não deve ser gravado",
      aninhado: { muito: { fundo: true } },
    });
    expect(res.statusCode).toBe(200);
    const escola = await prisma.escola.findUniqueOrThrow({ where: { id: ids.escola } });
    expect(escola.dadosCenso).toEqual({ codigoEscola: "29000001", localizacao: "Rural", dependenciasFisicas: ["Biblioteca", "Cozinha"] });
  });

  it("escola: tipo/opção/tamanho inválidos → 400 e nada gravado", async () => {
    for (const corpo of [{ localizacao: "Lunar" }, { codigoEscola: "9".repeat(300) }, { dependenciasFisicas: "texto" }]) {
      const res = await send("PUT", `/api/escolas/${ids.escola}/censo`, corpo);
      expect(res.statusCode).toBe(400);
    }
    const escola = await prisma.escola.findUniqueOrThrow({ where: { id: ids.escola } });
    expect((escola.dadosCenso as Record<string, unknown>).localizacao).toBe("Rural");
  });

  it("turma e profissional também validam", async () => {
    const t = await send("PUT", `/api/turmas/${ids.turma}/censo`, { turmaEducacaoEspecial: "Talvez" });
    expect(t.statusCode).toBe(400);
    const t2 = await send("PUT", `/api/turmas/${ids.turma}/censo`, { nomeTurma: "3A-FC", extra: 1 });
    expect(t2.statusCode).toBe(200);
    const turma = await prisma.turma.findUniqueOrThrow({ where: { id: ids.turma } });
    expect(turma.dadosCenso).toEqual({ nomeTurma: "3A-FC" });

    const p = await send("PUT", `/api/profissionais/${ids.prof}/censo`, { possuiDeficiencia: "sim" });
    expect(p.statusCode).toBe(400);
    const p2 = await send("PUT", `/api/profissionais/${ids.prof}/censo`, { cargo: "Diretor(a)", possuiDeficiencia: false, lixo: "x" });
    expect(p2.statusCode).toBe(200);
    const prof = await prisma.profissionalEducacao.findUniqueOrThrow({ where: { id: ids.prof } });
    expect(prof.dadosCenso).toEqual({ cargo: "Diretor(a)", possuiDeficiencia: false });
  });
});

describe("aprovar/rejeitar licença", () => {
  it("rejeitar sem motivo → 400", async () => {
    const res = await send("POST", `/api/licencas/${ids.l1}/aprovar`, { aprovado: false });
    expect(res.statusCode).toBe(400);
    const res2 = await send("POST", `/api/licencas/${ids.l1}/aprovar`, { status: "REJEITADA", aprovadaPor: "qualquer" });
    expect(res2.statusCode).toBe(400);
    expect((await prisma.licenca.findUniqueOrThrow({ where: { id: ids.l1 } })).status).toBe("PENDENTE");
  });

  it("motivo acima do máximo → 400", async () => {
    const res = await send("POST", `/api/licencas/${ids.l1}/aprovar`, { aprovado: false, motivo: "m".repeat(10_001) });
    expect(res.statusCode).toBe(400);
  });

  it("formato do dashboard (status/justificativaRejeicao) rejeita com motivo; aprovador vem da sessão", async () => {
    const res = await send("POST", `/api/licencas/${ids.l1}/aprovar`, {
      status: "REJEITADA",
      justificativaRejeicao: "Período coincide com o conselho de classe",
      aprovadaPor: "usuario-forjado",
    });
    expect(res.statusCode).toBe(200);
    const l = await prisma.licenca.findUniqueOrThrow({ where: { id: ids.l1 } });
    expect(l.status).toBe("REJEITADA");
    expect(l.justificativaRejeicao).toBe("Período coincide com o conselho de classe");
    expect(l.aprovadaPor).not.toBe("usuario-forjado");
  });

  it("formato documentado aprova; reprocessar devolve a mensagem de negócio", async () => {
    const res = await send("POST", `/api/licencas/${ids.l2}/aprovar`, { aprovado: true });
    expect(res.statusCode).toBe(200);
    expect((await prisma.licenca.findUniqueOrThrow({ where: { id: ids.l2 } })).status).toBe("APROVADA");
    const de_novo = await send("POST", `/api/licencas/${ids.l2}/aprovar`, { aprovado: true });
    expect(de_novo.statusCode).toBe(400);
    expect(de_novo.json().error).toBe("Esta licença já foi processada");
  });

  it("dashboard aprovando (status APROVADA) funciona", async () => {
    const res = await send("POST", `/api/licencas/${ids.l3}/aprovar`, { status: "APROVADA", aprovadaPor: "x" });
    expect(res.statusCode).toBe(200);
  });
});
