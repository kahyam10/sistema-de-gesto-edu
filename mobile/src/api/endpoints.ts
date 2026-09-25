import { api } from "./client";
import type {
  AlunoVinculado, Boletim, Chamada, Comunicado, FrequenciaAluno, NotasDaTurma,
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
  comunicados: () => api<Comunicado[]>("/api/portal/meu/comunicados"),
  confirmarComunicado: (id: string) => api<unknown>(`/api/comunicados/${id}/confirmar`, { method: "POST", body: {} }),
};
