import { api } from "./client";
import type {
  Agenda, CardapioSemana, EscolaContato, MeusDados, Notificacao,
  AlunosDaTurma, AlunoVinculado, Boletim, Chamada, Comunicado, FrequenciaAluno, NotasDaTurma,
  ResumoProfessor, StatusFrequencia, TokensResposta, Usuario,
} from "./types";

// ---------- Sessão ----------
export const authApi = {
  login: (email: string, password: string) =>
    api<TokensResposta>("/api/auth/mobile/login", { method: "POST", body: { email, password }, auth: false }),
  logout: (refreshToken: string) =>
    api<void>("/api/auth/mobile/logout", { method: "POST", body: { refreshToken }, auth: false }),
  me: () => api<{ user: Usuario }>("/api/auth/me"),
};

// ---------- Professor ----------
export const professorApi = {
  resumo: () => api<ResumoProfessor>("/api/portal/professor/resumo"),
  chamada: (turmaId: string, data: string) =>
    api<Chamada>(`/api/portal/professor/turmas/${turmaId}/chamada?data=${data}`),
  salvarChamada: (
    turmaId: string,
    data: string,
    presencas: Array<{ matriculaId: string; status: StatusFrequencia }>
  ) => api<{ message: string }>("/api/frequencia/turma", { method: "POST", body: { turmaId, data, presencas } }),
  alunos: (turmaId: string) => api<AlunosDaTurma>(`/api/portal/professor/turmas/${turmaId}/alunos`),
  notas: (turmaId: string) => api<NotasDaTurma>(`/api/portal/professor/turmas/${turmaId}/notas`),
  criarAvaliacao: (dados: {
    nome: string;
    tipo: "PROVA" | "TRABALHO" | "ATIVIDADE" | "PARTICIPACAO" | "RECUPERACAO";
    bimestre: number;
    data: string;
    valorMaximo: number;
    peso: number;
    turmaId: string;
    disciplinaId: string;
  }) => api<{ id: string }>("/api/avaliacoes", { method: "POST", body: dados }),
  lancarNotas: (avaliacaoId: string, notas: Array<{ matriculaId: string; valor: number }>) =>
    api<unknown>("/api/notas/turma", { method: "POST", body: { avaliacaoId, notas } }),
};

// ---------- Responsável ----------
export const responsavelApi = {
  alunos: () => api<AlunoVinculado[]>("/api/portal/meu/alunos"),
  boletim: (matriculaId: string) => api<Boletim>(`/api/portal/meu/alunos/${matriculaId}/boletim`),
  frequencia: (matriculaId: string) => api<FrequenciaAluno>(`/api/portal/meu/alunos/${matriculaId}/frequencia`),
};

// ---------- Comum (pais e professores): sempre do usuário da sessão ----------
export const comumApi = {
  comunicados: () => api<Comunicado[]>("/api/portal/meu/comunicados"),
  marcarLido: (id: string) => api<unknown>(`/api/comunicados/${id}/marcar-lido`, { method: "POST", body: {} }),
  confirmarComunicado: (id: string) => api<unknown>(`/api/comunicados/${id}/confirmar`, { method: "POST", body: {} }),
  agenda: (dias = 60) => api<Agenda>(`/api/portal/meu/agenda?dias=${dias}`),
  cardapio: () => api<CardapioSemana>("/api/portal/meu/cardapio"),
  escolas: () => api<EscolaContato[]>("/api/portal/meu/escolas"),
  meusDados: () => api<MeusDados>("/api/portal/meu/dados"),
  // A API confere que o :userId é o da sessão (PERM_004)
  notificacoes: (userId: string) => api<Notificacao[]>(`/api/notificacoes/usuario/${encodeURIComponent(userId)}`),
  marcarNotificacaoLida: (id: string) => api<unknown>(`/api/notificacoes/${encodeURIComponent(id)}/marcar-lida`, { method: "POST", body: {} }),
  marcarTodasLidas: (userId: string) =>
    api<unknown>(`/api/notificacoes/usuario/${encodeURIComponent(userId)}/marcar-todas-lidas`, { method: "POST", body: {} }),
};
