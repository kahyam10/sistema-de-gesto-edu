import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { CreateEscolaInput, UpdateEscolaInput } from "../schemas/index.js";
import { contextoAtual } from "../lib/contexto.js";
import { filtroLeitura } from "../lib/escopo.js";

/**
 * Includes não passam pela extensão de escopo do Prisma (ela filtra só o model
 * da consulta raiz): o filtro de leitura do model incluído vai aqui, a partir
 * do escopo da requisição. Sem contexto/escopo (gestão da rede, jobs) = {}.
 */
function ondeNoEscopo(model: string): { where?: Record<string, unknown> } {
  const escopo = contextoAtual()?.escopo;
  const filtro = escopo ? filtroLeitura(model, escopo) : null;
  return filtro ? { where: filtro } : {};
}

export class EscolaService {
  async findAll() {
    return prisma.escola.findMany({
      include: {
        etapas: { include: { etapa: true } },
        diretor: { select: { id: true, nome: true, tipo: true, email: true, telefone: true, dadosCenso: true } },
      },
      orderBy: { nome: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.escola.findUnique({
      where: { id },
      include: {
        etapas: { include: { etapa: true } },
        turmas: { ...ondeNoEscopo("Turma"), include: { serie: true } },
        profissionais: { ...ondeNoEscopo("EscolaProfissional") },
        diretor: { select: { id: true, nome: true, tipo: true, email: true, telefone: true, dadosCenso: true } },
      },
    });
  }

  async findByCodigo(codigo: string) {
    return prisma.escola.findUnique({
      where: { codigo },
    });
  }

  async create(data: CreateEscolaInput) {
    const { etapasIds, diretorId, ...escolaData } = data;

    return prisma.escola.create({
      data: {
        ...escolaData,
        email: escolaData.email || null,
        diretorId: diretorId || null,
        etapas: etapasIds
          ? {
              create: etapasIds.map((etapaId) => ({
                etapaId,
              })),
            }
          : undefined,
      },
      include: {
        etapas: { include: { etapa: true } },
        diretor: { select: { id: true, nome: true, tipo: true, email: true, telefone: true, dadosCenso: true } },
      },
    });
  }

  async update(id: string, data: UpdateEscolaInput) {
    const { etapasIds, diretorId, ...escolaData } = data;

    return prisma.$transaction(async (tx) => {
      // Se etapasIds foi fornecido, atualiza as etapas
      if (etapasIds !== undefined) {
        // Remove etapas antigas
        await tx.escolaEtapa.deleteMany({
          where: { escolaId: id },
        });

        // Adiciona novas etapas
        if (etapasIds.length > 0) {
          await tx.escolaEtapa.createMany({
            data: etapasIds.map((etapaId) => ({
              escolaId: id,
              etapaId,
            })),
          });
        }
      }

      return tx.escola.update({
        where: { id },
        data: {
          ...escolaData,
          email: escolaData.email || null,
          ...(diretorId !== undefined && { diretorId: diretorId || null }),
        },
        include: {
          etapas: { include: { etapa: true } },
          diretor: { select: { id: true, nome: true, tipo: true, email: true, telefone: true, dadosCenso: true } },
        },
      });
    });
  }

  async updateCenso(id: string, dados: unknown) {
    return prisma.escola.update({
      where: { id },
      data: {
        dadosCenso:
          dados === null || dados === undefined
            ? Prisma.DbNull
            : (dados as Prisma.InputJsonValue),
      },
    });
  }

  async delete(id: string) {
    return prisma.escola.delete({
      where: { id },
    });
  }

  async getEstatisticas(id: string) {
    const escola = await prisma.escola.findUnique({
      where: { id },
      include: {
        // Professor: só as turmas e os alunos do seu escopo (antes, o include
        // trazia as matrículas de todas as turmas da escola)
        turmas: {
          ...ondeNoEscopo("Turma"),
          select: {
            capacidadeMaxima: true,
            _count: { select: { matriculas: { ...ondeNoEscopo("Matricula") } } },
          },
        },
      },
    });

    if (!escola) return null;

    const totalTurmas = escola.turmas.length;
    const totalAlunos = escola.turmas.reduce(
      (acc, turma) => acc + turma._count.matriculas,
      0
    );
    const capacidadeTotal = escola.turmas.reduce(
      (acc, turma) => acc + turma.capacidadeMaxima,
      0
    );
    const ocupacao =
      capacidadeTotal > 0
        ? Math.round((totalAlunos / capacidadeTotal) * 100)
        : 0;

    return {
      totalTurmas,
      totalAlunos,
      capacidadeTotal,
      ocupacao,
    };
  }
}

export const escolaService = new EscolaService();
