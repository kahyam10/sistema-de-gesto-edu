import { prisma } from "../lib/prisma.js";
import {
  CreateMatriculaInput,
  UpdateMatriculaInput,
} from "../schemas/index.js";
import { CPFValidator } from "../utils/cpf-validator.js";

// Função para gerar número de matrícula único
function gerarNumeroMatricula(anoLetivo: number): string {
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${anoLetivo}${random}`;
}

export class MatriculaService {
  private async gerarNumeroMatriculaUnico(anoLetivo: number) {
    let numeroMatricula = gerarNumeroMatricula(anoLetivo);
    let exists = await prisma.matricula.findUnique({
      where: { numeroMatricula },
    });
    while (exists) {
      numeroMatricula = gerarNumeroMatricula(anoLetivo);
      exists = await prisma.matricula.findUnique({
        where: { numeroMatricula },
      });
    }
    return numeroMatricula;
  }

  private async checarDisponibilidadeTurma(
    turmaId: string,
    possuiDeficiencia: boolean
  ) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { matriculas: { select: { possuiDeficiencia: true } } },
    });

    if (!turma) {
      throw new Error("Turma não encontrada");
    }

    const totalAlunos = turma.matriculas.length;
    const totalPCD = turma.matriculas.filter(
      (m: { possuiDeficiencia: boolean }) => m.possuiDeficiencia
    ).length;

    if (totalAlunos >= turma.capacidadeMaxima) {
      return {
        disponivel: false,
        motivo: "Turma está lotada",
      };
    }

    if (possuiDeficiencia && totalPCD >= turma.limitePCD) {
      return {
        disponivel: false,
        motivo: `Limite de ${turma.limitePCD} alunos PCD por turma atingido`,
      };
    }

    return { disponivel: true };
  }

  async findAll(filters?: {
    escolaId?: string;
    etapaId?: string;
    turmaId?: string;
    anoLetivo?: number;
    status?: string;
  }) {
    return prisma.matricula.findMany({
      where: filters,
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
      orderBy: { nomeAluno: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.matricula.findUnique({
      where: { id },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async findByNumero(numeroMatricula: string) {
    return prisma.matricula.findUnique({
      where: { numeroMatricula },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async findSemTurma(escolaId?: string, anoLetivo?: number) {
    return prisma.matricula.findMany({
      where: {
        turmaId: null,
        status: "ATIVA",
        ...(escolaId && { escolaId }),
        ...(anoLetivo && { anoLetivo }),
      },
      include: {
        escola: true,
        etapa: true,
      },
      orderBy: { nomeAluno: "asc" },
    });
  }

  async create(data: CreateMatriculaInput) {
    // Valida formato do CPF (se fornecido)
    if (data.cpfAluno) {
      const cpfValidation = CPFValidator.validateWithMessage(data.cpfAluno);
      if (!cpfValidation.valid) {
        throw new Error(cpfValidation.message || "CPF inválido");
      }

      // Limpa e formata o CPF
      const cpfLimpo = CPFValidator.clean(data.cpfAluno);

      // Verifica se CPF já existe (em qualquer ano letivo ativo)
      const existing = await prisma.matricula.findFirst({
        where: {
          cpfAluno: cpfLimpo,
          status: { in: ["ATIVA", "AGUARDANDO_VAGA"] },
        },
      });
      if (existing) {
        throw new Error(
          `CPF já cadastrado em matrícula ativa (${existing.numeroMatricula})`
        );
      }

      // Atualiza o CPF com valor limpo
      data.cpfAluno = cpfLimpo;
    }

    // Gera número de matrícula único
    const numeroMatricula = await this.gerarNumeroMatriculaUnico(
      data.anoLetivo
    );

    return prisma.matricula.create({
      data: {
        ...data,
        numeroMatricula,
        status: "ATIVA",
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async update(id: string, data: UpdateMatriculaInput) {
    return prisma.matricula.update({
      where: { id },
      data: {
        ...data,
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.matricula.delete({
      where: { id },
    });
  }

  async cancelar(id: string) {
    return prisma.matricula.update({
      where: { id },
      data: {
        status: "CANCELADA",
        turmaId: null,
      },
    });
  }

  async confirmar(id: string, turmaId: string) {
    const matricula = await prisma.matricula.findUnique({
      where: { id },
      select: { possuiDeficiencia: true },
    });

    if (!matricula) {
      throw new Error("Matrícula não encontrada");
    }

    const disponibilidade = await this.checarDisponibilidadeTurma(
      turmaId,
      matricula.possuiDeficiencia
    );

    if (!disponibilidade.disponivel) {
      throw new Error(disponibilidade.motivo || "Turma indisponível");
    }

    return prisma.matricula.update({
      where: { id },
      data: {
        status: "ATIVA",
        turmaId,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async createPortal(data: CreateMatriculaInput) {
    // Valida formato do CPF (se fornecido)
    if (data.cpfAluno) {
      const cpfValidation = CPFValidator.validateWithMessage(data.cpfAluno);
      if (!cpfValidation.valid) {
        throw new Error(cpfValidation.message || "CPF inválido");
      }

      // Limpa e formata o CPF
      const cpfLimpo = CPFValidator.clean(data.cpfAluno);

      // Verifica se CPF já existe (em qualquer ano letivo ativo)
      const existing = await prisma.matricula.findFirst({
        where: {
          cpfAluno: cpfLimpo,
          status: { in: ["ATIVA", "AGUARDANDO_VAGA"] },
        },
      });
      if (existing) {
        throw new Error(
          `CPF já cadastrado em matrícula ativa (${existing.numeroMatricula})`
        );
      }

      // Atualiza o CPF com valor limpo
      data.cpfAluno = cpfLimpo;
    }

    const numeroMatricula = await this.gerarNumeroMatriculaUnico(
      data.anoLetivo
    );

    let status = "ATIVA";
    let turmaIdFinal = data.turmaId || null;

    if (!data.turmaId) {
      status = "AGUARDANDO_VAGA";
    } else {
      const disponibilidade = await this.checarDisponibilidadeTurma(
        data.turmaId,
        data.possuiDeficiencia
      );

      if (!disponibilidade.disponivel) {
        status = "AGUARDANDO_VAGA";
        turmaIdFinal = null;
      }
    }

    return prisma.matricula.create({
      data: {
        ...data,
        numeroMatricula,
        status,
        turmaId: turmaIdFinal,
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async transferir(id: string, novaEscolaId: string, novaTurmaId?: string) {
    return prisma.matricula.update({
      where: { id },
      data: {
        escolaId: novaEscolaId,
        turmaId: novaTurmaId || null,
        status: "TRANSFERIDA",
      },
    });
  }

  async getEstatisticas(anoLetivo: number, escolaId?: string) {
    const where = {
      anoLetivo,
      ...(escolaId && { escolaId }),
    };

    const [total, ativas, pcd, semTurma] = await Promise.all([
      prisma.matricula.count({ where }),
      prisma.matricula.count({ where: { ...where, status: "ATIVA" } }),
      prisma.matricula.count({ where: { ...where, possuiDeficiencia: true } }),
      prisma.matricula.count({
        where: { ...where, turmaId: null, status: "ATIVA" },
      }),
    ]);

    return {
      total,
      ativas,
      pcd,
      semTurma,
      percentualPCD: total > 0 ? Math.round((pcd / total) * 100) : 0,
    };
  }
}

export const matriculaService = new MatriculaService();
