// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

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

  // Infraestrutura - Áreas comuns
  possuiPatio?: boolean;
  possuiParque?: boolean;
  possuiQuadra?: boolean;
  quadraCoberta?: boolean;
  possuiBiblioteca?: boolean;
  possuiRefeitorio?: boolean;
  possuiSalaProfessores?: boolean;
  possuiSecretaria?: boolean;
  possuiDiretoria?: boolean;
  possuiAlmoxarifado?: boolean;
  possuiCozinha?: boolean;
  possuiDispensa?: boolean;

  // Infraestrutura - Banheiros
  qtdBanheirosAlunos?: number;
  qtdBanheirosAlunas?: number;
  qtdBanheirosAdaptados?: number;
  qtdBanheirosFuncionarios?: number;

  // Infraestrutura - Tecnologia
  possuiInternet?: boolean;
  tipoInternet?: string | null;
  velocidadeInternet?: string | null;
  possuiSalaInformatica?: boolean;
  qtdComputadores?: number;
  possuiProjetores?: boolean;
  qtdProjetores?: number;

  // Infraestrutura - Acessibilidade
  possuiRampaAcesso?: boolean;
  possuiElevador?: boolean;
  possuiPisoTatil?: boolean;
  possuiSinalizacaoBraile?: boolean;

  // Relacionamentos
  salas?: Sala[];

  createdAt: string;
  updatedAt: string;
}

// ==================== SALAS ====================

export type TipoSala =
  | "AULA"
  | "INFORMATICA"
  | "LEITURA"
  | "LABORATORIO"
  | "MULTIUSO"
  | "AEE";

export interface Sala {
  id: string;
  nome: string;
  tipo: TipoSala;
  capacidade: number;
  possuiArCondicionado: boolean;
  possuiVentilador: boolean;
  possuiTV: boolean;
  possuiProjetor: boolean;
  possuiQuadro: boolean;
  metragem?: number | null;
  andar: number;
  acessivel: boolean;
  ativo: boolean;
  observacoes?: string | null;
  escolaId: string;
  escola?: Escola;
  createdAt: string;
  updatedAt: string;
}

export interface SalasEstatisticas {
  totalSalas: number;
  salasAula: number;
  salasInformatica: number;
  salasLeitura: number;
  laboratorios: number;
  salasMultiuso: number;
  salasAEE: number;
  capacidadeTotal: number;
  salasComArCondicionado: number;
  salasComProjetor: number;
  salasAcessiveis: number;
}

