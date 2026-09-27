import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";
import type {
  CreateItemEstoqueInput,
  UpdateItemEstoqueInput,
  CreateMovimentacaoEstoqueInput,
} from "../schemas/alimentacao.schemas.js";

// O tipo da movimentação dá o sinal: quantidade é SEMPRE positiva no banco.
const TIPOS_ENTRADA = ["ENTRADA", "AJUSTE_ENTRADA"];
const TIPOS_SAIDA = ["SAIDA", "PERDA", "AJUSTE_SAIDA"];

/**
 * Filtros de listagem de itens de estoque
 */
interface ItemEstoqueFilters {
  escolaId?: string;
  categoria?: string;
  ativo?: boolean;
  busca?: string;
}

/**
 * Filtros de listagem de movimentações
 */
interface MovimentacaoFilters {
  itemId?: string;
  escolaId?: string;
  tipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

const includeItem = {
  item: {
    select: { id: true, nome: true, unidadeMedida: true, escolaId: true },
  },
};

function montarWhereMovimentacao(filters: MovimentacaoFilters) {
  const where: Prisma.MovimentacaoEstoqueWhereInput = {};

  if (filters.itemId) where.itemId = filters.itemId;
  if (filters.tipo) where.tipo = filters.tipo;
  if (filters.escolaId) where.item = { escolaId: filters.escolaId };

  if (filters.dataInicio || filters.dataFim) {
    where.data = {};
    if (filters.dataInicio) where.data.gte = filters.dataInicio;
    if (filters.dataFim) where.data.lte = filters.dataFim;
  }

  return where;
}

export class EstoqueService {
  /**
   * Lista itens de estoque com saldo derivado das movimentações.
   * Saldo calculado anti-N+1 via groupBy + Map em memória.
   */
  async listItens(filters?: ItemEstoqueFilters) {
    const where: Prisma.ItemEstoqueWhereInput = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.categoria) where.categoria = filters.categoria;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.busca) {
      where.nome = { contains: filters.busca, mode: "insensitive" };
    }

    const itens = await prisma.itemEstoque.findMany({
      where,
      include: { escola: { select: { id: true, nome: true } } },
      orderBy: { nome: "asc" },
    });

    if (itens.length === 0) return [];

    const grupos = await prisma.movimentacaoEstoque.groupBy({
      by: ["itemId", "tipo"],
      _sum: { quantidade: true },
      where: { itemId: { in: itens.map((i) => i.id) } },
    });

    const saldos = new Map<string, number>();
    for (const grupo of grupos) {
      const quantidade = grupo._sum.quantidade ?? 0;
      const atual = saldos.get(grupo.itemId) ?? 0;
      saldos.set(
        grupo.itemId,
        TIPOS_ENTRADA.includes(grupo.tipo) ? atual + quantidade : atual - quantidade
      );
    }

    return itens.map((item) => ({
      ...item,
      saldo: saldos.get(item.id) ?? 0,
    }));
  }

  /**
   * Busca item por ID com saldo e últimas 20 movimentações
   */
  async findItemById(id: string) {
    const item = await prisma.itemEstoque.findUnique({
      where: { id },
      include: {
        escola: { select: { id: true, nome: true } },
        movimentacoes: { orderBy: { data: "desc" }, take: 20 },
      },
    });

    if (!item) {
      throw new NotFoundError("NF_033");
    }

    const saldo = await this.calcularSaldo(id);

    return { ...item, saldo };
  }

  /**
   * Cria item de estoque (nome único por escola — P2002 sobe para o handler)
   */
  async createItem(data: CreateItemEstoqueInput) {
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    return prisma.itemEstoque.create({
      data,
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  /**
   * Atualiza item de estoque
   */
  async updateItem(id: string, data: UpdateItemEstoqueInput) {
    const item = await prisma.itemEstoque.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundError("NF_033");
    }

    return prisma.itemEstoque.update({
      where: { id },
      data,
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  /**
   * Remove item de estoque (cascade remove as movimentações)
   */
  async deleteItem(id: string) {
    const item = await prisma.itemEstoque.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundError("NF_033");
    }

    return prisma.itemEstoque.delete({ where: { id } });
  }

  /**
   * Saldo derivado: soma das entradas menos soma das saídas.
   * NUNCA materializado — aceita tx para uso dentro de transações.
   */
  async calcularSaldo(itemId: string, tx?: Pick<typeof prisma, "movimentacaoEstoque">) {
    const db = tx ?? prisma;

    const grupos = await db.movimentacaoEstoque.groupBy({
      by: ["tipo"],
      _sum: { quantidade: true },
      where: { itemId },
    });

    let saldo = 0;
    for (const grupo of grupos) {
      const quantidade = grupo._sum.quantidade ?? 0;
      saldo += TIPOS_ENTRADA.includes(grupo.tipo) ? quantidade : -quantidade;
    }

    return saldo;
  }

  /**
   * Registra movimentação em transação interativa: a checagem de saldo na
   * saída roda DENTRO da $transaction — sem isso, duas saídas concorrentes
   * furam o estoque.
   */
  async registrarMovimentacao(data: CreateMovimentacaoEstoqueInput) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.itemEstoque.findUnique({
        where: { id: data.itemId },
      });
      if (!item) {
        throw new NotFoundError("NF_033");
      }

      if (TIPOS_SAIDA.includes(data.tipo)) {
        const saldo = await this.calcularSaldo(data.itemId, tx);
        if (saldo < data.quantidade) {
          throw new BusinessError("BIZ_025");
        }
      }

      return tx.movimentacaoEstoque.create({
        data: { ...data, data: data.data ?? new Date() },
        include: includeItem,
      });
    });
  }

  /**
   * Lista movimentações com filtros
   */
  async listMovimentacoes(filters: MovimentacaoFilters) {
    return prisma.movimentacaoEstoque.findMany({
      where: montarWhereMovimentacao(filters),
      include: includeItem,
      orderBy: { data: "desc" },
    });
  }

  /**
   * Lista movimentações paginadas
   */
  async listMovimentacoesPaginated(
    filters: MovimentacaoFilters,
    pagination: { page: number; limit: number }
  ) {
    const where = montarWhereMovimentacao(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.movimentacaoEstoque.findMany({
        where,
        include: includeItem,
        orderBy: { data: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.movimentacaoEstoque.count({ where }),
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
   * Remove uma movimentação (trilha de auditoria — restrito a GESTAO no RBAC).
   * Correção operacional preferida: movimentação AJUSTE_* com motivo.
   */
  async deleteMovimentacao(id: string) {
    const movimentacao = await prisma.movimentacaoEstoque.findUnique({
      where: { id },
    });

    if (!movimentacao) {
      throw new NotFoundError("NF_034");
    }

    return prisma.movimentacaoEstoque.delete({ where: { id } });
  }

  /**
   * Itens ativos com saldo <= estoqueMinimo (item zerado com mínimo 0 alerta:
   * despensa vazia deve alertar). Filtro em memória sobre listItens.
   */
  async alertasEstoqueMinimo(escolaId?: string) {
    const itens = await this.listItens({ escolaId, ativo: true });

    return itens
      .filter((item) => item.saldo <= item.estoqueMinimo)
      .map(({ saldo, ...item }) => ({ item, saldo }));
  }
}

export const estoqueService = new EstoqueService();
