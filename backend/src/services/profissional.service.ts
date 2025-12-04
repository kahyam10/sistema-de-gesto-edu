import { prisma } from "../lib/prisma.js";
import {
  CreateProfissionalInput,
  UpdateProfissionalInput,
} from "../schemas/index.js";

export class ProfissionalService {
  async findAll(filters?: { tipo?: string; ativo?: boolean }) {
    return prisma.profissionalEducacao.findMany({
      where: filters,
      include: {
        escolas: {
          include: { escola: true },
        },
        turmas: {
          include: { turma: { include: { escola: true, serie: true } } },
        },
        formacoes: {
          orderBy: { anoConclusao: "desc" },
        },
      },
      orderBy: { nome: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.profissionalEducacao.findUnique({
      where: { id },
      include: {
        escolas: {
          include: { escola: true },
        },
        turmas: {
          include: { turma: { include: { escola: true, serie: true } } },
        },
        formacoes: {
          orderBy: { anoConclusao: "desc" },
        },
      },
    });
  }

  async findByCpf(cpf: string) {
    return prisma.profissionalEducacao.findUnique({
      where: { cpf },
    });
  }

  async findByEscola(escolaId: string) {
    return prisma.profissionalEducacao.findMany({
      where: {
        escolas: {
          some: { escolaId },
        },
      },
      include: {
        escolas: { include: { escola: true } },
      },
      orderBy: { nome: "asc" },
    });
  }

  async create(data: CreateProfissionalInput) {
    // Verifica se CPF já existe
    const existing = await this.findByCpf(data.cpf);
    if (existing) {
      throw new Error("Já existe um profissional cadastrado com este CPF");
    }

    // Verifica matrícula única (se fornecida)
    if (data.matricula) {
      const existingMatricula = await prisma.profissionalEducacao.findUnique({
        where: { matricula: data.matricula },
      });
      if (existingMatricula) {
        throw new Error(
          "Já existe um profissional cadastrado com esta matrícula"
        );
      }
    }

    const { escolasIds, ...profissionalData } = data;

    return prisma.profissionalEducacao.create({
      data: {
        ...profissionalData,
        email: profissionalData.email || null,
        escolas: escolasIds
          ? {
              create: escolasIds.map((escolaId: string) => ({ escolaId })),
            }
          : undefined,
      },
      include: {
        escolas: { include: { escola: true } },
      },
    });
  }

  async update(id: string, data: UpdateProfissionalInput) {
    const { escolasIds, ...profissionalData } = data;

    // Se escolasIds foi fornecido, atualiza as escolas
    if (escolasIds !== undefined) {
      // Remove escolas antigas
      await prisma.escolaProfissional.deleteMany({
        where: { profissionalId: id },
      });

      // Adiciona novas escolas
      if (escolasIds.length > 0) {
        await prisma.escolaProfissional.createMany({
          data: escolasIds.map((escolaId: string) => ({
            profissionalId: id,
            escolaId,
          })),
        });
      }
    }

    return prisma.profissionalEducacao.update({
      where: { id },
      data: {
        ...profissionalData,
        email: profissionalData.email || null,
      },
      include: {
        escolas: { include: { escola: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.profissionalEducacao.delete({
      where: { id },
    });
  }

  async vincularEscola(
    profissionalId: string,
    escolaId: string,
    funcao?: string,
    cargaHoraria?: number
  ) {
    return prisma.escolaProfissional.create({
      data: {
        profissionalId,
        escolaId,
        funcao,
        cargaHoraria,
      },
    });
  }

  async desvincularEscola(profissionalId: string, escolaId: string) {
    return prisma.escolaProfissional.delete({
      where: {
        escolaId_profissionalId: {
          escolaId,
          profissionalId,
        },
      },
    });
  }

  // ==================== FORMAÇÕES ====================

  async getFormacoes(profissionalId: string) {
    return prisma.formacaoProfissional.findMany({
      where: { profissionalId },
      orderBy: { anoConclusao: "desc" },
    });
  }

  async addFormacao(
    profissionalId: string,
    data: {
      tipo: string;
      nome: string;
      instituicao?: string;
      anoConclusao?: number;
      cargaHoraria?: number;
      emAndamento?: boolean;
    }
  ) {
    return prisma.formacaoProfissional.create({
      data: {
        profissionalId,
        ...data,
      },
    });
  }

  async updateFormacao(
    formacaoId: string,
    data: {
      tipo?: string;
      nome?: string;
      instituicao?: string;
      anoConclusao?: number;
      cargaHoraria?: number;
      emAndamento?: boolean;
    }
  ) {
    return prisma.formacaoProfissional.update({
      where: { id: formacaoId },
      data,
    });
  }

  async deleteFormacao(formacaoId: string) {
    return prisma.formacaoProfissional.delete({
      where: { id: formacaoId },
    });
  }
}

export const profissionalService = new ProfissionalService();
