import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";
import type {
  CreateCardapioInput,
  UpdateCardapioInput,
} from "../schemas/alimentacao.schemas.js";

/**
 * Filtros de listagem de cardápios
 */
interface CardapioFilters {
  escolaId?: string;
  turno?: string;
  tipoRefeicao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  ativo?: boolean;
}

const includeEscola = {
  escola: { select: { id: true, nome: true } },
};

/**
 * Monta o where compartilhado entre findAll e findAllPaginated.
 * Quando escolaId é informado, retorna os cardápios da escola E os da rede
 * (escolaId null = cardápio da rede, publicado pela SEMEC).
 */
function montarWhere(filters?: CardapioFilters) {
  const where: any = {};

  if (filters?.escolaId) {
    where.OR = [{ escolaId: filters.escolaId }, { escolaId: null }];
  }
  if (filters?.turno) where.turno = filters.turno;
  if (filters?.tipoRefeicao) where.tipoRefeicao = filters.tipoRefeicao;
  if (filters?.ativo !== undefined) where.ativo = filters.ativo;

  if (filters?.dataInicio || filters?.dataFim) {
    where.data = {};
    if (filters.dataInicio) where.data.gte = filters.dataInicio;
    if (filters.dataFim) where.data.lte = filters.dataFim;
  }

  return where;
}

export class CardapioService {
  /**
   * Lista cardápios com filtros
   */
  async findAll(filters?: CardapioFilters) {
    return prisma.cardapio.findMany({
      where: montarWhere(filters),
      include: includeEscola,
      orderBy: [{ data: "asc" }, { turno: "asc" }],
    });
  }

  /**
   * Lista cardápios paginados
   */
  async findAllPaginated(
    filters: CardapioFilters,
    pagination: { page: number; limit: number }
  ) {
    const where = montarWhere(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.cardapio.findMany({
        where,
        include: includeEscola,
        orderBy: [{ data: "asc" }, { turno: "asc" }],
        skip,
        take: pagination.limit,
      }),
      prisma.cardapio.count({ where }),
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
   * Busca cardápio por ID
   */
  async findById(id: string) {
    const cardapio = await prisma.cardapio.findUnique({
      where: { id },
      include: includeEscola,
    });

    if (!cardapio) {
      throw new NotFoundError("NF_032");
    }

    return cardapio;
  }

  /**
   * Cria um cardápio.
   * Cardapio.escolaId nullable (rede) impede @@unique no Postgres (múltiplos NULLs),
   * por isso a duplicidade escola/data/turno/tipo é pré-checada aqui (BIZ_026).
   */
  async create(data: CreateCardapioInput) {
    if (data.escolaId) {
      const escola = await prisma.escola.findUnique({
        where: { id: data.escolaId },
      });
      if (!escola) {
        throw new NotFoundError("NF_003");
      }
    }

    const duplicado = await prisma.cardapio.findFirst({
      where: {
        escolaId: data.escolaId ?? null,
        data: data.data,
        turno: data.turno,
        tipoRefeicao: data.tipoRefeicao,
      },
    });

    if (duplicado) {
      throw new BusinessError("BIZ_026");
    }

    return prisma.cardapio.create({
      data: {
        ...data,
        escolaId: data.escolaId ?? null,
      },
      include: includeEscola,
    });
  }

  /**
   * Atualiza um cardápio
   */
  async update(id: string, data: UpdateCardapioInput) {
    const cardapio = await prisma.cardapio.findUnique({ where: { id } });

    if (!cardapio) {
      throw new NotFoundError("NF_032");
    }

    if (data.escolaId) {
      const escola = await prisma.escola.findUnique({
        where: { id: data.escolaId },
      });
      if (!escola) {
        throw new NotFoundError("NF_003");
      }
    }

    return prisma.cardapio.update({
      where: { id },
      data,
      include: includeEscola,
    });
  }

  /**
   * Remove um cardápio
   */
  async delete(id: string) {
    const cardapio = await prisma.cardapio.findUnique({ where: { id } });

    if (!cardapio) {
      throw new NotFoundError("NF_032");
    }

    return prisma.cardapio.delete({ where: { id } });
  }
}

export const cardapioService = new CardapioService();
