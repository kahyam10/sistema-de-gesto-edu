import { prisma } from "../lib/prisma.js";
import {
  CreateAvaliacaoInput,
  UpdateAvaliacaoInput,
} from "../schemas/index.js";

const avaliacaoInclude = {
  turma: {
    select: { id: true, nome: true, serie: { select: { nome: true } } },
  },
  disciplina: { select: { id: true, nome: true, codigo: true } },
  profissional: { select: { id: true, nome: true } },
  _count: { select: { notas: true } },
};

export class AvaliacaoService {
  async findAll(filters?: {
    turmaId?: string;
    disciplinaId?: string;
    bimestre?: number;
  }) {
    const where: any = {};
    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.disciplinaId) where.disciplinaId = filters.disciplinaId;
    if (filters?.bimestre) where.bimestre = filters.bimestre;

    return prisma.avaliacao.findMany({
      where,
      include: avaliacaoInclude,
      orderBy: [{ bimestre: "asc" }, { data: "asc" }],
    });
  }

  async findAllPaginated(
    filters: {
      turmaId?: string;
      disciplinaId?: string;
      bimestre?: number;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: any = {};
    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.disciplinaId) where.disciplinaId = filters.disciplinaId;
    if (filters?.bimestre) where.bimestre = filters.bimestre;

    const [data, total] = await Promise.all([
      prisma.avaliacao.findMany({
        where,
        include: avaliacaoInclude,
        orderBy: [{ bimestre: "asc" }, { data: "asc" }],
        skip,
        take: pagination.limit,
      }),
      prisma.avaliacao.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.avaliacao.findUnique({
      where: { id },
      include: {
        ...avaliacaoInclude,
        notas: {
          include: {
            matricula: {
              select: { id: true, nomeAluno: true, numeroMatricula: true },
            },
          },
          orderBy: { matricula: { nomeAluno: "asc" } },
        },
      },
    });
  }

  async findByTurmaDisciplina(
    turmaId: string,
    disciplinaId: string,
    bimestre?: number
  ) {
    const where: any = { turmaId, disciplinaId };
    if (bimestre) where.bimestre = bimestre;

    return prisma.avaliacao.findMany({
      where,
      include: {
        ...avaliacaoInclude,
        notas: {
          include: {
            matricula: {
              select: { id: true, nomeAluno: true, numeroMatricula: true },
            },
          },
        },
      },
      orderBy: [{ bimestre: "asc" }, { data: "asc" }],
    });
  }

  async create(data: CreateAvaliacaoInput) {
    // Verifica se turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });
    if (!turma) {
      throw new Error("Turma não encontrada");
    }

    // Verifica se disciplina existe
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: data.disciplinaId },
    });
    if (!disciplina) {
      throw new Error("Disciplina não encontrada");
    }

    return prisma.avaliacao.create({
      data: {
        ...data,
        profissionalId: data.profissionalId || null,
      },
      include: avaliacaoInclude,
    });
  }

  async update(id: string, data: UpdateAvaliacaoInput) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id },
    });

    if (!avaliacao) {
      throw new Error("Avaliação não encontrada");
    }

    return prisma.avaliacao.update({
      where: { id },
      data,
      include: avaliacaoInclude,
    });
  }

  async delete(id: string) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id },
    });

    if (!avaliacao) {
      throw new Error("Avaliação não encontrada");
    }

    // Cascade delete das notas é tratado pelo Prisma (onDelete: Cascade)
    return prisma.avaliacao.delete({ where: { id } });
  }
}

export const avaliacaoService = new AvaliacaoService();
