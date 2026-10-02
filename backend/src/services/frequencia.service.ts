import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";

/** aulaChave da chamada diária (turma sem grade no dia da semana). */
export const AULA_DIA = "DIA";

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;

/** Dia da semana (SEGUNDA, TERCA...) de uma data pura (meia-noite UTC). */
export function diaSemanaDaData(data: Date): string {
  return DIAS_SEMANA[data.getUTCDay()];
}

/** Aula resolvida para a chamada: "DIA" (sem grade) ou uma aula da grade. */
export interface AulaDaChamada {
  aulaChave: string;
  gradeHorariaId: string | null;
  disciplina: string | null;
  horaInicio: string | null;
}

const CHAMADA_DIARIA: AulaDaChamada = {
  aulaChave: AULA_DIA,
  gradeHorariaId: null,
  disciplina: null,
  horaInicio: null,
};

/**
 * Regra da frequência POR AULA:
 * - a turma tem aulas na grade nesse dia da semana → a chamada é por aula:
 *   gradeHorariaId é obrigatório e precisa ser uma aula DESSA turma NESSE dia;
 * - não tem (ex.: Educação Infantil) → chamada diária ("DIA"); mandar uma
 *   aula nesse caso é recusado.
 * Não mistura os dois modos. Registros "DIA" antigos continuam valendo.
 */
export async function resolverAulaDaChamada(
  turmaId: string,
  data: Date,
  gradeHorariaId?: string | null,
): Promise<AulaDaChamada> {
  const aulasNoDia = await prisma.gradeHoraria.findMany({
    where: { turmaId, diaSemana: diaSemanaDaData(data) },
    select: { id: true, disciplina: true, horaInicio: true },
  });
  if (!gradeHorariaId) {
    if (aulasNoDia.length > 0) {
      throw new Error(
        "Esta turma tem aulas na grade neste dia: informe a aula (a chamada é por aula)",
      );
    }
    return CHAMADA_DIARIA;
  }
  if (aulasNoDia.length === 0) {
    throw new Error(
      "Esta turma não tem aulas na grade neste dia: a chamada é diária (não informe a aula)",
    );
  }
  const aula = aulasNoDia.find((a) => a.id === gradeHorariaId);
  if (!aula) {
    throw new Error("A aula informada não é desta turma neste dia da semana");
  }
  return {
    aulaChave: aula.id,
    gradeHorariaId: aula.id,
    disciplina: aula.disciplina,
    horaInicio: aula.horaInicio,
  };
}

/**
 * Professor responsável pela aula que uma escrita de frequência afeta (para
 * o preHandler do app.ts). Devolve o profissionalId da aula da grade, ou null
 * quando não há aula (chamada diária), a aula não tem professor definido ou
 * não foi encontrada — nesses casos vale só "leciona na turma" (e o service
 * recusa aula inexistente/de outra turma).
 */
export async function professorDaAulaAlvo(
  url: string,
  method: string,
  body: Record<string, unknown> | undefined,
): Promise<string | null> {
  const m = url.match(/^\/api\/frequencia(?:\/([^/]+))?$/);
  if (!m) return null;
  const segmento = m[1];
  if (method === "POST") {
    if (segmento && segmento !== "turma") return null;
    const gradeHorariaId = body?.gradeHorariaId;
    if (typeof gradeHorariaId !== "string" || !gradeHorariaId) return null;
    const aula = await prisma.gradeHoraria.findUnique({
      where: { id: gradeHorariaId },
      select: { profissionalId: true },
    });
    return aula?.profissionalId ?? null;
  }
  // PATCH/DELETE /api/frequencia/:id → aula do registro
  if (!segmento) return null;
  const registro = await prisma.frequencia.findUnique({
    where: { id: segmento },
    select: { gradeHoraria: { select: { profissionalId: true } } },
  });
  return registro?.gradeHoraria?.profissionalId ?? null;
}

/**
 * Interface para criar frequência
 */
