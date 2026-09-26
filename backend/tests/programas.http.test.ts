// Módulo 5 pelas rotas, no formato do model/painel. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

let app: FastifyInstance;
let token = "";
const ids: Record<string, string> = {};
const auth = () => ({ authorization: `Bearer ${token}` });
const post = (url: string, payload: unknown) => app.inject({ method: "POST", url, headers: auth(), payload: payload as object });

beforeAll(async () => {
  _resetarLimiteLogin();
  const password = await bcrypt.hash("senha-de-teste-forte-123", 10);
  await prisma.user.upsert({
    where: { email: "admin-m5@teste.local" }, update: {},
    create: { email: "admin-m5@teste.local", nome: "Admin M5", role: "ADMIN", password },
  });
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular M5" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental M5", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais M5", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "2º Ano M5", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia M5", codigo: "M5-01" } });
  const turma = await prisma.turma.create({ data: { nome: "2A-M5", turno: "MATUTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id } });
  const aluno = await prisma.matricula.create({
    data: {
      anoLetivo: 2026, status: "ATIVA", dataNascimento: new Date("2018-06-10"), sexo: "M", nomeResponsavel: "Resp M5",
      escolaId: escola.id, etapaId: etapa.id, turmaId: turma.id, numeroMatricula: "M5000001", nomeAluno: "Aluno Fictício M5",
    },
  });
  Object.assign(ids, { escola: escola.id, aluno: aluno.id });
  app = await buildApp();
  await app.ready();
  const login = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email: "admin-m5@teste.local", password: "senha-de-teste-forte-123" } });
  token = login.json().accessToken;
});

afterAll(async () => {
  await app.close();
});

describe("AEE", () => {
  it("PEI com campos do model; campos extras descartados", async () => {
    const res = await post("/api/aee/pei", {
      matriculaId: ids.aluno, anoLetivo: 2026, deficiencia: "OUTRA", necessitaAEE: true,
      objetivosGerais: "Objetivo fictício", status: "CANCELADO", id: "forjado",
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().status).toBe("ATIVO");
    expect(res.json().id).not.toBe("forjado");
    ids.pei = res.json().id;
  });

  it("sala de recursos e atendimento", async () => {
    const sala = await post("/api/aee/salas-recursos", { escolaId: ids.escola, nome: "Sala M5", tipo: "TIPO_I", turno: "MATUTINO" });
    expect(sala.statusCode).toBe(201);
    const at = await post("/api/aee/atendimentos", { peiId: ids.pei, salaRecursosId: sala.json().id, data: "2026-09-20", horario: "09:00", presenca: true });
    expect(at.statusCode).toBe(201);
    const ruim = await post("/api/aee/atendimentos", { peiId: ids.pei, salaRecursosId: sala.json().id, data: "ontem" });
    expect(ruim.statusCode).toBe(400);
    expect(ruim.json().issues[0].campo).toBe("data");
  });
});

describe("Busca ativa", () => {
  it("caso, visita e encaminhamento no formato do model", async () => {
    const caso = await post("/api/busca-ativa", { matriculaId: ids.aluno, motivo: "INFREQUENCIA", prioridade: "ALTA", escolaId: ids.escola });
    expect(caso.statusCode).toBe(201);
    const visita = await post("/api/busca-ativa/visitas", {
      buscaAtivaId: caso.json().id, data: "2026-09-21", responsavel: "Agente fictício", situacao: "REALIZADA",
    });
    expect(visita.statusCode).toBe(201);
    const enc = await post("/api/busca-ativa/encaminhamentos", {
      buscaAtivaId: caso.json().id, orgao: "CRAS", motivo: "Acompanhamento familiar", dataEnvio: "2026-09-22",
    });
    expect(enc.statusCode).toBe(201);
  });
});

describe("Acompanhamento individualizado", () => {
  it("cria, registra evolução ({ data, observacao }) e conclui", async () => {
    const ac = await post("/api/acompanhamento", { matriculaId: ids.aluno, tipo: "APRENDIZAGEM", motivo: "Leitura", escolaId: ids.escola });
    expect(ac.statusCode).toBe(201);
    const ev = await post(`/api/acompanhamento/${ac.json().id}/evolucao`, { data: "2026-09-23", observacao: "Avançou na leitura" });
    expect(ev.statusCode).toBe(200);
    const semTexto = await post(`/api/acompanhamento/${ac.json().id}/evolucao`, { observacao: "" });
    expect(semTexto.statusCode).toBe(400);
    const fim = await post(`/api/acompanhamento/${ac.json().id}/concluir`, { resultado: "Meta atingida" });
    expect(fim.statusCode).toBe(200);
  });
});
