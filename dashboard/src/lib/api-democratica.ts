// Camada de API do Módulo 8 — Gestão Democrática
// (colegiado escolar, grêmio estudantil, líderes de turma, reuniões/assembleias)
import {
  request,
  type PaginatedResponse,
  type PaginationParams,
} from "./api";

// ==================== TIPOS ====================

export type SegmentoDemocratico =
  | "PROFESSOR"
  | "PAI_RESPONSAVEL"
  | "ALUNO"
  | "FUNCIONARIO"
  | "COMUNIDADE"
  | "DIRECAO";

export interface ColegiadoEscolar {
  id: string;
  nome: string;
  dataInicioMandato: string;
  dataFimMandato: string;
  ativo: boolean;
  escolaId: string;
  escola?: { id: string; nome: string };
  membros?: MembroColegiado[];
  reunioes?: ReuniaoDemocratica[];
  _count?: { membros: number };
  createdAt: string;
  updatedAt: string;
}

export interface MembroColegiado {
  id: string;
  nome: string;
  segmento: SegmentoDemocratico;
  cargo:
    | "PRESIDENTE"
    | "VICE_PRESIDENTE"
    | "SECRETARIO"
    | "TESOUREIRO"
    | "TITULAR"
    | "SUPLENTE";
  ativo: boolean;
  colegiadoId: string;
  profissionalId?: string | null;
  matriculaId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GremioEstudantil {
  id: string;
  nome: string;
  anoLetivo: number;
  status: "EM_ELEICAO" | "ATIVO" | "INATIVO";
  dataFundacao?: string | null;
  escolaId: string;
  escola?: { id: string; nome: string };
  chapas?: ChapaGremio[];
  atividades?: AtividadeGremio[];
  _count?: { chapas: number; atividades: number };
  createdAt: string;
  updatedAt: string;
}

export interface MembroChapa {
  nome: string;
  matriculaId?: string;
  cargo: "PRESIDENTE" | "VICE" | "SECRETARIO" | "TESOUREIRO" | "MEMBRO";
}

export interface ChapaGremio {
  id: string;
  nome: string;
  numero: number;
  membros?: MembroChapa[] | null;
  votosRecebidos?: number | null;
  eleita: boolean;
  gremioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AtividadeGremio {
  id: string;
  titulo: string;
  tipo: "PROJETO" | "EVENTO" | "CAMPANHA" | "REUNIAO" | "OUTRA";
  descricao?: string | null;
  dataInicio: string;
  dataFim?: string | null;
  status: "PLANEJADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  resultado?: string | null;
  gremioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiderTurma {
  id: string;
  anoLetivo: number;
  tipo: "LIDER" | "VICE_LIDER";
  formaEscolha: "ELEICAO" | "INDICACAO" | "VOLUNTARIO";
  dataEscolha?: string | null;
  ativo: boolean;
  turmaId: string;
  turma?: { id: string; nome: string; turno: string };
  matriculaId: string;
  matricula?: { id: string; nomeAluno: string; numeroMatricula: string };
  createdAt: string;
  updatedAt: string;
}

export interface ItemPauta {
  item: string;
  descricao?: string;
}

export interface DecisaoReuniao {
  descricao: string;
  votosFavor?: number;
  votosContra?: number;
  abstencoes?: number;
}

export interface PresencaReuniaoDemocratica {
  id: string;
  nome: string;
  segmento?: SegmentoDemocratico | null;
  presente: boolean;
  reuniaoId: string;
  createdAt: string;
}

export interface ReuniaoDemocratica {
  id: string;
  titulo: string;
  orgao: "COLEGIADO" | "GREMIO" | "ASSEMBLEIA_GERAL" | "OUTRO";
  data: string;
  horario: string;
  local?: string | null;
  pauta?: ItemPauta[] | null;
  ata?: string | null;
  decisoes?: DecisaoReuniao[] | null;
  status: "AGENDADA" | "REALIZADA" | "CANCELADA";
  escolaId: string;
  escola?: { id: string; nome: string };
  colegiadoId?: string | null;
  colegiado?: { id: string; nome: string } | null;
  presencas?: PresencaReuniaoDemocratica[];
  _count?: { presencas: number };
  createdAt: string;
  updatedAt: string;
}

// ==================== COLEGIADOS ====================

export const colegiadosApi = {
  list: (filters?: { escolaId?: string; ativo?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());
    const query = params.toString();
    return request<ColegiadoEscolar[]>(
      `/api/colegiados${query ? `?${query}` : ""}`,
    );
  },
  get: (id: string) => request<ColegiadoEscolar>(`/api/colegiados/${id}`),
  create: (data: {
    nome?: string;
    escolaId: string;
    dataInicioMandato: string;
    dataFimMandato: string;
    ativo?: boolean;
  }) => request<ColegiadoEscolar>("/api/colegiados", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      dataInicioMandato: string;
      dataFimMandato: string;
      ativo: boolean;
    }>,
  ) =>
    request<ColegiadoEscolar>(`/api/colegiados/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/colegiados/${id}`, { method: "DELETE" }),
  addMembro: (
    id: string,
    data: {
      nome: string;
      segmento: SegmentoDemocratico;
      cargo?: MembroColegiado["cargo"];
      profissionalId?: string;
      matriculaId?: string;
      ativo?: boolean;
    },
  ) =>
    request<MembroColegiado>(`/api/colegiados/${id}/membros`, {
      method: "POST",
      body: data,
    }),
  updateMembro: (
    membroId: string,
    data: Partial<{
      nome: string;
      segmento: SegmentoDemocratico;
      cargo: MembroColegiado["cargo"];
      profissionalId: string;
      matriculaId: string;
      ativo: boolean;
    }>,
  ) =>
    request<MembroColegiado>(`/api/colegiados/membros/${membroId}`, {
      method: "PUT",
      body: data,
    }),
  removeMembro: (membroId: string) =>
    request<{ message: string }>(`/api/colegiados/membros/${membroId}`, {
      method: "DELETE",
    }),
};

// ==================== GRÊMIOS ====================

export const gremiosApi = {
  list: (filters?: { escolaId?: string; anoLetivo?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.anoLetivo)
      params.append("anoLetivo", filters.anoLetivo.toString());
    if (filters?.status) params.append("status", filters.status);
    const query = params.toString();
    return request<GremioEstudantil[]>(`/api/gremios${query ? `?${query}` : ""}`);
  },
  get: (id: string) => request<GremioEstudantil>(`/api/gremios/${id}`),
  create: (data: {
    nome: string;
    escolaId: string;
    anoLetivo: number;
    status?: GremioEstudantil["status"];
    dataFundacao?: string;
  }) => request<GremioEstudantil>("/api/gremios", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      anoLetivo: number;
      status: GremioEstudantil["status"];
      dataFundacao: string;
    }>,
  ) => request<GremioEstudantil>(`/api/gremios/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/gremios/${id}`, { method: "DELETE" }),
  addChapa: (
    id: string,
    data: { nome: string; numero: number; membros?: MembroChapa[] },
  ) =>
    request<ChapaGremio>(`/api/gremios/${id}/chapas`, {
      method: "POST",
      body: data,
    }),
  updateChapa: (
    chapaId: string,
    data: Partial<{ nome: string; numero: number; membros: MembroChapa[] }>,
  ) =>
    request<ChapaGremio>(`/api/gremios/chapas/${chapaId}`, {
      method: "PUT",
      body: data,
    }),
  deleteChapa: (chapaId: string) =>
    request<{ message: string }>(`/api/gremios/chapas/${chapaId}`, {
      method: "DELETE",
    }),
  apurarEleicao: (
    id: string,
    resultados: { chapaId: string; votosRecebidos: number }[],
  ) =>
    request<GremioEstudantil>(`/api/gremios/${id}/apurar-eleicao`, {
      method: "POST",
      body: { resultados },
    }),
  addAtividade: (
    id: string,
    data: {
      titulo: string;
      tipo: AtividadeGremio["tipo"];
      descricao?: string;
      dataInicio: string;
      dataFim?: string;
      status?: AtividadeGremio["status"];
      resultado?: string;
    },
  ) =>
    request<AtividadeGremio>(`/api/gremios/${id}/atividades`, {
      method: "POST",
      body: data,
    }),
  updateAtividade: (
    atividadeId: string,
    data: Partial<{
      titulo: string;
      tipo: AtividadeGremio["tipo"];
      descricao: string;
      dataInicio: string;
      dataFim: string;
      status: AtividadeGremio["status"];
      resultado: string;
    }>,
  ) =>
    request<AtividadeGremio>(`/api/gremios/atividades/${atividadeId}`, {
      method: "PUT",
      body: data,
    }),
  deleteAtividade: (atividadeId: string) =>
    request<{ message: string }>(`/api/gremios/atividades/${atividadeId}`, {
      method: "DELETE",
    }),
};

// ==================== LÍDERES DE TURMA ====================

export const lideresTurmaApi = {
  list: (filters?: {
    turmaId?: string;
    anoLetivo?: number;
    escolaId?: string;
    ativo?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.anoLetivo)
      params.append("anoLetivo", filters.anoLetivo.toString());
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());
    const query = params.toString();
    return request<LiderTurma[]>(`/api/lideres-turma${query ? `?${query}` : ""}`);
  },
  get: (id: string) => request<LiderTurma>(`/api/lideres-turma/${id}`),
  create: (data: {
    turmaId: string;
    matriculaId: string;
    anoLetivo: number;
    tipo: LiderTurma["tipo"];
    formaEscolha?: LiderTurma["formaEscolha"];
    dataEscolha?: string;
  }) => request<LiderTurma>("/api/lideres-turma", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      formaEscolha: LiderTurma["formaEscolha"];
      dataEscolha: string;
      ativo: boolean;
    }>,
  ) =>
    request<LiderTurma>(`/api/lideres-turma/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/lideres-turma/${id}`, {
      method: "DELETE",
    }),
};