export const salasApi = {
  listByEscola: (escolaId: string) =>
    request<Sala[]>(`/api/escolas/${escolaId}/salas`),
  get: (id: string) => request<Sala>(`/api/salas/${id}`),
  getEstatisticas: (escolaId: string) =>
    request<SalasEstatisticas>(`/api/escolas/${escolaId}/salas/estatisticas`),
  create: (
    escolaId: string,
    data: {
      nome: string;
      tipo: TipoSala;
      capacidade?: number;
      possuiArCondicionado?: boolean;
      possuiVentilador?: boolean;
      possuiTV?: boolean;
      possuiProjetor?: boolean;
      possuiQuadro?: boolean;
      metragem?: number | null;
      andar?: number;
      acessivel?: boolean;
      observacoes?: string | null;
      ativo?: boolean;
    }
  ) =>
    request<Sala>(`/api/escolas/${escolaId}/salas`, {
      method: "POST",
      body: data,
    }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      tipo: TipoSala;
      capacidade: number;
      possuiArCondicionado: boolean;
      possuiVentilador: boolean;
      possuiTV: boolean;
      possuiProjetor: boolean;
      possuiQuadro: boolean;
      metragem: number | null;
      andar: number;
      acessivel: boolean;
      observacoes: string | null;
      ativo: boolean;
    }>
  ) =>
    request<Sala>(`/api/salas/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<void>(`/api/salas/${id}`, { method: "DELETE" }),
};

export interface EscolaEstatisticas {
  totalTurmas: number;
  totalAlunos: number;
  capacidadeTotal: number;
  ocupacao: number;
}

export type EscolaInfraestruturaUpdate = Partial<{
  possuiPatio: boolean;
  possuiParque: boolean;
  possuiQuadra: boolean;
  quadraCoberta: boolean;
  possuiBiblioteca: boolean;
  possuiRefeitorio: boolean;
  possuiSalaProfessores: boolean;
  possuiSecretaria: boolean;
  possuiDiretoria: boolean;
  possuiAlmoxarifado: boolean;
  possuiCozinha: boolean;
  possuiDispensa: boolean;
  qtdBanheirosAlunos: number;
  qtdBanheirosAlunas: number;
  qtdBanheirosAdaptados: number;
  qtdBanheirosFuncionarios: number;
  possuiInternet: boolean;
  tipoInternet: string | null;
  velocidadeInternet: string | null;
  possuiSalaInformatica: boolean;
  qtdComputadores: number;
  possuiProjetores: boolean;
  qtdProjetores: number;
  possuiRampaAcesso: boolean;
  possuiElevador: boolean;
  possuiPisoTatil: boolean;
  possuiSinalizacaoBraile: boolean;
}>;

export const escolasApi = {
  list: () => request<Escola[]>("/api/escolas"),
  get: (id: string) => request<Escola>(`/api/escolas/${id}`),
  getEstatisticas: (id: string) =>
    request<EscolaEstatisticas>(`/api/escolas/${id}/estatisticas`),
  create: (
    data: {
      nome: string;
      codigo: string;
      endereco?: string;
      telefone?: string;
      email?: string;
      quantidadeSalas?: number;
      ativo?: boolean;
      etapasIds?: string[];
    } & EscolaInfraestruturaUpdate
  ) => request<Escola>("/api/escolas", { method: "POST", body: data }),
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
    }> &
      EscolaInfraestruturaUpdate
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

export interface GradeHorario {
  id: string;
  turmaId: string;
  diaSemana: "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA" | "SABADO";
  horaInicio: string;
  horaFim: string;
  disciplina: string;
  observacoes?: string;
  profissionalId?: string | null;
  profissional?: ProfissionalEducacao | null;
  turma?: Turma;
  createdAt: string;
  updatedAt: string;
}

export interface CargaHorariaResumo {
  profissionalId: string;
  profissionalNome: string;
  totalAulas: number;
  totalMinutos: number;
}

export interface CargaHorariaEscolaResumo {
  escolaId: string;
  escolaNome: string;
  totalAulas: number;
  totalMinutos: number;
}

export interface CargaHorariaTurmaResumo {
  turmaId: string;
  turmaNome: string;
  escolaNome: string;
  totalAulas: number;
  totalMinutos: number;
}

export interface VagasResumoEscola {
  escolaId: string;
  escolaNome: string;
  totalTurmas: number;
  capacidadeTotal: number;
  alunosTotal: number;
  pcdTotal: number;
  vagasDisponiveis: number;
  vagasPCDDisponiveis: number;
  turmasLotadas: number;
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
  getVagasResumo: (escolaId?: string, anoLetivo?: number) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    if (anoLetivo) params.append("anoLetivo", anoLetivo.toString());
    const query = params.toString();
    return request<VagasResumoEscola[]>(
      `/api/turmas/relatorios/vagas${query ? `?${query}` : ""}`
    );
  },
};

// ==================== GRADE HORÁRIA ====================

export const gradeHorariaApi = {
  list: (filters?: { turmaId?: string; profissionalId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.profissionalId)
      params.append("profissionalId", filters.profissionalId);
    const query = params.toString();
    return request<GradeHorario[]>(
      `/api/grade-horaria${query ? `?${query}` : ""}`
    );
  },
  get: (id: string) => request<GradeHorario>(`/api/grade-horaria/${id}`),
  create: (data: {
    turmaId: string;
    diaSemana: GradeHorario["diaSemana"];
    horaInicio: string;
    horaFim: string;
    disciplina: string;
    profissionalId?: string;
    observacoes?: string;
  }) => request<GradeHorario>("/api/grade-horaria", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      turmaId: string;
      diaSemana: GradeHorario["diaSemana"];
      horaInicio: string;
      horaFim: string;
      disciplina: string;
      profissionalId?: string;
      observacoes?: string;
    }>
  ) => request<GradeHorario>(`/api/grade-horaria/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/grade-horaria/${id}`, { method: "DELETE" }),
  getCargaResumo: (profissionalId?: string) => {
    const params = new URLSearchParams();
    if (profissionalId) params.append("profissionalId", profissionalId);
    const query = params.toString();
    return request<CargaHorariaResumo[]>(
      `/api/grade-horaria/relatorios/carga${query ? `?${query}` : ""}`
    );
  },
  getCargaResumoPorEscola: () =>
    request<CargaHorariaEscolaResumo[]>(
      "/api/grade-horaria/relatorios/escola"
    ),
  getCargaResumoPorTurma: () =>
    request<CargaHorariaTurmaResumo[]>(
      "/api/grade-horaria/relatorios/turma"
    ),
};

// ==================== MATRÍCULAS ====================

export interface Matricula {
  id: string;
  numeroMatricula: string;
  anoLetivo: number;
  status:
    | "ATIVA"
    | "TRANSFERIDA"
    | "CANCELADA"
    | "CONCLUIDA"
    | "AGUARDANDO_VAGA";
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
  // Saude
  tipoSanguineo?: string;
  alergias?: string;
  medicamentos?: string;
  condicoesSaude?: string;
  planoSaude?: string;
  numeroCartaoSUS?: string;
  // Emergencia
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
  contatoEmergenciaParentesco?: string;
  // Autorizacoes
  autorizacaoImagem: boolean;
  autorizacaoSaida: boolean;
  pessoasAutorizadasRetirar?: string;
  // Relacionamentos
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
  status?: "ATIVA" | "TRANSFERIDA" | "CANCELADA" | "CONCLUIDA" | "AGUARDANDO_VAGA";
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
  // Saude
  tipoSanguineo?: string;
  alergias?: string;
  medicamentos?: string;
  condicoesSaude?: string;
  planoSaude?: string;
  numeroCartaoSUS?: string;
  // Emergencia
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
  contatoEmergenciaParentesco?: string;
  // Autorizacoes
  autorizacaoImagem?: boolean;
  autorizacaoSaida?: boolean;
  pessoasAutorizadasRetirar?: string;
  // Relacionamentos
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
  createPortal: (data: CreateMatriculaData) =>
    request<Matricula>("/api/matriculas/portal", {
      method: "POST",
      body: data,
    }),
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
  confirmar: (id: string, turmaId: string) =>
    request<Matricula>(`/api/matriculas/${id}/confirmar`, {
      method: "PATCH",
      body: { turmaId },
    }),
};

// ==================== PROFISSIONAIS ====================

export interface FormacaoProfissional {
  id: string;
  profissionalId: string;
  tipo: string; // GRADUACAO, POS_GRADUACAO, MESTRADO, DOUTORADO, CURSO_TECNICO, CURSO_LIVRE
  nome: string;
  instituicao?: string;
  anoConclusao?: number;
  cargaHoraria?: number;
  emAndamento: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  formacoes?: FormacaoProfissional[];
  createdAt: string;
  updatedAt: string;
}

export interface LotacaoResumo {
  escolaId: string;
  escolaNome: string;
  total: number;
  porTipo: Record<string, number>;
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
  getLotacaoResumo: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const query = params.toString();
    return request<LotacaoResumo[]>(
      `/api/profissionais/relatorios/lotacao${query ? `?${query}` : ""}`
    );
  },
  // Formações
  getFormacoes: (profissionalId: string) =>
    request<FormacaoProfissional[]>(
      `/api/profissionais/${profissionalId}/formacoes`
    ),
  addFormacao: (
    profissionalId: string,
    data: {
      tipo: string;
      nome: string;
      instituicao?: string;
      anoConclusao?: number;
      cargaHoraria?: number;
      emAndamento?: boolean;
    }
  ) =>
    request<FormacaoProfissional>(
      `/api/profissionais/${profissionalId}/formacoes`,
      {
        method: "POST",
        body: data,
      }
    ),
  updateFormacao: (
    profissionalId: string,
    formacaoId: string,
    data: Partial<{
      tipo: string;
      nome: string;
      instituicao?: string;
      anoConclusao?: number;
      cargaHoraria?: number;
      emAndamento?: boolean;
    }>
  ) =>
    request<FormacaoProfissional>(
      `/api/profissionais/${profissionalId}/formacoes/${formacaoId}`,
      {
        method: "PUT",
        body: data,
      }
    ),
  deleteFormacao: (profissionalId: string, formacaoId: string) =>
    request<void>(
      `/api/profissionais/${profissionalId}/formacoes/${formacaoId}`,
      {
        method: "DELETE",
      }
    ),
};

// Health check
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>("/health"),
};

// ==================== MÓDULOS ====================

export type SubModuleStatus =
  | "planning"
  | "in-progress"
  | "review"
  | "correction"
  | "homologated"
  | "completed";
export type ModuleStatus =
  | "planning"
  | "in-progress"
  | "review"
  | "correction"
  | "homologated"
  | "completed";

export interface SubModule {
  id: string;
  name: string;
  description: string;
  status: SubModuleStatus;
  observacao?: string | null;
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
  status: ModuleStatus;
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
    data: {
      name: string;
      description: string;
      status?: string;
      ordem?: number;
      observacao?: string;
    }
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
      observacao: string;
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

// ==================== CALENDÁRIO LETIVO ====================

// Status do ano letivo
export interface StatusAnoLetivo {
  // Início e Fim do Ano Letivo (define intervalo para cadastro de eventos)
  temInicioDefinido: boolean;
  temFimDefinido: boolean;
  dataInicioAnoLetivo: string | null;
  dataFimAnoLetivo: string | null;

  // Início e Fim das Aulas Regulares (define período para contabilização de dias letivos)
  temInicioAulasDefinido: boolean;
  temFimAulasDefinido: boolean;
  dataInicioAulas: string | null;
  dataFimAulas: string | null;

  // Controle de fluxo
  podeAdicionarEventos: boolean;
  podeContabilizarDiasLetivos: boolean;
  proximoEventoObrigatorio:
    | "INICIO_ANO_LETIVO"
    | "FIM_ANO_LETIVO"
    | "INICIO_AULAS_REGULARES"
    | "FIM_AULAS_REGULARES"
    | null;

  // Legado (manter compatibilidade)
  dataInicio: string | null;
  dataFim: string | null;
}

export interface AnoLetivo {
  id: string;
  ano: number;
  ativo: boolean;
  eventos?: EventoCalendario[];
  status: StatusAnoLetivo;
  createdAt: string;
  updatedAt: string;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  horaInicio?: string;
  horaFim?: string;
  tipo: string; // INICIO_ANO_LETIVO, FIM_ANO_LETIVO, FERIADO, RECESSO, SABADO_LETIVO, EVENTO, AC, AVALIACAO, REUNIAO, CONSELHO_CLASSE, PLANEJAMENTO, FORMACAO, OUTRO
  escopo: string; // REDE, ESCOLA
  recorrente: boolean;
  tipoRecorrencia?: string;
  diaRecorrencia?: string;
  cor: string;
  reduzDiaLetivo: boolean;
  anoLetivoId: string;
  escolaId?: string;
  escola?: Escola;
  createdAt: string;
  updatedAt: string;
}

export interface EstatisticasCalendario {
  diasTotais: number | null;
  diasLetivos: number | null;
  sabadosLetivos: number | null;
  feriados: number | null;
  domingos: number | null;
  eventos: number;
  feriadosEventos: number;
  dataInicioAnoLetivo: string | null;
  dataFimAnoLetivo: string | null;
  dataInicioAulas: string | null;
  dataFimAulas: string | null;
  status: {
    temInicioDefinido: boolean;
    temFimDefinido: boolean;
    temInicioAulasDefinido: boolean;
    temFimAulasDefinido: boolean;
    podeAdicionarEventos: boolean;
    podeContabilizarDiasLetivos: boolean;
    proximoEventoObrigatorio:
      | "INICIO_ANO_LETIVO"
      | "FIM_ANO_LETIVO"
      | "INICIO_AULAS_REGULARES"
      | "FIM_AULAS_REGULARES"
      | null;
  };
}

export const calendarioApi = {
  // Anos Letivos
  listAnosLetivos: () => request<AnoLetivo[]>("/api/calendario/anos-letivos"),
  getAnoLetivoAtivo: () =>
    request<AnoLetivo>("/api/calendario/anos-letivos/ativo"),
  getAnoLetivo: (id: string) =>
    request<AnoLetivo>(`/api/calendario/anos-letivos/${id}`),
  createAnoLetivo: (data: { ano: number; ativo?: boolean }) =>
    request<AnoLetivo>("/api/calendario/anos-letivos", {
      method: "POST",
      body: data,
    }),
  updateAnoLetivo: (
    id: string,
    data: Partial<{
      ano: number;
      ativo: boolean;
    }>
  ) =>
    request<AnoLetivo>(`/api/calendario/anos-letivos/${id}`, {
      method: "PUT",
      body: data,
    }),
  deleteAnoLetivo: (id: string) =>
    request<void>(`/api/calendario/anos-letivos/${id}`, { method: "DELETE" }),

  // Eventos
  getEventos: (anoLetivoId: string, escolaId?: string) => {
    const params = escolaId ? `?escolaId=${escolaId}` : "";
    return request<EventoCalendario[]>(
      `/api/calendario/anos-letivos/${anoLetivoId}/eventos${params}`
    );
  },
  getEventosByData: (anoLetivoId: string, data: string, escolaId?: string) => {
    const params = escolaId ? `?escolaId=${escolaId}` : "";
    return request<EventoCalendario[]>(
      `/api/calendario/anos-letivos/${anoLetivoId}/eventos/data/${data}${params}`
    );
  },
  getEventosByMes: (
    anoLetivoId: string,
    ano: number,
    mes: number,
    escolaId?: string
  ) => {
    const params = escolaId ? `?escolaId=${escolaId}` : "";
    return request<EventoCalendario[]>(
      `/api/calendario/anos-letivos/${anoLetivoId}/eventos/mes/${ano}/${mes}${params}`
    );
  },
  getEvento: (id: string) =>
    request<EventoCalendario>(`/api/calendario/eventos/${id}`),
  createEvento: (data: {
    titulo: string;
    descricao?: string;
    dataInicio: string;
    dataFim?: string;
    horaInicio?: string;
    horaFim?: string;
    tipo: string;
    escopo?: string;
    recorrente?: boolean;
    tipoRecorrencia?: string;
    diaRecorrencia?: string;
    cor?: string;
    reduzDiaLetivo?: boolean;
    anoLetivoId: string;
    escolaId?: string;
  }) =>
    request<EventoCalendario>("/api/calendario/eventos", {
      method: "POST",
      body: data,
    }),
  updateEvento: (
    id: string,
    data: Partial<{
      titulo: string;
      descricao?: string;
      dataInicio: string;
      dataFim?: string;
      horaInicio?: string;
      horaFim?: string;
      tipo: string;
      escopo?: string;
      recorrente?: boolean;
      tipoRecorrencia?: string;
      diaRecorrencia?: string;
      cor?: string;
      reduzDiaLetivo?: boolean;
      escolaId?: string;
    }>
  ) =>
    request<EventoCalendario>(`/api/calendario/eventos/${id}`, {
      method: "PUT",
      body: data,
    }),
  deleteEvento: (id: string) =>
    request<void>(`/api/calendario/eventos/${id}`, { method: "DELETE" }),

  // Estatísticas
  getEstatisticas: (anoLetivoId: string, escolaId?: string) => {
    const params = escolaId ? `?escolaId=${escolaId}` : "";
    return request<EstatisticasCalendario>(
      `/api/calendario/anos-letivos/${anoLetivoId}/estatisticas${params}`
    );
  },
};

// ==================== FREQUÊNCIA ====================

export interface Frequencia {
  id: string;
  data: string;
  status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
  justificativa?: string;
  observacao?: string;
  matriculaId: string;
  turmaId: string;
  matricula?: {
    id: string;
    numeroMatricula: string;
    nomeAluno: string;
  };
  turma?: {
    id: string;
    nome: string;
    serie?: { nome: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface EstatisticasFrequencia {
  totalAulas: number;
  presencas: number;
  faltas: number;
  faltasJustificadas: number;
  percentualPresenca: number;
  percentualFaltas: number;
  abaixoDoLimite: boolean;
}

export interface AlunoComBaixaFrequencia {
  matricula: {
    id: string;
    numeroMatricula: string;
    nomeAluno: string;
  };
  estatisticas: EstatisticasFrequencia;
}

export const frequenciaApi = {
  // Listar frequências
  list: (params?: {
    turmaId?: string;
    matriculaId?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.turmaId) query.append("turmaId", params.turmaId);
    if (params?.matriculaId) query.append("matriculaId", params.matriculaId);
    if (params?.dataInicio) query.append("dataInicio", params.dataInicio);
    if (params?.dataFim) query.append("dataFim", params.dataFim);
    const queryString = query.toString();
    return request<Frequencia[]>(
      `/api/frequencia${queryString ? `?${queryString}` : ""}`
    );
  },

  // Buscar frequência por ID
  get: (id: string) => request<Frequencia>(`/api/frequencia/${id}`),

  // Criar registro de frequência
  create: (data: {
    matriculaId: string;
    turmaId: string;
    data: string;
    status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
    justificativa?: string;
    observacao?: string;
  }) =>
    request<Frequencia>("/api/frequencia", {
      method: "POST",
      body: data,
    }),

  // Registrar frequência de turma completa
  registrarTurma: (data: {
    turmaId: string;
    data: string;
    presencas: Array<{
      matriculaId: string;
      status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
      justificativa?: string;
      observacao?: string;
    }>;
  }) =>
    request<{
      message: string;
      registros: Frequencia[];
    }>("/api/frequencia/turma", {
      method: "POST",
      body: data,
    }),

  // Atualizar frequência
  update: (
    id: string,
    data: {
      status?: "PRESENTE" | "FALTA" | "JUSTIFICADA";
      justificativa?: string;
      observacao?: string;
    }
  ) =>
    request<Frequencia>(`/api/frequencia/${id}`, {
      method: "PATCH",
      body: data,
    }),

  // Deletar frequência
  delete: (id: string) =>
    request<{ message: string }>(`/api/frequencia/${id}`, {
      method: "DELETE",
    }),

  // Estatísticas de frequência
  getEstatisticas: (
    matriculaId: string,
    turmaId: string,
    dataInicio?: string,
    dataFim?: string
  ) => {
    const query = new URLSearchParams();
    if (dataInicio) query.append("dataInicio", dataInicio);
    if (dataFim) query.append("dataFim", dataFim);
    const queryString = query.toString();
    return request<EstatisticasFrequencia>(
      `/api/frequencia/estatisticas/${matriculaId}/${turmaId}${queryString ? `?${queryString}` : ""}`
    );
  },

  // Alunos com baixa frequência
  listarBaixaFrequencia: (
    turmaId: string,
    dataInicio?: string,
    dataFim?: string
  ) => {
    const query = new URLSearchParams();
    if (dataInicio) query.append("dataInicio", dataInicio);
    if (dataFim) query.append("dataFim", dataFim);
    const queryString = query.toString();
    return request<AlunoComBaixaFrequencia[]>(
      `/api/frequencia/turma/${turmaId}/baixa-frequencia${queryString ? `?${queryString}` : ""}`
    );
  },

  // Resumo de frequência da turma (todos os alunos)
  getResumoTurma: (
    turmaId: string,
    dataInicio?: string,
    dataFim?: string
  ) => {
    const query = new URLSearchParams();
    if (dataInicio) query.append("dataInicio", dataInicio);
    if (dataFim) query.append("dataFim", dataFim);
    const queryString = query.toString();
    return request<AlunoComBaixaFrequencia[]>(
      `/api/frequencia/turma/${turmaId}/resumo${queryString ? `?${queryString}` : ""}`
    );
  },

  // Buscar frequência por data
  buscarPorData: (turmaId: string, data: string) =>
    request<Frequencia[]>(`/api/frequencia/turma/${turmaId}/data/${data}`),
};

// ==================== DISCIPLINAS ====================

export interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  cargaHorariaSemanal?: number;
  obrigatoria: boolean;
  ativo: boolean;
  ordem: number;
  etapaId: string;
  etapa?: EtapaEnsino;
  createdAt: string;
  updatedAt: string;
}

export const disciplinasApi = {
  list: (filters?: { etapaId?: string; ativo?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.etapaId) params.append("etapaId", filters.etapaId);
    if (filters?.ativo !== undefined) params.append("ativo", filters.ativo.toString());
    const query = params.toString();
    return request<Disciplina[]>(`/api/disciplinas${query ? `?${query}` : ""}`);
  },
  get: (id: string) => request<Disciplina>(`/api/disciplinas/${id}`),
  getByEtapa: (etapaId: string) =>
    request<Disciplina[]>(`/api/disciplinas/etapa/${etapaId}`),
  create: (data: {
    nome: string;
    codigo: string;
    descricao?: string;
    cargaHorariaSemanal?: number;
    obrigatoria?: boolean;
    ativo?: boolean;
    ordem?: number;
    etapaId: string;
  }) => request<Disciplina>("/api/disciplinas", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      codigo: string;
      descricao?: string;
      cargaHorariaSemanal?: number;
      obrigatoria?: boolean;
      ativo?: boolean;
      ordem?: number;
      etapaId: string;
    }>
  ) => request<Disciplina>(`/api/disciplinas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/disciplinas/${id}`, { method: "DELETE" }),
};

// ==================== CONFIGURAÇÃO DE AVALIAÇÃO ====================

export interface ConfiguracaoAvaliacao {
  id: string;
  anoLetivo: number;
  sistemaAvaliacao: string;
  numeroPeriodos: number;
  mediaMinima: number;
  percentualFrequenciaMinima: number;
  recuperacaoParalela: boolean;
  recuperacaoFinal: boolean;
  escolaId?: string;
  escola?: Escola;
  etapaId?: string;
  etapa?: EtapaEnsino;
  createdAt: string;
  updatedAt: string;
}

export const configuracaoAvaliacaoApi = {
  list: (filters?: { anoLetivo?: number; escolaId?: string; etapaId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.anoLetivo) params.append("anoLetivo", filters.anoLetivo.toString());
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.etapaId) params.append("etapaId", filters.etapaId);
    const query = params.toString();
    return request<ConfiguracaoAvaliacao[]>(
      `/api/configuracao-avaliacao${query ? `?${query}` : ""}`
    );
  },
  get: (id: string) =>
    request<ConfiguracaoAvaliacao>(`/api/configuracao-avaliacao/${id}`),
  create: (data: {
    anoLetivo: number;
    sistemaAvaliacao?: string;
    numeroPeriodos?: number;
    mediaMinima?: number;
    percentualFrequenciaMinima?: number;
    recuperacaoParalela?: boolean;
    recuperacaoFinal?: boolean;
    escolaId?: string;
    etapaId?: string;
  }) =>
    request<ConfiguracaoAvaliacao>("/api/configuracao-avaliacao", {
      method: "POST",
      body: data,
    }),
  update: (
    id: string,
    data: Partial<{
      anoLetivo: number;
      sistemaAvaliacao: string;
      numeroPeriodos: number;
      mediaMinima: number;
      percentualFrequenciaMinima: number;
      recuperacaoParalela: boolean;
      recuperacaoFinal: boolean;
      escolaId?: string;
      etapaId?: string;
    }>
  ) =>
    request<ConfiguracaoAvaliacao>(`/api/configuracao-avaliacao/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    request<void>(`/api/configuracao-avaliacao/${id}`, { method: "DELETE" }),
};

