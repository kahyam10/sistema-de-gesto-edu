// Frente H — boletim da turma em lote (GET /api/notas/boletim-turma/:turmaId).
// O resultado por aluno tem de ser IGUAL ao boletim individual, com um número
// de consultas que não cresce com a turma, e respeitar o escopo (professor só
// as turmas dele; escola só a própria; responsável não acessa). Dados fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma, prismaSemEscopo } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { notaService } from "../src/services/nota.service.js";
import { cenarioDuasEscolas, entrar } from "./fb-cenario.js";

const SUF = "fh81";
const HOJE = new Date("2026-10-02T00:00:00.000Z");
let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
const alunos: Record<string, { id: string }> = {};
const tokens = new Map<string, { authorization: string }>();
const email = (p: string) => `${p}-${SUF}@teste.local`;
const get = async (quem: string, url: string) => {
  if (!tokens.has(quem)) tokens.set(quem, await entrar(app, email(quem)));
  return app.inject({ method: "GET", url, headers: tokens.get(quem)! });
};

// Contador de consultas ligado só durante a medição
let contador: ((chave: string) => void) | null = null;
prismaSemEscopo.$use(async (params, next) => {
  contador?.(`${params.model}.${params.action}`);
  return next(params);
});

let seq = 0;
async function aluno(nomeAluno: string, turmaId: string, extra: Record<string, unknown> = {}) {
  seq++;
  return prisma.matricula.create({
    data: {
      numeroMatricula: `${SUF}X${String(seq).padStart(4, "0")}`,
      anoLetivo: 2026, status: "ATIVA", nomeAluno, dataNascimento: new Date("2017-01-01"), sexo: "M",
      nomeResponsavel: "Responsável Fictício", etapaId: c.etapa.id, escolaId: c.escolaA.id, turmaId, ...extra,
    },
  });
}
const diasDe = (n: number, mes = 2) => Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, mes, 1 + i)));
async function frequencia(matriculaId: string, turmaId: string, presentes: number, faltas = 0, justificadas = 0) {
  const status = [
    ...Array(presentes).fill("PRESENTE"), ...Array(faltas).fill("FALTA"), ...Array(justificadas).fill("JUSTIFICADA"),
  ];
  const datas = diasDe(status.length);
  await prisma.frequencia.createMany({ data: status.map((s, i) => ({ matriculaId, turmaId, data: datas[i], status: s })) });
}

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas(SUF);
  // Turma A (prof A): matA ("Aluna A") + mais alunos com situações diferentes
  alunos.matA = c.matA;
  alunos.bruno = await aluno("Bruno Fictício", c.turmaA.id);
  alunos.carla = await aluno("Carla Fictícia", c.turmaA.id);
  alunos.davi = await aluno("Davi Fictício", c.turmaA.id);
  alunos.ex2025 = await aluno("Elisa Ano Anterior", c.turmaA.id, { anoLetivo: 2025 });
  alunos.transferido = await aluno("Fábio Transferido", c.turmaA.id, { status: "TRANSFERIDA" });
  // Dado inconsistente de propósito: matrícula na turma A mas da escola B —
  // a secretaria da escola A não pode recebê-la no lote
  alunos.outraEscola = await aluno("Gil Outra Escola", c.turmaA.id, { escolaId: c.escolaB.id });

  // Média mínima 5,0 e frequência mínima 75% para a escola A/etapa
  await prisma.configuracaoAvaliacao.create({
    data: { anoLetivo: 2026, mediaMinima: 5, percentualFrequenciaMinima: 75, escolaId: c.escolaA.id, etapaId: c.etapa.id },
  });
  const disc = (nome: string, codigo: string, ordem: number) =>
    prisma.disciplina.create({ data: { nome: `${nome} ${SUF}`, codigo: `${codigo}-${SUF}`, etapaId: c.etapa.id, ordem } });
  const mat = await disc("Matemática", "MAT", 1);
  const por = await disc("Português", "POR", 2);
  const art = await disc("Artes", "ART", 3); // só tem avaliação no 1º bimestre → EM_CURSO

  const av = (turmaId: string, disciplinaId: string, bimestre: number, data: string, peso = 1, valorMaximo = 10, nome = "Prova") =>
    prisma.avaliacao.create({
      data: { nome: `${nome} ${bimestre} ${data}`, tipo: "PROVA", bimestre, data: new Date(data), peso, valorMaximo, turmaId, disciplinaId },
    });
  const nota = (avaliacao: { id: string; bimestre: number }, turmaId: string, disciplina: string, matriculaId: string, valor: number) =>
    prisma.nota.create({ data: { valor, turmaId, disciplina, bimestre: avaliacao.bimestre, avaliacaoId: avaliacao.id, matriculaId } });

  const notasPorAluno: Record<string, number[]> = {
    matA: [9, 8, 7, 10], bruno: [5, 4, 6, 3], carla: [2, 1, 3, 2], davi: [8, 8, 8, 8],
    ex2025: [6, 6, 6, 6], transferido: [10, 10, 10, 10], outraEscola: [7, 7, 7, 7],
  };
  for (const d of [mat, por]) {
    for (let b = 1; b <= 4; b++) {
      const mes = String(b * 2).padStart(2, "0");
      // duas avaliações no MESMO dia (ordem estável) com pesos/escala diferentes
      const p1 = await av(c.turmaA.id, d.id, b, `2026-${mes}-10`, 2, 10, "P1");
      const p2 = await av(c.turmaA.id, d.id, b, `2026-${mes}-10`, 1, 5, "P2");
      for (const [k, ns] of Object.entries(notasPorAluno)) {
        await nota(p1, c.turmaA.id, d.nome, alunos[k].id, ns[b - 1]);
        // Davi não fez a P2 (realizada sem nota = 0)
        if (k !== "davi") await nota(p2, c.turmaA.id, d.nome, alunos[k].id, Math.min(5, ns[b - 1] / 2));
      }
    }
    // futura, sem nota: não entra na média
    await av(c.turmaA.id, d.id, 4, "2026-12-01", 3, 10, "Futura");
  }
  const a1 = await av(c.turmaA.id, art.id, 1, "2026-03-15");
  await nota(a1, c.turmaA.id, art.nome, alunos.matA.id, 9);

  // Frequência: Bruno abaixo de 75% (6/10), Carla sem registro, demais 100%
  await frequencia(alunos.matA.id, c.turmaA.id, 10);
  await frequencia(alunos.bruno.id, c.turmaA.id, 6, 3, 1);
  await frequencia(alunos.davi.id, c.turmaA.id, 9, 1);
  await frequencia(alunos.ex2025.id, c.turmaA.id, 10);
  await frequencia(alunos.transferido.id, c.turmaA.id, 2, 8);
  await frequencia(alunos.outraEscola.id, c.turmaA.id, 10);

  // Turma 3C (mesma escola, sem aulas do prof A) com muitos alunos, para o
  // teste de número de consultas
  for (let i = 0; i < 6; i++) {
    const m = await aluno(`Aluno 3C ${i}`, c.turmaA2.id);
    await frequencia(m.id, c.turmaA2.id, 5 + i, 5 - Math.min(i, 5));
  }
  const p3c = await av(c.turmaA2.id, mat.id, 1, "2026-03-10");
  await nota(p3c, c.turmaA2.id, mat.nome, c.matA2.id, 7);

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app?.close();
});