interface CreateFrequenciaInput {
  matriculaId: string;
  turmaId: string;
  data: Date;
  gradeHorariaId?: string;
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
  /** Aula da grade (obrigatória quando a turma tem grade no dia). */
  gradeHorariaId?: string;
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
  abaixoDoLimite: boolean; // true se presenças/aulas < 75% (razão exata, sem arredondar)
}

/** Frequência mínima padrão (sem configuração de avaliação), em %. */
export const FREQUENCIA_MINIMA_PADRAO = 75;

/**
 * Presença abaixo do mínimo, comparando a RAZÃO EXATA (sem arredondar):
 * 149/200 = 74,5% é exibido como 75%, mas está abaixo de 75%. Sem aulas
 * registradas conta como 0% (comportamento de sempre).
 */
export function frequenciaAbaixoDoMinimo(
  presencas: number,
  totalAulas: number,
  minimoPercentual: number = FREQUENCIA_MINIMA_PADRAO,
): boolean {
  if (totalAulas <= 0) return minimoPercentual > 0;
  return presencas * 100 < minimoPercentual * totalAulas;
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
    const where: Prisma.FrequenciaWhereInput = {};

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
    pagination: { page: number; limit: number },
  ) {
    const where: Prisma.FrequenciaWhereInput = {};
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
      throw new NotFoundError("NF_004");
    }

    // Verifica se turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: data.turmaId },
    });

    if (!turma) {
      throw new NotFoundError("NF_005");
    }

    const aula = await resolverAulaDaChamada(data.turmaId, data.data, data.gradeHorariaId);

    // Verifica se já existe registro para esta data (e aula)
    const existente = await prisma.frequencia.findFirst({
      where: {
        matriculaId: data.matriculaId,
        turmaId: data.turmaId,
        data: data.data,
        aulaChave: aula.aulaChave,
      },
    });

    if (existente) {
      throw new Error(
        aula.gradeHorariaId
          ? "Já existe um registro de frequência para este aluno nesta aula"
          : "Já existe um registro de frequência para este aluno nesta data",
      );
    }

    return prisma.frequencia.create({
      data: { ...data, ...aula },
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
      throw new NotFoundError("NF_005");
    }

    // Valida se todas as matrículas pertencem à turma
    const matriculasIds = turma.matriculas.map((m) => m.id);
    for (const presenca of data.presencas) {
      if (!matriculasIds.includes(presenca.matriculaId)) {
        throw new Error(
          `Matrícula ${presenca.matriculaId} não pertence a esta turma`,
        );
      }
    }

    // Chamada diária ou de uma aula da grade (regra em resolverAulaDaChamada)
    const aula = await resolverAulaDaChamada(data.turmaId, data.data, data.gradeHorariaId);

    // Grava a chamada da aula (ou do dia) aluno a aluno (upsert pela chave
    // matrícula+turma+data+aulaChave), numa transação só. NÃO apaga e recria o dia: o app do professor
    // reenvia só { matriculaId, status } e, antes, a justificativa/observação
    // lançadas pela secretaria sumiam a cada correção. Regras por aluno:
    // - justificativa/observacao ausentes no payload = mantém o que existe;
    // - status saindo de JUSTIFICADA (sem justificativa nova) = limpa a justificativa;
    // - aluno que não veio no payload = registro intocado.
    const includeRegistro = {
      matricula: {
        select: { id: true, numeroMatricula: true, nomeAluno: true },
      },
    } as const;
    const saindoDeJustificada = data.presencas
      .filter((p) => p.status !== "JUSTIFICADA" && p.justificativa === undefined)
      .map((p) => p.matriculaId);
    const [, ...registros] = await prisma.$transaction([
      prisma.frequencia.updateMany({
        where: {
          turmaId: data.turmaId,
          data: data.data,
          aulaChave: aula.aulaChave,
          matriculaId: { in: saindoDeJustificada },
          status: "JUSTIFICADA",
        },
        data: { justificativa: null },
      }),
      ...data.presencas.map((presenca) =>
        prisma.frequencia.upsert({
          where: {
            matriculaId_turmaId_data_aulaChave: {
              matriculaId: presenca.matriculaId,
              turmaId: data.turmaId,
              data: data.data,
              aulaChave: aula.aulaChave,
            },
          },
          create: {
            turmaId: data.turmaId,
            matriculaId: presenca.matriculaId,
            data: data.data,
            ...aula,
            status: presenca.status,
            justificativa: presenca.justificativa,
            observacao: presenca.observacao,
          },
          update: {
            status: presenca.status,
            // undefined = o Prisma não mexe no campo (mantém o valor existente)
            justificativa: presenca.justificativa,
            observacao: presenca.observacao,
          },
          include: includeRegistro,
        }),
      ),
    ]);

    return {
      message: `Frequência registrada para ${registros.length} aluno(s)`,
      aula: aula.gradeHorariaId
        ? { gradeHorariaId: aula.gradeHorariaId, disciplina: aula.disciplina, horaInicio: aula.horaInicio }
        : null,
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
      throw new NotFoundError("NF_012");
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
      throw new NotFoundError("NF_012");
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
    dataFim?: Date,
  ): Promise<EstatisticasFrequencia> {
    const where: Prisma.FrequenciaWhereInput = {
      matriculaId,
      turmaId,
    };

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataInicio;
      if (dataFim) where.data.lte = dataFim;
    }

    // Usar groupBy ao invés de carregar todos os registros
    const agrupado = await prisma.frequencia.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const totalAulas = agrupado.reduce((acc, g) => acc + g._count, 0);
    const presencas =
      agrupado.find((g) => g.status === "PRESENTE")?._count || 0;
    const faltas = agrupado.find((g) => g.status === "FALTA")?._count || 0;
    const faltasJustificadas =
      agrupado.find((g) => g.status === "JUSTIFICADA")?._count || 0;

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
      abaixoDoLimite: frequenciaAbaixoDoMinimo(presencas, totalAulas),
    };
  }

  /**
   * Calcula estatísticas a partir de registros já carregados (sem query extra)
   */
  private calcularEstatisticasFromRecords(
    registros: Array<{ status: string }>,
  ): EstatisticasFrequencia {
    const totalAulas = registros.length;
    const presencas = registros.filter((r) => r.status === "PRESENTE").length;
    const faltas = registros.filter((r) => r.status === "FALTA").length;
    const faltasJustificadas = registros.filter(
      (r) => r.status === "JUSTIFICADA",
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
      abaixoDoLimite: frequenciaAbaixoDoMinimo(presencas, totalAulas),
    };
  }

  /**
   * Lista alunos com frequência abaixo de 75%
   * Otimizado: busca todas as frequências da turma em uma única query
   */
  async listarAlunosComBaixaFrequencia(
    turmaId: string,
    dataInicio?: Date,
    dataFim?: Date,
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
      throw new NotFoundError("NF_005");
    }

    // Buscar TODAS as frequências da turma em UMA query (elimina N+1)
    const whereFreq: Prisma.FrequenciaWhereInput = {
      turmaId,
      matriculaId: { in: turma.matriculas.map((m) => m.id) },
    };
    if (dataInicio || dataFim) {
      whereFreq.data = {};
      if (dataInicio) whereFreq.data.gte = dataInicio;
      if (dataFim) whereFreq.data.lte = dataFim;
    }

    const todasFrequencias = await prisma.frequencia.findMany({
      where: whereFreq,
      select: { matriculaId: true, status: true },
    });

    // Agrupar por aluno em memória
    const frequenciasPorAluno = new Map<string, Array<{ status: string }>>();
    for (const freq of todasFrequencias) {
      const list = frequenciasPorAluno.get(freq.matriculaId) || [];
      list.push({ status: freq.status });
      frequenciasPorAluno.set(freq.matriculaId, list);
    }

    const alunosComBaixaFrequencia = [];

    for (const matricula of turma.matriculas) {
      const registros = frequenciasPorAluno.get(matricula.id) || [];
      const stats = this.calcularEstatisticasFromRecords(registros);

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
   * Otimizado: busca todas as frequências em uma única query
   */
  async getResumoTurma(turmaId: string, dataInicio?: Date, dataFim?: Date) {
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
      throw new NotFoundError("NF_005");
    }

    // Buscar TODAS as frequências da turma em UMA query (elimina N+1)
    const whereFreq: Prisma.FrequenciaWhereInput = {
      turmaId,
      matriculaId: { in: turma.matriculas.map((m) => m.id) },
    };
    if (dataInicio || dataFim) {
      whereFreq.data = {};
      if (dataInicio) whereFreq.data.gte = dataInicio;
      if (dataFim) whereFreq.data.lte = dataFim;
    }

    const todasFrequencias = await prisma.frequencia.findMany({
      where: whereFreq,
      select: { matriculaId: true, status: true },
    });

    // Agrupar por aluno em memória
    const frequenciasPorAluno = new Map<string, Array<{ status: string }>>();
    for (const freq of todasFrequencias) {
      const list = frequenciasPorAluno.get(freq.matriculaId) || [];
      list.push({ status: freq.status });
      frequenciasPorAluno.set(freq.matriculaId, list);
    }

    const alunos = turma.matriculas.map((matricula) => {
      const registros = frequenciasPorAluno.get(matricula.id) || [];
      const stats = this.calcularEstatisticasFromRecords(registros);
      return { matricula, estatisticas: stats };
    });

    return alunos;
  }

  /**
   * Aulas da grade da turma no dia da semana da data, com o andamento da
   * chamada de cada uma. modo = "AULA" quando a turma tem grade nesse dia
   * (chamada por aula) ou "DIA" (chamada diária). Com `profissionalId`
   * (professor logado), lista só as aulas dele e as sem professor definido
   * na grade — o modo continua sendo o da turma.
   */
  async aulasDoDia(turmaId: string, data: Date, profissionalId?: string) {
    const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { id: true } });
    if (!turma) throw new NotFoundError("NF_005");
    const diaSemana = diaSemanaDaData(data);
    const [aulas, chamadas] = await Promise.all([
      prisma.gradeHoraria.findMany({
        where: { turmaId, diaSemana },
        select: {
          id: true,
          disciplina: true,
          horaInicio: true,
          horaFim: true,
          profissionalId: true,
          profissional: { select: { id: true, nome: true } },
        },
        orderBy: [{ horaInicio: "asc" }, { disciplina: "asc" }],
      }),
      prisma.frequencia.groupBy({
        by: ["aulaChave"],
        where: { turmaId, data },
        _count: true,
        _max: { updatedAt: true },
      }),
    ]);
    const porChave = new Map(chamadas.map((c) => [c.aulaChave, c]));
    const visiveis = profissionalId
      ? aulas.filter((a) => a.profissionalId === null || a.profissionalId === profissionalId)
      : aulas;
    const dia = porChave.get(AULA_DIA);
    return {
      data: data.toISOString().slice(0, 10),
      diaSemana,
      modo: aulas.length > 0 ? ("AULA" as const) : ("DIA" as const),
      aulas: visiveis.map((a) => {
        const c = porChave.get(a.id);
        return {
          gradeHorariaId: a.id,
          disciplina: a.disciplina,
          horaInicio: a.horaInicio,
          horaFim: a.horaFim,
          profissional: a.profissional,
          totalRegistros: c?._count ?? 0,
          registradaEm: c?._max.updatedAt ?? null,
        };
      }),
      // Chamada diária do dia (inclui registros "DIA" antigos)
      chamadaDiaria: { totalRegistros: dia?._count ?? 0, registradaEm: dia?._max.updatedAt ?? null },
    };
  }

  /**
   * Busca frequência por data específica de uma turma (todas as aulas do dia,
   * ou só a de `gradeHorariaId`; "DIA" = só a chamada diária).
   */
  async buscarPorData(turmaId: string, data: Date, aulaChave?: string) {
    return prisma.frequencia.findMany({
      where: {
        turmaId,
        data,
        ...(aulaChave && { aulaChave }),
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
      orderBy: [{ horaInicio: "asc" }, { matricula: { nomeAluno: "asc" } }],
    });
  }
}

export const frequenciaService = new FrequenciaService();
