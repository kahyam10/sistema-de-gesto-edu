// Frente D — situação final = boletim (mesma configuração) e avaliação
// realizada sem nota contando 0. Dados 100% fictícios.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { notaService } from "../src/services/nota.service.js";
import { criarEstrutura, criarAluno, dias } from "./fd-fixture.js";

const HOJE = new Date("2026-10-02T00:00:00.000Z");
let e: Awaited<ReturnType<typeof criarEstrutura>>;
let disc: { id: string; nome: string };

async function prova(bimestre: number, data: string, peso = 1, valorMaximo = 10) {
  return prisma.avaliacao.create({
    data: { nome: `Av ${bimestre} ${data}`, tipo: "PROVA", bimestre, data: new Date(data), peso, valorMaximo, turmaId: e.turma.id, disciplinaId: disc.id },
  });
}
async function nota(avaliacaoId: string, bimestre: number, matriculaId: string, valor: number) {
  return prisma.nota.create({ data: { valor, turmaId: e.turma.id, disciplina: disc.nome, bimestre, avaliacaoId, matriculaId } });
}
async function presencaTotal(matriculaId: string) {
  await prisma.frequencia.createMany({ data: dias(10).map((data) => ({ matriculaId, turmaId: e.turma.id, data, status: "PRESENTE" })) });
}

beforeAll(async () => {
  e = await criarEstrutura("FDN");
  disc = await prisma.disciplina.create({ data: { nome: "Ciências FDN", codigo: "CIE-FDN", etapaId: e.etapa.id } });
  // Configuração da rede para esta escola/etapa: média mínima 5,0
  await prisma.configuracaoAvaliacao.create({
    data: { anoLetivo: 2026, mediaMinima: 5, percentualFrequenciaMinima: 75, escolaId: e.escola.id, etapaId: e.etapa.id },
  });
});

describe("situação final usa a mesma regra do boletim", () => {
  it("média 5,5 com mínimo configurado 5,0 → APROVADO nos dois (antes a rota usava 6,0 fixo)", async () => {
    const aluno = await criarAluno("FDN", e, "Eva FDN");
    await presencaTotal(aluno.id);
    for (let b = 1; b <= 4; b++) {
      const av = await prova(b, `2026-0${b * 2}-05`);
      await nota(av.id, b, aluno.id, 5.5);
    }
    const boletim = await notaService.getBoletim(aluno.id, undefined, HOJE);
    const d = boletim.disciplinas.find((x) => x.disciplinaId === disc.id)!;
    expect(d.mediaFinal).toBe(5.5);
    expect(d.situacao).toBe("APROVADO");

    const s = await notaService.getSituacaoFinal(aluno.id, e.turma.id, disc.id, HOJE);
    expect(s).toEqual({ situacao: "APROVADO", mediaFinal: 5.5, frequencia: 100 });
    expect(await notaService.calcularMediaFinal(aluno.id, e.turma.id, disc.id, HOJE)).toBe(5.5);
  });
});

describe("avaliação sem nota lançada", () => {
  it("já realizada conta 0; futura ainda não entra — no boletim, na média e na situação", async () => {
    const aluno = await criarAluno("FDN", e, "Ivo FDN");
    const outro = await criarAluno("FDN", e, "Lia FDN");
    await presencaTotal(aluno.id);
    // bimestres 1–4 da disciplina já existem (teste anterior), mas sem nota do Ivo
    // → cada um conta 0 para ele. No 1º acrescenta uma prova com nota 10 e uma futura.
    const feita = await prova(1, "2026-03-20");
    await nota(feita.id, 1, aluno.id, 10);
    await nota(feita.id, 1, outro.id, 7);
    const futura = await prova(1, "2026-12-01", 3);
    await nota(futura.id, 1, outro.id, 9);

    // Bimestre 1: [5,5 do outro aluno não conta] Ivo: 0 (sem nota, realizada) + 10 → 5; futura fora
    expect(await notaService.calcularMedia(aluno.id, e.turma.id, disc.id, 1, HOJE)).toBe(5);
    // Se "hoje" passa da data da futura, ela entra como 0 com peso 3: (0+10+0*3)/5 = 2
    expect(await notaService.calcularMedia(aluno.id, e.turma.id, disc.id, 1, new Date("2026-12-02"))).toBe(2);

    const b = await notaService.getBoletim(aluno.id, undefined, HOJE);
    const d = b.disciplinas.find((x) => x.disciplinaId === disc.id)!;
    expect(d.bimestres.map((x) => x.media)).toEqual([5, 0, 0, 0]);
    expect(d.mediaFinal).toBe(1.25);
    // A nota null continua aparecendo como "não lançada" na lista de avaliações
    expect(d.bimestres[0].avaliacoes.find((a) => a.id === futura.id)?.nota).toBeNull();
    expect(d.situacao).toBe("REPROVADO");
    const s = await notaService.getSituacaoFinal(aluno.id, e.turma.id, disc.id, HOJE);
    expect(s.situacao).toBe("REPROVADO");
    expect(s.mediaFinal).toBe(1.25);
  });

  it("bimestre só com avaliação futura e sem nota fica sem média (EM_CURSO)", async () => {
    const e2 = await criarEstrutura("FDO");
    const d2 = await prisma.disciplina.create({ data: { nome: "Artes FDO", codigo: "ART-FDO", etapaId: e2.etapa.id } });
    const aluno = await criarAluno("FDO", e2, "Rui FDO");
    await prisma.avaliacao.create({
      data: { nome: "Futura", tipo: "PROVA", bimestre: 4, data: new Date("2026-12-10"), turmaId: e2.turma.id, disciplinaId: d2.id },
    });
    const b = await notaService.getBoletim(aluno.id, undefined, HOJE);
    expect(b.disciplinas[0].bimestres[3].media).toBeNull();
    expect(b.disciplinas[0].situacao).toBe("EM_CURSO");
  });

  it("pesos todos 0 (dado legado) não deixam a média null: vira média simples", async () => {
    const e3 = await criarEstrutura("FDP");
    const d3 = await prisma.disciplina.create({ data: { nome: "Geo FDP", codigo: "GEO-FDP", etapaId: e3.etapa.id } });
    const aluno = await criarAluno("FDP", e3, "Tom FDP");
    for (const [valor, data] of [[8, "2026-03-01"], [4, "2026-03-02"]] as const) {
      const av = await prisma.avaliacao.create({
        data: { nome: `P ${data}`, tipo: "PROVA", bimestre: 1, peso: 0, data: new Date(data), turmaId: e3.turma.id, disciplinaId: d3.id },
      });
      await prisma.nota.create({ data: { valor, turmaId: e3.turma.id, disciplina: d3.nome, bimestre: 1, avaliacaoId: av.id, matriculaId: aluno.id } });
    }
    expect(await notaService.calcularMedia(aluno.id, e3.turma.id, d3.id, 1, HOJE)).toBe(6);
  });
});
