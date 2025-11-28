import { prisma } from "../lib/prisma.js";
import { CreateEscolaInput, UpdateEscolaInput } from "../schemas/index.js";

export class EscolaService {
  async findAll() {
    return prisma.escola.findMany({
      include: {
        etapas: { include: { etapa: true } },
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
      },
    });
  }

  async findByCodigo(codigo: string) {
    return prisma.escola.findUnique({
      where: { codigo },
    });
  }

  async create(data: CreateEscolaInput) {
    const { etapasIds, ...escolaData } = data;

    return prisma.escola.create({
      data: {
        ...escolaData,
        email: escolaData.email || null,
        etapas: etapasIds
          ? {
              create: etapasIds.map((etapaId) => ({
                etapaId,
              })),
            }
          : undefined,
      },
      include: { etapas: { include: { etapa: true } } },
    });
  }

  async update(id: string, data: UpdateEscolaInput) {
    const { etapasIds, ...escolaData } = data;

    // Se etapasIds foi fornecido, atualiza as etapas
    if (etapasIds !== undefined) {
      // Remove etapas antigas
      await prisma.escolaEtapa.deleteMany({
        where: { escolaId: id },
      });

      // Adiciona novas etapas
      if (etapasIds.length > 0) {
        await prisma.escolaEtapa.createMany({
          data: etapasIds.map((etapaId) => ({
            escolaId: id,
            etapaId,
          })),
        });
      }
    }

    return prisma.escola.update({
      where: { id },
      data: {
        ...escolaData,
        email: escolaData.email || null,
      },
      include: { etapas: { include: { etapa: true } } },
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
