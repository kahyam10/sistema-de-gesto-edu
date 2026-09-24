import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import type {
  CreateRegistroRefeicaoInput,
  UpdateRegistroRefeicaoInput,
  RelatorioPnaeQuery,
} from "../schemas/alimentacao.schemas.js";

/**
 * Filtros de listagem de registros de refeição
 */
interface RefeicaoFilters {
  escolaId?: string;
  turno?: string;
  tipoRefeicao?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

const includePadrao = {
  escola: { select: { id: true, nome: true } },
  cardapio: { select: { id: true, descricao: true } },
};

function montarWhere(filters?: RefeicaoFilters) {
  const where: any = {};

  if (filters?.escolaId) where.escolaId = filters.escolaId;
  if (filters?.turno) where.turno = filters.turno;
  if (filters?.tipoRefeicao) where.tipoRefeicao = filters.tipoRefeicao;

  if (filters?.dataInicio || filters?.dataFim) {
    where.data = {};
    if (filters.dataInicio) where.data.gte = filters.dataInicio;
    if (filters.dataFim) where.data.lte = filters.dataFim;
  }

  return where;
}

export class RefeicaoService {
  /**
   * Lista registros de refeição com filtros
   */
  async findAll(filters?: RefeicaoFilters) {
    return prisma.registroRefeicao.findMany({
      where: montarWhere(filters),
      include: includePadrao,
      orderBy: { data: "desc" },
    });
  }

  /**
   * Lista registros paginados
   */
  async findAllPaginated(
    filters: RefeicaoFilters,
    pagination: { page: number; limit: number }
  ) {
    const where = montarWhere(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.registroRefeicao.findMany({
        where,
        include: includePadrao,
        orderBy: { data: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.registroRefeicao.count({ where }),
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
   * Busca registro de refeição por ID
   */
  async findById(id: string) {
    const registro = await prisma.registroRefeicao.findUnique({
      where: { id },
      include: includePadrao,
    });

    if (!registro) {
      throw new NotFoundError("NF_035");
    }

    return registro;
  }

  /**
   * Cria registro de refeição. Duplicidade escola/data/turno/tipo fica por
   * conta do @@unique do Prisma (P2002 sobe para o handler).
   */
  async create(data: CreateRegistroRefeicaoInput) {
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    if (data.cardapioId) {
      const cardapio = await prisma.cardapio.findUnique({
        where: { id: data.cardapioId },
      });
      if (!cardapio) {
        throw new NotFoundError("NF_032");
      }
    }

    return prisma.registroRefeicao.create({
      data,
      include: includePadrao,
    });
  }

  /**
   * Atualiza registro de refeição
   */
  async update(id: string, data: UpdateRegistroRefeicaoInput) {
    const registro = await prisma.registroRefeicao.findUnique({
      where: { id },
    });

    if (!registro) {
      throw new NotFoundError("NF_035");
    }

    if (data.cardapioId) {
      const cardapio = await prisma.cardapio.findUnique({
        where: { id: data.cardapioId },
      });
      if (!cardapio) {
        throw new NotFoundError("NF_032");
      }
    }

    return prisma.registroRefeicao.update({
      where: { id },
      data,
      include: includePadrao,
    });
  }

  /**
   * Remove registro de refeição
   */
  async delete(id: string) {
    const registro = await prisma.registroRefeicao.findUnique({
      where: { id },
    });

    if (!registro) {
      throw new NotFoundError("NF_035");
    }

    return prisma.registroRefeicao.delete({ where: { id } });
  }

  /**
   * Relatório PNAE/FNDE: consolida refeições servidas por escola no período
   * e o custo dos insumos (ENTRADAS no período). Agrega em memória (anti-N+1).
   */
  async relatorioPnae({ dataInicio, dataFim, escolaId }: RelatorioPnaeQuery) {
    // 1. Refeições servidas no período, agrupadas por escola
    const registros = await prisma.registroRefeicao.findMany({
      where: {
        data: { gte: dataInicio, lte: dataFim },
        ...(escolaId ? { escolaId } : {}),
      },
      include: { escola: { select: { id: true, nome: true } } },
    });

    const porEscola = new Map<
      string,
      {
        escolaId: string;
        nomeEscola: string;
        totalPorTipoRefeicao: Record<string, number>;
        totalRefeicoes: number;
      }
    >();

    for (const registro of registros) {
      let grupo = porEscola.get(registro.escolaId);
      if (!grupo) {
        grupo = {
          escolaId: registro.escolaId,
          nomeEscola: registro.escola.nome,
          totalPorTipoRefeicao: {},
          totalRefeicoes: 0,
        };
        porEscola.set(registro.escolaId, grupo);
      }
      grupo.totalPorTipoRefeicao[registro.tipoRefeicao] =
        (grupo.totalPorTipoRefeicao[registro.tipoRefeicao] ?? 0) +
        registro.quantidadeServida;
      grupo.totalRefeicoes += registro.quantidadeServida;
    }

    // 2. Custo dos insumos: ENTRADAS no período (quantidade × custoUnitario)
    const entradas = await prisma.movimentacaoEstoque.findMany({
      where: {
        data: { gte: dataInicio, lte: dataFim },
        tipo: "ENTRADA",
        ...(escolaId ? { item: { escolaId } } : {}),
      },
      include: {
        item: { select: { id: true, nome: true, escolaId: true } },
      },
    });

    const custoTotalInsumos = entradas.reduce(
      (total, mov) => total + mov.quantidade * (mov.custoUnitario ?? 0),
      0
    );

    const escolas = Array.from(porEscola.values());
    const totalRefeicoes = escolas.reduce(
      (total, escola) => total + escola.totalRefeicoes,
      0
    );

    return {
      periodo: { dataInicio, dataFim },
      escolas,
      consolidado: {
        totalRefeicoes,
        custoTotalInsumos,
        custoMedioPorRefeicao:
          totalRefeicoes > 0 ? custoTotalInsumos / totalRefeicoes : 0,
      },
    };
  }
}

export const refeicaoService = new RefeicaoService();
