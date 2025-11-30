// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = localStorage.getItem("auth_token");

  const config: RequestInit = {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new ApiError(response.status, error.error || "Erro na requisição");
  }

  // Para DELETE que retorna 204
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ==================== AUTH ====================

export interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  escola?: Escola;
  ativo: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (data: {
    email: string;
    password: string;
    nome: string;
    role?: string;
    escolaId?: string;
  }) =>
    request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: data,
    }),

  me: () => request<User>("/api/auth/me"),
};

// ==================== ETAPAS ====================

export interface Serie {
  id: string;
  nome: string;
  ordem: number;
  etapaId: string;
  etapa?: EtapaEnsino;
  createdAt: string;
  updatedAt: string;
}

export interface EtapaEnsino {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  series?: Serie[];
  createdAt: string;
  updatedAt: string;
}

export const etapasApi = {
  list: () => request<EtapaEnsino[]>("/api/etapas"),
  get: (id: string) => request<EtapaEnsino>(`/api/etapas/${id}`),
  create: (data: { nome: string; descricao?: string; ordem: number }) =>
    request<EtapaEnsino>("/api/etapas", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{ nome: string; descricao?: string; ordem: number }>
  ) => request<EtapaEnsino>(`/api/etapas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/etapas/${id}`, { method: "DELETE" }),
};

// ==================== SÉRIES ====================

export const seriesApi = {
  list: () => request<Serie[]>("/api/series"),
  get: (id: string) => request<Serie>(`/api/series/${id}`),
  getByEtapa: (etapaId: string) =>
    request<Serie[]>(`/api/series/etapa/${etapaId}`),
  create: (data: { nome: string; ordem: number; etapaId: string }) =>
    request<Serie>("/api/series", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{ nome: string; ordem: number; etapaId: string }>
  ) => request<Serie>(`/api/series/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/series/${id}`, { method: "DELETE" }),
};

// ==================== ESCOLAS ====================

export interface Escola {
  id: string;
  nome: string;
  codigo: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  quantidadeSalas: number;
  ativo: boolean;
  etapas?: { etapa: EtapaEnsino }[];
  createdAt: string;
  updatedAt: string;
}

export interface EscolaEstatisticas {
  totalTurmas: number;
  totalAlunos: number;
  capacidadeTotal: number;
  ocupacao: number;
}

export const escolasApi = {
  list: () => request<Escola[]>("/api/escolas"),
  get: (id: string) => request<Escola>(`/api/escolas/${id}`),
  getEstatisticas: (id: string) =>
    request<EscolaEstatisticas>(`/api/escolas/${id}/estatisticas`),
  create: (data: {
    nome: string;
    codigo: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    quantidadeSalas?: number;
    ativo?: boolean;
    etapasIds?: string[];
  }) => request<Escola>("/api/escolas", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      codigo: string;
      endereco?: string;
      telefone?: string;
      email?: string;
      quantidadeSalas?: number;
      ativo?: boolean;
      etapasIds?: string[];
    }>
  ) => request<Escola>(`/api/escolas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/escolas/${id}`, { method: "DELETE" }),
};

// ==================== TURMAS ====================

