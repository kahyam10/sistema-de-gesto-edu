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

  async getVagasResumo(escolaId?: string, anoLetivo?: number) {
    const turmas = await prisma.turma.findMany({
      where: {
        ...(escolaId && { escolaId }),
        ...(anoLetivo && { anoLetivo }),
      },
      include: {
        escola: true,
        matriculas: { select: { possuiDeficiencia: true } },
      },
    });

    const resumoMap = new Map<
      string,
      {
        escolaId: string;
        escolaNome: string;
        totalTurmas: number;
        capacidadeTotal: number;
        alunosTotal: number;
        pcdTotal: number;
        vagasDisponiveis: number;
        vagasPCDDisponiveis: number;
        turmasLotadas: number;
      }
    >();

    turmas.forEach((turma) => {
      const totalAlunos = turma.matriculas.length;
      const totalPCD = turma.matriculas.filter(
        (m: { possuiDeficiencia: boolean }) => m.possuiDeficiencia
      ).length;
      const vagas = Math.max(turma.capacidadeMaxima - totalAlunos, 0);
      const vagasPCD = Math.max(turma.limitePCD - totalPCD, 0);
      const lotada = totalAlunos >= turma.capacidadeMaxima;

      const current = resumoMap.get(turma.escolaId) || {
        escolaId: turma.escolaId,
        escolaNome: turma.escola?.nome || "N/A",
        totalTurmas: 0,
        capacidadeTotal: 0,
        alunosTotal: 0,
        pcdTotal: 0,
        vagasDisponiveis: 0,
        vagasPCDDisponiveis: 0,
        turmasLotadas: 0,
      };

      resumoMap.set(turma.escolaId, {
        ...current,
        totalTurmas: current.totalTurmas + 1,
        capacidadeTotal: current.capacidadeTotal + turma.capacidadeMaxima,
        alunosTotal: current.alunosTotal + totalAlunos,
        pcdTotal: current.pcdTotal + totalPCD,
        vagasDisponiveis: current.vagasDisponiveis + vagas,
        vagasPCDDisponiveis: current.vagasPCDDisponiveis + vagasPCD,
        turmasLotadas: current.turmasLotadas + (lotada ? 1 : 0),
      });
    });

    return Array.from(resumoMap.values()).sort((a, b) =>
      a.escolaNome.localeCompare(b.escolaNome)
    );
  }
}

export const turmaService = new TurmaService();
