import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { veiculoService } from "../src/services/veiculo.service.js";
import { rotaTransporteService } from "../src/services/rota-transporte.service.js";

const DIA_MS = 86400000;

let escola: { id: string };
let matriculaA: { id: string };
let matriculaB: { id: string };

const baseMatricula = {
  anoLetivo: 2026,
  status: "ATIVA",
  dataNascimento: new Date("2015-03-10"),
  sexo: "M",
  nomeResponsavel: "Responsável Transporte",
};

describe("Transporte Escolar", () => {
  beforeAll(async () => {
    // Filhos antes de pais (FK-safe)
    await prisma.rotaAluno.deleteMany();
    await prisma.rotaEscola.deleteMany();
    await prisma.rotaTransporte.deleteMany();
    await prisma.manutencaoVeiculo.deleteMany();
    await prisma.veiculo.deleteMany();
    await prisma.motorista.deleteMany();
    await prisma.matricula.deleteMany({
      where: { numeroMatricula: { startsWith: "TRANSP" } },
    });
    await prisma.escola.deleteMany({ where: { codigo: "TRANSP-A" } });

    const tipo = await prisma.tipoEducacao.upsert({
      where: { nome: "Educação Regular Transporte" },
      update: {},
      create: { nome: "Educação Regular Transporte" },
    });
    const etapa = await prisma.etapaEnsino.create({
      data: {
        nome: `Fundamental Transporte ${Date.now()}`,
        tipoEducacaoId: tipo.id,
      },
    });
    escola = await prisma.escola.create({
      data: { nome: "Escola Transporte", codigo: "TRANSP-A" },
    });

    matriculaA = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "TRANSP-0001",
        nomeAluno: "Aluno Rota A",
        escolaId: escola.id,
        etapaId: etapa.id,
      },
    });
    matriculaB = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "TRANSP-0002",
        nomeAluno: "Aluno Rota B",
        escolaId: escola.id,
        etapaId: etapa.id,
      },
    });
  });

  it("vincula aluno à rota e rejeita o mesmo aluno duas vezes (BIZ_027)", async () => {
    const rota = await rotaTransporteService.create({
      nome: "Rota Sede Norte",
      codigo: "TROTA-01",
      turno: "MATUTINO",
      tipo: "RURAL",
      itinerario: "Sede → Comunidade Norte → Escola",
      ativo: true,
    });

    const vinculo = await rotaTransporteService.vincularAluno(rota.id, {
      matriculaId: matriculaA.id,
      pontoEmbarque: "Km 12 da vicinal",
    });
    expect(vinculo.matriculaId).toBe(matriculaA.id);
    expect(vinculo.pontoEmbarque).toBe("Km 12 da vicinal");

    await expect(
      rotaTransporteService.vincularAluno(rota.id, {
        matriculaId: matriculaA.id,
      })
    ).rejects.toMatchObject({ code: "BIZ_027" });
  });

  it("rejeita vínculo de aluno além da capacidade do veículo (BIZ_028)", async () => {
    const veiculo = await veiculoService.create({
      placa: "TRA1B23",
      tipo: "VAN",
      capacidade: 1,
      tipoPropriedade: "PROPRIO",
      adaptadoPCD: false,
      ativo: true,
    });

    const rota = await rotaTransporteService.create({
      nome: "Rota Lotada",
      codigo: "TROTA-02",
      turno: "VESPERTINO",
      tipo: "RURAL",
      itinerario: "Sede → Comunidade Sul → Escola",
      veiculoId: veiculo.id,
      ativo: true,
    });

    // Ocupa a única vaga do veículo
    await rotaTransporteService.vincularAluno(rota.id, {
      matriculaId: matriculaA.id,
    });

    // Segundo aluno excede a capacidade
    await expect(
      rotaTransporteService.vincularAluno(rota.id, {
        matriculaId: matriculaB.id,
      })
    ).rejects.toMatchObject({ code: "BIZ_028" });
  });

  it("rejeita motorista com CNH vencida vinculado a rota (BIZ_029)", async () => {
    const ontem = new Date(Date.now() - DIA_MS);
    const motorista = await prisma.motorista.create({
      data: {
        nome: "Motorista CNH Vencida",
        cpf: "90090090011",
        cnhNumero: "12345678900",
        cnhCategoria: "D",
        cnhValidade: ontem,
      },
    });

    await expect(
      rotaTransporteService.create({
        nome: "Rota Sem Condutor",
        codigo: "TROTA-03",
        turno: "MATUTINO",
        tipo: "URBANA",
        itinerario: "Bairro Centro → Escola",
        motoristaId: motorista.id,
        ativo: true,
      })
    ).rejects.toMatchObject({ code: "BIZ_029" });

    // Nenhuma rota deve ter sido criada com o código
    const orfa = await prisma.rotaTransporte.findUnique({
      where: { codigo: "TROTA-03" },
    });
    expect(orfa).toBeNull();
  });

  it("alerta vencimento de documentação do veículo dentro da janela de dias", async () => {
    const em10Dias = new Date(Date.now() + 10 * DIA_MS);
    const em90Dias = new Date(Date.now() + 90 * DIA_MS);

    const vencendo = await veiculoService.create({
      placa: "TRA2C34",
      tipo: "ONIBUS",
      capacidade: 40,
      tipoPropriedade: "PROPRIO",
      adaptadoPCD: false,
      vencimentoLicenciamento: em10Dias,
      ativo: true,
    });
    const emDia = await veiculoService.create({
      placa: "TRA3D45",
      tipo: "ONIBUS",
      capacidade: 40,
      tipoPropriedade: "PROPRIO",
      adaptadoPCD: false,
      vencimentoLicenciamento: em90Dias,
      ativo: true,
    });

    const alertas = await veiculoService.alertasVencimentos(30);
    const ids = alertas.map((a) => a.veiculo.id);

    expect(ids).toContain(vencendo.id);
    expect(ids).not.toContain(emDia.id);

    const alerta = alertas.find((a) => a.veiculo.id === vencendo.id);
    expect(alerta?.documentosVencendo).toEqual([
      {
        documento: "Licenciamento",
        vencimento: em10Dias,
        vencido: false,
      },
    ]);

    // Janela configurável: com 120 dias o segundo veículo também alerta
    const alertasAmplos = await veiculoService.alertasVencimentos(120);
    expect(alertasAmplos.map((a) => a.veiculo.id)).toContain(emDia.id);
  });
});