// ==================== AVALIAÇÕES ====================

export interface Avaliacao {
  id: string;
  nome: string;
  tipo: "PROVA" | "TRABALHO" | "ATIVIDADE" | "PARTICIPACAO" | "RECUPERACAO";
  peso: number;
  valorMaximo: number;
  data: string;
  bimestre: number;
  observacao?: string;
  turmaId: string;
  turma?: Turma;
  disciplinaId: string;
  disciplina?: Disciplina;
  profissionalId?: string;
  profissional?: ProfissionalEducacao;
  notas?: Nota[];
  createdAt: string;
  updatedAt: string;
}

export const avaliacoesApi = {
  list: (filters?: { turmaId?: string; disciplinaId?: string; bimestre?: number }) => {
    const params = new URLSearchParams();
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.disciplinaId) params.append("disciplinaId", filters.disciplinaId);
    if (filters?.bimestre) params.append("bimestre", filters.bimestre.toString());
    const query = params.toString();
    return request<Avaliacao[]>(`/api/avaliacoes${query ? `?${query}` : ""}`);
  },
  get: (id: string) => request<Avaliacao>(`/api/avaliacoes/${id}`),
  create: (data: {
    nome: string;
    tipo: string;
    peso?: number;
    valorMaximo?: number;
    data: string;
    bimestre: number;
    observacao?: string;
    turmaId: string;
    disciplinaId: string;
    profissionalId?: string;
  }) => request<Avaliacao>("/api/avaliacoes", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      nome: string;
      tipo: string;
      peso: number;
      valorMaximo: number;
      data: string;
      bimestre: number;
      observacao?: string;
    }>
  ) => request<Avaliacao>(`/api/avaliacoes/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/avaliacoes/${id}`, { method: "DELETE" }),
};

