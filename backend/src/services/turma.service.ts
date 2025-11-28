import { prisma } from "../lib/prisma.js";
import { CreateTurmaInput, UpdateTurmaInput } from "../schemas/index.js";

export class TurmaService {
  async findAll(filters?: {
    escolaId?: string;
    anoLetivo?: number;
    ativo?: boolean;
  }) {
    return prisma.turma.findMany({
      where: filters,
      include: {
        escola: true,
        serie: { include: { etapa: true } },
        matriculas: {
          select: { id: true, nomeAluno: true, possuiDeficiencia: true },
        },
        professores: {
          include: { profissional: true },
        },
      },
      orderBy: [{ escola: { nome: "asc" } }, { nome: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.turma.findUnique({
      where: { id },
      include: {
        escola: true,
        serie: { include: { etapa: true } },
        matriculas: true,
        professores: {
          include: { profissional: true },
        },
      },
    });
  }

  async findByEscola(escolaId: string, anoLetivo?: number) {
    return prisma.turma.findMany({
      where: {
        escolaId,
        ...(anoLetivo && { anoLetivo }),
      },
      include: {
        serie: { include: { etapa: true } },
        matriculas: {
          select: { id: true, nomeAluno: true, possuiDeficiencia: true },
        },
      },
      orderBy: { nome: "asc" },
    });
  }

  async create(data: CreateTurmaInput) {
    return prisma.turma.create({
      data: {
        nome: data.nome,
        turno: data.turno,
        anoLetivo: data.anoLetivo,
        capacidadeMaxima: data.capacidadeMaxima,
        limitePCD: data.limitePCD,
        escolaId: data.escolaId,
        serieId: data.serieId,
        ativo: data.ativo,
      },
      include: {
        escola: true,
        serie: { include: { etapa: true } },
      },
    });
  }

  async update(id: string, data: UpdateTurmaInput) {
    return prisma.turma.update({
      where: { id },
      data,
      include: {
        escola: true,
        serie: { include: { etapa: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.turma.delete({
      where: { id },
    });
  }

  async addAluno(turmaId: string, matriculaId: string) {
    const turma = await this.findById(turmaId);
    if (!turma) throw new Error("Turma não encontrada");

    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
    });
    if (!matricula) throw new Error("Matrícula não encontrada");

    // Verifica capacidade
    const totalAlunos = turma.matriculas.length;
    if (totalAlunos >= turma.capacidadeMaxima) {
      throw new Error("Turma está lotada");
    }

    // Verifica limite PCD
    if (matricula.possuiDeficiencia) {
      const totalPCD = turma.matriculas.filter(
        (m: { possuiDeficiencia: boolean }) => m.possuiDeficiencia
      ).length;
      if (totalPCD >= turma.limitePCD) {
        throw new Error(
          `Limite de ${turma.limitePCD} alunos PCD por turma atingido`
        );
      }
    }

    return prisma.matricula.update({
      where: { id: matriculaId },
      data: { turmaId },
    });
  }

  async removeAluno(turmaId: string, matriculaId: string) {
    return prisma.matricula.update({
      where: { id: matriculaId },
      data: { turmaId: null },
    });
  }

  async addProfessor(
    turmaId: string,
    profissionalId: string,
    tipo: string,
    disciplina?: string
  ) {
    return prisma.turmaProfessor.create({
      data: {
        turmaId,
        profissionalId,
        tipo,
        disciplina,
      },
      include: { profissional: true },
    });
  }

  async removeProfessor(turmaId: string, profissionalId: string) {
    return prisma.turmaProfessor.delete({
      where: {
        turmaId_profissionalId: {
          turmaId,
          profissionalId,
        },
      },
    });
  }

  async getEstatisticas(id: string) {
    const turma = await this.findById(id);
    if (!turma) return null;

    const totalAlunos = turma.matriculas.length;
    const totalPCD = turma.matriculas.filter(
      (m: { possuiDeficiencia: boolean }) => m.possuiDeficiencia
    ).length;
    const vagasDisponiveis = turma.capacidadeMaxima - totalAlunos;
    const vagasPCDDisponiveis = turma.limitePCD - totalPCD;
    const ocupacao = Math.round((totalAlunos / turma.capacidadeMaxima) * 100);

    return {
      totalAlunos,
      totalPCD,
      vagasDisponiveis,
      vagasPCDDisponiveis,
      ocupacao,
      capacidadeMaxima: turma.capacidadeMaxima,
      limitePCD: turma.limitePCD,
    };
  }
}

export const turmaService = new TurmaService();
