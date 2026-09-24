import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { liderTurmaService } from "../src/services/lider-turma.service.js";
import { gremioService } from "../src/services/gremio.service.js";
import { reuniaoDemocraticaService } from "../src/services/reuniao-democratica.service.js";

let escola: { id: string };
let turmaA: { id: string };
let turmaB: { id: string };
let matriculaTurmaA: { id: string };
let matriculaTurmaA2: { id: string };
let matriculaTurmaB: { id: string };

describe("Módulo 8 — Gestão Democrática", () => {
  beforeAll(async () => {
    // Limpeza em ordem FK-segura (filhos antes de pais)
    await prisma.presencaReuniaoDemocratica.deleteMany();
    await prisma.reuniaoDemocratica.deleteMany();
    await prisma.membroColegiado.deleteMany();
    await prisma.colegiadoEscolar.deleteMany();
    await prisma.chapaGremio.deleteMany();
    await prisma.atividadeGremio.deleteMany();
    await prisma.gremioEstudantil.deleteMany();
    await prisma.liderTurma.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Regular Democrática" },
    });
    const etapa = await prisma.etapaEnsino.create({
      data: { nome: "Fundamental Dem", tipoEducacaoId: tipo.id },
    });
    const nivel = await prisma.nivelEnsino.create({
      data: { nome: "Anos Finais Dem", etapaId: etapa.id },
    });
    const serie = await prisma.serie.create({
      data: { nome: "8º Ano Dem", nivelId: nivel.id },
    });
    escola = await prisma.escola.create({
      data: { nome: "Escola Democrática", codigo: "DEM-01" },
    });
    turmaA = await prisma.turma.create({
      data: {
        nome: "8A",
        turno: "MATUTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: serie.id,
      },
    });
    turmaB = await prisma.turma.create({
      data: {
        nome: "8B",
        turno: "VESPERTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: serie.id,
      },
    });

    const baseMatricula = {
      anoLetivo: 2026,
      status: "ATIVA",
      dataNascimento: new Date("2012-04-15"),
      sexo: "F",
      nomeResponsavel: "Responsável Dem",
      escolaId: escola.id,
      etapaId: etapa.id,
    };
    matriculaTurmaA = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "DEM000001",
        nomeAluno: "Aluna Líder",
        turmaId: turmaA.id,
      },
    });
    matriculaTurmaA2 = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "DEM000002",
        nomeAluno: "Aluno Vice",
        sexo: "M",
        turmaId: turmaA.id,
      },
    });
    matriculaTurmaB = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "DEM000003",
        nomeAluno: "Aluno Outra Turma",
        sexo: "M",
        turmaId: turmaB.id,
      },
    });
  });

  it("impede segundo LIDER na mesma turma/ano (BIZ_030), mas aceita um VICE_LIDER", async () => {
    const lider = await liderTurmaService.create({
      turmaId: turmaA.id,
      matriculaId: matriculaTurmaA.id,
      anoLetivo: 2026,
      tipo: "LIDER",
      formaEscolha: "ELEICAO",
    });
    expect(lider.tipo).toBe("LIDER");

    await expect(
      liderTurmaService.create({
        turmaId: turmaA.id,
        matriculaId: matriculaTurmaA2.id,
        anoLetivo: 2026,
        tipo: "LIDER",
        formaEscolha: "ELEICAO",
      })
    ).rejects.toMatchObject({ code: "BIZ_030" });

    const vice = await liderTurmaService.create({
      turmaId: turmaA.id,
      matriculaId: matriculaTurmaA2.id,
      anoLetivo: 2026,
      tipo: "VICE_LIDER",
      formaEscolha: "INDICACAO",
    });
    expect(vice.tipo).toBe("VICE_LIDER");
  });

  it("rejeita líder cuja matrícula pertence a outra turma (BIZ_031)", async () => {
    await expect(
      liderTurmaService.create({
        turmaId: turmaA.id,
        matriculaId: matriculaTurmaB.id,
        anoLetivo: 2027,
        tipo: "LIDER",
        formaEscolha: "ELEICAO",
      })
    ).rejects.toMatchObject({ code: "BIZ_031" });
  });

  it("apura a eleição marcando a chapa vencedora e ativando o grêmio; segunda apuração falha (BIZ_032)", async () => {
    const gremio = await gremioService.create({
      nome: "Grêmio Estudantil Dem",
      escolaId: escola.id,
      anoLetivo: 2026,
      status: "EM_ELEICAO",
    });
    const chapa1 = await gremioService.addChapa(gremio.id, {
      nome: "Chapa Um",
      numero: 1,
      membros: [{ nome: "Aluna Líder", cargo: "PRESIDENTE" }],
    });
    const chapa2 = await gremioService.addChapa(gremio.id, {
      nome: "Chapa Dois",
      numero: 2,
    });

    const apurado = await gremioService.apurarEleicao(gremio.id, {
      resultados: [
        { chapaId: chapa1.id, votosRecebidos: 30 },
        { chapaId: chapa2.id, votosRecebidos: 70 },
      ],
    });

    expect(apurado.status).toBe("ATIVO");
    const vencedora = apurado.chapas.find((c) => c.id === chapa2.id);
    const perdedora = apurado.chapas.find((c) => c.id === chapa1.id);
    expect(vencedora?.eleita).toBe(true);
    expect(vencedora?.votosRecebidos).toBe(70);
    expect(perdedora?.eleita).toBe(false);
    expect(perdedora?.votosRecebidos).toBe(30);

    await expect(
      gremioService.apurarEleicao(gremio.id, {
        resultados: [{ chapaId: chapa1.id, votosRecebidos: 99 }],
      })
    ).rejects.toMatchObject({ code: "BIZ_032" });
  });

  it("registra ata com presenças e status REALIZADA; reunião cancelada é imutável (BIZ_033)", async () => {
    const reuniao = await reuniaoDemocraticaService.create({
      titulo: "Assembleia Geral Dem",
      orgao: "ASSEMBLEIA_GERAL",
      data: new Date("2026-08-15"),
      horario: "19:00",
      escolaId: escola.id,
    });

    const realizada = await reuniaoDemocraticaService.registrarAta(reuniao.id, {
      ata: "Ata da assembleia geral com deliberações registradas.",
      decisoes: [{ descricao: "Aprovar calendário", votosFavor: 12 }],
      presencas: [
        { nome: "Maria da Comunidade", segmento: "COMUNIDADE", presente: true },
        { nome: "João Professor", segmento: "PROFESSOR", presente: true },
      ],
    });

    expect(realizada.status).toBe("REALIZADA");
    expect(realizada.ata).toContain("Ata da assembleia");
    expect(realizada.presencas).toHaveLength(2);

    await reuniaoDemocraticaService.cancelar(reuniao.id);

    await expect(
      reuniaoDemocraticaService.registrarAta(reuniao.id, {
        ata: "Tentativa de alterar reunião cancelada.",
      })
    ).rejects.toMatchObject({ code: "BIZ_033" });
  });
});