export interface Turma {
  id: string;
  nome: string;
  turno: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
  anoLetivo: number;
  capacidadeMaxima: number;
  limitePCD: number;
  ativo: boolean;
  escolaId: string;
  escola?: Escola;
  serieId: string;
  serie?: Serie & { etapa?: EtapaEnsino };
  matriculas?: Matricula[];
  professores?: {
    profissional: ProfissionalEducacao;
    tipo: string;
    disciplina?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TurmaEstatisticas {
  totalAlunos: number;
  totalPCD: number;
  vagasDisponiveis: number;
  vagasPCDDisponiveis: number;
  ocupacao: number;
  capacidadeMaxima: number;
  limitePCD: number;
}

export const turmasApi = {
  list: (filters?: {
    escolaId?: string;
    anoLetivo?: number;
    ativo?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.anoLetivo)
      params.append("anoLetivo", filters.anoLetivo.toString());
    if (filters?.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());
    const query = params.toString();
    return request<Turma[]>(`/api/turmas${query ? `?${query}` : ""}`);
  },
  get: (id: string) => request<Turma>(`/api/turmas/${id}`),
  getEstatisticas: (id: string) =>
    request<TurmaEstatisticas>(`/api/turmas/${id}/estatisticas`),
  getByEscola: (escolaId: string, anoLetivo?: number) => {
    const params = anoLetivo ? `?anoLetivo=${anoLetivo}` : "";
    return request<Turma[]>(`/api/turmas/escola/${escolaId}${params}`);
  },
  create: (data: {
    nome: string;
    turno: string;
    anoLetivo: number;
    capacidadeMaxima?: number;
    limitePCD?: number;
    escolaId: string;
    serieId: string;
    ativo?: boolean;
  }) => request<Turma>("/api/turmas", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      turno: string;
      anoLetivo: number;
      capacidadeMaxima?: number;
      limitePCD?: number;
      escolaId: string;
      serieId: string;
      ativo?: boolean;
    }>
  ) => request<Turma>(`/api/turmas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/turmas/${id}`, { method: "DELETE" }),
  addAluno: (turmaId: string, matriculaId: string) =>
    request<Matricula>(`/api/turmas/${turmaId}/alunos`, {
      method: "POST",
      body: { matriculaId },
    }),
  removeAluno: (turmaId: string, matriculaId: string) =>
    request<void>(`/api/turmas/${turmaId}/alunos/${matriculaId}`, {
      method: "DELETE",
    }),
  addProfessor: (
    turmaId: string,
    data: { profissionalId: string; tipo: string; disciplina?: string }
  ) =>
    request<unknown>(`/api/turmas/${turmaId}/professores`, {
      method: "POST",
      body: data,
    }),
  removeProfessor: (turmaId: string, profissionalId: string) =>
    request<void>(`/api/turmas/${turmaId}/professores/${profissionalId}`, {
      method: "DELETE",
    }),
};

// ==================== MATRÍCULAS ====================

export interface Matricula {
  id: string;
  numeroMatricula: string;
  anoLetivo: number;
  status: "ATIVA" | "TRANSFERIDA" | "CANCELADA" | "CONCLUIDA";
  dataMatricula: string;
  nomeAluno: string;
  dataNascimento: string;
  cpfAluno?: string;
  rgAluno?: string;
  sexo: "M" | "F";
  naturalidade?: string;
  nacionalidade: string;
  corRaca?: string;
  possuiDeficiencia: boolean;
  tipoDeficiencia?: string;
  nomeResponsavel: string;
  cpfResponsavel?: string;
  telefoneResponsavel?: string;
  emailResponsavel?: string;
  parentesco?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  documentosEntregues?: string;
  observacoes?: string;
  escolaId: string;
  escola?: Escola;
  etapaId: string;
  etapa?: EtapaEnsino;
  turmaId?: string;
  turma?: Turma;
  createdAt: string;
  updatedAt: string;
}

export interface MatriculaEstatisticas {
  total: number;
  ativas: number;
  pcd: number;
  semTurma: number;
  percentualPCD: number;
}

export interface CreateMatriculaData {
  anoLetivo: number;
  nomeAluno: string;
  dataNascimento: string;
  cpfAluno?: string;
  rgAluno?: string;
  sexo: "M" | "F";
  naturalidade?: string;
  nacionalidade?: string;
  corRaca?: string;
  possuiDeficiencia?: boolean;
  tipoDeficiencia?: string;
  nomeResponsavel: string;
  cpfResponsavel?: string;
  telefoneResponsavel?: string;
  emailResponsavel?: string;
  parentesco?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  documentosEntregues?: string;
  observacoes?: string;
  escolaId: string;
  etapaId: string;
  turmaId?: string;
}

export const matriculasApi = {
  list: (filters?: {
    escolaId?: string;
    etapaId?: string;
    turmaId?: string;
    anoLetivo?: number;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.etapaId) params.append("etapaId", filters.etapaId);
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.anoLetivo)
      params.append("anoLetivo", filters.anoLetivo.toString());
    if (filters?.status) params.append("status", filters.status);
    const query = params.toString();
    return request<Matricula[]>(`/api/matriculas${query ? `?${query}` : ""}`);
  },
  get: (id: string) => request<Matricula>(`/api/matriculas/${id}`),
  getByNumero: (numero: string) =>
    request<Matricula>(`/api/matriculas/numero/${numero}`),
  getSemTurma: (escolaId?: string, anoLetivo?: number) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    if (anoLetivo) params.append("anoLetivo", anoLetivo.toString());
    const query = params.toString();
    return request<Matricula[]>(
      `/api/matriculas/sem-turma${query ? `?${query}` : ""}`
    );
  },
  getEstatisticas: (anoLetivo: number, escolaId?: string) => {
    const params = new URLSearchParams({ anoLetivo: anoLetivo.toString() });
    if (escolaId) params.append("escolaId", escolaId);
    return request<MatriculaEstatisticas>(
      `/api/matriculas/estatisticas?${params}`
    );
  },
  create: (data: CreateMatriculaData) =>
    request<Matricula>("/api/matriculas", { method: "POST", body: data }),
  update: (id: string, data: Partial<CreateMatriculaData>) =>
    request<Matricula>(`/api/matriculas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/matriculas/${id}`, { method: "DELETE" }),
  cancelar: (id: string) =>
    request<Matricula>(`/api/matriculas/${id}/cancelar`, { method: "PATCH" }),
  transferir: (id: string, escolaId: string, turmaId?: string) =>
    request<Matricula>(`/api/matriculas/${id}/transferir`, {
      method: "PATCH",
      body: { escolaId, turmaId },
    }),
};

