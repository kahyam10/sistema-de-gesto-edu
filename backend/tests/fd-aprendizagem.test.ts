// Frente D — resumo da escola em lote dá o mesmo resultado do cálculo por
// turma, sem o N+1 (uma consulta de avaliações para a escola inteira).
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, vi } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { aprendizagemService } from "../src/services/aprendizagem.service.js";
import { criarEstrutura, criarAluno, dias } from "./fd-fixture.js";

const HOJE = new Date("2026-10-02T00:00:00.000Z");
let e: Awaited<ReturnType<typeof criarEstrutura>>;
const turmas: string[] = [];

beforeAll(async () => {
  e = await criarEstrutura("FDA");
  // Segunda etapa na mesma escola, com configuração própria (média 5)
  const etapa2 = await prisma.etapaEnsino.create({ data: { nome: "Infantil FDA", tipoEducacaoId: e.tipo.id } });
  const nivel2 = await prisma.nivelEnsino.create({ data: { nome: "Pré FDA", etapaId: etapa2.id } });
  const serie2 = await prisma.serie.create({ data: { nome: "Pré II FDA", nivelId: nivel2.id } });
  await prisma.configuracaoAvaliacao.create({ data: { anoLetivo: 2026, mediaMinima: 5, percentualFrequenciaMinima: 80, escolaId: e.escola.id, etapaId: etapa2.id } });

  const tB = await prisma.turma.create({ data: { nome: "3B-FDA", turno: "VESPERTINO", anoLetivo: 2026, escolaId: e.escola.id, serieId: e.serie.id } });
  const tC = await prisma.turma.create({ data: { nome: "PRE-FDA", turno: "MATUTINO", anoLetivo: 2026, escolaId: e.escola.id, serieId: serie2.id } });
  // Turma de outro ano e inativa: não entram
  await prisma.turma.create({ data: { nome: "Velha-FDA", turno: "MATUTINO", anoLetivo: 2025, escolaId: e.escola.id, serieId: e.serie.id } });
  await prisma.turma.create({ data: { nome: "Inativa-FDA", turno: "MATUTINO", anoLetivo: 2026, ativo: false, escolaId: e.escola.id, serieId: e.serie.id } });
  turmas.push(e.turma.id, tB.id, tC.id);

  const discs = await Promise.all([
    prisma.disciplina.create({ data: { nome: "LP FDA", codigo: "LP-FDA", ordem: 1, etapaId: e.etapa.id } }),
    prisma.disciplina.create({ data: { nome: "MAT FDA", codigo: "MAT-FDA", ordem: 2, etapaId: e.etapa.id } }),
    prisma.disciplina.create({ data: { nome: "Linguagem FDA", codigo: "LG-FDA", etapaId: etapa2.id } }),
  ]);
  const etapaDaTurma = [e.etapa.id, e.etapa.id, etapa2.id];
  let k = 0;
  for (const [i, turmaId] of turmas.entries()) {
    const alunos = [];
    for (let j = 0; j < 3; j++) {
      alunos.push(await criarAluno("FDA", { escola: e.escola, etapa: { id: etapaDaTurma[i] }, turma: { id: turmaId } }, `Aluno ${i}-${j} FDA`));
    }
    for (const d of discs.filter((x) => x.etapaId === etapaDaTurma[i])) {
      for (const bimestre of [1, 2, 3]) {
        const av = await prisma.avaliacao.create({
          data: { nome: `P${bimestre}`, tipo: "PROVA", bimestre, peso: 1 + (bimestre % 2), valorMaximo: bimestre === 2 ? 5 : 10,
            data: new Date(`2026-0${bimestre * 2}-1${i}`), turmaId, disciplinaId: d.id },
        });
        // aluno 0 sem nota na prova do 2º bimestre (conta 0); demais com notas variadas
        for (const [j, a] of alunos.entries()) {
          if (j === 0 && bimestre === 2) continue;
          k++;
          await prisma.nota.create({ data: { valor: ((k * 37) % 10) / (bimestre === 2 ? 2 : 1), turmaId, disciplina: d.nome, bimestre, avaliacaoId: av.id, matriculaId: a.id } });
        }
      }
    }
    await prisma.frequencia.createMany({
      data: alunos.flatMap((a, j) => dias(20).map((data, n) => ({ matriculaId: a.id, turmaId, data, status: n < 20 - j * 3 ? "PRESENTE" : "FALTA" }))),
    });
  }
});

describe("aprendizagem: resumo da escola em lote", () => {
  it("mesmo resultado do cálculo turma a turma", async () => {
    const lote = await aprendizagemService.escola(e.escola.id, undefined, HOJE);
    expect(lote.anoLetivo).toBe(2026);
    expect(lote.anosDisponiveis).toEqual([2026, 2025]);
    const esperado = [];
    for (const id of turmas) {
      const r = await aprendizagemService.turma(id, undefined, HOJE);
      esperado.push({ turma: r.turma, bimestre: r.bimestre, resumo: r.resumo, regra: r.regra });
    }
    esperado.sort((x, y) => x.turma.nome.localeCompare(y.turma.nome));
    expect(lote.turmas).toEqual(esperado);
    // sanidade: as duas regras aparecem e há aluno em atenção
    expect(new Set(lote.turmas.map((t) => t.regra.mediaMinima))).toEqual(new Set([6, 5]));
    expect(lote.turmas.some((t) => t.resumo.emAtencao > 0)).toBe(true);
  });

  it("não faz consulta por turma (avaliações/turma carregadas uma vez para a escola)", async () => {
    // O cliente é estendido (escopo): o espião só conta e repassa ao original
    const avOrig = prisma.avaliacao.findMany.bind(prisma.avaliacao);
    const tuOrig = prisma.turma.findUnique.bind(prisma.turma);
    const av = vi.spyOn(prisma.avaliacao, "findMany").mockImplementation(((a: never) => avOrig(a)) as never);
    const tu = vi.spyOn(prisma.turma, "findUnique").mockImplementation(((a: never) => tuOrig(a)) as never);
    try {
      await aprendizagemService.escola(e.escola.id, 2026, HOJE);
      expect(av).toHaveBeenCalledTimes(1);
      expect(tu).not.toHaveBeenCalled();
    } finally {
      av.mockRestore();
      tu.mockRestore();
    }
  });
});
