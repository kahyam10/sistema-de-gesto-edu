// Frente I — (1) piso entre recuperação e reprovação configurável na
// configuração de avaliação (antes 3,0 fixo) e (2) frequência POR DISCIPLINA
// no boletim, só para exibição (a situação continua pela frequência geral).
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { notaService, determinaSituacao, type RegraAprovacao } from "../src/services/nota.service.js";
import { chaveDisciplina } from "../src/services/frequencia.service.js";
import { cenarioDuasEscolas, entrar } from "./fb-cenario.js";

const SUF = "fi93"; // dígitos 93: CPF fictício do cenário não colide com os outros arquivos
const HOJE = new Date("2026-10-02T00:00:00.000Z");
let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
const tokens = new Map<string, { authorization: string }>();
const email = (p: string) => `${p}-${SUF}@teste.local`;
async function req(quem: string, method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  if (!tokens.has(quem)) tokens.set(quem, await entrar(app, email(quem)));
  return app.inject({ method, url, headers: tokens.get(quem)!, ...(payload !== undefined && { payload: payload as object }) });
}

let mat: { id: string; nome: string };
let por: { id: string; nome: string };
let cie: { id: string; nome: string };
let alunoPisoA: { id: string };
let alunoPisoB: { id: string };
let cfgA: { id: string; notaMinimaRecuperacao: number };

let seq = 0;
async function aluno(nomeAluno: string, turmaId: string, escolaId: string) {
  seq++;
  return prisma.matricula.create({
    data: {
      numeroMatricula: `${SUF}P${String(seq).padStart(4, "0")}`,
      anoLetivo: 2026, status: "ATIVA", nomeAluno, dataNascimento: new Date("2017-01-01"), sexo: "F",
      nomeResponsavel: "Responsável Fictício", etapaId: c.etapa.id, escolaId, turmaId,
    },
  });
}

/** Avaliações (uma por bimestre) da disciplina na turma, criadas uma vez só. */
const avaliacoesCache = new Map<string, Array<{ id: string; bimestre: number }>>();
async function avaliacoesDa(turmaId: string, d: { id: string; nome: string }) {
  const chave = `${turmaId}:${d.id}`;
  if (!avaliacoesCache.has(chave)) {
    const avs = [];
    for (let b = 1; b <= 4; b++) {
      avs.push(
        await prisma.avaliacao.create({
          data: {
            nome: `Prova ${d.nome} ${b}`, tipo: "PROVA", bimestre: b,
            data: new Date(`2026-0${b * 2}-12`), peso: 1, valorMaximo: 10, turmaId, disciplinaId: d.id,
          },
        })
      );
    }
    avaliacoesCache.set(chave, avs);
  }
  return avaliacoesCache.get(chave)!;
}

/** Nota `valor` nos 4 bimestres da disciplina, para o aluno, na turma. */
async function notasNosQuatroBimestres(turmaId: string, d: { id: string; nome: string }, matriculaId: string, valor: number) {
  for (const av of await avaliacoesDa(turmaId, d)) {
    await prisma.nota.create({ data: { valor, turmaId, disciplina: d.nome, bimestre: av.bimestre, avaliacaoId: av.id, matriculaId } });
  }
}

