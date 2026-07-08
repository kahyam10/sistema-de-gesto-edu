import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { frequenciaService } from "../src/services/frequencia.service.js";
import { notaService } from "../src/services/nota.service.js";
import { avaliacaoService } from "../src/services/avaliacao.service.js";
import { disciplinaService } from "../src/services/disciplina.service.js";

let escola: { id: string };
let etapa: { id: string };
let turma: { id: string };
let matricula: { id: string };
let disciplina: { id: string };

describe("Módulo Pedagógico (frequência + notas + boletim)", () => {
  beforeAll(async () => {
    await prisma.nota.deleteMany();
    await prisma.avaliacao.deleteMany();
    await prisma.frequencia.deleteMany();
    await prisma.disciplina.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Regular Pedagógico" },
    });
    etapa = await prisma.etapaEnsino.create({
      data: { nome: "Fundamental Ped", tipoEducacaoId: tipo.id },
    });
    const nivel = await prisma.nivelEnsino.create({
      data: { nome: "Anos Iniciais Ped", etapaId: etapa.id },
    });
    const serie = await prisma.serie.create({
      data: { nome: "3º Ano Ped", nivelId: nivel.id },
    });
    escola = await prisma.escola.create({
      data: { nome: "Escola Ped", codigo: "PED-01" },
    });
    turma = await prisma.turma.create({
      data: {
        nome: "3A",
        turno: "MATUTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: serie.id,
      },
    });
    matricula = await prisma.matricula.create({
      data: {
        numeroMatricula: "PED000001",
        anoLetivo: 2026,
        status: "ATIVA",
        nomeAluno: "Aluna Boletim",
        dataNascimento: new Date("2016-05-01"),
        sexo: "F",
        nomeResponsavel: "Resp Boletim",
        escolaId: escola.id,
        etapaId: etapa.id,
        turmaId: turma.id,
      },
    });
    disciplina = await disciplinaService.create({
      nome: "Matemática Ped",
      codigo: "MAT-PED",
      etapaId: etapa.id,
      obrigatoria: true,
      ativo: true,
      ordem: 0,
    });
  });

  it("registra frequência da turma e calcula estatísticas", async () => {
    await frequenciaService.registrarTurma({
      turmaId: turma.id,
      data: new Date("2026-03-02"),
      presencas: [{ matriculaId: matricula.id, status: "PRESENTE" }],
    });
    await frequenciaService.registrarTurma({
      turmaId: turma.id,
      data: new Date("2026-03-03"),
      presencas: [{ matriculaId: matricula.id, status: "FALTA" }],
    });

    const stats = await frequenciaService.calcularEstatisticas(
      matricula.id,
      turma.id
    );
    expect(stats.totalAulas).toBe(2);
    expect(stats.presencas).toBe(1);
    expect(stats.percentualPresenca).toBe(50);
  });

  it("rejeita frequência de matrícula que não pertence à turma", async () => {
    await expect(
      frequenciaService.registrarTurma({
        turmaId: turma.id,
        data: new Date("2026-03-04"),
        presencas: [{ matriculaId: "matricula-alheia", status: "PRESENTE" }],
      })
    ).rejects.toThrow();
  });

  it("calcula média ponderada por avaliação (peso)", async () => {
    const prova = await avaliacaoService.create({
      nome: "Prova B1",
      tipo: "PROVA",
      peso: 2,
      valorMaximo: 10,
      data: new Date("2026-03-10"),
      bimestre: 1,
      turmaId: turma.id,
      disciplinaId: disciplina.id,
    });
    const trabalho = await avaliacaoService.create({
      nome: "Trabalho B1",
      tipo: "TRABALHO",
      peso: 1,
      valorMaximo: 10,
      data: new Date("2026-03-20"),
      bimestre: 1,
      turmaId: turma.id,
      disciplinaId: disciplina.id,
    });

    await notaService.lancarNotasTurma({
      avaliacaoId: prova.id,
      notas: [{ matriculaId: matricula.id, valor: 8 }],
    });
    await notaService.lancarNotasTurma({
      avaliacaoId: trabalho.id,
      notas: [{ matriculaId: matricula.id, valor: 5 }],
    });

    // (8*2 + 5*1) / 3 = 7
    const media = await notaService.calcularMedia(
      matricula.id,
      turma.id,
      disciplina.id,
      1
    );
    expect(media).toBe(7);
  });

  it("gera boletim com média por bimestre e situação EM_CURSO", async () => {
    const boletim = await notaService.getBoletim(matricula.id);

    expect(boletim.matricula.numeroMatricula).toBe("PED000001");
    const disc = boletim.disciplinas.find(
      (d) => d.disciplinaId === disciplina.id
    );
    expect(disc).toBeDefined();
    expect(disc!.bimestres.find((b) => b.bimestre === 1)?.media).toBe(7);
    // Só o 1º bimestre tem nota → EM_CURSO
    expect(disc!.situacao).toBe("EM_CURSO");
    expect(boletim.frequencia.percentualPresenca).toBe(50);
  });

  it("reprova por frequência (<75%) mesmo com médias altas nos 4 bimestres", async () => {
    // completa os bimestres 2-4 com nota 10
    for (let bim = 2; bim <= 4; bim++) {
      const av = await avaliacaoService.create({
        nome: `Prova B${bim}`,
        tipo: "PROVA",
        peso: 1,
        valorMaximo: 10,
        data: new Date(`2026-0${bim + 3}-10`),
        bimestre: bim,
        turmaId: turma.id,
        disciplinaId: disciplina.id,
      });
      await notaService.lancarNotasTurma({
        avaliacaoId: av.id,
        notas: [{ matriculaId: matricula.id, valor: 10 }],
      });
    }

    const boletim = await notaService.getBoletim(matricula.id);
    const disc = boletim.disciplinas.find(
      (d) => d.disciplinaId === disciplina.id
    )!;
    // frequência está em 50% (<75%) → REPROVADO apesar das notas
    expect(disc.situacao).toBe("REPROVADO");
    expect(disc.mediaFinal).not.toBeNull();
  });
});
