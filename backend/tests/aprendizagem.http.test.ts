// Módulo 2 — acompanhamento de aprendizagens e regra do boletim vinda da
// configuração de avaliação. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { notaService } from "../src/services/nota.service.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};
const get = (quem: string, url: string) => app.inject({ method: "GET", url, headers: { authorization: `Bearer ${tokens[quem]}` } });

beforeAll(async () => {
  _resetarLimiteLogin();
  const hash = await bcrypt.hash(SENHA, 10);
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular M2" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental M2", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais M2", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "3º Ano M2", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia M2", codigo: "M2-01" } });
  const turma = await prisma.turma.create({ data: { nome: "3A-M2", turno: "MATUTINO", anoLetivo: 2031, escolaId: escola.id, serieId: serie.id } });
  const outraTurma = await prisma.turma.create({ data: { nome: "3B-M2", turno: "VESPERTINO", anoLetivo: 2031, escolaId: escola.id, serieId: serie.id } });
  const [lp, mat] = await Promise.all([
    prisma.disciplina.create({ data: { nome: "Português M2", codigo: "LP-M2", ordem: 1, etapaId: etapa.id } }),
    prisma.disciplina.create({ data: { nome: "Matemática M2", codigo: "MAT-M2", ordem: 2, etapaId: etapa.id } }),
  ]);
  const base = { anoLetivo: 2031, status: "ATIVA", dataNascimento: new Date("2022-01-10"), sexo: "F", nomeResponsavel: "Resp M2", escolaId: escola.id, etapaId: etapa.id, turmaId: turma.id };
  const ana = await prisma.matricula.create({ data: { ...base, numeroMatricula: "M2000001", nomeAluno: "Ana M2" } });
  const bruno = await prisma.matricula.create({ data: { ...base, numeroMatricula: "M2000002", nomeAluno: "Bruno M2" } });
  // Regra da escola/etapa: média 7,0 e frequência 80%
  await prisma.configuracaoAvaliacao.create({ data: { anoLetivo: 2031, mediaMinima: 7, percentualFrequenciaMinima: 80, escolaId: escola.id, etapaId: etapa.id } });

  const notas: Record<string, Record<number, [number, number]>> = {
    // disciplina → bimestre → [Ana, Bruno]
    [lp.id]: { 1: [8, 6], 2: [8.5, 5], 3: [8, 6], 4: [8, 6] },
    [mat.id]: { 1: [9, 7], 2: [7.5, 7.5], 3: [8, 6], 4: [8, 6] },
  };
  for (const [disciplinaId, porBim] of Object.entries(notas)) {
    for (const [b, [va, vb]] of Object.entries(porBim)) {
      const bimestre = Number(b);
      const av = await prisma.avaliacao.create({
        data: { nome: `Prova ${bimestre}`, tipo: "PROVA", bimestre, data: new Date(`2031-0${bimestre * 2}-10`), turmaId: turma.id, disciplinaId },
      });
      const disc = disciplinaId === lp.id ? "Português M2" : "Matemática M2";
      await prisma.nota.createMany({ data: [
        { valor: va, turmaId: turma.id, disciplina: disc, bimestre, avaliacaoId: av.id, matriculaId: ana.id },
        { valor: vb, turmaId: turma.id, disciplina: disc, bimestre, avaliacaoId: av.id, matriculaId: bruno.id },
      ] });
    }
  }
  // Bruno: 7 presenças em 10 aulas (70%)
  const dias = Array.from({ length: 10 }, (_, i) => new Date(Date.UTC(2031, 2, 3 + i)));
  await prisma.frequencia.createMany({ data: dias.flatMap((data, i) => [
    { matriculaId: ana.id, turmaId: turma.id, data, status: "PRESENTE" },
    { matriculaId: bruno.id, turmaId: turma.id, data, status: i < 7 ? "PRESENTE" : "FALTA" },
  ]) });

  const prof = await prisma.profissionalEducacao.create({ data: { nome: "Prof M2", cpf: "00000000787", tipo: "PROFESSOR" } });
  await prisma.turmaProfessor.create({ data: { turmaId: outraTurma.id, profissionalId: prof.id, tipo: "PROFESSOR" } });
  await prisma.user.create({ data: { email: "coord-m2@teste.local", nome: "Coord M2", role: "COORDENADOR", password: hash, escolaId: escola.id } });
  await prisma.user.create({ data: { email: "prof-m2@teste.local", nome: "Prof M2", role: "PROFESSOR", password: hash, profissionalId: prof.id } });
  await prisma.user.create({ data: { email: "resp-m2@teste.local", nome: "Resp M2", role: "RESPONSAVEL", password: hash } });
  Object.assign(ids, { escola: escola.id, turma: turma.id, ana: ana.id, bruno: bruno.id, lp: lp.id });

  app = await buildApp();
  await app.ready();
  for (const [k, email] of [["coord", "coord-m2@teste.local"], ["prof", "prof-m2@teste.local"], ["resp", "resp-m2@teste.local"]]) {
    const r = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
    tokens[k] = r.json().accessToken;
  }
});