/** Presença total na chamada DIÁRIA (sem disciplina) em n dias. */
async function presencaDiaria(matriculaId: string, turmaId: string, n: number, inicio = 1) {
  await prisma.frequencia.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      matriculaId, turmaId, data: new Date(Date.UTC(2026, 2, inicio + i)), status: "PRESENTE",
    })),
  });
}

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas(SUF);
  const disc = (nome: string, codigo: string, ordem: number) =>
    prisma.disciplina.create({ data: { nome, codigo: `${codigo}-${SUF}`, etapaId: c.etapa.id, ordem } });
  mat = await disc(`Matemática ${SUF}`, "MAT", 1);
  por = await disc(`Língua Portuguesa ${SUF}`, "LP", 2);
  cie = await disc(`Ciências ${SUF}`, "CIE", 3);

  app = await buildApp();
  await app.ready();

  // Escola A: piso 4 (via API). Escola B: sem piso informado → padrão 3.
  const rA = await req("admin", "POST", "/api/configuracao-avaliacao", {
    anoLetivo: 2026, sistemaAvaliacao: "NOTA", numeroPeriodos: 4, mediaMinima: 6, notaMinimaRecuperacao: 4,
    percentualFrequenciaMinima: 75, escolaId: c.escolaA.id, etapaId: c.etapa.id,
  });
  expect(rA.statusCode).toBe(201);
  cfgA = rA.json();
  expect(cfgA.notaMinimaRecuperacao).toBe(4);
  const rB = await req("admin", "POST", "/api/configuracao-avaliacao", {
    anoLetivo: 2026, sistemaAvaliacao: "NOTA", numeroPeriodos: 4, mediaMinima: 6,
    percentualFrequenciaMinima: 75, escolaId: c.escolaB.id, etapaId: c.etapa.id,
  });
  expect(rB.statusCode).toBe(201);
  expect(rB.json().notaMinimaRecuperacao).toBe(3);

  // Aluno com média 3,5 em Matemática nas duas escolas (frequência 100%)
  alunoPisoA = await aluno("Paula Piso A", c.turmaA.id, c.escolaA.id);
  alunoPisoB = await aluno("Pedro Piso B", c.turmaB.id, c.escolaB.id);
  for (const [a, turmaId] of [[alunoPisoA, c.turmaA.id], [alunoPisoB, c.turmaB.id]] as const) {
    await notasNosQuatroBimestres(turmaId, mat, a.id, 3.5);
    await presencaDiaria(a.id, turmaId, 10);
  }

  // Aluna A (turma A): notas 8 em Matemática, Português e Ciências; chamada
  // POR AULA em Matemática (3 de 4) e Português (1 de 2) + 6 presenças na
  // chamada diária → geral 10/12 = 83% (acima de 75%).
  for (const d of [mat, por, cie]) await notasNosQuatroBimestres(c.turmaA.id, d, c.matA.id, 8);
  await presencaDiaria(c.matA.id, c.turmaA.id, 6);
  const grade = (disciplina: string, horaInicio: string) =>
    prisma.gradeHoraria.create({ data: { diaSemana: "SEGUNDA", horaInicio, horaFim: "09:00", disciplina, turmaId: c.turmaA.id } });
  const gMat = await grade(mat.nome, "07:30");
  const gPor = await grade(por.nome, "09:10");
  const porAula = (g: { id: string }, disciplina: string, dia: number, status: string) =>
    prisma.frequencia.create({
      data: {
        matriculaId: c.matA.id, turmaId: c.turmaA.id, data: new Date(Date.UTC(2026, 3, dia)), status,
        gradeHorariaId: g.id, aulaChave: g.id, disciplina, horaInicio: "07:30",
      },
    });
  await porAula(gMat, mat.nome, 6, "PRESENTE");
  await porAula(gMat, mat.nome, 13, "PRESENTE");
  await porAula(gMat, mat.nome, 20, "PRESENTE");
  await porAula(gMat, mat.nome, 27, "FALTA");
  await porAula(gPor, por.nome, 6, "PRESENTE");
  // cópia com grafia diferente (sem acento, espaços, caixa): casa pelo nome normalizado
  await porAula(gPor, `  LINGUA  portuguesa ${SUF.toUpperCase()} `, 13, "JUSTIFICADA");
});

afterAll(async () => {
  await app?.close();
});

