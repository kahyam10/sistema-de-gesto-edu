import { prisma } from "../lib/prisma.js";
import { CreateSerieInput, UpdateSerieInput } from "../schemas/index.js";

export class SerieService {
  async findAll() {
    return prisma.serie.findMany({
      include: {
        nivel: {
          include: {
            etapa: {
              include: { tipoEducacao: true },
            },
          },
        },
      },
      orderBy: [
        { nivel: { etapa: { ordem: "asc" } } },
        { nivel: { ordem: "asc" } },
        { ordem: "asc" },
      ],
    });
  }

  async findById(id: string) {
    return prisma.serie.findUnique({
      where: { id },
      include: {
        nivel: {
          include: {
            etapa: {
              include: { tipoEducacao: true },
            },
          },
        },
        turmas: true,
      },
    });
  }

  async findByNivel(nivelId: string) {
    return prisma.serie.findMany({
      where: { nivelId },
      include: { nivel: true },
      orderBy: { ordem: "asc" },
    });
  }

  async create(data: CreateSerieInput) {
    return prisma.serie.create({
      data: {
        nome: data.nome,
        ordem: data.ordem,
        nivelId: data.nivelId,
      },
      include: {
        nivel: {
          include: { etapa: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateSerieInput) {
    return prisma.serie.update({
      where: { id },
      data,
      include: {
        nivel: {
          include: { etapa: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.serie.delete({
      where: { id },
    });
  }
}

export const serieService = new SerieService();
