// ==================== MÓDULO 7 — TRANSPORTE ESCOLAR ====================
// Camada de API do módulo de transporte (rotas, frota, motoristas, manutenção)

import {
  request,
  PaginatedResponse,
  PaginationParams,
} from "./api";

// ==================== TIPOS ====================

export type TurnoTransporte = "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";

export interface ManutencaoVeiculo {
  id: string;
  tipo:
    | "PREVENTIVA"
    | "CORRETIVA"
    | "REVISAO"
    | "TROCA_OLEO"
    | "PNEUS"
    | "FREIOS"
    | "OUTRA";
  descricao: string;
  dataAgendada: string;
  dataRealizada?: string | null;
  custo?: number | null;
  kmRegistrado?: number | null;
  oficina?: string | null;
  status: "AGENDADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  observacoes?: string | null;
  veiculoId: string;
  veiculo?: {
    id: string;
    placa: string;
    tipo: string;
    modelo?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  tipo: "ONIBUS" | "MICRO_ONIBUS" | "VAN" | "KOMBI" | "LANCHA" | "OUTRO";
  marca?: string | null;
  modelo?: string | null;
  anoFabricacao?: number | null;
  capacidade: number;
  renavam?: string | null;
  chassi?: string | null;
  tipoPropriedade: "PROPRIO" | "TERCEIRIZADO" | "CEDIDO";
  adaptadoPCD: boolean;
  vencimentoLicenciamento?: string | null;
  vencimentoSeguro?: string | null;
  vencimentoVistoria?: string | null;
  ativo: boolean;
  manutencoes?: ManutencaoVeiculo[];
  rotas?: RotaTransporte[];
  createdAt: string;
  updatedAt: string;
}

export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string | null;
  cnhNumero: string;
  cnhCategoria: "D" | "E";
  cnhValidade: string;
  cursoTransporteEscolar: boolean;
  vencimentoCursoTransporte?: string | null;
  vinculo: "EFETIVO" | "CONTRATADO" | "TERCEIRIZADO";
  ativo: boolean;
  rotas?: RotaTransporte[];
  createdAt: string;
  updatedAt: string;
}

export interface RotaTransporte {
  id: string;
  nome: string;
  codigo: string;
  turno: TurnoTransporte;
  tipo: "RURAL" | "URBANA" | "FLUVIAL";
  itinerario: string;
  kmDiario?: number | null;
  horarioSaida?: string | null;
  horarioRetorno?: string | null;
  ativo: boolean;
  veiculoId?: string | null;
  veiculo?: Veiculo | null;
  motoristaId?: string | null;
  motorista?: Motorista | null;
  escolas?: {
    id: string;
    escolaId: string;
    escola: { id: string; nome: string };
  }[];
  alunos?: {
    id: string;
    pontoEmbarque?: string | null;
    matriculaId: string;
    matricula: {
      id: string;
      nomeAluno: string;
      numeroMatricula: string;
      escolaId?: string;
    };
  }[];
  _count?: { alunos: number };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentoVencendo {
  documento: string;
  vencimento: string;
  vencido: boolean;
}

export interface AlertaVencimentoVeiculo {
  veiculo: Veiculo;
  documentosVencendo: DocumentoVencendo[];
}

export interface AlertaCnhMotorista {
  motorista: Motorista;
  documentosVencendo: DocumentoVencendo[];
}

export interface CustoPorVeiculo {
  veiculoId: string;
  veiculo: {
    id: string;
    placa: string;
    tipo: string;
    modelo?: string | null;
  } | null;
  totalManutencoes: number;
  custoTotal: number;
}

// ==================== HELPERS ====================

function addPaginationParams(
  params: URLSearchParams,
  pagination?: PaginationParams,
): void {
  if (pagination?.page) params.append("page", pagination.page.toString());
  if (pagination?.limit) params.append("limit", pagination.limit.toString());
}

// ==================== VEÍCULOS ====================

export const veiculosApi = {
  list: (filters?: {
    tipo?: string;
    ativo?: boolean;
    tipoPropriedade?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.ativo !== undefined)
      params.append("ativo", String(filters.ativo));
    if (filters?.tipoPropriedade)
      params.append("tipoPropriedade", filters.tipoPropriedade);

    const queryString = params.toString();
    return request<Veiculo[]>(
      `/api/veiculos${queryString ? `?${queryString}` : ""}`,
    );
  },

  get: (id: string) => request<Veiculo>(`/api/veiculos/${id}`),

  create: (data: Partial<Veiculo>) =>
    request<Veiculo>("/api/veiculos", { method: "POST", body: data }),

  update: (id: string, data: Partial<Veiculo>) =>
    request<Veiculo>(`/api/veiculos/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/veiculos/${id}`, { method: "DELETE" }),

  alertasVencimento: (dias?: number) => {
    const params = new URLSearchParams();
    if (dias) params.append("dias", dias.toString());
    const queryString = params.toString();
    return request<AlertaVencimentoVeiculo[]>(
      `/api/veiculos/alertas-vencimento${queryString ? `?${queryString}` : ""}`,
    );
  },
};

// ==================== MOTORISTAS ====================

export const motoristasApi = {
  list: (filters?: { ativo?: boolean; vinculo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.ativo !== undefined)
      params.append("ativo", String(filters.ativo));
    if (filters?.vinculo) params.append("vinculo", filters.vinculo);

    const queryString = params.toString();
    return request<Motorista[]>(
      `/api/motoristas${queryString ? `?${queryString}` : ""}`,
    );
  },

  get: (id: string) => request<Motorista>(`/api/motoristas/${id}`),

  create: (data: Partial<Motorista>) =>
    request<Motorista>("/api/motoristas", { method: "POST", body: data }),

  update: (id: string, data: Partial<Motorista>) =>
    request<Motorista>(`/api/motoristas/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/motoristas/${id}`, {
      method: "DELETE",
    }),

  alertasCnh: (dias?: number) => {
    const params = new URLSearchParams();
    if (dias) params.append("dias", dias.toString());
    const queryString = params.toString();
    return request<AlertaCnhMotorista[]>(
      `/api/motoristas/alertas-cnh${queryString ? `?${queryString}` : ""}`,
    );
  },
};

// ==================== ROTAS DE TRANSPORTE ====================

export const rotasTransporteApi = {
  list: (filters?: {
    turno?: string;
    tipo?: string;
    escolaId?: string;
    ativo?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.turno) params.append("turno", filters.turno);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.ativo !== undefined)
      params.append("ativo", String(filters.ativo));

    const queryString = params.toString();
    return request<RotaTransporte[]>(
      `/api/rotas-transporte${queryString ? `?${queryString}` : ""}`,
    );
  },