describe("piso entre recuperação e reprovação", () => {
  const regra = (piso: number): RegraAprovacao => ({ mediaMinima: 6, notaMinimaRecuperacao: piso, frequenciaMinima: 75, periodos: 4 });
  const freqOk = { presencas: 10, totalAulas: 10 };

  it("piso padrão 3 mantém exatamente a regra antiga (3,0 fixo)", () => {
    const antiga = (m: number) => (m >= 6 ? "APROVADO" : m >= 3.0 ? "RECUPERACAO" : "REPROVADO");
    for (let m = 0; m <= 10; m += 0.25) {
      expect(determinaSituacao(m, 4, freqOk, regra(3))).toBe(antiga(m));
    }
    expect(determinaSituacao(2.99, 4, freqOk, regra(3))).toBe("REPROVADO");
    expect(determinaSituacao(3, 4, freqOk, regra(3))).toBe("RECUPERACAO");
  });

  it("sem configuração cadastrada, a regra da turma usa piso 3", async () => {
    const r = await notaService.regraDaTurma({ anoLetivo: 2099, escolaId: c.escolaA.id, etapaId: c.etapa.id });
    expect(r).toEqual({ mediaMinima: 6, notaMinimaRecuperacao: 3, frequenciaMinima: 75, periodos: 4 });
  });

  it("piso 4 → média 3,5 vira REPROVADO; piso padrão (3) → RECUPERACAO — boletim, lote e situação final", async () => {
    const bolA = await notaService.getBoletim(alunoPisoA.id, undefined, HOJE);
    const dA = bolA.disciplinas.find((d) => d.disciplinaId === mat.id)!;
    expect(dA.mediaFinal).toBe(3.5);
    expect(dA.situacao).toBe("REPROVADO");
    const sA = await notaService.getSituacaoFinal(alunoPisoA.id, c.turmaA.id, mat.id, HOJE);
    expect(sA.situacao).toBe("REPROVADO");
    const loteA = await notaService.getBoletimTurma(c.turmaA.id, undefined, HOJE);
    const noLote = loteA.boletins.find((b) => b.matricula.id === alunoPisoA.id)!;
    expect(noLote.disciplinas.find((d) => d.disciplinaId === mat.id)!.situacao).toBe("REPROVADO");

    const bolB = await notaService.getBoletim(alunoPisoB.id, undefined, HOJE);
    expect(bolB.disciplinas.find((d) => d.disciplinaId === mat.id)!.situacao).toBe("RECUPERACAO");
    const sB = await notaService.getSituacaoFinal(alunoPisoB.id, c.turmaB.id, mat.id, HOJE);
    expect(sB.situacao).toBe("RECUPERACAO");
  });

  it("piso exatamente igual à média: 4,0 com piso 4 é RECUPERACAO (limite inclusivo)", () => {
    expect(determinaSituacao(4, 4, freqOk, regra(4))).toBe("RECUPERACAO");
    expect(determinaSituacao(3.99, 4, freqOk, regra(4))).toBe("REPROVADO");
  });

  it("validação: piso > média mínima, negativo ou > 10 → 400; dentro do intervalo → ok", async () => {
    const base = { anoLetivo: 2027, sistemaAvaliacao: "NOTA", numeroPeriodos: 4, percentualFrequenciaMinima: 75, escolaId: c.escolaA.id, etapaId: c.etapa.id };
    expect((await req("admin", "POST", "/api/configuracao-avaliacao", { ...base, mediaMinima: 6, notaMinimaRecuperacao: 6.5 })).statusCode).toBe(400);
    expect((await req("admin", "POST", "/api/configuracao-avaliacao", { ...base, mediaMinima: 6, notaMinimaRecuperacao: -1 })).statusCode).toBe(400);
    expect((await req("admin", "POST", "/api/configuracao-avaliacao", { ...base, mediaMinima: 6, notaMinimaRecuperacao: 11 })).statusCode).toBe(400);
    // piso = média mínima é permitido (sem faixa de recuperação)
    const igual = await req("admin", "POST", "/api/configuracao-avaliacao", { ...base, mediaMinima: 5, notaMinimaRecuperacao: 5 });
    expect(igual.statusCode).toBe(201);
    // sem piso e média mínima abaixo de 3: piso = própria média (mesmo resultado de antes, configuração válida)
    const baixa = await req("admin", "POST", "/api/configuracao-avaliacao", { ...base, anoLetivo: 2028, mediaMinima: 2 });
    expect(baixa.statusCode).toBe(201);
    expect(baixa.json().notaMinimaRecuperacao).toBe(2);

    const url = `/api/configuracao-avaliacao/${cfgA.id}`;
    // PUT parcial: só o piso, acima da média gravada (6) → 400
    const r1 = await req("admin", "PUT", url, { notaMinimaRecuperacao: 7 });
    expect(r1.statusCode).toBe(400);
    expect(r1.json().error).toMatch(/nota mínima para recuperação/i);
    // PUT parcial: só a média, abaixo do piso gravado (4) → 400
    expect((await req("admin", "PUT", url, { mediaMinima: 3.5 })).statusCode).toBe(400);
    // os dois no corpo, inconsistentes → 400
    expect((await req("admin", "PUT", url, { mediaMinima: 5, notaMinimaRecuperacao: 5.5 })).statusCode).toBe(400);
    // nada foi gravado pelas tentativas recusadas
    const atual = await prisma.configuracaoAvaliacao.findUniqueOrThrow({ where: { id: cfgA.id } });
    expect([atual.mediaMinima, atual.notaMinimaRecuperacao]).toEqual([6, 4]);
    // válido
    const ok = await req("admin", "PUT", url, { notaMinimaRecuperacao: 4.5 });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().notaMinimaRecuperacao).toBe(4.5);
    const volta = await req("admin", "PUT", url, { notaMinimaRecuperacao: 4 });
    expect(volta.statusCode).toBe(200);
  });

  it("listagem e detalhe devolvem o piso (schema de resposta não corta o campo)", async () => {
    const lista = await req("admin", "GET", `/api/configuracao-avaliacao?anoLetivo=2026&escolaId=${c.escolaA.id}`);
    expect(lista.statusCode).toBe(200);
    const doA = (lista.json() as Array<{ id: string; notaMinimaRecuperacao: number }>).find((x) => x.id === cfgA.id)!;
    expect(doA.notaMinimaRecuperacao).toBe(4);
    const det = await req("admin", "GET", `/api/configuracao-avaliacao/${cfgA.id}`);
    expect(det.json().notaMinimaRecuperacao).toBe(4);
  });
});

