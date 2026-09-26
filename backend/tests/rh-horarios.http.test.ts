// Módulo 4 — ACs por área e quadro de lotação. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { fracaoMaximaRegencia, paresConflitantes } from "../src/lib/horarios.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};
const req = (quem: string, method: "GET" | "POST" | "PUT", url: string, payload?: object) =>
  app.inject({ method, url, headers: { authorization: `Bearer ${tokens[quem]}` }, payload });

beforeAll(async () => {
  _resetarLimiteLogin();
  const hash = await bcrypt.hash(SENHA, 10);
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular M4" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental M4", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Finais M4", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "6º Ano M4", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia M4", codigo: "M4-01" } });
  const outra = await prisma.escola.create({ data: { nome: "Outra Escola M4", codigo: "M4-02" } });
  const turma = await prisma.turma.create({ data: { nome: "6A-M4", turno: "MATUTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id } });
  const profA = await prisma.profissionalEducacao.create({ data: { nome: "Professora A (M4)", cpf: "00000000434", tipo: "PROFESSOR", jornada: 20 } });
  const profB = await prisma.profissionalEducacao.create({ data: { nome: "Professor B (M4)", cpf: "00000000515", tipo: "PROFESSOR", jornada: 40 } });
  await prisma.escolaProfissional.create({ data: { escolaId: escola.id, profissionalId: profA.id, funcao: "Professora", cargaHoraria: 20 } });
  await prisma.escolaProfissional.create({ data: { escolaId: outra.id, profissionalId: profB.id, cargaHoraria: 40 } });
  // 5 dias × 3h = 15h de regência (limite de 20h × 2/3 ≈ 13,3h)
  await prisma.gradeHoraria.createMany({
    data: ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"].map((diaSemana) => ({
      diaSemana, horaInicio: "07:30", horaFim: "10:30", disciplina: "Matemática", turmaId: turma.id, profissionalId: profA.id,
    })),
  });
  await prisma.user.create({ data: { email: "admin-m4@teste.local", nome: "Admin M4", role: "ADMIN", password: hash } });
  await prisma.user.create({ data: { email: "dir-outra-m4@teste.local", nome: "Diretor Outra M4", role: "DIRETOR", password: hash, escolaId: outra.id } });
  await prisma.user.create({ data: { email: "prof-m4@teste.local", nome: "Prof M4", role: "PROFESSOR", password: hash, profissionalId: profA.id } });
  Object.assign(ids, { escola: escola.id, profA: profA.id, profB: profB.id });

  app = await buildApp();
  await app.ready();
  for (const [k, email] of [["admin", "admin-m4@teste.local"], ["dirOutra", "dir-outra-m4@teste.local"], ["prof", "prof-m4@teste.local"]]) {
    const r = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
    tokens[k] = r.json().accessToken;
  }
});

afterAll(async () => {
  await app.close();
});

describe("utilitários de horário", () => {
  it("fração da regência: padrão 2/3 e configurável", () => {
    expect(fracaoMaximaRegencia(undefined)).toBeCloseTo(2 / 3);
    expect(fracaoMaximaRegencia("3/4")).toBe(0.75);
    expect(fracaoMaximaRegencia("0.7")).toBe(0.7);
    expect(fracaoMaximaRegencia("abc")).toBeCloseTo(2 / 3);
  });
  it("encostar não é conflito; sobrepor é", () => {
    const a = { diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "09:00" };
    expect(paresConflitantes([a, { ...a, horaInicio: "09:00", horaFim: "10:00" }])).toHaveLength(0);
    expect(paresConflitantes([a, { ...a, horaInicio: "08:30", horaFim: "10:00" }])).toHaveLength(1);
  });
});

describe("AC por área", () => {
  it("cria AC com participante lotado", async () => {
    const r = await req("admin", "POST", "/api/atividades-complementares", {
      escolaId: ids.escola, area: "MATEMATICA", diaSemana: "TERCA", horaInicio: "14:00", horaFim: "16:00", participantes: [ids.profA],
    });
    expect(r.statusCode).toBe(201);
    expect(r.json().participantes).toEqual([{ id: ids.profA, nome: "Professora A (M4)" }]);
    ids.ac = r.json().id;
  });

  it("recusa participante que não está lotado nem leciona na escola (BIZ_036)", async () => {
    const r = await req("admin", "POST", "/api/atividades-complementares", {
      escolaId: ids.escola, area: "LINGUAGENS", diaSemana: "QUARTA", horaInicio: "14:00", horaFim: "16:00", participantes: [ids.profB],
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().error.code).toBe("BIZ_036");
  });

  it("recusa choque com aula (BIZ_037) e horário invertido (400)", async () => {
    const choque = await req("admin", "POST", "/api/atividades-complementares", {
      escolaId: ids.escola, area: "MATEMATICA", diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "09:00", participantes: [ids.profA],
    });
    expect(choque.statusCode).toBe(409);
    expect(choque.json().error.code).toBe("BIZ_037");
    const invertido = await req("admin", "POST", "/api/atividades-complementares", {
      escolaId: ids.escola, area: "MATEMATICA", diaSemana: "SEXTA", horaInicio: "16:00", horaFim: "14:00",
    });
    expect(invertido.statusCode).toBe(400);
    expect(invertido.json().issues[0].campo).toBe("horaFim");
  });

  it("editar para um horário que bate com aula também é recusado", async () => {
    const r = await req("admin", "PUT", `/api/atividades-complementares/${ids.ac}`, { diaSemana: "SEGUNDA", horaInicio: "10:00", horaFim: "11:00" });
    expect(r.statusCode).toBe(409);
  });
});

describe("quadro de lotação", () => {
  it("cruza jornada, regência e AC e aponta o excesso de regência", async () => {
    const r = await req("admin", "GET", `/api/lotacao/quadro?escolaId=${ids.escola}`);
    expect(r.statusCode).toBe(200);
    const b = r.json();
    const a = b.profissionais.find((p: { profissional: { id: string } }) => p.profissional.id === ids.profA);
    expect(a.horas).toMatchObject({ regenciaNaEscola: 15, regenciaTotal: 15, acNaEscola: 2, acTotal: 2, limiteRegencia: 13.3, saldo: 3 });
    expect(a.alertas.map((x: { codigo: string }) => x.codigo)).toEqual(["REGENCIA_ACIMA_DO_LIMITE"]);
    expect(a.disciplinasNaEscola).toEqual(["Matemática"]);
    expect(Object.keys(a.profissional)).not.toContain("cpf");
  });

  it("diretor de outra escola não abre (404) e professor não acessa (403)", async () => {
    expect((await req("dirOutra", "GET", `/api/lotacao/quadro?escolaId=${ids.escola}`)).statusCode).toBe(404);
    expect((await req("prof", "GET", `/api/lotacao/quadro?escolaId=${ids.escola}`)).statusCode).toBe(403);
  });
});
