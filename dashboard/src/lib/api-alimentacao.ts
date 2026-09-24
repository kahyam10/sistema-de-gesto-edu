// Módulo 6 — Alimentação Escolar: tipos + camada de API
// Importa a infraestrutura compartilhada de ./api (request já exportado de lá)
import {
  request,
  type Escola,
  type PaginationParams,
  type PaginatedResponse,
} from "./api";

// ==================== TIPOS ====================

export type TurnoRefeicao = "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
export type TipoRefeicao =
  | "CAFE_MANHA"
  | "LANCHE_MANHA"
  | "ALMOCO"
  | "LANCHE_TARDE"
  | "JANTAR"
  | "CEIA";
export type CategoriaItemEstoque =
  | "PERECIVEL"
  | "NAO_PERECIVEL"
  | "HORTIFRUTI"
  | "PROTEINA"
  | "GRAO"
  | "LATICINIO"
  | "OUTRO";
export type UnidadeMedida = "KG" | "G" | "L" | "ML" | "UN" | "PCT" | "CX";
export type TipoMovimentacaoEstoque =
  | "ENTRADA"
  | "SAIDA"
  | "PERDA"
  | "AJUSTE_ENTRADA"
  | "AJUSTE_SAIDA";

export interface ItemCardapio {
  alimento: string;
  quantidadePorAluno?: number;
  unidade?: string;
}

export interface Cardapio {
  id: string;
  data: string;
  turno: TurnoRefeicao;
  tipoRefeicao: TipoRefeicao;
  descricao: string;
  itens?: ItemCardapio[] | null;
  observacoesNutricionais?: string | null;
  ativo: boolean;
  escolaId?: string | null; // null = cardápio da rede (SEMEC)
  escola?: Escola | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemEstoque {
  id: string;
  nome: string;
  categoria: CategoriaItemEstoque;
  unidadeMedida: UnidadeMedida;
  estoqueMinimo: number;
  ativo: boolean;
  escolaId: string;
  escola?: Escola;
  /** Derivado das movimentações (nunca materializado no banco) */
  saldo?: number;
  movimentacoes?: MovimentacaoEstoque[];
  createdAt: string;
  updatedAt: string;
}

export interface MovimentacaoEstoque {
  id: string;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number;
  data: string;
  custoUnitario?: number | null;
  fornecedor?: string | null;
  notaFiscal?: string | null;
  motivo?: string | null;
  registradoPor?: string | null;
  itemId: string;
  item?: Pick<ItemEstoque, "id" | "nome" | "unidadeMedida" | "escolaId">;
  createdAt: string;
}

export interface AlertaEstoque {
  item: ItemEstoque;
  saldo: number;
}

export interface RegistroRefeicao {
  id: string;
  data: string;
  turno: TurnoRefeicao;
  tipoRefeicao: TipoRefeicao;
  quantidadeServida: number;
  quantidadePlanejada?: number | null;
  observacoes?: string | null;
  escolaId: string;
  escola?: Escola;
  cardapioId?: string | null;
  cardapio?: Pick<Cardapio, "id" | "descricao"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelatorioPnaeEscola {
  escolaId: string;
  nomeEscola: string;
  totalPorTipoRefeicao: Record<string, number>;
  totalRefeicoes: number;
}

export interface RelatorioPnae {
  periodo: { dataInicio: string; dataFim: string };
  escolas: RelatorioPnaeEscola[];
  consolidado: {
    totalRefeicoes: number;
    custoTotalInsumos: number;
    custoMedioPorRefeicao: number;
  };
}

// ==================== INPUTS ====================

export interface CreateCardapioInput {
  data: string;
  turno: TurnoRefeicao;
  tipoRefeicao: TipoRefeicao;
  descricao: string;
  itens?: ItemCardapio[];
  observacoesNutricionais?: string;
  escolaId?: string; // ausente = cardápio da rede
  ativo?: boolean;
}
export type UpdateCardapioInput = Partial<CreateCardapioInput>;

export interface CreateItemEstoqueInput {
  nome: string;
  categoria: CategoriaItemEstoque;
  unidadeMedida: UnidadeMedida;
  estoqueMinimo?: number;
  escolaId: string;
  ativo?: boolean;
}
export type UpdateItemEstoqueInput = Partial<Omit<CreateItemEstoqueInput, "escolaId">>;

export interface CreateMovimentacaoEstoqueInput {
  itemId: string;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number;
  data?: string;
  custoUnitario?: number;
  fornecedor?: string;
  notaFiscal?: string;
  motivo?: string; // obrigatório para PERDA e AJUSTE_*
  registradoPor?: string;
}

export interface CreateRegistroRefeicaoInput {
  data: string;
  turno: TurnoRefeicao;
  tipoRefeicao: TipoRefeicao;
  quantidadeServida: number;
  quantidadePlanejada?: number;
  observacoes?: string;
  escolaId: string;
  cardapioId?: string;
}
export type UpdateRegistroRefeicaoInput = Partial<CreateRegistroRefeicaoInput>;

// ==================== FILTROS ====================

export interface CardapioFilters {
  escolaId?: string;
  turno?: string;
  tipoRefeicao?: string;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
}

export interface ItemEstoqueFilters {
  escolaId?: string;
  categoria?: string;
  ativo?: boolean;
  busca?: string;
}

export interface MovimentacaoEstoqueFilters {
  itemId?: string;
  escolaId?: string;
  tipo?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface RefeicaoFilters {
  escolaId?: string;
  turno?: string;
  tipoRefeicao?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface RelatorioPnaeFilters {
  dataInicio: string;
  dataFim: string;
  escolaId?: string;
}

// addPaginationParams não é exportado de ./api — helper local equivalente
function addPaginationParams(
  params: URLSearchParams,
  pagination?: PaginationParams,
): void {
  if (pagination?.page) params.append("page", pagination.page.toString());
  if (pagination?.limit) params.append("limit", pagination.limit.toString());
}

// ==================== CARDÁPIOS API ====================

export const cardapiosApi = {
  list: (filters?: CardapioFilters, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.turno) params.append("turno", filters.turno);
    if (filters?.tipoRefeicao) params.append("tipoRefeicao", filters.tipoRefeicao);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    if (filters?.ativo !== undefined) params.append("ativo", String(filters.ativo));
    addPaginationParams(params, pagination);
    const queryString = params.toString();
    return pagination
      ? request<PaginatedResponse<Cardapio>>(
          `/api/cardapios${queryString ? `?${queryString}` : ""}`,
        )
      : request<Cardapio[]>(`/api/cardapios${queryString ? `?${queryString}` : ""}`);
  },

  get: (id: string) => request<Cardapio>(`/api/cardapios/${id}`),

  create: (data: CreateCardapioInput) =>
    request<Cardapio>("/api/cardapios", { method: "POST", body: data }),

  update: (id: string, data: UpdateCardapioInput) =>
    request<Cardapio>(`/api/cardapios/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/cardapios/${id}`, { method: "DELETE" }),
};

// ==================== ESTOQUE API ====================

export const estoqueApi = {
  listItens: (filters?: ItemEstoqueFilters) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.categoria) params.append("categoria", filters.categoria);
    if (filters?.ativo !== undefined) params.append("ativo", String(filters.ativo));
    if (filters?.busca) params.append("busca", filters.busca);
    const queryString = params.toString();
    return request<ItemEstoque[]>(
      `/api/estoque/itens${queryString ? `?${queryString}` : ""}`,
    );
  },