describe("frequência por disciplina no boletim (só exibição)", () => {
  it("chave de casamento: sem acento, minúsculas, espaços colapsados", () => {
    expect(chaveDisciplina("  Língua   Portuguesa ")).toBe("lingua portuguesa");
    expect(chaveDisciplina("CIÊNCIAS")).toBe(chaveDisciplina("ciencias"));
  });

  it("3/4 aulas de Matemática = 75%, 1/2 de Português = 50%, Ciências sem aula = null; situação pela frequência geral", async () => {
    const b = await notaService.getBoletim(c.matA.id, undefined, HOJE);
    const de = (id: string) => b.disciplinas.find((d) => d.disciplinaId === id)!;
    expect(de(mat.id).frequencia).toEqual({ totalAulas: 4, presencas: 3, faltas: 1, percentualPresenca: 75 });
    expect(de(por.id).frequencia).toEqual({ totalAulas: 2, presencas: 1, faltas: 1, percentualPresenca: 50 });
    expect(de(cie.id).frequencia).toBeNull();
    // Geral: 6 diárias + 4 aulas presentes de 12 = 83% → nada de reprovação por falta
    expect(b.frequencia).toMatchObject({ totalAulas: 12, presencas: 10, faltas: 2, percentualPresenca: 83, abaixoDoLimite: false });
    // Português com 50% na disciplina continua APROVADO (situação pela geral)
    expect(de(por.id).situacao).toBe("APROVADO");
    expect(b.situacaoGeral).toBe("APROVADO");
  });

  it("boletim individual = boletim em lote (com a frequência por disciplina)", async () => {
    const lote = await notaService.getBoletimTurma(c.turmaA.id, undefined, HOJE);
    expect(lote.boletins.length).toBeGreaterThanOrEqual(2);
    for (const b of lote.boletins) {
      expect(b).toEqual(await notaService.getBoletim(b.matricula.id, c.turmaA.id, HOJE));
    }
    const daAluna = lote.boletins.find((b) => b.matricula.id === c.matA.id)!;
    expect(daAluna.disciplinas.find((d) => d.disciplinaId === mat.id)!.frequencia?.percentualPresenca).toBe(75);
    // aluno só com chamada diária: frequência por disciplina null em todas
    const piso = lote.boletins.find((b) => b.matricula.id === alunoPisoA.id)!;
    expect(piso.disciplinas.every((d) => d.frequencia === null)).toBe(true);
  });

  it("rotas (staff e portal do responsável) devolvem o campo sem cortar, inclusive o null", async () => {
    const r = await req("admin", "GET", `/api/notas/boletim/${c.matA.id}`);
    expect(r.statusCode).toBe(200);
    const ds = r.json().disciplinas as Array<{ disciplinaId: string; frequencia: unknown }>;
    expect(ds.find((d) => d.disciplinaId === mat.id)!.frequencia).toEqual({ totalAulas: 4, presencas: 3, faltas: 1, percentualPresenca: 75 });
    expect(ds.find((d) => d.disciplinaId === cie.id)!.frequencia).toBeNull();

    const p = await req("resp-a", "GET", `/api/portal/meu/alunos/${c.matA.id}/boletim`);
    expect(p.statusCode).toBe(200);
    const pd = p.json().disciplinas as Array<{ disciplinaId: string; frequencia: { percentualPresenca: number } | null }>;
    expect(pd.find((d) => d.disciplinaId === por.id)!.frequencia?.percentualPresenca).toBe(50);
    expect(pd.find((d) => d.disciplinaId === cie.id)!.frequencia).toBeNull();
  });
});
