import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";
import {
  CreateLiderTurmaInput,
  UpdateLiderTurmaInput,
} from "../schemas/democratica.schemas.js";

const includePadrao = {
  turma: { select: { id: true, nome: true, turno: true } },
  matricula: { select: { id: true, nomeAluno: true, numeroMatricula: true } },
};

export class LiderTurmaService {
  // Lista líderes de turma com filtros
  async findAll(filters?: {
    turmaId?: string;
    anoLetivo?: number;
    escolaId?: string;
    ativo?: boolean;
  }) {
    const where: Prisma.LiderTurmaWhereInput = {};

    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.anoLetivo) where.anoLetivo = filters.anoLetivo;
    if (filters?.escolaId) where.turma = { escolaId: filters.escolaId };
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;

    return await prisma.liderTurma.findMany({
      where,
      include: includePadrao,
      orderBy: [{ anoLetivo: "desc" }, { createdAt: "desc" }],
    });
  }

  // Busca líder de turma por ID
  async findById(id: string) {
    const lider = await prisma.liderTurma.findUnique({
      where: { id },
      include: includePadrao,
    });

    if (!lider) {
      throw new NotFoundError("NF_045");
    }

    return lider;
  }

  // Cria líder/vice-líder de turma
  async create(data: CreateLiderTurmaInput) {
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });
    if (!turma) {
      throw new NotFoundError("NF_005");
    }

    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
    });
    if (!matricula) {
      throw new NotFoundError("NF_004");
    }

    // A matrícula precisa pertencer à turma informada
    if (matricula.turmaId !== data.turmaId) {
      throw new BusinessError("BIZ_031");
    }

    // Um líder e um vice por turma por ano letivo
    const existente = await prisma.liderTurma.findFirst({
      where: {
        turmaId: data.turmaId,
        anoLetivo: data.anoLetivo,
        tipo: data.tipo,
      },
    });
    if (existente) {
      throw new BusinessError("BIZ_030");
    }

    return await prisma.liderTurma.create({
      data,
      include: includePadrao,
    });
  }

  // Atualiza líder de turma
  async update(id: string, data: UpdateLiderTurmaInput) {
    const lider = await prisma.liderTurma.findUnique({ where: { id } });
    if (!lider) {
      throw new NotFoundError("NF_045");
    }

    return await prisma.liderTurma.update({
      where: { id },
      data,
      include: includePadrao,
    });
  }

  // Remove líder de turma
  async delete(id: string) {
    const lider = await prisma.liderTurma.findUnique({ where: { id } });
    if (!lider) {
      throw new NotFoundError("NF_045");
    }

    await prisma.liderTurma.delete({ where: { id } });
  }
}

export const liderTurmaService = new LiderTurmaService();
