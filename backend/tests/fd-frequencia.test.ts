// Frente D — chamada que preserva justificativa/observação e limite de 75%
// comparado pela razão exata. Dados 100% fictícios.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { frequenciaService, frequenciaAbaixoDoMinimo } from "../src/services/frequencia.service.js";
import { notaService } from "../src/services/nota.service.js";
import { criarEstrutura, criarAluno, dias } from "./fd-fixture.js";

const DIA = new Date("2026-03-04");
let e: Awaited<ReturnType<typeof criarEstrutura>>;
let ana: { id: string }, bia: { id: string }, caio: { id: string };

beforeAll(async () => {
  e = await criarEstrutura("FDF");
  ana = await criarAluno("FDF", e, "Ana FDF");
  bia = await criarAluno("FDF", e, "Bia FDF");
  caio = await criarAluno("FDF", e, "Caio FDF");
});

const registro = (matriculaId: string) =>
  prisma.frequencia.findUnique({
    // chave única com aulaChave (frequência por aula): turma sem grade = "DIA"
    where: { matriculaId_turmaId_data_aulaChave: { matriculaId, turmaId: e.turma.id, data: DIA, aulaChave: "DIA" } },
  });

describe("chamada do professor não apaga o que a secretaria lançou", () => {
  it("correção de um aluno mantém justificativa/observação dos outros e não apaga quem não veio", async () => {
    // Professor faz a chamada
    await frequenciaService.registrarTurma({
      turmaId: e.turma.id,
      data: DIA,
      presencas: [
        { matriculaId: ana.id, status: "FALTA" },
        { matriculaId: bia.id, status: "FALTA" },
        { matriculaId: caio.id, status: "PRESENTE" },
      ],
    });
    // Secretaria justifica a falta da Ana e anota observação da Bia
    const fa = await registro(ana.id);
    await frequenciaService.update(fa!.id, { status: "JUSTIFICADA", justificativa: "Atestado (fictício)" });
    const fb = await registro(bia.id);
    await frequenciaService.update(fb!.id, { observacao: "Chegou a avisar" });

    // App do professor reenvia só { matriculaId, status } — e só de quem mudou
    const r = await frequenciaService.registrarTurma({
      turmaId: e.turma.id,
      data: DIA,
      presencas: [
        { matriculaId: ana.id, status: "JUSTIFICADA" },
        { matriculaId: bia.id, status: "PRESENTE" },
      ],
    });
    // Formato da resposta mantido
    expect(r.message).toBe("Frequência registrada para 2 aluno(s)");
    expect(r.registros.map((x) => x.matricula.id).sort()).toEqual([ana.id, bia.id].sort());

    expect(await registro(ana.id)).toMatchObject({ status: "JUSTIFICADA", justificativa: "Atestado (fictício)" });
    expect(await registro(bia.id)).toMatchObject({ status: "PRESENTE", observacao: "Chegou a avisar" });
    // Caio não veio no payload: registro intocado (antes era apagado)
    expect(await registro(caio.id)).toMatchObject({ status: "PRESENTE" });
  });

  it("status saindo de JUSTIFICADA limpa a justificativa (mas mantém a observação)", async () => {
    const fa = await registro(ana.id);
    await frequenciaService.update(fa!.id, { observacao: "Obs da secretaria" });
    await frequenciaService.registrarTurma({
      turmaId: e.turma.id,
      data: DIA,
      presencas: [{ matriculaId: ana.id, status: "PRESENTE" }],
    });
    expect(await registro(ana.id)).toMatchObject({ status: "PRESENTE", justificativa: null, observacao: "Obs da secretaria" });
  });

  it("campos enviados explicitamente sobrescrevem", async () => {
    await frequenciaService.registrarTurma({
      turmaId: e.turma.id,
      data: DIA,
      presencas: [{ matriculaId: bia.id, status: "JUSTIFICADA", justificativa: "Nova", observacao: "Outra" }],
    });
    expect(await registro(bia.id)).toMatchObject({ status: "JUSTIFICADA", justificativa: "Nova", observacao: "Outra" });
  });

  it("matrícula de outra turma continua rejeitada e nada é gravado", async () => {
    await expect(
      frequenciaService.registrarTurma({
        turmaId: e.turma.id,
        data: new Date("2026-03-05"),
        presencas: [{ matriculaId: "matricula-alheia-fd", status: "PRESENTE" }],
      })
    ).rejects.toThrow();
  });
});

describe("limite de 75% pela razão exata", () => {
  it("helper: 149/200 (74,5%) está abaixo; 150/200 não; sem aulas conta como abaixo", () => {
    expect(frequenciaAbaixoDoMinimo(149, 200)).toBe(true);
    expect(frequenciaAbaixoDoMinimo(150, 200)).toBe(false);
    expect(frequenciaAbaixoDoMinimo(0, 0)).toBe(true);
    expect(frequenciaAbaixoDoMinimo(79, 100, 80)).toBe(true);
  });

  it("149 presenças em 200 aulas: exibe 75% mas abaixoDoLimite=true; boletim reprova por frequência", async () => {
    const e2 = await criarEstrutura("FDL");
    const aluno = await criarAluno("FDL", e2, "Davi FDL");
    const ds = dias(200);
    await prisma.frequencia.createMany({
      data: ds.map((data, i) => ({ matriculaId: aluno.id, turmaId: e2.turma.id, data, status: i < 149 ? "PRESENTE" : "FALTA" })),
    });
    const stats = await frequenciaService.calcularEstatisticas(aluno.id, e2.turma.id);
    expect(stats.percentualPresenca).toBe(75); // exibição continua arredondada
    expect(stats.abaixoDoLimite).toBe(true);

    const resumo = await frequenciaService.getResumoTurma(e2.turma.id);
    expect(resumo[0].estatisticas.abaixoDoLimite).toBe(true);
    expect((await frequenciaService.listarAlunosComBaixaFrequencia(e2.turma.id)).map((x) => x.matricula.id)).toEqual([aluno.id]);

    // 4 bimestres com nota 10 → só a frequência decide: antes saía APROVADO
    const disc = await prisma.disciplina.create({ data: { nome: "Mat FDL", codigo: "MAT-FDL", etapaId: e2.etapa.id } });
    for (let bimestre = 1; bimestre <= 4; bimestre++) {
      const av = await prisma.avaliacao.create({
        data: { nome: `P${bimestre}`, tipo: "PROVA", bimestre, data: new Date(`2026-0${bimestre * 2}-10`), turmaId: e2.turma.id, disciplinaId: disc.id },
      });
      await prisma.nota.create({ data: { valor: 10, turmaId: e2.turma.id, disciplina: disc.nome, bimestre, avaliacaoId: av.id, matriculaId: aluno.id } });
    }
    const hoje = new Date("2026-12-31");
    const b = await notaService.getBoletim(aluno.id, undefined, hoje);
    expect(b.frequencia.percentualPresenca).toBe(75);
    expect(b.frequencia.abaixoDoLimite).toBe(true);
    expect(b.disciplinas[0].situacao).toBe("REPROVADO");
    const s = await notaService.getSituacaoFinal(aluno.id, e2.turma.id, disc.id, hoje);
    expect(s.situacao).toBe("REPROVADO");
  });
});
