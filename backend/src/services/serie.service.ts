import { prisma } from "../lib/prisma.js";
import { CreateSerieInput, UpdateSerieInput } from "../schemas/index.js";

export class SerieService {
  async findAll() {
    return prisma.serie.findMany({
      include: { etapa: true },
      orderBy: { ordem: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.serie.findUnique({
      where: { id },
      include: { etapa: true, turmas: true },
    });
  }

  async findByEtapa(etapaId: string) {
    return prisma.serie.findMany({
      where: { etapaId },
      orderBy: { ordem: "asc" },
    });
  }

  async create(data: CreateSerieInput) {
    return prisma.serie.create({
      data: {
        nome: data.nome,
        ordem: data.ordem,
        etapaId: data.etapaId,
      },
      include: { etapa: true },
    });
  }

  async update(id: string, data: UpdateSerieInput) {
    return prisma.serie.update({
      where: { id },
      data,
      include: { etapa: true },
    });
  }

  async delete(id: string) {
    return prisma.serie.delete({
      where: { id },
    });
  }
}

export const serieService = new SerieService();
