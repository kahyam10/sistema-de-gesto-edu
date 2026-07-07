import { prisma } from "../lib/prisma.js";
import { CreateEtapaInput, UpdateEtapaInput } from "../schemas/index.js";

export class EtapaService {
  async findAll() {
    return prisma.etapaEnsino.findMany({
      include: {
        tipoEducacao: true,
        niveis: {
          orderBy: { ordem: "asc" },
          include: {
            series: { orderBy: { ordem: "asc" } },
          },
        },
      },
      orderBy: { ordem: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.etapaEnsino.findUnique({
      where: { id },
      include: {
        tipoEducacao: true,
        niveis: {
          orderBy: { ordem: "asc" },
          include: {
            series: { orderBy: { ordem: "asc" } },
          },
        },
        escolas: { include: { escola: true } },
      },
    });
  }

  async create(data: CreateEtapaInput) {
    return prisma.etapaEnsino.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        ordem: data.ordem,
        tipoEducacaoId: data.tipoEducacaoId,
      },
      include: {
        tipoEducacao: true,
        niveis: {
          include: { series: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateEtapaInput) {
    return prisma.etapaEnsino.update({
      where: { id },
      data,
      include: {
        tipoEducacao: true,
        niveis: {
          include: { series: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.etapaEnsino.delete({
      where: { id },
    });
  }
}

export const etapaService = new EtapaService();