// ==================== NOTAS ====================

export interface Nota {
  id: string;
  valor: number;
  observacao?: string;
  turmaId: string;
  disciplina: string;
  bimestre: number;
  avaliacaoId?: string | null;
  avaliacao?: Avaliacao;
  matriculaId: string;
  matricula?: Matricula;
  createdAt: string;
  updatedAt: string;
}

export interface BoletimDisciplina {
  disciplinaId: string;
  disciplinaNome: string;
  disciplinaCodigo?: string;
  bimestres: {
    bimestre: number;
    media: number | null;
    avaliacoes: {
      id: string;
      nome: string;
      tipo: string;
      peso: number;
      valorMaximo?: number;
      nota: number | null;
    }[];
  }[];
  mediaFinal: number | null;
  situacao: string;
}

export interface Boletim {
  matricula: {
    id: string;
    numeroMatricula: string;
    nomeAluno: string;
  };
  turma?: {
    id: string;
    nome: string;
    serie?: string | { nome: string };
    escola?: { nome: string };
  };
  disciplinas: BoletimDisciplina[];
  frequencia?: {
    totalAulas: number;
    presencas: number;
    faltas: number;
    percentualPresenca: number;
    abaixoDoLimite: boolean;
  };
  situacaoGeral?: string;
}

export const notasApi = {
  list: (filters?: {
    turmaId?: string;
    disciplina?: string;
    matriculaId?: string;
    bimestre?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.disciplina) params.append("disciplina", filters.disciplina);
    if (filters?.matriculaId) params.append("matriculaId", filters.matriculaId);
    if (filters?.bimestre) params.append("bimestre", filters.bimestre.toString());
    const queryString = params.toString();
    return request<Nota[]>(`/api/notas${queryString ? `?${queryString}` : ""}`);
  },
  create: (data: {
    matriculaId: string;
    turmaId: string;
    disciplina: string;
    bimestre: number;
    avaliacaoId: string | null;
    valor: number;
    observacao?: string;
  }) => request<Nota>("/api/notas", { method: "POST", body: data }),
  get: (id: string) => request<Nota>(`/api/notas/${id}`),
  lancarTurma: (data: {
    avaliacaoId: string;
    notas: Array<{ matriculaId: string; valor: number; observacao?: string }>;
  }) =>
    request<Nota[]>("/api/notas/turma", { method: "POST", body: data }),
  update: (
    id: string,
    data: { valor?: number; observacao?: string }
  ) => request<Nota>(`/api/notas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    request<void>(`/api/notas/${id}`, { method: "DELETE" }),
  getBoletim: (matriculaId: string, turmaId?: string) => {
    const params = turmaId ? `?turmaId=${turmaId}` : "";
    return request<Boletim>(`/api/notas/boletim/${matriculaId}${params}`);
  },
  getMediaFinal: (matriculaId: string, turmaId: string, disciplinaId: string) =>
    request<{ media: number }>(`/api/notas/media/${matriculaId}/${turmaId}/${disciplinaId}`),
  getSituacao: (matriculaId: string, turmaId: string, disciplinaId: string) =>
    request<{ situacao: string; mediaFinal: number; frequenciaPercentual: number }>(
      `/api/notas/situacao/${matriculaId}/${turmaId}/${disciplinaId}`
    ),
};

// ==================== UPLOAD DE DOCUMENTOS ====================

async function requestFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const config: RequestInit = {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new ApiError(response.status, error.error || "Erro na requisição");
  }

  return response.json();
}

export interface DocumentoMatricula {
  foto: string | null;
  rg: string | null;
  cpf: string | null;
  comprovante: string | null;
  certidao: string | null;
  historico: string | null;
  outros: Array<{ nome: string; path: string; tipo: string }>;
}

export const uploadApi = {
  uploadDocumento: (matriculaId: string, file: File, tipo: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", tipo);
    return requestFormData<{ message: string; path: string; matricula: Matricula }>(
      `/api/upload/matricula/${matriculaId}/documento`,
      formData
    );
  },

  getDocumentos: (matriculaId: string) =>
    request<DocumentoMatricula>(
      `/api/upload/matricula/${matriculaId}/documentos`
    ),
};

// ==================== PONTO DIGITAL ====================

export interface Ponto {
  id: string;
  profissionalId: string;
  escolaId?: string | null;
  data: string;
  entrada?: string | null;
  saida?: string | null;
  entrada2?: string | null;
  saida2?: string | null;
  horasTrabalhadas?: number | null;
  tipoRegistro: string;
  observacoes?: string | null;
  justificativa?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
  profissional?: {
    id: string;
    nome: string;
    cpf: string;
    tipo: string;
    matricula?: string | null;
  };
}

export interface RelatorioMensal {
  pontos: Ponto[];
  totalHoras: number;
  diasTrabalhados: number;
  faltas: number;
  atrasos: number;
}

export const pontosApi = {
  list: (filters?: {
    profissionalId?: string;
    escolaId?: string;
    dataInicio?: string;
    dataFim?: string;
    tipoRegistro?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.profissionalId) params.append("profissionalId", filters.profissionalId);
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    if (filters?.tipoRegistro) params.append("tipoRegistro", filters.tipoRegistro);

    const queryString = params.toString();
    return request<Ponto[]>(
      `/api/pontos${queryString ? `?${queryString}` : ""}`
    );
  },

  create: (data: Partial<Ponto>) =>
    request<Ponto>("/api/pontos", { method: "POST", body: data }),

  registrar: (data: {
    profissionalId: string;
    escolaId?: string;
    tipo: "ENTRADA" | "SAIDA" | "ENTRADA2" | "SAIDA2";
    horario: string;
    latitude?: number;
    longitude?: number;
  }) =>
    request<Ponto>("/api/pontos/registrar", { method: "POST", body: data }),

  getById: (id: string) => request<Ponto>(`/api/pontos/${id}`),

  update: (id: string, data: Partial<Ponto>) =>
    request<Ponto>(`/api/pontos/${id}`, { method: "PUT", body: data }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/pontos/${id}`, { method: "DELETE" }),

  relatorioMensal: (profissionalId: string, mes: number, ano: number) =>
    request<RelatorioMensal>(
      `/api/pontos/relatorio/${profissionalId}/${mes}/${ano}`
    ),
};

