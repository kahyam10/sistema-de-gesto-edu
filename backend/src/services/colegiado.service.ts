import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import {
  CreateColegiadoInput,
  UpdateColegiadoInput,
  CreateMembroColegiadoInput,
  UpdateMembroColegiadoInput,
} from "../schemas/democratica.schemas.js";

export class ColegiadoService {
  // Lista colegiados com filtros
  async findAll(filters?: { escolaId?: string; ativo?: boolean }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;

    return await prisma.colegiadoEscolar.findMany({
      where,
      include: {
        escola: { select: { id: true, nome: true } },
        _count: { select: { membros: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Busca colegiado por ID com membros ativos e últimas reuniões
  async findById(id: string) {
    const colegiado = await prisma.colegiadoEscolar.findUnique({
      where: { id },
      include: {
        escola: { select: { id: true, nome: true } },
        membros: { where: { ativo: true }, orderBy: { createdAt: "asc" } },
        reunioes: { orderBy: { data: "desc" }, take: 10 },
      },
    });

    if (!colegiado) {
      throw new NotFoundError("NF_040");
    }

    return colegiado;
  }

  // Cria colegiado escolar
  async create(data: CreateColegiadoInput) {
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    return await prisma.colegiadoEscolar.create({
      data,
      include: {
        escola: { select: { id: true, nome: true } },
        _count: { select: { membros: true } },
      },
    });
  }

  // Atualiza colegiado
  async update(id: string, data: UpdateColegiadoInput) {
    const colegiado = await prisma.colegiadoEscolar.findUnique({
      where: { id },
    });
    if (!colegiado) {
      throw new NotFoundError("NF_040");
    }

    return await prisma.colegiadoEscolar.update({
      where: { id },
      data,
      include: {
        escola: { select: { id: true, nome: true } },
        _count: { select: { membros: true } },
      },
    });
  }

  // Remove colegiado (cascade remove membros)
  async delete(id: string) {
    const colegiado = await prisma.colegiadoEscolar.findUnique({
      where: { id },
    });
    if (!colegiado) {
      throw new NotFoundError("NF_040");
    }

    await prisma.colegiadoEscolar.delete({ where: { id } });
  }

  // Adiciona membro ao colegiado
  async addMembro(colegiadoId: string, data: CreateMembroColegiadoInput) {
    const colegiado = await prisma.colegiadoEscolar.findUnique({
      where: { id: colegiadoId },
    });
    if (!colegiado) {
      throw new NotFoundError("NF_040");
    }

    if (data.profissionalId) {
      const profissional = await prisma.profissionalEducacao.findUnique({
        where: { id: data.profissionalId },
      });
      if (!profissional) {
        throw new NotFoundError("NF_006");
      }
    }

    if (data.matriculaId) {
      const matricula = await prisma.matricula.findUnique({
        where: { id: data.matriculaId },
      });
      if (!matricula) {
        throw new NotFoundError("NF_004");
      }
    }

    return await prisma.membroColegiado.create({
      data: { ...data, colegiadoId },
    });
  }

  // Atualiza membro do colegiado
  async updateMembro(membroId: string, data: UpdateMembroColegiadoInput) {
    const membro = await prisma.membroColegiado.findUnique({
      where: { id: membroId },
    });
    if (!membro) {
      throw new NotFoundError("NF_041");
    }

    return await prisma.membroColegiado.update({
      where: { id: membroId },
      data,
    });
  }

  // Remove membro do colegiado (DELETE físico, consistente com o resto do sistema)
  async removeMembro(membroId: string) {
    const membro = await prisma.membroColegiado.findUnique({
      where: { id: membroId },
    });
    if (!membro) {
      throw new NotFoundError("NF_041");
    }

    await prisma.membroColegiado.delete({ where: { id: membroId } });
  }
}

export const colegiadoService = new ColegiadoService();
