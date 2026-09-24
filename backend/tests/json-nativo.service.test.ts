import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { escolaService } from "../src/services/escola.service.js";
import { phaseService } from "../src/services/phase.service.js";
import { AcompanhamentoService } from "../src/services/acompanhamento.service.js";
import { NotificacaoService } from "../src/services/notificacao.service.js";
import { matriculaService } from "../src/services/matricula.service.js";

// Roundtrip dos campos convertidos de String(JSON) para Json nativo (jsonb)

const acompanhamentoService = new AcompanhamentoService();
const notificacaoService = new NotificacaoService();

let escola: { id: string };
let etapa: { id: string };
let user: { id: string };

describe("Campos Json nativos (jsonb)", () => {
  beforeAll(async () => {
    await prisma.notificacao.deleteMany();
    await prisma.acompanhamentoIndividualizado.deleteMany();
    await prisma.transferenciaMatricula.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.phase.deleteMany();
    await prisma.escolaEtapa.deleteMany();
    await prisma.user.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Educação Regular JSON" },
    });
    etapa = await prisma.etapaEnsino.create({
      data: { nome: "Fundamental JSON", tipoEducacaoId: tipo.id },
    });
    escola = await prisma.escola.create({
      data: { nome: "Escola JSON", codigo: "TESTE-JSON" },
    });
    user = await prisma.user.create({
      data: {
        email: "json@teste.dev",
        password: "hash-irrelevante",
        nome: "Usuário JSON",
      },
    });
  });

  it("dadosCenso da escola faz roundtrip como objeto (sem string)", async () => {
    await escolaService.updateCenso(escola.id, {
      salasClimatizadas: true,
      observacao: "censo teste",
      quantidade: 7,
    });

    const salva = await prisma.escola.findUnique({ where: { id: escola.id } });
    expect(salva!.dadosCenso).toEqual({
      salasClimatizadas: true,
      observacao: "censo teste",
      quantidade: 7,
    });
  });

  it("updateCenso(null) grava NULL de banco (não string 'null')", async () => {
    await escolaService.updateCenso(escola.id, null);
    const salva = await prisma.escola.findUnique({ where: { id: escola.id } });
    expect(salva!.dadosCenso).toBeNull();
  });

  it("phase.moduleIds roundtrip como array; ausente vira []", async () => {
    const comIds = await phaseService.create({
      name: "Fase JSON",
      description: "teste",
      status: "planning",
      ordem: 90,
      monthRange: "Jan-Fev",
      duration: "2 meses",
      moduleIds: ["mod-a", "mod-b"],
    } as Parameters<typeof phaseService.create>[0]);
    expect(comIds.moduleIds).toEqual(["mod-a", "mod-b"]);

    const achada = await phaseService.findById(comIds.id);
    expect(achada!.moduleIds).toEqual(["mod-a", "mod-b"]);

    const semIds = await phaseService.create({
      name: "Fase JSON vazia",
      description: "teste",
      status: "planning",
      ordem: 91,
      monthRange: "Mar-Abr",
      duration: "2 meses",
    } as Parameters<typeof phaseService.create>[0]);
    expect(semIds.moduleIds).toEqual([]);
  });

  it("acompanhamento.evolucoes acumula registros em array", async () => {
    const matricula = await matriculaService.create({
      anoLetivo: 2026,
      status: "ATIVA",
      nomeAluno: "Aluno JSON",
      dataNascimento: new Date("2016-05-01"),
      sexo: "F",
      nomeResponsavel: "Resp JSON",
      escolaId: escola.id,
      etapaId: etapa.id,
    } as Parameters<typeof matriculaService.create>[0]);

    const acomp = await acompanhamentoService.create({
      matriculaId: matricula.id,
      tipo: "PEDAGOGICO",
      motivo: "teste json",
      escolaId: escola.id,
    });

    await acompanhamentoService.registrarEvolucao(acomp.id, {
      data: new Date("2026-03-01"),
      observacao: "primeira evolução",
    });
    const depois = await acompanhamentoService.registrarEvolucao(acomp.id, {
      data: new Date("2026-04-01"),
      observacao: "segunda evolução",
    });

    const evolucoes = depois.evolucoes as Array<Record<string, unknown>>;
    expect(Array.isArray(evolucoes)).toBe(true);
    expect(evolucoes).toHaveLength(2);
    expect(evolucoes[0].observacao).toBe("primeira evolução");
    expect(evolucoes[1].observacao).toBe("segunda evolução");
    expect(evolucoes[1]).toHaveProperty("id");
    expect(evolucoes[1]).toHaveProperty("criadoEm");
  });

  it("notificacao.canais roundtrip como array", async () => {
    const notificacao = await notificacaoService.create({
      userId: user.id,
      titulo: "Teste JSON",
      mensagem: "canais nativos",
      tipo: "SISTEMA",
      canais: ["APP", "EMAIL"],
    });

    const salva = await prisma.notificacao.findUnique({
      where: { id: notificacao.id },
    });
    expect(salva!.canais).toEqual(["APP", "EMAIL"]);
  });

  it("matricula.documentosEntregues roundtrip como checklist Record<tipo, boolean>", async () => {
    const matricula = await matriculaService.create({
      anoLetivo: 2026,
      status: "ATIVA",
      nomeAluno: "Aluno Docs",
      dataNascimento: new Date("2015-09-09"),
      sexo: "M",
      nomeResponsavel: "Resp Docs",
      escolaId: escola.id,
      etapaId: etapa.id,
      documentosEntregues: {
        CERTIDAO_NASCIMENTO: true,
        COMPROVANTE_RESIDENCIA: false,
      },
    } as Parameters<typeof matriculaService.create>[0]);

    const salva = await prisma.matricula.findUnique({
      where: { id: matricula.id },
    });
    expect(salva!.documentosEntregues).toEqual({
      CERTIDAO_NASCIMENTO: true,
      COMPROVANTE_RESIDENCIA: false,
    });
  });
});