describe("boletim da turma = boletim individual (mesma regra)", () => {
  it("cada aluno do lote (inclusive transferido/concluído) é IGUAL ao boletim individual", async () => {
    const lote = await notaService.getBoletimTurma(c.turmaA.id, undefined, HOJE);
    const ids = lote.boletins.map((b) => b.matricula.id);
    const todos = ["matA", "bruno", "carla", "davi", "ex2025", "outraEscola", "transferido"].map((k) => alunos[k].id);
    expect(new Set(ids)).toEqual(new Set(todos));
    // ordenado pelo nome do aluno
    const nomes = lote.boletins.map((b) => b.matricula.nomeAluno);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b)));
    expect(lote.turma).toEqual({ id: c.turmaA.id, nome: c.turmaA.nome, serie: c.serie.nome, anoLetivo: 2026 });

    for (const b of lote.boletins) {
      const individual = await notaService.getBoletim(b.matricula.id, c.turmaA.id, HOJE);
      expect(b).toEqual(individual);
    }
  });

  it("o cenário cobre as regras: peso/escala, realizada sem nota = 0, futura fora, frequência, EM_CURSO", async () => {
    const lote = await notaService.getBoletimTurma(c.turmaA.id, undefined, HOJE);
    const de = (k: string) => lote.boletins.find((b) => b.matricula.id === alunos[k].id)!;
    const matDe = (k: string) => de(k).disciplinas.find((d) => d.disciplinaCodigo === `MAT-${SUF}`)!;
    // Davi: P1 = 8 (peso 2), P2 sem nota já realizada = 0 (peso 1) → (16+0)/3 = 5,33
    expect(matDe("davi").bimestres[0].media).toBe(5.33);
    // futura (bimestre 4) aparece na lista, mas não entra na média
    const b4 = matDe("matA").bimestres[3];
    expect(b4.avaliacoes.some((a) => a.nota === null && a.peso === 3)).toBe(true);
    // Matemática da Aluna A: média ≥ 5 → APROVADO; Artes sem os 4 bimestres → EM_CURSO
    expect(matDe("matA").situacao).toBe("APROVADO");
    expect(de("matA").disciplinas.find((d) => d.disciplinaCodigo === `ART-${SUF}`)!.situacao).toBe("EM_CURSO");
    expect(de("matA").situacaoGeral).toBe("EM_CURSO");
    // Bruno: 6/10 presenças, abaixo de 75% → REPROVADO por frequência
    expect(de("bruno").frequencia).toEqual({ percentualPresenca: 60, totalAulas: 10, presencas: 6, faltas: 4, abaixoDoLimite: true });
    expect(matDe("bruno").situacao).toBe("REPROVADO");
    // Carla sem frequência registrada: 0 aulas
    expect(de("carla").frequencia.totalAulas).toBe(0);
  });

  it("anoLetivo filtra as matrículas do ano informado", async () => {
    const so2026 = await notaService.getBoletimTurma(c.turmaA.id, 2026, HOJE);
    expect(so2026.boletins.map((b) => b.matricula.id)).not.toContain(alunos.ex2025.id);
    expect(so2026.boletins).toHaveLength(6);
    const so2025 = await notaService.getBoletimTurma(c.turmaA.id, 2025, HOJE);
    expect(so2025.boletins.map((b) => b.matricula.id)).toEqual([alunos.ex2025.id]);
  });

  it("número de consultas não cresce com o número de alunos (uma busca de avaliações+notas)", async () => {
    // Contagem pelo middleware do cliente-base (vale para as consultas do
    // cliente estendido): modelo.operação → nº de chamadas
    const medir = async (turmaId: string) => {
      const contagem: Record<string, number> = {};
      contador = (k) => { contagem[k] = (contagem[k] ?? 0) + 1; };
      try {
        const r = await notaService.getBoletimTurma(turmaId, undefined, HOJE);
        return { n: r.boletins.length, contagem };
      } finally {
        contador = null;
      }
    };
    const pequena = await medir(c.turmaB.id); // 1 aluno
    const grande = await medir(c.turmaA2.id); // 7 alunos
    expect(pequena.n).toBe(1);
    expect(grande.n).toBe(7);
    expect(grande.contagem).toEqual(pequena.contagem);
    expect(grande.contagem["Avaliacao.findMany"]).toBe(1);
    expect(grande.contagem["Frequencia.groupBy"]).toBeUndefined(); // nada de estatística por aluno
    const total = Object.values(grande.contagem).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(8);
  });
});

