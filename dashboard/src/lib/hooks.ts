import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  etapasApi,
  seriesApi,
  escolasApi,
  turmasApi,
  matriculasApi,
  profissionaisApi,
  authApi,
  type EtapaEnsino,
  type Serie,
  type Escola,
  type Turma,
  type Matricula,
  type ProfissionalEducacao,
  type CreateMatriculaData,
} from "./api";

// ==================== AUTH HOOKS ====================

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      nome: string;
      role?: string;
      escolaId?: string;
    }) => authApi.register(data),
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: authApi.me,
    enabled: !!localStorage.getItem("auth_token"),
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem("auth_token");
    queryClient.clear();
  };
}

// ==================== ETAPAS HOOKS ====================

export function useEtapas() {
  return useQuery({
    queryKey: ["etapas"],
    queryFn: etapasApi.list,
  });
}

export function useEtapa(id: string) {
  return useQuery({
    queryKey: ["etapas", id],
    queryFn: () => etapasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { nome: string; descricao?: string; ordem: number }) =>
      etapasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
    },
  });
}

export function useUpdateEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EtapaEnsino> }) =>
      etapasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
    },
  });
}

export function useDeleteEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => etapasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
    },
  });
}

// ==================== SÉRIES HOOKS ====================

export function useSeries() {
  return useQuery({
    queryKey: ["series"],
    queryFn: seriesApi.list,
  });
}

export function useSerie(id: string) {
  return useQuery({
    queryKey: ["series", id],
    queryFn: () => seriesApi.get(id),
    enabled: !!id,
  });
}

export function useSeriesByEtapa(etapaId: string) {
  return useQuery({
    queryKey: ["series", "etapa", etapaId],
    queryFn: () => seriesApi.getByEtapa(etapaId),
    enabled: !!etapaId,
  });
}

export function useCreateSerie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { nome: string; ordem: number; etapaId: string }) =>
      seriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

export function useUpdateSerie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Serie> }) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

export function useDeleteSerie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

// ==================== ESCOLAS HOOKS ====================

export function useEscolas() {
  return useQuery({
    queryKey: ["escolas"],
    queryFn: escolasApi.list,
  });
}

export function useEscola(id: string) {
  return useQuery({
    queryKey: ["escolas", id],
    queryFn: () => escolasApi.get(id),
    enabled: !!id,
  });
}

export function useEscolaEstatisticas(id: string) {
  return useQuery({
    queryKey: ["escolas", id, "estatisticas"],
    queryFn: () => escolasApi.getEstatisticas(id),
    enabled: !!id,
  });
}

export function useCreateEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof escolasApi.create>[0]) =>
      escolasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
    },
  });
}

export function useUpdateEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Escola> & { etapasIds?: string[] };
    }) => escolasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
    },
  });
}

export function useDeleteEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => escolasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
    },
  });
}

// ==================== TURMAS HOOKS ====================

export function useTurmas(filters?: {
  escolaId?: string;
  anoLetivo?: number;
  ativo?: boolean;
}) {
  return useQuery({
    queryKey: ["turmas", filters],
    queryFn: () => turmasApi.list(filters),
  });
}

export function useTurma(id: string) {
  return useQuery({
    queryKey: ["turmas", id],
    queryFn: () => turmasApi.get(id),
    enabled: !!id,
  });
}

export function useTurmaEstatisticas(id: string) {
  return useQuery({
    queryKey: ["turmas", id, "estatisticas"],
    queryFn: () => turmasApi.getEstatisticas(id),
    enabled: !!id,
  });
}

export function useTurmasByEscola(escolaId: string, anoLetivo?: number) {
  return useQuery({
    queryKey: ["turmas", "escola", escolaId, anoLetivo],
    queryFn: () => turmasApi.getByEscola(escolaId, anoLetivo),
    enabled: !!escolaId,
  });
}

