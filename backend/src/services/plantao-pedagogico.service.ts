import { PrismaClient } from "@prisma/client";
import { NotFoundError, BusinessError } from "../errors/AppError.js";

const prisma = new PrismaClient();

export class PlantaoPedagogicoService {
  /**
   * Cria um novo plantão pedagógico
   */
  async create(data: {
    escolaId: string;
    data: Date;
    tipo: string;
    descricao?: string;
    horarioInicio: string;
    horarioFim: string;
    profissionais?: string;
    turmaId?: string;
    local?: string;
    observacoes?: string;
  }) {
    // Validar escola
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    // Validar turma se fornecida
    if (data.turmaId) {
      const turma = await prisma.turma.findUnique({
        where: { id: data.turmaId },
      });
      if (!turma) {
        throw new NotFoundError("NF_005");
      }
    }

    const plantao = await prisma.plantaoPedagogico.create({
      data: {
        escolaId: data.escolaId,
        data: data.data,
        tipo: data.tipo,
        descricao: data.descricao,
        horarioInicio: data.horarioInicio,
        horarioFim: data.horarioFim,
        profissionais: data.profissionais,
        turmaId: data.turmaId,
        local: data.local,
        observacoes: data.observacoes,
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
      },
    });

    return plantao;
  }

  /**
   * Lista todos os plantões com filtros opcionais
   */
  async findAll(filters?: {
    escolaId?: string;
    turmaId?: string;
    tipo?: string;
    dataInicio?: Date;
    dataFim?: Date;
    ativo?: boolean;
  }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data = {};
      if (filters.dataInicio) where.data.gte = filters.dataInicio;
      if (filters.dataFim) where.data.lte = filters.dataFim;
    }

    const plantoes = await prisma.plantaoPedagogico.findMany({
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
      },
      orderBy: {
        data: "desc",
      },
    });

    return plantoes;
  }

  /**
   * Busca um plantão por ID
   */
  async findById(id: string) {
    const plantao = await prisma.plantaoPedagogico.findUnique({
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
          },
        },
      },
    });

    if (!plantao) {
      throw new NotFoundError("NF_024");
    }

    return plantao;
  }

  /**
   * Atualiza um plantão
   */
  async update(
    id: string,
    data: {
      data?: Date;
      tipo?: string;
      descricao?: string;
      horarioInicio?: string;
      horarioFim?: string;
      profissionais?: string;
      turmaId?: string;
      local?: string;
      observacoes?: string;
      ativo?: boolean;
    }
  ) {
    const plantao = await prisma.plantaoPedagogico.findUnique({
      where: { id },
    });

    if (!plantao) {
      throw new NotFoundError("NF_024");
    }

    // Validar turma se fornecida
    if (data.turmaId) {
      const turma = await prisma.turma.findUnique({
        where: { id: data.turmaId },
      });
      if (!turma) {
        throw new NotFoundError("NF_002");
      }
    }

    const updatedPlantao = await prisma.plantaoPedagogico.update({
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
      },
    });

    return updatedPlantao;
  }

  /**
   * Deleta um plantão
   */
  async delete(id: string) {
    const plantao = await prisma.plantaoPedagogico.findUnique({
      where: { id },
    });

    if (!plantao) {
      throw new NotFoundError("NF_024");
    }

    await prisma.plantaoPedagogico.delete({
      where: { id },
    });

    return { message: "Plantão pedagógico deletado com sucesso" };
  }

  /**
   * Busca plantões por escola e período
   */
  async findByEscolaAndPeriodo(
    escolaId: string,
    dataInicio: Date,
    dataFim: Date
  ) {
    const plantoes = await prisma.plantaoPedagogico.findMany({
      where: {
        escolaId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        ativo: true,
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
      },
      orderBy: {
        data: "asc",
      },
    });

    return plantoes;
  }

  /**
   * Estatísticas de plantões
   */
  async getEstatisticas(escolaId?: string) {
    const where: any = {};
    if (escolaId) where.escolaId = escolaId;

    const total = await prisma.plantaoPedagogico.count({ where });

    const porTipo = await prisma.plantaoPedagogico.groupBy({
      by: ["tipo"],
      where,
      _count: true,
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const proximos = await prisma.plantaoPedagogico.count({
      where: {
        ...where,
        data: {
          gte: hoje,
        },
        ativo: true,
      },
    });

    return {
      total,
      proximos,
      porTipo: porTipo.reduce((acc: any, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
    };
  }
}
