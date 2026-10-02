// Verificação de pertinência EM LOTE (lib/prisma.ts): a chamada de uma turma
// de 35 alunos faz UMA consulta de pertinência por model-pai (id IN (...)),
// não 35 — com a mesma semântica de negação. Dados 100% fictícios.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma, metricasPertinencia } from "../src/lib/prisma.js";
import { contextoAcesso, type Escopo } from "../src/lib/contexto.js";
import { EscopoNegadoError } from "../src/lib/escopo.js";
import { cenarioDuasEscolas } from "./fb-cenario.js";

let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
let alunos: string[] = [];
let escopo: Escopo;
const DATA = new Date("2026-04-14T00:00:00.000Z");

// "await" DENTRO do run: a PrismaPromise é preguiçosa e só executa no then
const comoProfessor = <T>(fn: () => PromiseLike<T>) =>
  contextoAcesso.run({ cache: new Map(), papel: "PROFESSOR", escopo }, async () => await fn());

const chamada = (matriculaIds: string[]) =>
  prisma.$transaction(
    matriculaIds.map((matriculaId) =>
      prisma.frequencia.create({ data: { turmaId: c.turmaA.id, matriculaId, data: DATA, status: "PRESENTE" } })
    )
  );

beforeAll(async () => {
  c = await cenarioDuasEscolas("fb74");
  await prisma.matricula.createMany({
    data: Array.from({ length: 34 }, (_, i) => ({
      numeroMatricula: `fb74L${String(i).padStart(4, "0")}`, nomeAluno: `Aluno lote ${i}`, anoLetivo: 2026, status: "ATIVA",
      dataNascimento: new Date("2017-01-01"), sexo: "M", nomeResponsavel: "Responsável Fictício",
      etapaId: c.etapa.id, escolaId: c.escolaA.id, turmaId: c.turmaA.id,
    })),
  });
  alunos = (await prisma.matricula.findMany({ where: { turmaId: c.turmaA.id }, select: { id: true } })).map((m) => m.id);
  expect(alunos).toHaveLength(35);
  escopo = { tipo: "PROFESSOR", profissionalId: c.profA.id, turmaIds: [c.turmaA.id], escolaIds: [c.escolaA.id] };
});

// Consultas de pertinência feitas durante fn
const contarConsultas = async <T>(fn: () => Promise<T>) => {
  const antes = metricasPertinencia.consultas;
  const r = await fn();
  return { r, consultas: metricasPertinencia.consultas - antes };
};

describe("pertinência em lote", () => {
  it("35 creates numa transação = 1 consulta por model-pai (Turma e Matricula)", async () => {
    const { r: criados, consultas } = await contarConsultas(() => comoProfessor(() => chamada(alunos)));
    expect(criados).toHaveLength(35);
    expect(consultas).toBe(2); // antes: 1 (Turma) + 35 (uma por matriculaId)
    expect(await prisma.frequencia.count({ where: { turmaId: c.turmaA.id, data: DATA } })).toBe(35);
  });

  it("createMany também agrupa", async () => {
    const d2 = new Date("2026-04-15T00:00:00.000Z");
    const { consultas } = await contarConsultas(() =>
      comoProfessor(() =>
        prisma.frequencia.createMany({ data: alunos.map((matriculaId) => ({ turmaId: c.turmaA.id, matriculaId, data: d2, status: "FALTA" })) })
      )
    );
    expect(consultas).toBe(2);
    expect(await prisma.frequencia.count({ where: { data: d2 } })).toBe(35);
  });

  it("um aluno fora do escopo no lote nega a chamada inteira (nada é gravado)", async () => {
    const d3 = new Date("2026-04-16T00:00:00.000Z");
    const lote = [...alunos.slice(0, 10), c.matB.id].map((matriculaId) =>
      prisma.frequencia.create({ data: { turmaId: c.turmaA.id, matriculaId, data: d3, status: "PRESENTE" } })
    );
    await expect(comoProfessor(() => prisma.$transaction(lote))).rejects.toBeInstanceOf(EscopoNegadoError);
    expect(await prisma.frequencia.count({ where: { data: d3 } })).toBe(0);
  });

  it("id inexistente também é negado (mesma semântica do count)", async () => {
    await expect(
      comoProfessor(() =>
        prisma.frequencia.create({ data: { turmaId: c.turmaA.id, matriculaId: "id-que-nao-existe", data: DATA, status: "PRESENTE" } })
      )
    ).rejects.toBeInstanceOf(EscopoNegadoError);
  });
});
