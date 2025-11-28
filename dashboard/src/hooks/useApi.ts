"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  etapasApi,
  seriesApi,
  escolasApi,
  turmasApi,
  matriculasApi,
  profissionaisApi,
  modulesApi,
  EtapaEnsino,
  Serie,
  Escola,
  Turma,
  Matricula,
  ProfissionalEducacao,
  Module,
  SubModule,
} from "@/lib/api";
import { toast } from "sonner";

// ==================== ETAPAS ====================

export function useEtapas() {
  return useQuery({
    queryKey: ["etapas"],
    queryFn: () => etapasApi.list(),
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
      toast.success("Etapa cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar etapa");
    },
  });
}

export function useUpdateEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ nome: string; descricao?: string; ordem: number }>;
    }) => etapasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
      toast.success("Etapa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar etapa");
    },
  });
}

export function useDeleteEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => etapasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
      toast.success("Etapa removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover etapa");
    },
  });
}

// ==================== SÉRIES ====================

export function useSeries() {
  return useQuery({
    queryKey: ["series"],
    queryFn: () => seriesApi.list(),
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
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
      toast.success("Série cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar série");
    },
  });
}

export function useUpdateSerie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ nome: string; ordem: number; etapaId: string }>;
    }) => seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
      toast.success("Série atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar série");
    },
  });
}

export function useDeleteSerie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["etapas"] });
      toast.success("Série removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover série");
    },
  });
}

// ==================== ESCOLAS ====================

export function useEscolas() {
  return useQuery({
    queryKey: ["escolas"],
    queryFn: () => escolasApi.list(),
  });
}

export function useEscola(id: string) {
  return useQuery({
    queryKey: ["escolas", id],
    queryFn: () => escolasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      nome: string;
      codigo: string;
      endereco?: string;
      telefone?: string;
      email?: string;
      ativo?: boolean;
      etapasIds?: string[];
    }) => escolasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Escola cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar escola");
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
      data: Partial<{
        nome: string;
        codigo: string;
        endereco?: string;
        telefone?: string;
        email?: string;
        ativo?: boolean;
        etapasIds?: string[];
      }>;
    }) => escolasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Escola atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar escola");
    },
  });
}

export function useDeleteEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => escolasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Escola removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover escola");
    },
  });
}

// ==================== TURMAS ====================

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

export function useCreateTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      nome: string;
      turno: string;
      anoLetivo: number;
      capacidadeMaxima?: number;
      limitePCD?: number;
      escolaId: string;
      serieId: string;
      ativo?: boolean;
    }) => turmasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Turma cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar turma");
    },
  });
}

export function useUpdateTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        nome: string;
        turno: string;
        anoLetivo: number;
        capacidadeMaxima?: number;
        limitePCD?: number;
        escolaId: string;
        serieId: string;
        ativo?: boolean;
      }>;
    }) => turmasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Turma atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar turma");
    },
  });
}

export function useDeleteTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => turmasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Turma removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover turma");
    },
  });
}

export function useAddAlunoToTurma() {
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
      toast.success("Aluno adicionado à turma!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar aluno à turma");
    },
  });
}

export function useRemoveAlunoFromTurma() {
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
      toast.success("Aluno removido da turma!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover aluno da turma");
    },
  });
}

export function useAddProfessorToTurma() {
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
      toast.success("Profissional adicionado à turma!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar profissional à turma");
    },
  });
}

export function useRemoveProfessorFromTurma() {
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
      toast.success("Profissional removido da turma!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover profissional da turma");
    },
  });
}

export function useMatriculasSemTurma(escolaId?: string, anoLetivo?: number) {
  return useQuery({
    queryKey: ["matriculas", "sem-turma", escolaId, anoLetivo],
    queryFn: () => matriculasApi.getSemTurma(escolaId, anoLetivo),
  });
}

// ==================== MATRÍCULAS ====================

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

export function useCreateMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof matriculasApi.create>[0]) =>
      matriculasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Matrícula realizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao realizar matrícula");
    },
  });
}

export function useUpdateMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Parameters<typeof matriculasApi.create>[0]>;
    }) => matriculasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      toast.success("Matrícula atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar matrícula");
    },
  });
}

export function useDeleteMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matriculasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      toast.success("Matrícula removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover matrícula");
    },
  });
}

// ==================== PROFISSIONAIS ====================

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

export function useCreateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof profissionaisApi.create>[0]) =>
      profissionaisApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      toast.success("Profissional cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar profissional");
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
      data: Partial<Parameters<typeof profissionaisApi.create>[0]>;
    }) => profissionaisApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      toast.success("Profissional atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar profissional");
    },
  });
}

export function useDeleteProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profissionaisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      toast.success("Profissional removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover profissional");
    },
  });
}

// ==================== MÓDULOS ====================

export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: () => modulesApi.list(),
  });
}

export function useModule(id: string) {
  return useQuery({
    queryKey: ["modules", id],
    queryFn: () => modulesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      icon?: string;
      phase?: number;
      status?: string;
      progress?: number;
      ordem?: number;
    }) => modulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Módulo criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar módulo");
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description: string;
        icon: string;
        phase: number;
        status: string;
        progress: number;
        ordem: number;
      }>;
    }) => modulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Módulo atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar módulo");
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => modulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Módulo removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover módulo");
    },
  });
}

export function useCreateSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      data,
    }: {
      moduleId: string;
      data: {
        name: string;
        description: string;
        status?: string;
        ordem?: number;
      };
    }) => modulesApi.createSubModule(moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Sub-módulo criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar sub-módulo");
    },
  });
}

export function useUpdateSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description: string;
        status: string;
        ordem: number;
      }>;
    }) => modulesApi.updateSubModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Sub-módulo atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar sub-módulo");
    },
  });
}

export function useDeleteSubModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => modulesApi.deleteSubModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Sub-módulo removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover sub-módulo");
    },
  });
}

export function useToggleSubModuleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => modulesApi.toggleSubModuleStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success(
        data.status === "completed" ? "Recurso concluído!" : "Recurso reaberto!"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao alternar status");
    },
  });
}