// ==================== REUNIÕES DEMOCRÁTICAS ====================

export interface ReuniaoDemocraticaFilters {
  escolaId?: string;
  orgao?: string;
  status?: string;
  colegiadoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const reunioesDemocraticasApi = {
  list: (filters?: ReuniaoDemocraticaFilters, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.orgao) params.append("orgao", filters.orgao);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.colegiadoId) params.append("colegiadoId", filters.colegiadoId);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.limit) params.append("limit", pagination.limit.toString());

    const query = params.toString();
    return pagination
      ? request<PaginatedResponse<ReuniaoDemocratica>>(
          `/api/reunioes-democraticas${query ? `?${query}` : ""}`,
        )
      : request<ReuniaoDemocratica[]>(
          `/api/reunioes-democraticas${query ? `?${query}` : ""}`,
        );
  },
  get: (id: string) =>
    request<ReuniaoDemocratica>(`/api/reunioes-democraticas/${id}`),
  create: (data: {
    titulo: string;
    orgao: ReuniaoDemocratica["orgao"];
    data: string;
    horario: string;
    local?: string;
    pauta?: ItemPauta[];
    escolaId: string;
    colegiadoId?: string;
  }) =>
    request<ReuniaoDemocratica>("/api/reunioes-democraticas", {
      method: "POST",
      body: data,
    }),
  update: (
    id: string,
    data: Partial<{
      titulo: string;
      orgao: ReuniaoDemocratica["orgao"];
      data: string;
      horario: string;
      local: string;
      pauta: ItemPauta[];
      escolaId: string;
      colegiadoId: string;
    }>,
  ) =>
    request<ReuniaoDemocratica>(`/api/reunioes-democraticas/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/reunioes-democraticas/${id}`, {
      method: "DELETE",
    }),
  registrarAta: (
    id: string,
    data: {
      ata: string;
      decisoes?: DecisaoReuniao[];
      presencas?: {
        nome: string;
        segmento?: SegmentoDemocratico;
        presente?: boolean;
      }[];
    },
  ) =>
    request<ReuniaoDemocratica>(
      `/api/reunioes-democraticas/${id}/registrar-ata`,
      { method: "PATCH", body: data },
    ),
  cancelar: (id: string) =>
    request<ReuniaoDemocratica>(`/api/reunioes-democraticas/${id}/cancelar`, {
      method: "PATCH",
    }),
};