  getItem: (id: string) => request<ItemEstoque>(`/api/estoque/itens/${id}`),

  createItem: (data: CreateItemEstoqueInput) =>
    request<ItemEstoque>("/api/estoque/itens", { method: "POST", body: data }),

  updateItem: (id: string, data: UpdateItemEstoqueInput) =>
    request<ItemEstoque>(`/api/estoque/itens/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteItem: (id: string) =>
    request<{ message: string }>(`/api/estoque/itens/${id}`, {
      method: "DELETE",
    }),

  listMovimentacoes: (
    filters?: MovimentacaoEstoqueFilters,
    pagination?: PaginationParams,
  ) => {
    const params = new URLSearchParams();
    if (filters?.itemId) params.append("itemId", filters.itemId);
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    addPaginationParams(params, pagination);
    const queryString = params.toString();
    return pagination
      ? request<PaginatedResponse<MovimentacaoEstoque>>(
          `/api/estoque/movimentacoes${queryString ? `?${queryString}` : ""}`,
        )
      : request<MovimentacaoEstoque[]>(
          `/api/estoque/movimentacoes${queryString ? `?${queryString}` : ""}`,
        );
  },

  createMovimentacao: (data: CreateMovimentacaoEstoqueInput) =>
    request<MovimentacaoEstoque>("/api/estoque/movimentacoes", {
      method: "POST",
      body: data,
    }),

  deleteMovimentacao: (id: string) =>
    request<{ message: string }>(`/api/estoque/movimentacoes/${id}`, {
      method: "DELETE",
    }),

  alertas: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<AlertaEstoque[]>(
      `/api/estoque/alertas${queryString ? `?${queryString}` : ""}`,
    );
  },
};

// ==================== REFEIÇÕES API ====================

export const refeicoesApi = {
  list: (filters?: RefeicaoFilters, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.turno) params.append("turno", filters.turno);
    if (filters?.tipoRefeicao) params.append("tipoRefeicao", filters.tipoRefeicao);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    addPaginationParams(params, pagination);
    const queryString = params.toString();
    return pagination
      ? request<PaginatedResponse<RegistroRefeicao>>(
          `/api/refeicoes${queryString ? `?${queryString}` : ""}`,
        )
      : request<RegistroRefeicao[]>(
          `/api/refeicoes${queryString ? `?${queryString}` : ""}`,
        );
  },

  get: (id: string) => request<RegistroRefeicao>(`/api/refeicoes/${id}`),

  create: (data: CreateRegistroRefeicaoInput) =>
    request<RegistroRefeicao>("/api/refeicoes", { method: "POST", body: data }),

  update: (id: string, data: UpdateRegistroRefeicaoInput) =>
    request<RegistroRefeicao>(`/api/refeicoes/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/refeicoes/${id}`, { method: "DELETE" }),

  relatorioPnae: (filters: RelatorioPnaeFilters) => {
    const params = new URLSearchParams();
    params.append("dataInicio", filters.dataInicio);
    params.append("dataFim", filters.dataFim);
    if (filters.escolaId) params.append("escolaId", filters.escolaId);
    return request<RelatorioPnae>(
      `/api/refeicoes/relatorio-pnae?${params.toString()}`,
    );
  },
};
