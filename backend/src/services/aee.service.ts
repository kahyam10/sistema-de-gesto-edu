import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";

export interface CreatePEIInput {
  matriculaId: string;
  anoLetivo: number;
  deficiencia: string;
  cid?: string;
  laudoMedico?: boolean;
  laudoPath?: string;
  necessitaAEE?: boolean;
  frequenciaAEE?: string;
  profissionalAEE?: string;
  objetivosGerais?: string;
  objetivosEspecificos?: string;
  estrategias?: string;
  recursos?: string;
  avaliacaoDiagnostica?: string;
  elaboradoPor?: string;
  dataElaboracao?: Date;
}

export interface UpdatePEIInput {
  deficiencia?: string;
  cid?: string;
  laudoMedico?: boolean;
  laudoPath?: string;
  necessitaAEE?: boolean;
  frequenciaAEE?: string;
  profissionalAEE?: string;
  objetivosGerais?: string;
  objetivosEspecificos?: string;
  estrategias?: string;
  recursos?: string;
  avaliacaoDiagnostica?: string;
  dataRevisao?: Date;
  status?: string;
}

export interface CreateSalaRecursosInput {
  escolaId: string;
  nome: string;
  tipo: string; // TIPO_I, TIPO_II
  turno: string;
  capacidade?: number;
  recursos?: string;
  profissionais?: string; // JSON array
}

export interface CreateAtendimentoAEEInput {
  peiId: string;
  salaRecursosId: string;
  data: Date;
  horario?: string;
  duracao?: number;
  objetivo?: string;
  atividades?: string;
  recursos?: string;
  observacoes?: string;
  presenca?: boolean;
  justificativa?: string;
  profissionalId?: string;
}

export class AEEService {
  // ==================== PEI (PLANO EDUCACIONAL INDIVIDUALIZADO) ====================

  async createPEI(data: CreatePEIInput) {
    // Verifica se matrícula existe
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004"); // Matrícula não encontrada
    }

    // Verifica se já existe PEI para esta matrícula
    const existente = await prisma.planoEducacionalIndividualizado.findUnique({
      where: { matriculaId: data.matriculaId },
    });

    if (existente) {
      throw new BusinessError("BIZ_014", {
        matriculaId: data.matriculaId,
        peiId: existente.id,
      }); // Já existe PEI para esta matrícula
    }

