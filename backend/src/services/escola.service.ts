import { prisma } from "../lib/prisma.js";
import { CreateEscolaInput, UpdateEscolaInput } from "../schemas/index.js";

export class EscolaService {
  async findAll() {
    return prisma.escola.findMany({
      include: {
        etapas: { include: { etapa: true } },
        diretor: true,
      },
      orderBy: { nome: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.escola.findUnique({
      where: { id },
      include: {
        etapas: { include: { etapa: true } },
        turmas: { include: { serie: true } },
        profissionais: true,
        diretor: true,
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
        diretor: true,
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
          diretor: true,
        },
      });
    });
  }

  async updateCenso(id: string, dados: unknown) {
    return prisma.escola.update({
      where: { id },
      data: { dadosCenso: JSON.stringify(dados) },
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
        turmas: {
          include: {
            matriculas: true,
          },
        },
      },
    });

    if (!escola) return null;

    const totalTurmas = escola.turmas.length;
    const totalAlunos = escola.turmas.reduce(
      (acc, turma) => acc + turma.matriculas.length,
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