// ==================== PROFISSIONAIS ====================

export interface ProfissionalEducacao {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  tipo: "PROFESSOR" | "AUXILIAR" | "COORDENADOR" | "DIRETOR";
  formacao?: string;
  especialidade?: string;
  matricula?: string;
  ativo: boolean;
  escolas?: { escola: Escola }[];
  turmas?: { turma: Turma; tipo: string; disciplina?: string }[];
  createdAt: string;
  updatedAt: string;
}

export const profissionaisApi = {
  list: (filters?: { tipo?: string; ativo?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());
    const query = params.toString();
    return request<ProfissionalEducacao[]>(
      `/api/profissionais${query ? `?${query}` : ""}`
    );
  },
  get: (id: string) =>
    request<ProfissionalEducacao>(`/api/profissionais/${id}`),
  getByEscola: (escolaId: string) =>
    request<ProfissionalEducacao[]>(`/api/profissionais/escola/${escolaId}`),
  create: (data: {
    nome: string;
    cpf: string;
    email?: string;
    telefone?: string;
    tipo: string;
    formacao?: string;
    especialidade?: string;
    matricula?: string;
    ativo?: boolean;
    escolasIds?: string[];
  }) =>
    request<ProfissionalEducacao>("/api/profissionais", {
      method: "POST",
      body: data,
    }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      cpf: string;
      email?: string;
      telefone?: string;
      tipo: string;
      formacao?: string;
      especialidade?: string;
      matricula?: string;
      ativo?: boolean;
      escolasIds?: string[];
    }>
  ) =>
    request<ProfissionalEducacao>(`/api/profissionais/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<void>(`/api/profissionais/${id}`, { method: "DELETE" }),
  vincularEscola: (
    profissionalId: string,
    escolaId: string,
    funcao?: string,
    cargaHoraria?: number
  ) =>
    request<unknown>(`/api/profissionais/${profissionalId}/escolas`, {
      method: "POST",
      body: { escolaId, funcao, cargaHoraria },
    }),
  desvincularEscola: (profissionalId: string, escolaId: string) =>
    request<void>(`/api/profissionais/${profissionalId}/escolas/${escolaId}`, {
      method: "DELETE",
    }),
};

// Health check
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>("/health"),
};

// ==================== MÓDULOS ====================

export interface SubModule {
  id: string;
  name: string;
  description: string;
  status: "planning" | "in-progress" | "completed" | "blocked";
  ordem: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  phase: number;
  status: "planning" | "in-progress" | "completed" | "blocked";
  progress: number;
  ordem: number;
  subModules: SubModule[];
  createdAt: string;
  updatedAt: string;
}

export const modulesApi = {
  list: () => request<Module[]>("/api/modules"),
  get: (id: string) => request<Module>(`/api/modules/${id}`),
  create: (data: {
    name: string;
    description: string;
    icon?: string;
    phase?: number;
    status?: string;
    progress?: number;
    ordem?: number;
  }) => request<Module>("/api/modules", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      icon: string;
      phase: number;
      status: string;
      progress: number;
      ordem: number;
    }>
  ) => request<Module>(`/api/modules/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/modules/${id}`, { method: "DELETE" }),
  // SubModules
  createSubModule: (
    moduleId: string,
    data: { name: string; description: string; status?: string; ordem?: number }
  ) =>
    request<SubModule>(`/api/modules/${moduleId}/submodules`, {
      method: "POST",
      body: data,
    }),
  updateSubModule: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      status: string;
      ordem: number;
    }>
  ) =>
    request<SubModule>(`/api/modules/submodules/${id}`, {
      method: "PUT",
      body: data,
    }),
  deleteSubModule: (id: string) =>
    request<void>(`/api/modules/submodules/${id}`, { method: "DELETE" }),
  toggleSubModuleStatus: (id: string) =>
    request<SubModule>(`/api/modules/submodules/${id}/toggle`, {
      method: "PATCH",
    }),
};

// ==================== PHASES (CRONOGRAMA) ====================

export interface Phase {
  id: string;
  name: string;
  description: string;
  monthRange: string;
  duration: string;
  ordem: number;
  status: "planning" | "in-progress" | "completed" | "blocked";
  moduleIds: string[]; // IDs dos módulos relacionados
  createdAt: string;
  updatedAt: string;
}

export const phasesApi = {
  list: () => request<Phase[]>("/api/phases"),
  get: (id: string) => request<Phase>(`/api/phases/${id}`),
  create: (data: {
    name: string;
    description: string;
    monthRange: string;
    duration: string;
    ordem?: number;
    status?: string;
    moduleIds?: string[];
  }) => request<Phase>("/api/phases", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      monthRange: string;
      duration: string;
      ordem: number;
      status: string;
      moduleIds: string[];
    }>
  ) => request<Phase>(`/api/phases/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/phases/${id}`, { method: "DELETE" }),
};

export { ApiError };
