import { PrismaClient } from "@prisma/client";
import { createError } from "../errors/AppError";

const prisma = new PrismaClient();

export class ReuniaoPaisService {
  /**
   * Cria uma nova reunião de pais
   */
  async create(data: {
    escolaId: string;
    turmaId?: string;
    titulo: string;
    descricao?: string;
    data: Date;
    horario: string;
    duracao?: number;
    local?: string;
    tipo: string;
    finalidade?: string;
    pauta?: string;
    profissionalId?: string;
  }) {
    // Validar escola
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw createError("NOT_FOUND", "NF_003");
    }

    // Validar turma se fornecida
    if (data.turmaId) {
      const turma = await prisma.turma.findUnique({
        where: { id: data.turmaId },
      });
      if (!turma) {
        throw createError("NOT_FOUND", "NF_005");
      }
    }

    // Validar profissional se fornecido
    if (data.profissionalId) {
      const profissional = await prisma.profissionalEducacao.findUnique({
        where: { id: data.profissionalId },
      });
      if (!profissional) {
        throw createError("NOT_FOUND", "NF_006");
      }
    }

    const reuniao = await prisma.reuniaoPais.create({
      data: {
        escolaId: data.escolaId,
        turmaId: data.turmaId,
        titulo: data.titulo,
        descricao: data.descricao,
        data: data.data,
        horario: data.horario,
        duracao: data.duracao,
        local: data.local,
        tipo: data.tipo,
        finalidade: data.finalidade,
        pauta: data.pauta,
        profissionalId: data.profissionalId,
      },
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        profissional: true,
        presencas: true,
      },
    });

    return reuniao;
  }

  /**
   * Lista todas as reuniões com filtros opcionais
   */
  async findAll(filters?: {
    escolaId?: string;
    turmaId?: string;
    tipo?: string;
    status?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.status) where.status = filters.status;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data = {};
      if (filters.dataInicio) where.data.gte = filters.dataInicio;
      if (filters.dataFim) where.data.lte = filters.dataFim;
    }

    const reunioes = await prisma.reuniaoPais.findMany({
      where,
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        profissional: true,
        presencas: true,
        _count: {
          select: {
            presencas: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
    });

    return reunioes;
  }

  /**
   * Busca uma reunião por ID
   */
  async findById(id: string) {
    const reuniao = await prisma.reuniaoPais.findUnique({
      where: { id },
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
            matriculas: {
              where: {
                status: "ATIVA",
              },
              select: {
                id: true,
                nomeAluno: true,
                nomeResponsavel: true,
              },
            },
          },
        },
        profissional: true,
        presencas: {
          include: {
            matricula: {
              select: {
                id: true,
                nomeAluno: true,
                nomeResponsavel: true,
              },
            },
          },
        },
        _count: {
          select: {
            presencas: true,
          },
        },
      },
    });

    if (!reuniao) {
      throw createError("NOT_FOUND", "NF_025");
    }

    return reuniao;
  }

  /**
   * Atualiza uma reunião
   */
  async update(
    id: string,
    data: {
      titulo?: string;
      descricao?: string;
      data?: Date;
      horario?: string;
      duracao?: number;
      local?: string;
      tipo?: string;
      finalidade?: string;
      pauta?: string;
      ata?: string;
      encaminhamentos?: string;
      status?: string;
      profissionalId?: string;
    }
  ) {
    const reuniao = await prisma.reuniaoPais.findUnique({
      where: { id },
    });

    if (!reuniao) {
      throw createError("NOT_FOUND", "NF_025");
    }

    // Validar profissional se fornecido
    if (data.profissionalId) {
      const profissional = await prisma.profissionalEducacao.findUnique({
        where: { id: data.profissionalId },
      });
      if (!profissional) {
        throw createError("NOT_FOUND", "NF_003");
      }
    }

    const updatedReuniao = await prisma.reuniaoPais.update({
      where: { id },
      data,
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        profissional: true,
        presencas: true,
        _count: {
          select: {
            presencas: true,
          },
        },
      },
    });

    return updatedReuniao;
  }

  /**
   * Deleta uma reunião
   */
  async delete(id: string) {
    const reuniao = await prisma.reuniaoPais.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            presencas: true,
          },
        },
      },
    });

    if (!reuniao) {
      throw createError("NOT_FOUND", "NF_025");
    }

    // Não permite deletar se já tem presenças registradas
    if (reuniao._count.presencas > 0) {
      throw createError("BUSINESS", "BIZ_018");
    }

    await prisma.reuniaoPais.delete({
      where: { id },
    });

    return { message: "Reunião deletada com sucesso" };
  }

  /**
   * Registra presença em reunião
   */
  async registrarPresenca(data: {
    reuniaoId: string;
    matriculaId: string;
    nomeResponsavel: string;
    parentesco?: string;
    presente: boolean;
    horarioChegada?: string;
    observacoes?: string;
  }) {
    // Validar reunião
    const reuniao = await prisma.reuniaoPais.findUnique({
      where: { id: data.reuniaoId },
    });
    if (!reuniao) {
      throw createError("NOT_FOUND", "NF_025");
    }

    // Validar matrícula
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
    });
    if (!matricula) {
      throw createError("NOT_FOUND", "NF_004");
    }

    // Verificar se já existe presença registrada
    const presencaExistente = await prisma.presencaReuniao.findUnique({
      where: {
        reuniaoId_matriculaId: {
          reuniaoId: data.reuniaoId,
          matriculaId: data.matriculaId,
        },
      },
    });

    if (presencaExistente) {
      // Atualiza presença existente
      const presencaAtualizada = await prisma.presencaReuniao.update({
        where: {
          reuniaoId_matriculaId: {
            reuniaoId: data.reuniaoId,
            matriculaId: data.matriculaId,
          },
        },
        data: {
          nomeResponsavel: data.nomeResponsavel,
          parentesco: data.parentesco,
          presente: data.presente,
          horarioChegada: data.horarioChegada,
          observacoes: data.observacoes,
        },
        include: {
          matricula: {
            select: {
              nomeAluno: true,
              nomeResponsavel: true,
            },
          },
        },
      });
      return presencaAtualizada;
    }

    // Cria nova presença
    const presenca = await prisma.presencaReuniao.create({
      data: {
        reuniaoId: data.reuniaoId,
        matriculaId: data.matriculaId,
        nomeResponsavel: data.nomeResponsavel,
        parentesco: data.parentesco,
        presente: data.presente,
        horarioChegada: data.horarioChegada,
        observacoes: data.observacoes,
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
            nomeResponsavel: true,
          },
        },
      },
    });

    return presenca;
  }

  /**
   * Lista presenças de uma reunião
   */
  async findPresencasByReuniao(reuniaoId: string) {
    const presencas = await prisma.presencaReuniao.findMany({
      where: { reuniaoId },
      include: {
        matricula: {
          select: {
            id: true,
            nomeAluno: true,
            nomeResponsavel: true,
            turma: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        matricula: {
          nomeAluno: "asc",
        },
      },
    });

    return presencas;
  }

  /**
   * Deleta uma presença
   */
  async deletePresenca(id: string) {
    const presenca = await prisma.presencaReuniao.findUnique({
      where: { id },
    });

    if (!presenca) {
      throw createError("NOT_FOUND", "NF_026");
    }

    await prisma.presencaReuniao.delete({
      where: { id },
    });

    return { message: "Presença deletada com sucesso" };
  }

  /**
   * Estatísticas de reuniões
   */
  async getEstatisticas(escolaId?: string) {
    const where: any = {};
    if (escolaId) where.escolaId = escolaId;

    const total = await prisma.reuniaoPais.count({ where });

    const porStatus = await prisma.reuniaoPais.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const porTipo = await prisma.reuniaoPais.groupBy({
      by: ["tipo"],
      where,
      _count: true,
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const proximas = await prisma.reuniaoPais.count({
      where: {
        ...where,
        data: {
          gte: hoje,
        },
        status: "AGENDADA",
      },
    });

    // Taxa de presença média
    const reunioesRealizadas = await prisma.reuniaoPais.findMany({
      where: {
        ...where,
        status: "REALIZADA",
      },
      include: {
        presencas: {
          where: {
            presente: true,
          },
        },
        turma: {
          include: {
            matriculas: {
              where: {
                status: "ATIVA",
              },
            },
          },
        },
      },
    });

    let totalPresencas = 0;
    let totalEsperado = 0;

    reunioesRealizadas.forEach((reuniao) => {
      totalPresencas += reuniao.presencas.length;
      if (reuniao.turma) {
        totalEsperado += reuniao.turma.matriculas.length;
      }
    });

    const taxaPresenca =
      totalEsperado > 0 ? (totalPresencas / totalEsperado) * 100 : 0;

    return {
      total,
      proximas,
      porStatus: porStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      porTipo: porTipo.reduce((acc: any, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      taxaPresencaMedia: Math.round(taxaPresenca * 100) / 100,
    };
  }
}
