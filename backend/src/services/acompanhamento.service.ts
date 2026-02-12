import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";

export interface CreateAcompanhamentoInput {
  matriculaId: string;
  tipo: string; // PEDAGOGICO, COMPORTAMENTAL, SOCIO_EMOCIONAL, APRENDIZAGEM
  motivo: string;
  objetivos?: string;
  profissionalId?: string;
  escolaId?: string;
  acoes?: string;
  estrategias?: string;
  dataInicio?: Date;
}

export interface UpdateAcompanhamentoInput {
  objetivos?: string;
  profissionalId?: string;
  acoes?: string;
  estrategias?: string;
  evolucoes?: string; // JSON string
  status?: string; // EM_ANDAMENTO, CONCLUIDO, SUSPENSO
  resultado?: string;
  dataFim?: Date;
}

export interface RegistrarEvolucaoInput {
  data: Date;
  observacao: string;
  profissionalId?: string;
}

export class AcompanhamentoService {
  async create(data: CreateAcompanhamentoInput) {
    // Verifica se matrícula existe
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004"); // Matrícula não encontrada
    }

    return await prisma.acompanhamentoIndividualizado.create({
      data: {
        ...data,
        dataInicio: data.dataInicio || new Date(),
        status: "EM_ANDAMENTO",
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
            numeroMatricula: true,
            turma: {
              select: {
                nome: true,
                serie: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
        escola: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    escolaId?: string;
    tipo?: string;
    status?: string;
    profissionalId?: string;
  }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.status) where.status = filters.status;
    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;

    return await prisma.acompanhamentoIndividualizado.findMany({
      where,
      include: {
        matricula: {
          select: {
            nomeAluno: true,
            numeroMatricula: true,
            escola: {
              select: {
                nome: true,
              },
            },
            turma: {
              select: {
                nome: true,
                serie: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
        escola: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // EM_ANDAMENTO primeiro
        { dataInicio: "desc" },
      ],
    });
  }

  async findById(id: string) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            escola: true,
            turma: {
              include: {
                serie: true,
              },
            },
          },
        },
        profissional: true,
        escola: true,
      },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id }); // Acompanhamento não encontrado
    }

    return acompanhamento;
  }

  async findByMatricula(matriculaId: string) {
    return await prisma.acompanhamentoIndividualizado.findMany({
      where: { matriculaId },
      include: {
        profissional: {
          select: {
            nome: true,
          },
        },
        escola: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        dataInicio: "desc",
      },
    });
  }

  async update(id: string, data: UpdateAcompanhamentoInput) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id });
    }

    return await prisma.acompanhamentoIndividualizado.update({
      where: { id },
      data,
      include: {
        matricula: {
          include: {
            turma: {
              include: {
                serie: true,
              },
            },
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id });
    }

    return await prisma.acompanhamentoIndividualizado.delete({
      where: { id },
    });
  }

  // ==================== EVOLUÇÃO DO ACOMPANHAMENTO ====================

  async registrarEvolucao(id: string, evolucao: RegistrarEvolucaoInput) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id });
    }

    if (acompanhamento.status !== "EM_ANDAMENTO") {
      throw new BusinessError("BIZ_015", {
        acompanhamentoId: id,
        status: acompanhamento.status,
      }); // Acompanhamento não está em andamento
    }

    // Parse existing evolutions or create new array
    const evolucoes = acompanhamento.evolucoes
      ? JSON.parse(acompanhamento.evolucoes)
      : [];

    // Add new evolution
    evolucoes.push({
      id: `evo_${Date.now()}`,
      data: evolucao.data.toISOString(),
      observacao: evolucao.observacao,
      profissionalId: evolucao.profissionalId,
      criadoEm: new Date().toISOString(),
    });

    return await prisma.acompanhamentoIndividualizado.update({
      where: { id },
      data: {
        evolucoes: JSON.stringify(evolucoes),
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async concluir(id: string, resultado: string) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id });
    }

    if (acompanhamento.status === "CONCLUIDO") {
      throw new BusinessError("BIZ_016", {
        acompanhamentoId: id,
      }); // Acompanhamento já está concluído
    }

    return await prisma.acompanhamentoIndividualizado.update({
      where: { id },
      data: {
        status: "CONCLUIDO",
        resultado,
        dataFim: new Date(),
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async suspender(id: string, motivo: string) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id });
    }

    return await prisma.acompanhamentoIndividualizado.update({
      where: { id },
      data: {
        status: "SUSPENSO",
        resultado: motivo,
        dataFim: new Date(),
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
          },
        },
      },
    });
  }

  async reativar(id: string) {
    const acompanhamento = await prisma.acompanhamentoIndividualizado.findUnique({
      where: { id },
    });

    if (!acompanhamento) {
      throw new NotFoundError("NF_023", { acompanhamentoId: id });
    }

    if (acompanhamento.status !== "SUSPENSO") {
      throw new BusinessError("BIZ_017", {
        acompanhamentoId: id,
        status: acompanhamento.status,
      }); // Apenas acompanhamentos suspensos podem ser reativados
    }

    return await prisma.acompanhamentoIndividualizado.update({
      where: { id },
      data: {
        status: "EM_ANDAMENTO",
        dataFim: null,
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
          },
        },
      },
    });
  }

  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  async getEstatisticas(escolaId?: string) {
    const where: any = {};
    if (escolaId) where.escolaId = escolaId;

    const total = await prisma.acompanhamentoIndividualizado.count({ where });

    const porStatus = await prisma.acompanhamentoIndividualizado.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const porTipo = await prisma.acompanhamentoIndividualizado.groupBy({
      by: ["tipo"],
      where,
      _count: true,
    });

    return {
      total,
      porStatus: porStatus.reduce(
        (acc, item) => ({
          ...acc,
          [item.status]: item._count,
        }),
        {} as Record<string, number>
      ),
      porTipo: porTipo.reduce(
        (acc, item) => ({
          ...acc,
          [item.tipo]: item._count,
        }),
        {} as Record<string, number>
      ),
    };
  }
}
