import { prisma } from "../lib/prisma.js";

/**
 * Interface para criar frequência
 */
interface CreateFrequenciaInput {
  matriculaId: string;
  turmaId: string;
  data: Date;
  status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
  justificativa?: string;
  observacao?: string;
}

/**
 * Interface para atualizar frequência
 */
interface UpdateFrequenciaInput {
  status?: "PRESENTE" | "FALTA" | "JUSTIFICADA";
  justificativa?: string;
  observacao?: string;
}

/**
 * Interface para registrar frequência de turma completa
 */
interface RegistroFrequenciaTurma {
  turmaId: string;
  data: Date;
  presencas: Array<{
    matriculaId: string;
    status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
    justificativa?: string;
    observacao?: string;
  }>;
}

/**
 * Interface para estatísticas de frequência
 */
interface EstatisticasFrequencia {
  totalAulas: number;
  presencas: number;
  faltas: number;
  faltasJustificadas: number;
  percentualPresenca: number;
  percentualFaltas: number;
  abaixoDoLimite: boolean; // true se percentualPresenca < 75%
}

export class FrequenciaService {
  /**
   * Lista frequências com filtros
   */
  async list(params: {
    turmaId?: string;
    matriculaId?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const where: any = {};

    if (params.turmaId) where.turmaId = params.turmaId;
    if (params.matriculaId) where.matriculaId = params.matriculaId;

    if (params.dataInicio || params.dataFim) {
      where.data = {};
      if (params.dataInicio) where.data.gte = params.dataInicio;
      if (params.dataFim) where.data.lte = params.dataFim;
    }

    const include = {
      matricula: {
        select: {
          id: true,
          numeroMatricula: true,
          nomeAluno: true,
        },
      },
      turma: {
        select: {
          id: true,
          nome: true,
          serie: { select: { nome: true } },
        },
      },
    };

    return prisma.frequencia.findMany({
      where,
      include,
      orderBy: { data: "desc" },
    });
  }

  /**
   * Lista frequências paginadas
   */
  async listPaginated(
    params: {
      turmaId?: string;
      matriculaId?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
    pagination: { page: number; limit: number }
  ) {
    const where: any = {};
    if (params.turmaId) where.turmaId = params.turmaId;
    if (params.matriculaId) where.matriculaId = params.matriculaId;
    if (params.dataInicio || params.dataFim) {
      where.data = {};
      if (params.dataInicio) where.data.gte = params.dataInicio;
      if (params.dataFim) where.data.lte = params.dataFim;
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const include = {
      matricula: {
        select: { id: true, numeroMatricula: true, nomeAluno: true },
      },
      turma: {
        select: { id: true, nome: true, serie: { select: { nome: true } } },
      },
    };

    const [data, total] = await Promise.all([
      prisma.frequencia.findMany({
        where,
        include,
        orderBy: { data: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.frequencia.count({ where }),
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

  /**
   * Busca frequência por ID
   */
  async findById(id: string) {
    return prisma.frequencia.findUnique({
      where: { id },
      include: {
        matricula: {
          select: {
            id: true,
            numeroMatricula: true,
            nomeAluno: true,
          },
        },
        turma: {
          select: {
            id: true,
            nome: true,
            serie: { select: { nome: true } },
          },
        },
      },
    });
  }

  /**
   * Cria um registro de frequência
   */
  async create(data: CreateFrequenciaInput) {
    // Verifica se matrícula existe
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
    });

    if (!matricula) {
      throw new Error("Matrícula não encontrada");
    }

    // Verifica se turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });

    if (!turma) {
      throw new Error("Turma não encontrada");
    }

    // Verifica se já existe registro para esta data
    const existente = await prisma.frequencia.findFirst({
      where: {
        matriculaId: data.matriculaId,
        turmaId: data.turmaId,
        data: data.data,
      },
    });

    if (existente) {
      throw new Error(
        "Já existe um registro de frequência para este aluno nesta data"
      );
    }

    return prisma.frequencia.create({
      data,
      include: {
        matricula: {
          select: {
            id: true,
            numeroMatricula: true,
            nomeAluno: true,
          },
        },
        turma: {
          select: {
            id: true,
            nome: true,
            serie: { select: { nome: true } },
          },
        },
      },
    });
  }

  /**
   * Registra frequência para uma turma completa
   */
  async registrarTurma(data: RegistroFrequenciaTurma) {
    // Verifica se turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
      include: { matriculas: true },
    });

    if (!turma) {
      throw new Error("Turma não encontrada");
    }

    // Valida se todas as matrículas pertencem à turma
    const matriculasIds = turma.matriculas.map((m) => m.id);
    for (const presenca of data.presencas) {
      if (!matriculasIds.includes(presenca.matriculaId)) {
        throw new Error(
          `Matrícula ${presenca.matriculaId} não pertence a esta turma`
        );
      }
    }

    // Remove registros existentes para esta data (se houver)
    await prisma.frequencia.deleteMany({
      where: {
        turmaId: data.turmaId,
        data: data.data,
      },
    });

    // Cria novos registros
    const registros = await Promise.all(
      data.presencas.map((presenca) =>
        prisma.frequencia.create({
          data: {
            turmaId: data.turmaId,
            matriculaId: presenca.matriculaId,
            data: data.data,
            status: presenca.status,
            justificativa: presenca.justificativa,
            observacao: presenca.observacao,
          },
          include: {
            matricula: {
              select: {
                id: true,
                numeroMatricula: true,
                nomeAluno: true,
              },
            },
          },
        })
      )
    );

    return {
      message: `Frequência registrada para ${registros.length} aluno(s)`,
      registros,
    };
  }

  /**
   * Atualiza um registro de frequência
   */
  async update(id: string, data: UpdateFrequenciaInput) {
    const frequencia = await prisma.frequencia.findUnique({
      where: { id },
    });

    if (!frequencia) {
      throw new Error("Registro de frequência não encontrado");
    }

    return prisma.frequencia.update({
      where: { id },
      data,
      include: {
        matricula: {
          select: {
            id: true,
            numeroMatricula: true,
            nomeAluno: true,
          },
        },
        turma: {
          select: {
            id: true,
            nome: true,
            serie: { select: { nome: true } },
          },
        },
      },
    });
  }

  /**
   * Remove um registro de frequência
   */
  async delete(id: string) {
    const frequencia = await prisma.frequencia.findUnique({
      where: { id },
    });

    if (!frequencia) {
      throw new Error("Registro de frequência não encontrado");
    }

    return prisma.frequencia.delete({
      where: { id },
    });
  }

  /**
   * Calcula estatísticas de frequência de um aluno
   */
  async calcularEstatisticas(
    matriculaId: string,
    turmaId: string,
    dataInicio?: Date,
    dataFim?: Date
  ): Promise<EstatisticasFrequencia> {
    const where: any = {
      matriculaId,
      turmaId,
    };

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataInicio;
      if (dataFim) where.data.lte = dataFim;
    }

    const registros = await prisma.frequencia.findMany({
      where,
    });

    const totalAulas = registros.length;
    const presencas = registros.filter((r) => r.status === "PRESENTE").length;
    const faltas = registros.filter((r) => r.status === "FALTA").length;
    const faltasJustificadas = registros.filter(
      (r) => r.status === "JUSTIFICADA"
    ).length;

    const percentualPresenca =
      totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;
    const percentualFaltas =
      totalAulas > 0
        ? Math.round(((faltas + faltasJustificadas) / totalAulas) * 100)
        : 0;

    return {
      totalAulas,
      presencas,
      faltas,
      faltasJustificadas,
      percentualPresenca,
      percentualFaltas,
      abaixoDoLimite: percentualPresenca < 75,
    };
  }

  /**
   * Lista alunos com frequência abaixo de 75%
   */
  async listarAlunosComBaixaFrequencia(
    turmaId: string,
    dataInicio?: Date,
    dataFim?: Date
  ) {
    // Busca turma com matrículas
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        matriculas: {
          where: { status: "ATIVA" },
          select: {
            id: true,
            numeroMatricula: true,
            nomeAluno: true,
          },
        },
      },
    });

    if (!turma) {
      throw new Error("Turma não encontrada");
    }

    // Calcula estatísticas para cada aluno
    const alunosComBaixaFrequencia = [];

    for (const matricula of turma.matriculas) {
      const stats = await this.calcularEstatisticas(
        matricula.id,
        turmaId,
        dataInicio,
        dataFim
      );

      if (stats.abaixoDoLimite && stats.totalAulas > 0) {
        alunosComBaixaFrequencia.push({
          matricula,
          estatisticas: stats,
        });
      }
    }

    return alunosComBaixaFrequencia;
  }

  /**
   * Retorna estatísticas de frequência para todos os alunos de uma turma.
   */
  async getResumoTurma(
    turmaId: string,
    dataInicio?: Date,
    dataFim?: Date
  ) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        matriculas: {
          where: { status: "ATIVA" },
          select: {
            id: true,
            numeroMatricula: true,
            nomeAluno: true,
          },
          orderBy: { nomeAluno: "asc" },
        },
      },
    });

    if (!turma) {
      throw new Error("Turma não encontrada");
    }

    const alunos = [];

    for (const matricula of turma.matriculas) {
      const stats = await this.calcularEstatisticas(
        matricula.id,
        turmaId,
        dataInicio,
        dataFim
      );

      alunos.push({
        matricula,
        estatisticas: stats,
      });
    }

    return alunos;
  }

  /**
   * Busca frequência por data específica de uma turma
   */
  async buscarPorData(turmaId: string, data: Date) {
    return prisma.frequencia.findMany({
      where: {
        turmaId,
        data,
      },
      include: {
        matricula: {
          select: {
            id: true,
            numeroMatricula: true,
            nomeAluno: true,
          },
        },
      },
      orderBy: {
        matricula: { nomeAluno: "asc" },
      },
    });
  }
}

export const frequenciaService = new FrequenciaService();
