import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { matriculaService } from "../src/services/matricula.service.js";

let escolaA: { id: string };
let escolaB: { id: string };
let etapa: { id: string };

const baseMatricula = {
  anoLetivo: 2026,
  status: "ATIVA",
  nomeAluno: "Aluno Teste",
  dataNascimento: new Date("2015-03-10"),
  sexo: "M",
  nomeResponsavel: "Responsável Teste",
};

describe("MatriculaService", () => {
  beforeAll(async () => {
    await prisma.transferenciaMatricula.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.escolaEtapa.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Educação Regular Teste" },
    });
    etapa = await prisma.etapaEnsino.create({
      data: { nome: "Ensino Fundamental Teste", tipoEducacaoId: tipo.id },
    });
    escolaA = await prisma.escola.create({
      data: { nome: "Escola A", codigo: "TESTE-A" },
    });
    escolaB = await prisma.escola.create({
      data: { nome: "Escola B", codigo: "TESTE-B" },
    });
  });

  it("cria matrícula gerando número único prefixado pelo ano letivo", async () => {
    const matricula = await matriculaService.create({
      ...baseMatricula,
      cpfAluno: "11122233344",
      escolaId: escolaA.id,
      etapaId: etapa.id,
    } as Parameters<typeof matriculaService.create>[0]);

    expect(matricula.numeroMatricula).toMatch(/^2026\d{5}$/);
    expect(matricula.status).toBe("ATIVA");
    expect(matricula.escolaId).toBe(escolaA.id);
  });

  it("rejeita segunda matrícula ativa com o mesmo CPF no mesmo ano", async () => {
    await expect(
      matriculaService.create({
        ...baseMatricula,
        nomeAluno: "Outro Aluno",
        cpfAluno: "11122233344",
        escolaId: escolaB.id,
        etapaId: etapa.id,
      } as Parameters<typeof matriculaService.create>[0])
    ).rejects.toThrow("Já existe uma matrícula ativa com este CPF");
  });

  it("transfere matrícula registrando histórico com origem e destino", async () => {
    const matricula = await matriculaService.create({
      ...baseMatricula,
      nomeAluno: "Aluno Transferido",
      cpfAluno: "55566677788",
      escolaId: escolaA.id,
      etapaId: etapa.id,
    } as Parameters<typeof matriculaService.create>[0]);

    const transferida = await matriculaService.transferir(
      matricula.id,
      escolaB.id,
      undefined,
      "Mudança de bairro"
    );

    expect(transferida.status).toBe("TRANSFERIDA");
    expect(transferida.escolaId).toBe(escolaB.id);

    const historico = await matriculaService.getTransferencias(matricula.id);
    expect(historico).toHaveLength(1);
    expect(historico[0].escolaOrigemId).toBe(escolaA.id);
    expect(historico[0].escolaDestinoId).toBe(escolaB.id);
    expect(historico[0].motivo).toBe("Mudança de bairro");
  });

  it("falha ao transferir matrícula inexistente sem gravar histórico órfão", async () => {
    await expect(
      matriculaService.transferir("id-inexistente", escolaB.id)
    ).rejects.toThrow("Matrícula não encontrada");

    const orfaos = await prisma.transferenciaMatricula.findMany({
      where: { matriculaId: "id-inexistente" },
    });
    expect(orfaos).toHaveLength(0);
  });

  it("cancela matrícula removendo-a da turma", async () => {
    const matricula = await matriculaService.create({
      ...baseMatricula,
      nomeAluno: "Aluno Cancelado",
      cpfAluno: "99988877766",
      escolaId: escolaA.id,
      etapaId: etapa.id,
    } as Parameters<typeof matriculaService.create>[0]);

    const cancelada = await matriculaService.cancelar(matricula.id);

    expect(cancelada.status).toBe("CANCELADA");
    expect(cancelada.turmaId).toBeNull();
  });
});