  get: (id: string) => request<RotaTransporte>(`/api/rotas-transporte/${id}`),

  create: (data: Partial<RotaTransporte>) =>
    request<RotaTransporte>("/api/rotas-transporte", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<RotaTransporte>) =>
    request<RotaTransporte>(`/api/rotas-transporte/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/rotas-transporte/${id}`, {
      method: "DELETE",
    }),

  vincularEscola: (id: string, escolaId: string) =>
    request<{ id: string; escolaId: string }>(
      `/api/rotas-transporte/${id}/escolas`,
      { method: "POST", body: { escolaId } },
    ),

  desvincularEscola: (id: string, escolaId: string) =>
    request<{ message: string }>(
      `/api/rotas-transporte/${id}/escolas/${escolaId}`,
      { method: "DELETE" },
    ),

  vincularAluno: (
    id: string,
    data: { matriculaId: string; pontoEmbarque?: string },
  ) =>
    request<{ id: string; matriculaId: string }>(
      `/api/rotas-transporte/${id}/alunos`,
      { method: "POST", body: data },
    ),

  desvincularAluno: (id: string, matriculaId: string) =>
    request<{ message: string }>(
      `/api/rotas-transporte/${id}/alunos/${matriculaId}`,
      { method: "DELETE" },
    ),
};

// ==================== MANUTENÇÕES ====================

export const manutencoesApi = {
  list: (
    filters?: {
      veiculoId?: string;
      status?: string;
      tipo?: string;
      dataInicio?: string;
      dataFim?: string;
    },
    pagination?: PaginationParams,
  ) => {
    const params = new URLSearchParams();
    if (filters?.veiculoId) params.append("veiculoId", filters.veiculoId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    addPaginationParams(params, pagination);

    const queryString = params.toString();
    return pagination
      ? request<PaginatedResponse<ManutencaoVeiculo>>(
          `/api/manutencoes${queryString ? `?${queryString}` : ""}`,
        )
      : request<ManutencaoVeiculo[]>(
          `/api/manutencoes${queryString ? `?${queryString}` : ""}`,
        );
  },

  get: (id: string) => request<ManutencaoVeiculo>(`/api/manutencoes/${id}`),

  create: (data: Partial<ManutencaoVeiculo>) =>
    request<ManutencaoVeiculo>("/api/manutencoes", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<ManutencaoVeiculo>) =>
    request<ManutencaoVeiculo>(`/api/manutencoes/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/manutencoes/${id}`, {
      method: "DELETE",
    }),

  custosPorVeiculo: (filters?: { dataInicio?: string; dataFim?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    const queryString = params.toString();
    return request<CustoPorVeiculo[]>(
      `/api/manutencoes/custos-por-veiculo${queryString ? `?${queryString}` : ""}`,
    );
  },
};