export function useCreateTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof turmasApi.create>[0]) =>
      turmasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export function useUpdateTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Turma> }) =>
      turmasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export function useDeleteTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => turmasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export function useAddAlunoTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      turmaId,
      matriculaId,
    }: {
      turmaId: string;
      matriculaId: string;
    }) => turmasApi.addAluno(turmaId, matriculaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useRemoveAlunoTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      turmaId,
      matriculaId,
    }: {
      turmaId: string;
      matriculaId: string;
    }) => turmasApi.removeAluno(turmaId, matriculaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useAddProfessorTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      turmaId,
      data,
    }: {
      turmaId: string;
      data: { profissionalId: string; tipo: string; disciplina?: string };
    }) => turmasApi.addProfessor(turmaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export function useRemoveProfessorTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      turmaId,
      profissionalId,
    }: {
      turmaId: string;
      profissionalId: string;
    }) => turmasApi.removeProfessor(turmaId, profissionalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

// ==================== MATRÍCULAS HOOKS ====================

export function useMatriculas(filters?: {
  escolaId?: string;
  etapaId?: string;
  turmaId?: string;
  anoLetivo?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["matriculas", filters],
    queryFn: () => matriculasApi.list(filters),
  });
}

export function useMatricula(id: string) {
  return useQuery({
    queryKey: ["matriculas", id],
    queryFn: () => matriculasApi.get(id),
    enabled: !!id,
  });
}

export function useMatriculasSemTurma(escolaId?: string, anoLetivo?: number) {
  return useQuery({
    queryKey: ["matriculas", "sem-turma", escolaId, anoLetivo],
    queryFn: () => matriculasApi.getSemTurma(escolaId, anoLetivo),
  });
}

export function useMatriculaEstatisticas(anoLetivo: number, escolaId?: string) {
  return useQuery({
    queryKey: ["matriculas", "estatisticas", anoLetivo, escolaId],
    queryFn: () => matriculasApi.getEstatisticas(anoLetivo, escolaId),
  });
}

export function useCreateMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMatriculaData) => matriculasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useUpdateMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Matricula> }) =>
      matriculasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useDeleteMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matriculasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useCancelarMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matriculasApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useTransferirMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      escolaId,
      turmaId,
    }: {
      id: string;
      escolaId: string;
      turmaId?: string;
    }) => matriculasApi.transferir(id, escolaId, turmaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

// ==================== PROFISSIONAIS HOOKS ====================

export function useProfissionais(filters?: { tipo?: string; ativo?: boolean }) {
  return useQuery({
    queryKey: ["profissionais", filters],
    queryFn: () => profissionaisApi.list(filters),
  });
}

export function useProfissional(id: string) {
  return useQuery({
    queryKey: ["profissionais", id],
    queryFn: () => profissionaisApi.get(id),
    enabled: !!id,
  });
}

export function useProfissionaisByEscola(escolaId: string) {
  return useQuery({
    queryKey: ["profissionais", "escola", escolaId],
    queryFn: () => profissionaisApi.getByEscola(escolaId),
    enabled: !!escolaId,
  });
}

export function useCreateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof profissionaisApi.create>[0]) =>
      profissionaisApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });
}

export function useUpdateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProfissionalEducacao> & { escolasIds?: string[] };
    }) => profissionaisApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });
}

export function useDeleteProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profissionaisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });
}

export function useVincularProfissionalEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profissionalId,
      escolaId,
      funcao,
      cargaHoraria,
    }: {
      profissionalId: string;
      escolaId: string;
      funcao?: string;
      cargaHoraria?: number;
    }) =>
      profissionaisApi.vincularEscola(
        profissionalId,
        escolaId,
        funcao,
        cargaHoraria
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });
}

export function useDesvincularProfissionalEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profissionalId,
      escolaId,
    }: {
      profissionalId: string;
      escolaId: string;
    }) => profissionaisApi.desvincularEscola(profissionalId, escolaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
  });
}
