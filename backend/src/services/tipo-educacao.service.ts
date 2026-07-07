import { prisma } from "../lib/prisma.js";
import type {
  CreateTipoEducacaoInput,
  UpdateTipoEducacaoInput,
} from "../schemas/index.js";

export class TipoEducacaoService {
  async findAll() {
    return prisma.tipoEducacao.findMany({
      include: {
        etapas: {
          orderBy: { ordem: "asc" },
          include: {
            niveis: {
              orderBy: { ordem: "asc" },
              include: {
                series: { orderBy: { ordem: "asc" } },
              },
            },
          },
        },
      },
      orderBy: { ordem: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.tipoEducacao.findUnique({
      where: { id },
      include: {
        etapas: {
          orderBy: { ordem: "asc" },
          include: {
            niveis: {
              orderBy: { ordem: "asc" },
              include: {
                series: { orderBy: { ordem: "asc" } },
              },
            },
          },
        },
      },
    });
  }

  async create(data: CreateTipoEducacaoInput) {
    return prisma.tipoEducacao.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        ordem: data.ordem ?? 0,
      },
      include: { etapas: true },
    });
  }

  async update(id: string, data: UpdateTipoEducacaoInput) {
    return prisma.tipoEducacao.update({
      where: { id },
      data,
      include: { etapas: true },
    });
  }

  async delete(id: string) {
    return prisma.tipoEducacao.delete({
      where: { id },
    });
  }
}

export const tipoEducacaoService = new TipoEducacaoService();