    return await prisma.planoEducacionalIndividualizado.create({
      data: {
        ...data,
        dataElaboracao: data.dataElaboracao || new Date(),
      },
      include: {
        matricula: {
          select: {
            nomeAluno: true,
            numeroMatricula: true,
            dataNascimento: true,
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
      },
    });
  }

  async findAllPEI(filters?: { escolaId?: string; anoLetivo?: number; status?: string }) {
    const where: any = {};

    if (filters?.anoLetivo) where.anoLetivo = filters.anoLetivo;
    if (filters?.status) where.status = filters.status;

    if (filters?.escolaId) {
      where.matricula = {
        escolaId: filters.escolaId,
      };
    }

    return await prisma.planoEducacionalIndividualizado.findMany({
      where,
      include: {
        matricula: {
          select: {
            nomeAluno: true,
            numeroMatricula: true,
            dataNascimento: true,
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
        _count: {
          select: {
            atendimentos: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAllPEIPaginated(
    filters: { escolaId?: string; anoLetivo?: number; status?: string },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: any = {};

    if (filters?.anoLetivo) where.anoLetivo = filters.anoLetivo;
    if (filters?.status) where.status = filters.status;

    if (filters?.escolaId) {
      where.matricula = {
        escolaId: filters.escolaId,
      };
    }

    const include = {
      matricula: {
        select: {
          nomeAluno: true,
          numeroMatricula: true,
          dataNascimento: true,
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
      _count: {
        select: {
          atendimentos: true,
        },
      },
    };

    const [data, total] = await Promise.all([
      prisma.planoEducacionalIndividualizado.findMany({
        where,
        include,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pagination.limit,
      }),
      prisma.planoEducacionalIndividualizado.count({ where }),
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

  async findPEIById(id: string) {
    const pei = await prisma.planoEducacionalIndividualizado.findUnique({
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
        atendimentos: {
          include: {
            salaRecursos: {
              select: {
                nome: true,
                tipo: true,
              },
            },
            profissional: {
              select: {
                nome: true,
              },
            },
          },
          orderBy: {
            data: "desc",
          },
        },
      },
    });

    if (!pei) {
      throw new NotFoundError("NF_020", { peiId: id }); // PEI não encontrado
    }

    return pei;
  }

  async findPEIByMatricula(matriculaId: string) {
    return await prisma.planoEducacionalIndividualizado.findUnique({
      where: { matriculaId },
      include: {
        matricula: true,
        atendimentos: {
          include: {
            salaRecursos: true,
            profissional: {
              select: {
                nome: true,
              },
            },
          },
          orderBy: {
            data: "desc",
          },
          take: 10,
        },
      },
    });
  }

  async updatePEI(id: string, data: UpdatePEIInput) {
    const pei = await prisma.planoEducacionalIndividualizado.findUnique({
      where: { id },
    });

    if (!pei) {
      throw new NotFoundError("NF_020", { peiId: id });
    }

    return await prisma.planoEducacionalIndividualizado.update({
      where: { id },
      data,
      include: {
        matricula: true,
        atendimentos: {
          orderBy: {
            data: "desc",
          },
          take: 10,
        },
      },
    });
  }

  async deletePEI(id: string) {
    const pei = await prisma.planoEducacionalIndividualizado.findUnique({
      where: { id },
    });

    if (!pei) {
      throw new NotFoundError("NF_020", { peiId: id });
    }

    return await prisma.planoEducacionalIndividualizado.delete({
      where: { id },
    });
  }

  // ==================== SALAS DE RECURSOS ====================

  async createSalaRecursos(data: CreateSalaRecursosInput) {
    // Verifica se escola existe
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });

    if (!escola) {
      throw new NotFoundError("NF_002"); // Escola não encontrada
    }

    return await prisma.salaRecursos.create({
      data: {
        ...data,
        capacidade: data.capacidade || 10,
      },
      include: {
        escola: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async findAllSalasRecursos(filters?: { escolaId?: string; turno?: string }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.turno) where.turno = filters.turno;

    return await prisma.salaRecursos.findMany({
      where,
      include: {
        escola: {
          select: {
            nome: true,
          },
        },
        _count: {
          select: {
            atendimentos: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });
  }

  async findSalaRecursosById(id: string) {
    const sala = await prisma.salaRecursos.findUnique({
      where: { id },
      include: {
        escola: true,
        atendimentos: {
          include: {
            pei: {
              include: {
                matricula: {
                  select: {
                    nomeAluno: true,
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
          orderBy: {
            data: "desc",
          },
          take: 20,
        },
      },
    });

    if (!sala) {
      throw new NotFoundError("NF_021", { salaRecursosId: id }); // Sala de recursos não encontrada
    }

    return sala;
  }

  async updateSalaRecursos(id: string, data: Partial<CreateSalaRecursosInput>) {
    const sala = await prisma.salaRecursos.findUnique({
      where: { id },
    });

    if (!sala) {
      throw new NotFoundError("NF_021", { salaRecursosId: id });
    }

    return await prisma.salaRecursos.update({
      where: { id },
      data,
      include: {
        escola: true,
      },
    });
  }

  async deleteSalaRecursos(id: string) {
    const sala = await prisma.salaRecursos.findUnique({
      where: { id },
    });

    if (!sala) {
      throw new NotFoundError("NF_021", { salaRecursosId: id });
    }

    return await prisma.salaRecursos.delete({
      where: { id },
    });
  }

  // ==================== ATENDIMENTOS AEE ====================

  async createAtendimento(data: CreateAtendimentoAEEInput) {
    // Verifica se PEI existe
    const pei = await prisma.planoEducacionalIndividualizado.findUnique({
      where: { id: data.peiId },
    });

    if (!pei) {
      throw new NotFoundError("NF_020", { peiId: data.peiId });
    }

    // Verifica se sala de recursos existe
    const sala = await prisma.salaRecursos.findUnique({
      where: { id: data.salaRecursosId },
    });

    if (!sala) {
      throw new NotFoundError("NF_021", { salaRecursosId: data.salaRecursosId });
    }

    return await prisma.atendimentoAEE.create({
      data: {
        ...data,
        presenca: data.presenca !== false, // Default true
      },
      include: {
        pei: {
          include: {
            matricula: {
              select: {
                nomeAluno: true,
              },
            },
          },
        },
        salaRecursos: true,
        profissional: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async findAtendimentosByPEI(peiId: string, filters?: { mes?: number; ano?: number }) {
    const where: any = { peiId };

    if (filters?.mes && filters?.ano) {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0, 23, 59, 59);

      where.data = {
        gte: startDate,
        lte: endDate,
      };
    }

    return await prisma.atendimentoAEE.findMany({
      where,
      include: {
        salaRecursos: {
          select: {
            nome: true,
            tipo: true,
          },
        },
        profissional: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
    });
  }

  async findAtendimentosBySala(salaRecursosId: string, filters?: { mes?: number; ano?: number }) {
    const where: any = { salaRecursosId };

    if (filters?.mes && filters?.ano) {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0, 23, 59, 59);

      where.data = {
        gte: startDate,
        lte: endDate,
      };
    }

    return await prisma.atendimentoAEE.findMany({
      where,
      include: {
        pei: {
          include: {
            matricula: {
              select: {
                nomeAluno: true,
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
      orderBy: {
        data: "desc",
      },
    });
  }

  async updateAtendimento(id: string, data: Partial<CreateAtendimentoAEEInput>) {
    const atendimento = await prisma.atendimentoAEE.findUnique({
      where: { id },
    });

    if (!atendimento) {
      throw new NotFoundError("NF_022", { atendimentoId: id }); // Atendimento não encontrado
    }

    return await prisma.atendimentoAEE.update({
      where: { id },
      data,
      include: {
        pei: {
          include: {
            matricula: true,
          },
        },
        salaRecursos: true,
        profissional: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async deleteAtendimento(id: string) {
    const atendimento = await prisma.atendimentoAEE.findUnique({
      where: { id },
    });

    if (!atendimento) {
      throw new NotFoundError("NF_022", { atendimentoId: id });
    }

    return await prisma.atendimentoAEE.delete({
      where: { id },
    });
  }

  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  async getEstatisticasAEE(escolaId?: string) {
    const where: any = {};

    if (escolaId) {
      where.matricula = {
        escolaId,
      };
    }

    const totalPEIs = await prisma.planoEducacionalIndividualizado.count({ where });

    const totalSalasRecursos = await prisma.salaRecursos.count({
      where: escolaId ? { escolaId } : undefined,
    });

    const alunosAtendidos = await prisma.planoEducacionalIndividualizado.count({
      where: {
        ...where,
        necessitaAEE: true,
      },
    });

    const porDeficiencia = await prisma.planoEducacionalIndividualizado.groupBy({
      by: ["deficiencia"],
      where,
      _count: true,
    });

    return {
      totalPEIs,
      totalSalasRecursos,
      alunosAtendidos,
      porDeficiencia: porDeficiencia.reduce(
        (acc, item) => ({
          ...acc,
          [item.deficiencia]: item._count,
        }),
        {} as Record<string, number>
      ),
    };
  }
}