describe("GET /api/notas/boletim-turma/:turmaId", () => {
  const url = (turmaId: string, q = "") => `/api/notas/boletim-turma/${turmaId}${q}`;

  it("ADMIN: 200 e cada boletim é igual ao da rota individual", async () => {
    const r = await get("admin", url(c.turmaA.id));
    expect(r.statusCode).toBe(200);
    const corpo = r.json() as { turma: { id: string }; boletins: Array<{ matricula: { id: string } }> };
    expect(corpo.turma.id).toBe(c.turmaA.id);
    expect(corpo.boletins).toHaveLength(7); // inclui o transferido
    for (const b of corpo.boletins) {
      const ind = await get("admin", `/api/notas/boletim/${b.matricula.id}?turmaId=${c.turmaA.id}`);
      expect(ind.statusCode).toBe(200);
      expect(b).toEqual(ind.json());
    }
    // null preservado (sem schema 200 que transforme em 0/"")
    const carla = corpo.boletins.find((b) => b.matricula.id === alunos.carla.id) as unknown as {
      disciplinas: Array<{ disciplinaCodigo: string; mediaFinal: number | null; bimestres: Array<{ media: number | null }> }>;
    };
    const artes = carla.disciplinas.find((d) => d.disciplinaCodigo === `ART-${SUF}`)!;
    expect(artes.mediaFinal).toBe(0); // realizada sem nota = 0
    expect(artes.bimestres[1].media).toBeNull(); // bimestre sem avaliação
  });

  it("anoLetivo na query; valor inválido → 400; turma inexistente → 404", async () => {
    const r = await get("admin", url(c.turmaA.id, "?anoLetivo=2025"));
    expect(r.statusCode).toBe(200);
    expect(r.json().boletins.map((b: { matricula: { id: string } }) => b.matricula.id)).toEqual([alunos.ex2025.id]);
    expect((await get("admin", url(c.turmaA.id, "?anoLetivo=abc"))).statusCode).toBe(400);
    expect((await get("admin", url(c.turmaA.id, "?anoLetivo=1e3"))).statusCode).toBe(400);
    expect((await get("admin", url("turma-que-nao-existe-fh"))).statusCode).toBe(404);
  });

  it("professor: a própria turma sim; turma de outro professor (mesma escola ou não) não", async () => {
    const ok = await get("prof-a", url(c.turmaA.id));
    expect(ok.statusCode).toBe(200);
    const ids = ok.json().boletins.map((b: { matricula: { id: string } }) => b.matricula.id) as string[];
    // só matrículas da turma dele
    const daTurma = await prisma.matricula.findMany({ where: { turmaId: c.turmaA.id }, select: { id: true } });
    expect(ids.every((id) => daTurma.some((m) => m.id === id))).toBe(true);
    for (const [quem, turmaId] of [["prof-a", c.turmaB.id], ["prof-a", c.turmaA2.id], ["prof-b", c.turmaA.id]] as const) {
      const r = await get(quem, url(turmaId));
      expect([403, 404]).toContain(r.statusCode);
      expect(r.body).not.toContain("Aluna");
    }
  });

  it("escola-escopo: só a própria escola, e nenhum aluno de outra escola no lote", async () => {
    const r = await get("sec-a", url(c.turmaA.id));
    expect(r.statusCode).toBe(200);
    const ids = r.json().boletins.map((b: { matricula: { id: string } }) => b.matricula.id) as string[];
    expect(ids).toContain(alunos.matA.id);
    expect(ids).not.toContain(alunos.outraEscola.id);
    expect(r.body).not.toContain("Gil Outra Escola");
    expect([403, 404]).toContain((await get("sec-a", url(c.turmaB.id))).statusCode);
  });

  it("RESPONSAVEL e USER sem função não acessam (403)", async () => {
    expect((await get("resp-a", url(c.turmaA.id))).statusCode).toBe(403);
    expect((await get("user-sem", url(c.turmaA.id))).statusCode).toBe(403);
  });
});
