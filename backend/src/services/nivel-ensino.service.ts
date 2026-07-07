import { prisma } from "../lib/prisma.js";
import type {
  CreateNivelEnsinoInput,
  UpdateNivelEnsinoInput,
} from "../schemas/index.js";

export class NivelEnsinoService {
  async findAll() {
    return prisma.nivelEnsino.findMany({
      include: {
        etapa: {
          include: {
            tipoEducacao: true,
          },
        },
        series: { orderBy: { ordem: "asc" } },
      },
      orderBy: [{ etapa: { ordem: "asc" } }, { ordem: "asc" }],
    });
  }

  async findByEtapaId(etapaId: string) {
    return prisma.nivelEnsino.findMany({
      where: { etapaId },
      include: {
        etapa: true,
        series: { orderBy: { ordem: "asc" } },
      },
      orderBy: { ordem: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.nivelEnsino.findUnique({
      where: { id },
      include: {
        etapa: {
          include: { tipoEducacao: true },
        },
        series: { orderBy: { ordem: "asc" } },
      },
    });
  }

  async create(data: CreateNivelEnsinoInput) {
    return prisma.nivelEnsino.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        ordem: data.ordem ?? 0,
        etapaId: data.etapaId,
      },
      include: {
        etapa: true,
        series: true,
      },
    });
  }

  async update(id: string, data: UpdateNivelEnsinoInput) {
    return prisma.nivelEnsino.update({
      where: { id },
      data,
      include: {
        etapa: true,
        series: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.nivelEnsino.delete({
      where: { id },
    });
  }
}

export const nivelEnsinoService = new NivelEnsinoService();