// ==================== LICENÇAS ====================

export interface Licenca {
  id: string;
  profissionalId: string;
  tipo: string;
  dataInicio: string;
  dataFim: string;
  diasCorridos: number;
  diasUteis?: number | null;
  motivo?: string | null;
  observacoes?: string | null;
  status: string;
  documentoPath?: string | null;
  aprovadaPor?: string | null;
  dataAprovacao?: string | null;
  justificativaRejeicao?: string | null;
  createdAt: string;
  updatedAt: string;
  profissional?: {
    id: string;
    nome: string;
    cpf: string;
    tipo: string;
    matricula?: string | null;
    email?: string | null;
    telefone?: string | null;
  };
}

export interface RelatorioLicencas {
  licencas: Licenca[];
  totalDias: number;
  porTipo: Record<string, number>;
}

export const licencasApi = {
  list: (filters?: {
    profissionalId?: string;
    status?: string;
    tipo?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.profissionalId) params.append("profissionalId", filters.profissionalId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);

    const queryString = params.toString();
    return request<Licenca[]>(
      `/api/licencas${queryString ? `?${queryString}` : ""}`
    );
  },

  create: (data: Partial<Licenca>) =>
    request<Licenca>("/api/licencas", { method: "POST", body: data }),

  getById: (id: string) => request<Licenca>(`/api/licencas/${id}`),

  update: (id: string, data: Partial<Licenca>) =>
    request<Licenca>(`/api/licencas/${id}`, { method: "PUT", body: data }),

  aprovar: (
    id: string,
    data: {
      aprovadaPor: string;
      status: "APROVADA" | "REJEITADA";
      justificativaRejeicao?: string;
    }
  ) =>
    request<Licenca>(`/api/licencas/${id}/aprovar`, {
      method: "POST",
      body: data,
    }),

  cancelar: (id: string) =>
    request<Licenca>(`/api/licencas/${id}/cancelar`, { method: "POST" }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/licencas/${id}`, { method: "DELETE" }),

  listAtivas: () => request<Licenca[]>("/api/licencas/status/ativas"),

  relatorio: (profissionalId: string, anoInicio?: number, anoFim?: number) => {
    const params = new URLSearchParams();
    if (anoInicio) params.append("anoInicio", anoInicio.toString());
    if (anoFim) params.append("anoFim", anoFim.toString());

    const queryString = params.toString();
    return request<RelatorioLicencas>(
      `/api/licencas/relatorio/${profissionalId}${queryString ? `?${queryString}` : ""}`
    );
  },
};

// ==================== MÓDULO 5: PROGRAMAS ESPECIAIS ====================

// Busca Ativa
export interface BuscaAtiva {
  id: string;
  matriculaId: string;
  motivo: string;
  descricao?: string;
  status: string;
  prioridade: string;
  responsavelId?: string;
  escolaId?: string;
  resultado?: string;
  dataResolucao?: string;
  createdAt: string;
  updatedAt: string;
  matricula?: {
    nomeAluno: string;
    numeroMatricula: string;
    turma?: {
      nome: string;
      serie?: {
        nome: string;
      };
    };
  };
  responsavel?: {
    nome: string;
  };
  escola?: {
    nome: string;
  };
  visitas?: VisitaDomiciliar[];
  encaminhamentos?: EncaminhamentoExterno[];
  _count?: {
    visitas: number;
    encaminhamentos: number;
  };
}

export interface VisitaDomiciliar {
  id: string;
  buscaAtivaId: string;
  data: string;
  horario?: string;
  responsavel: string;
  situacao: string;
  relato?: string;
  observacoes?: string;
  proximaVisita?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncaminhamentoExterno {
  id: string;
  buscaAtivaId: string;
  orgao: string;
  motivo: string;
  dataEnvio: string;
  protocolo?: string;
  status: string;
  retorno?: string;
  dataRetorno?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

// AEE
export interface PlanoEducacionalIndividualizado {
  id: string;
  matriculaId: string;
  anoLetivo: number;
  deficiencia: string;
  cid?: string;
  laudoMedico: boolean;
  laudoPath?: string;
  necessitaAEE: boolean;
  frequenciaAEE?: string;
  profissionalAEE?: string;
  objetivosGerais?: string;
  objetivosEspecificos?: string;
  estrategias?: string;
  recursos?: string;
  avaliacaoDiagnostica?: string;
  elaboradoPor?: string;
  dataElaboracao: string;
  dataRevisao?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  matricula?: any;
  atendimentos?: AtendimentoAEE[];
  _count?: {
    atendimentos: number;
  };
}

export interface SalaRecursos {
  id: string;
  escolaId: string;
  nome: string;
  tipo: string;
  turno: string;
  capacidade: number;
  ativa: boolean;
  recursos?: string;
  profissionais?: string;
  createdAt: string;
  updatedAt: string;
  escola?: {
    nome: string;
  };
  atendimentos?: AtendimentoAEE[];
  _count?: {
    atendimentos: number;
  };
}

export interface AtendimentoAEE {
  id: string;
  peiId: string;
  salaRecursosId: string;
  data: string;
  horario?: string;
  duracao?: number;
  objetivo?: string;
  atividades?: string;
  recursos?: string;
  observacoes?: string;
  presenca: boolean;
  justificativa?: string;
  profissionalId?: string;
  createdAt: string;
  updatedAt: string;
  pei?: any;
  salaRecursos?: any;
  profissional?: {
    nome: string;
  };
}

// Acompanhamento
export interface AcompanhamentoIndividualizado {
  id: string;
  matriculaId: string;
  tipo: string;
  motivo: string;
  objetivos?: string;
  profissionalId?: string;
  escolaId?: string;
  acoes?: string;
  estrategias?: string;
  dataInicio: string;
  dataFim?: string;
  evolucoes?: string;
  status: string;
  resultado?: string;
  createdAt: string;
  updatedAt: string;
  matricula?: any;
  profissional?: {
    nome: string;
  };
  escola?: {
    nome: string;
  };
}

// API - Busca Ativa
export const buscaAtivaApi = {
  list: (filters?: {
    escolaId?: string;
    status?: string;
    prioridade?: string;
    motivo?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.prioridade) params.append("prioridade", filters.prioridade);
    if (filters?.motivo) params.append("motivo", filters.motivo);

    const queryString = params.toString();
    return request<BuscaAtiva[]>(
      `/api/busca-ativa${queryString ? `?${queryString}` : ""}`
    );
  },

  get: (id: string) => request<BuscaAtiva>(`/api/busca-ativa/${id}`),

  create: (data: Partial<BuscaAtiva>) =>
    request<BuscaAtiva>("/api/busca-ativa", { method: "POST", body: data }),

  update: (id: string, data: Partial<BuscaAtiva>) =>
    request<BuscaAtiva>(`/api/busca-ativa/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/busca-ativa/${id}`, {
      method: "DELETE",
    }),

  estatisticas: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<any>(
      `/api/busca-ativa/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },

  // Visitas
  createVisita: (data: Partial<VisitaDomiciliar>) =>
    request<VisitaDomiciliar>("/api/busca-ativa/visitas", {
      method: "POST",
      body: data,
    }),

  listVisitas: (buscaAtivaId: string) =>
    request<VisitaDomiciliar[]>(`/api/busca-ativa/${buscaAtivaId}/visitas`),

  updateVisita: (id: string, data: Partial<VisitaDomiciliar>) =>
    request<VisitaDomiciliar>(`/api/busca-ativa/visitas/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteVisita: (id: string) =>
    request<{ message: string }>(`/api/busca-ativa/visitas/${id}`, {
      method: "DELETE",
    }),

  // Encaminhamentos
  createEncaminhamento: (data: Partial<EncaminhamentoExterno>) =>
    request<EncaminhamentoExterno>("/api/busca-ativa/encaminhamentos", {
      method: "POST",
      body: data,
    }),

  listEncaminhamentos: (buscaAtivaId: string) =>
    request<EncaminhamentoExterno[]>(
      `/api/busca-ativa/${buscaAtivaId}/encaminhamentos`
    ),

  updateEncaminhamento: (id: string, data: Partial<EncaminhamentoExterno>) =>
    request<EncaminhamentoExterno>(`/api/busca-ativa/encaminhamentos/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteEncaminhamento: (id: string) =>
    request<{ message: string }>(`/api/busca-ativa/encaminhamentos/${id}`, {
      method: "DELETE",
    }),
};

// API - AEE
export const aeeApi = {
  // PEI
  listPEI: (filters?: { escolaId?: string; anoLetivo?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.anoLetivo)
      params.append("anoLetivo", filters.anoLetivo.toString());
    if (filters?.status) params.append("status", filters.status);

    const queryString = params.toString();
    return request<PlanoEducacionalIndividualizado[]>(
      `/api/aee/pei${queryString ? `?${queryString}` : ""}`
    );
  },

  getPEI: (id: string) =>
    request<PlanoEducacionalIndividualizado>(`/api/aee/pei/${id}`),

  getPEIByMatricula: (matriculaId: string) =>
    request<PlanoEducacionalIndividualizado>(
      `/api/aee/pei/matricula/${matriculaId}`
    ),

  createPEI: (data: Partial<PlanoEducacionalIndividualizado>) =>
    request<PlanoEducacionalIndividualizado>("/api/aee/pei", {
      method: "POST",
      body: data,
    }),

  updatePEI: (id: string, data: Partial<PlanoEducacionalIndividualizado>) =>
    request<PlanoEducacionalIndividualizado>(`/api/aee/pei/${id}`, {
      method: "PUT",
      body: data,
    }),

  deletePEI: (id: string) =>
    request<{ message: string }>(`/api/aee/pei/${id}`, { method: "DELETE" }),

  // Salas de Recursos
  listSalasRecursos: (filters?: { escolaId?: string; turno?: string }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.turno) params.append("turno", filters.turno);

    const queryString = params.toString();
    return request<SalaRecursos[]>(
      `/api/aee/salas-recursos${queryString ? `?${queryString}` : ""}`
    );
  },

  getSalaRecursos: (id: string) =>
    request<SalaRecursos>(`/api/aee/salas-recursos/${id}`),

  createSalaRecursos: (data: Partial<SalaRecursos>) =>
    request<SalaRecursos>("/api/aee/salas-recursos", {
      method: "POST",
      body: data,
    }),

  updateSalaRecursos: (id: string, data: Partial<SalaRecursos>) =>
    request<SalaRecursos>(`/api/aee/salas-recursos/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteSalaRecursos: (id: string) =>
    request<{ message: string }>(`/api/aee/salas-recursos/${id}`, {
      method: "DELETE",
    }),

  // Atendimentos
  createAtendimento: (data: Partial<AtendimentoAEE>) =>
    request<AtendimentoAEE>("/api/aee/atendimentos", {
      method: "POST",
      body: data,
    }),

  listAtendimentosByPEI: (peiId: string, mes?: number, ano?: number) => {
    const params = new URLSearchParams();
    if (mes) params.append("mes", mes.toString());
    if (ano) params.append("ano", ano.toString());
    const queryString = params.toString();
    return request<AtendimentoAEE[]>(
      `/api/aee/atendimentos/pei/${peiId}${queryString ? `?${queryString}` : ""}`
    );
  },

  listAtendimentosBySala: (
    salaRecursosId: string,
    mes?: number,
    ano?: number
  ) => {
    const params = new URLSearchParams();
    if (mes) params.append("mes", mes.toString());
    if (ano) params.append("ano", ano.toString());
    const queryString = params.toString();
    return request<AtendimentoAEE[]>(
      `/api/aee/atendimentos/sala/${salaRecursosId}${queryString ? `?${queryString}` : ""}`
    );
  },

  updateAtendimento: (id: string, data: Partial<AtendimentoAEE>) =>
    request<AtendimentoAEE>(`/api/aee/atendimentos/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteAtendimento: (id: string) =>
    request<{ message: string }>(`/api/aee/atendimentos/${id}`, {
      method: "DELETE",
    }),

  estatisticasAEE: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<any>(
      `/api/aee/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },
};

// API - Acompanhamento
export const acompanhamentoApi = {
  list: (filters?: {
    escolaId?: string;
    tipo?: string;
    status?: string;
    profissionalId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.profissionalId)
      params.append("profissionalId", filters.profissionalId);

    const queryString = params.toString();
    return request<AcompanhamentoIndividualizado[]>(
      `/api/acompanhamento${queryString ? `?${queryString}` : ""}`
    );
  },

  get: (id: string) =>
    request<AcompanhamentoIndividualizado>(`/api/acompanhamento/${id}`),

  getByMatricula: (matriculaId: string) =>
    request<AcompanhamentoIndividualizado[]>(
      `/api/acompanhamento/matricula/${matriculaId}`
    ),

  create: (data: Partial<AcompanhamentoIndividualizado>) =>
    request<AcompanhamentoIndividualizado>("/api/acompanhamento", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<AcompanhamentoIndividualizado>) =>
    request<AcompanhamentoIndividualizado>(`/api/acompanhamento/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/acompanhamento/${id}`, {
      method: "DELETE",
    }),

  registrarEvolucao: (
    id: string,
    data: { data: string; observacao: string; profissionalId?: string }
  ) =>
    request<AcompanhamentoIndividualizado>(`/api/acompanhamento/${id}/evolucao`, {
      method: "POST",
      body: data,
    }),

  concluir: (id: string, resultado: string) =>
    request<AcompanhamentoIndividualizado>(`/api/acompanhamento/${id}/concluir`, {
      method: "POST",
      body: { resultado },
    }),

  suspender: (id: string, motivo: string) =>
    request<AcompanhamentoIndividualizado>(`/api/acompanhamento/${id}/suspender`, {
      method: "POST",
      body: { motivo },
    }),

  reativar: (id: string) =>
    request<AcompanhamentoIndividualizado>(`/api/acompanhamento/${id}/reativar`, {
      method: "POST",
    }),

  estatisticas: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<any>(
      `/api/acompanhamento/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },
};

// ==================== MÓDULO 9: COMUNICAÇÃO E EVENTOS ====================

export interface PlantaoPedagogico {
  id: string;
  escolaId: string;
  escola?: Escola;
  data: string;
  tipo: string;
  descricao?: string;
  horarioInicio: string;
  horarioFim: string;
  profissionais?: string;
  turmaId?: string;
  turma?: Turma;
  local?: string;
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReuniaoPais {
  id: string;
  escolaId: string;
  escola?: Escola;
  turmaId?: string;
  turma?: Turma;
  titulo: string;
  descricao?: string;
  data: string;
  horario: string;
  duracao?: number;
  local?: string;
  tipo: string;
  finalidade?: string;
  pauta?: string;
  ata?: string;
  encaminhamentos?: string;
  status: string;
  profissionalId?: string;
  profissional?: ProfissionalEducacao;
  presencas?: PresencaReuniao[];
  _count?: {
    presencas: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PresencaReuniao {
  id: string;
  reuniaoId: string;
  reuniao?: ReuniaoPais;
  matriculaId: string;
  matricula?: Matricula;
  nomeResponsavel: string;
  parentesco?: string;
  presente: boolean;
  horarioChegada?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comunicado {
  id: string;
  escolaId?: string;
  escola?: Escola;
  titulo: string;
  mensagem: string;
  tipo: string;
  categoria?: string;
  destinatarios: string;
  turmaId?: string;
  turma?: Turma;
  etapaId?: string;
  etapa?: EtapaEnsino;
  anexoUrl?: string;
  dataPublicacao: string;
  dataExpiracao?: string;
  ativo: boolean;
  destaque: boolean;
  autorId?: string;
  autor?: ProfissionalEducacao;
  autorNome: string;
  destinatariosLeitura?: ComunicadoDestinatario[];
  _count?: {
    destinatariosLeitura: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComunicadoDestinatario {
  id: string;
  comunicadoId: string;
  userId: string;
  lido: boolean;
  dataLeitura?: string;
  confirmado: boolean;
  dataConfirmacao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notificacao {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  canais: string;
  link?: string;
  acaoTipo?: string;
  acaoId?: string;
  lida: boolean;
  dataLeitura?: string;
  enviadaEmail: boolean;
  enviadaSMS: boolean;
  enviadaPush: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== PLANTÃO PEDAGÓGICO API ====================

export const plantaoPedagogicoApi = {
  list: (filters?: {
    escolaId?: string;
    turmaId?: string;
    tipo?: string;
    dataInicio?: string;
    dataFim?: string;
    ativo?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    if (filters?.ativo !== undefined) params.append("ativo", String(filters.ativo));
    const queryString = params.toString();
    return request<PlantaoPedagogico[]>(
      `/api/plantoes-pedagogicos${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: (id: string) =>
    request<PlantaoPedagogico>(`/api/plantoes-pedagogicos/${id}`),

  create: (data: Omit<PlantaoPedagogico, "id" | "createdAt" | "updatedAt">) =>
    request<PlantaoPedagogico>("/api/plantoes-pedagogicos", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<PlantaoPedagogico>) =>
    request<PlantaoPedagogico>(`/api/plantoes-pedagogicos/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/plantoes-pedagogicos/${id}`, {
      method: "DELETE",
    }),

  porEscolaEPeriodo: (escolaId: string, dataInicio: string, dataFim: string) => {
    const params = new URLSearchParams();
    params.append("dataInicio", dataInicio);
    params.append("dataFim", dataFim);
    return request<PlantaoPedagogico[]>(
      `/api/plantoes-pedagogicos/escola/${escolaId}/periodo?${params.toString()}`
    );
  },

  estatisticas: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<any>(
      `/api/plantoes-pedagogicos/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },
};

// ==================== REUNIÃO DE PAIS API ====================

export const reuniaoPaisApi = {
  list: (filters?: {
    escolaId?: string;
    turmaId?: string;
    tipo?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.dataInicio) params.append("dataInicio", filters.dataInicio);
    if (filters?.dataFim) params.append("dataFim", filters.dataFim);
    const queryString = params.toString();
    return request<ReuniaoPais[]>(
      `/api/reunioes-pais${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: (id: string) =>
    request<ReuniaoPais>(`/api/reunioes-pais/${id}`),

  create: (data: Omit<ReuniaoPais, "id" | "createdAt" | "updatedAt" | "presencas" | "_count">) =>
    request<ReuniaoPais>("/api/reunioes-pais", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<ReuniaoPais>) =>
    request<ReuniaoPais>(`/api/reunioes-pais/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/reunioes-pais/${id}`, {
      method: "DELETE",
    }),

  registrarPresenca: (data: Omit<PresencaReuniao, "id" | "createdAt" | "updatedAt">) =>
    request<PresencaReuniao>("/api/reunioes-pais/presencas", {
      method: "POST",
      body: data,
    }),

  getPresencas: (reuniaoId: string) =>
    request<PresencaReuniao[]>(`/api/reunioes-pais/${reuniaoId}/presencas`),

  deletePresenca: (id: string) =>
    request<{ message: string }>(`/api/reunioes-pais/presencas/${id}`, {
      method: "DELETE",
    }),

  estatisticas: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<any>(
      `/api/reunioes-pais/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },
};

// ==================== COMUNICADO API ====================

export const comunicadoApi = {
  list: (filters?: {
    escolaId?: string;
    turmaId?: string;
    etapaId?: string;
    tipo?: string;
    categoria?: string;
    destinatarios?: string;
    ativo?: boolean;
    destaque?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.escolaId) params.append("escolaId", filters.escolaId);
    if (filters?.turmaId) params.append("turmaId", filters.turmaId);
    if (filters?.etapaId) params.append("etapaId", filters.etapaId);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.categoria) params.append("categoria", filters.categoria);
    if (filters?.destinatarios) params.append("destinatarios", filters.destinatarios);
    if (filters?.ativo !== undefined) params.append("ativo", String(filters.ativo));
    if (filters?.destaque !== undefined) params.append("destaque", String(filters.destaque));
    const queryString = params.toString();
    return request<Comunicado[]>(
      `/api/comunicados${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: (id: string) =>
    request<Comunicado>(`/api/comunicados/${id}`),

  create: (data: Omit<Comunicado, "id" | "createdAt" | "updatedAt" | "destinatariosLeitura" | "_count">) =>
    request<Comunicado>("/api/comunicados", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: Partial<Comunicado>) =>
    request<Comunicado>(`/api/comunicados/${id}`, {
      method: "PUT",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/comunicados/${id}`, {
      method: "DELETE",
    }),

  marcarLido: (id: string, userId: string) =>
    request<ComunicadoDestinatario>(`/api/comunicados/${id}/marcar-lido`, {
      method: "POST",
      body: { userId },
    }),

  confirmar: (id: string, userId: string) =>
    request<ComunicadoDestinatario>(`/api/comunicados/${id}/confirmar`, {
      method: "POST",
      body: { userId },
    }),

  porUsuario: (userId: string, filtro?: "NAO_LIDOS" | "LIDOS" | "TODOS") => {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    const queryString = params.toString();
    return request<Comunicado[]>(
      `/api/comunicados/usuario/${userId}${queryString ? `?${queryString}` : ""}`
    );
  },

  estatisticas: (escolaId?: string) => {
    const params = new URLSearchParams();
    if (escolaId) params.append("escolaId", escolaId);
    const queryString = params.toString();
    return request<any>(
      `/api/comunicados/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },
};

// ==================== NOTIFICAÇÃO API ====================

export const notificacaoApi = {
  list: (filters?: {
    userId?: string;
    tipo?: string;
    prioridade?: string;
    lida?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.tipo) params.append("tipo", filters.tipo);
    if (filters?.prioridade) params.append("prioridade", filters.prioridade);
    if (filters?.lida !== undefined) params.append("lida", String(filters.lida));
    const queryString = params.toString();
    return request<Notificacao[]>(
      `/api/notificacoes${queryString ? `?${queryString}` : ""}`
    );
  },

  porUsuario: (userId: string, filtro?: "NAO_LIDAS" | "LIDAS" | "TODAS") => {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    const queryString = params.toString();
    return request<Notificacao[]>(
      `/api/notificacoes/usuario/${userId}${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: (id: string) =>
    request<Notificacao>(`/api/notificacoes/${id}`),

  create: (data: Omit<Notificacao, "id" | "createdAt" | "updatedAt" | "lida" | "dataLeitura" | "enviadaEmail" | "enviadaSMS" | "enviadaPush">) =>
    request<Notificacao>("/api/notificacoes", {
      method: "POST",
      body: data,
    }),

  createBulk: (data: {
    userIds: string[];
    titulo: string;
    mensagem: string;
    tipo: string;
    prioridade?: string;
    canais: string;
    link?: string;
    acaoTipo?: string;
    acaoId?: string;
  }) =>
    request<Notificacao[]>("/api/notificacoes/bulk", {
      method: "POST",
      body: data,
    }),

  marcarLida: (id: string) =>
    request<Notificacao>(`/api/notificacoes/${id}/marcar-lida`, {
      method: "POST",
    }),

  marcarTodasLidas: (userId: string) =>
    request<{ message: string; count: number }>(`/api/notificacoes/usuario/${userId}/marcar-todas-lidas`, {
      method: "POST",
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/notificacoes/${id}`, {
      method: "DELETE",
    }),

  deletarLidas: (userId: string) =>
    request<{ message: string; count: number }>(`/api/notificacoes/usuario/${userId}/lidas`, {
      method: "DELETE",
    }),

  countNaoLidas: (userId: string) =>
    request<{ count: number }>(`/api/notificacoes/usuario/${userId}/count-nao-lidas`),

  estatisticas: (userId?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    const queryString = params.toString();
    return request<any>(
      `/api/notificacoes/relatorios/estatisticas${queryString ? `?${queryString}` : ""}`
    );
  },

  atualizarStatusEnvio: (id: string, canal: "EMAIL" | "SMS" | "PUSH", enviado: boolean) =>
    request<Notificacao>(`/api/notificacoes/${id}/status-envio`, {
      method: "PUT",
      body: { canal, enviado },
    }),
};

export { ApiError };