afterAll(async () => {
  await app.close();
});

describe("acompanhamento de aprendizagens", () => {
  it("usa a regra da configuração e explica os motivos de atenção", async () => {
    const r = await get("coord", `/api/aprendizagem/turma/${ids.turma}?bimestre=2`);
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(b.regra).toEqual({ mediaMinima: 7, frequenciaMinima: 80, origem: "CONFIGURACAO" });
    expect(b.bimestre).toBe(2);
    const [primeiro, segundo] = b.alunos;
    expect(primeiro.nomeAluno).toBe("Bruno M2");
    expect(primeiro.motivos.map((m: { codigo: string }) => m.codigo)).toEqual(["ABAIXO_DA_MEDIA", "FREQUENCIA_BAIXA", "QUEDA"]);
    expect(primeiro.frequencia).toBe(70);
    // Ana só caiu em Matemática (9 → 7,5), sem ficar abaixo da média
    expect(segundo.motivos.map((m: { codigo: string }) => m.codigo)).toEqual(["QUEDA"]);
    const lp = b.disciplinas.find((d: { disciplinaId: string }) => d.disciplinaId === ids.lp);
    expect(lp).toMatchObject({ mediaTurma: 6.8, abaixoDaMedia: 1, alunosComNota: 2 });
    expect(b.resumo).toMatchObject({ alunos: 2, emAtencao: 2, frequenciaBaixa: 1 });
  });

  it("resumo da escola por turma", async () => {
    const r = await get("coord", `/api/aprendizagem/escola/${ids.escola}`);
    expect(r.statusCode).toBe(200);
    expect(r.json().anoLetivo).toBe(2031);
    expect(r.json().turmas.map((t: { turma: { nome: string } }) => t.turma.nome)).toEqual(["3A-M2", "3B-M2"]);
  });

  it("professor de outra turma recebe 404; responsável 403", async () => {
    expect((await get("prof", `/api/aprendizagem/turma/${ids.turma}`)).statusCode).toBe(404);
    expect((await get("resp", `/api/aprendizagem/turma/${ids.turma}`)).statusCode).toBe(403);
  });
});

describe("boletim segue a configuração de avaliação", () => {
  it("média 6,0 com mínimo 7,0 → recuperação (antes o 6,0 era fixo)", async () => {
    const b = await notaService.getBoletim(ids.bruno);
    const lp = b.disciplinas.find((d) => d.disciplinaId === ids.lp)!;
    expect(lp.mediaFinal).toBe(5.75);
    // Frequência de 70% < 80% da configuração → reprovado por frequência
    expect(lp.situacao).toBe("REPROVADO");
    const ana = await notaService.getBoletim(ids.ana);
    expect(ana.situacaoGeral).toBe("APROVADO");
  });
});
