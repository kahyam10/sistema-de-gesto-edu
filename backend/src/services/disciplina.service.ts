import { prisma } from "../lib/prisma.js";
import {
  CreateDisciplinaInput,
  UpdateDisciplinaInput,
} from "../schemas/index.js";

export class DisciplinaService {
  async findAll(filters?: { etapaId?: string; ativo?: boolean }) {
    const where: any = {};
    if (filters?.etapaId) where.etapaId = filters.etapaId;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;

    return prisma.disciplina.findMany({
      where,
      include: {
        etapa: { select: { id: true, nome: true } },
      },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.disciplina.findUnique({
      where: { id },
      include: {
        etapa: { select: { id: true, nome: true } },
        _count: { select: { avaliacoes: true } },
      },
    });
  }

  async findByEtapa(etapaId: string) {
    return prisma.disciplina.findMany({
      where: { etapaId, ativo: true },
      include: {
        etapa: { select: { id: true, nome: true } },
      },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
  }

  async create(data: CreateDisciplinaInput) {
    // Verifica se código já existe
    const existing = await prisma.disciplina.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new Error(`Já existe uma disciplina com o código "${data.codigo}"`);
    }

    // Verifica se etapa existe
    const etapa = await prisma.etapaEnsino.findUnique({
      where: { id: data.etapaId },
    });

    if (!etapa) {
      throw new Error("Etapa de ensino não encontrada");
    }

    return prisma.disciplina.create({
      data,
      include: {
        etapa: { select: { id: true, nome: true } },
      },
    });
  }

  async update(id: string, data: UpdateDisciplinaInput) {
    const disciplina = await prisma.disciplina.findUnique({
      where: { id },
    });

    if (!disciplina) {
      throw new Error("Disciplina não encontrada");
    }

    // Se está alterando código, verifica duplicidade
    if (data.codigo && data.codigo !== disciplina.codigo) {
      const existing = await prisma.disciplina.findUnique({
        where: { codigo: data.codigo },
      });
      if (existing) {
        throw new Error(
          `Já existe uma disciplina com o código "${data.codigo}"`
        );
      }
    }

    return prisma.disciplina.update({
      where: { id },
      data,
      include: {
        etapa: { select: { id: true, nome: true } },
      },
    });
  }

  async delete(id: string) {
    const disciplina = await prisma.disciplina.findUnique({
      where: { id },
      include: { _count: { select: { avaliacoes: true } } },
    });

    if (!disciplina) {
      throw new Error("Disciplina não encontrada");
    }

    if (disciplina._count.avaliacoes > 0) {
      throw new Error(
        `Não é possível excluir: existem ${disciplina._count.avaliacoes} avaliação(ões) vinculada(s)`
      );
    }

    return prisma.disciplina.delete({ where: { id } });
  }
}

export const disciplinaService = new DisciplinaService();
