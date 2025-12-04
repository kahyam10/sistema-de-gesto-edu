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
  phasesApi,
  salasApi,
  calendarioApi,
  EtapaEnsino,
  Serie,
  Escola,
  Turma,
  Matricula,
  ProfissionalEducacao,
  Module,
  SubModule,
  Phase,
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
        quantidadeSalas?: number;
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

export function useProfissionaisByEscola(escolaId: string) {
  return useQuery({
    queryKey: ["profissionais", "escola", escolaId],
    queryFn: () => profissionaisApi.getByEscola(escolaId),
    enabled: !!escolaId,
  });
}

// ==================== FORMAÇÕES ====================

export function useFormacoes(profissionalId: string) {
  return useQuery({
    queryKey: ["formacoes", profissionalId],
    queryFn: () => profissionaisApi.getFormacoes(profissionalId),
    enabled: !!profissionalId,
  });
}

export function useAddFormacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profissionalId,
      data,
    }: {
      profissionalId: string;
      data: {
        tipo: string;
        nome: string;
        instituicao?: string;
        anoConclusao?: number;
        cargaHoraria?: number;
        emAndamento?: boolean;
      };
    }) => profissionaisApi.addFormacao(profissionalId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["formacoes", variables.profissionalId],
      });
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      toast.success("Formação adicionada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar formação");
    },
  });
}

export function useUpdateFormacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profissionalId,
      formacaoId,
      data,
    }: {
      profissionalId: string;
      formacaoId: string;
      data: Partial<{
        tipo: string;
        nome: string;
        instituicao?: string;
        anoConclusao?: number;
        cargaHoraria?: number;
        emAndamento?: boolean;
      }>;
    }) => profissionaisApi.updateFormacao(profissionalId, formacaoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["formacoes", variables.profissionalId],
      });
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      toast.success("Formação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar formação");
    },
  });
}

export function useDeleteFormacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profissionalId,
      formacaoId,
    }: {
      profissionalId: string;
      formacaoId: string;
    }) => profissionaisApi.deleteFormacao(profissionalId, formacaoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["formacoes", variables.profissionalId],
      });
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      toast.success("Formação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover formação");
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
        observacao?: string;
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
        observacao: string;
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

// ==================== PHASES (CRONOGRAMA) ====================

export function usePhases() {
  return useQuery({
    queryKey: ["phases"],
    queryFn: () => phasesApi.list(),
  });
}

export function usePhase(id: string) {
  return useQuery({
    queryKey: ["phases", id],
    queryFn: () => phasesApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      monthRange: string;
      duration: string;
      ordem?: number;
      status?: string;
      moduleIds?: string[];
    }) => phasesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast.success("Fase criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar fase");
    },
  });
}

export function useUpdatePhase() {
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
        monthRange: string;
        duration: string;
        ordem: number;
        status: string;
        moduleIds: string[];
      }>;
    }) => phasesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast.success("Fase atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar fase");
    },
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => phasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast.success("Fase removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover fase");
    },
  });
}

// ==================== SALAS ====================

export function useSalasByEscola(escolaId: string | undefined) {
  return useQuery({
    queryKey: ["salas", "escola", escolaId],
    queryFn: () => salasApi.listByEscola(escolaId!),
    enabled: !!escolaId,
  });
}

export function useSala(id: string | undefined) {
  return useQuery({
    queryKey: ["salas", id],
    queryFn: () => salasApi.get(id!),
    enabled: !!id,
  });
}

export function useSalaEstatisticas(escolaId: string | undefined) {
  return useQuery({
    queryKey: ["salas", "estatisticas", escolaId],
    queryFn: () => salasApi.getEstatisticas(escolaId!),
    enabled: !!escolaId,
  });
}

export function useCreateSala() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      escolaId,
      data,
    }: {
      escolaId: string;
      data: {
        nome: string;
        tipo:
          | "AULA"
          | "INFORMATICA"
          | "LEITURA"
          | "LABORATORIO"
          | "MULTIUSO"
          | "AEE";
        capacidade?: number;
        andar?: number;
        possuiArCondicionado?: boolean;
        possuiVentilador?: boolean;
        possuiTV?: boolean;
        possuiProjetor?: boolean;
        possuiQuadro?: boolean;
        metragem?: number | null;
        acessivel?: boolean;
        observacoes?: string | null;
        ativo?: boolean;
      };
    }) => salasApi.create(escolaId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["salas", "escola", variables.escolaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["salas", "estatisticas", variables.escolaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["escolas", variables.escolaId],
      });
      toast.success("Sala criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar sala");
    },
  });
}

export function useUpdateSala() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      escolaId,
      data,
    }: {
      id: string;
      escolaId: string;
      data: Partial<{
        nome: string;
        tipo:
          | "AULA"
          | "INFORMATICA"
          | "LEITURA"
          | "LABORATORIO"
          | "MULTIUSO"
          | "AEE";
        capacidade: number;
        andar: number;
        possuiArCondicionado: boolean;
        possuiVentilador: boolean;
        possuiTV: boolean;
        possuiProjetor: boolean;
        possuiQuadro: boolean;
        metragem: number | null;
        acessivel: boolean;
        observacoes: string | null;
        ativo: boolean;
      }>;
    }) => salasApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["salas", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["salas", "escola", variables.escolaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["salas", "estatisticas", variables.escolaId],
      });
      toast.success("Sala atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar sala");
    },
  });
}

export function useDeleteSala() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, escolaId }: { id: string; escolaId: string }) =>
      salasApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["salas", "escola", variables.escolaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["salas", "estatisticas", variables.escolaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["escolas", variables.escolaId],
      });
      toast.success("Sala removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover sala");
    },
  });
}

// ==================== CALENDÁRIO LETIVO ====================

// Cache times para o calendário (em ms)
const CALENDARIO_STALE_TIME = 1000 * 60 * 5; // 5 minutos
const CALENDARIO_CACHE_TIME = 1000 * 60 * 30; // 30 minutos

export function useAnosLetivos() {
  return useQuery({
    queryKey: ["anos-letivos"],
    queryFn: () => calendarioApi.listAnosLetivos(),
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}

export function useAnoLetivoAtivo() {
  return useQuery({
    queryKey: ["anos-letivos", "ativo"],
    queryFn: () => calendarioApi.getAnoLetivoAtivo(),
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}

export function useAnoLetivo(id: string) {
  return useQuery({
    queryKey: ["anos-letivos", id],
    queryFn: () => calendarioApi.getAnoLetivo(id),
    enabled: !!id,
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}

export function useCreateAnoLetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { ano: number; ativo?: boolean }) =>
      calendarioApi.createAnoLetivo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anos-letivos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-calendario"] });
      toast.success("Ano letivo criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar ano letivo");
    },
  });
}

export function useUpdateAnoLetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        ano: number;
        ativo: boolean;
      }>;
    }) => calendarioApi.updateAnoLetivo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anos-letivos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-calendario"] });
      toast.success("Ano letivo atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar ano letivo");
    },
  });
}

export function useDeleteAnoLetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => calendarioApi.deleteAnoLetivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anos-letivos"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-calendario"] });
      toast.success("Ano letivo removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover ano letivo");
    },
  });
}

// Eventos
export function useEventos(anoLetivoId: string, escolaId?: string) {
  return useQuery({
    queryKey: ["eventos", anoLetivoId, escolaId],
    queryFn: () => calendarioApi.getEventos(anoLetivoId, escolaId),
    enabled: !!anoLetivoId,
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}

export function useEventosByMes(
  anoLetivoId: string,
  ano: number,
  mes: number,
  escolaId?: string
) {
  return useQuery({
    queryKey: ["eventos", "mes", anoLetivoId, ano, mes, escolaId],
    queryFn: () =>
      calendarioApi.getEventosByMes(anoLetivoId, ano, mes, escolaId),
    enabled: !!anoLetivoId && !!ano && !!mes,
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}

export function useEventosByData(
  anoLetivoId: string,
  data: string,
  escolaId?: string
) {
  return useQuery({
    queryKey: ["eventos", "data", anoLetivoId, data, escolaId],
    queryFn: () => calendarioApi.getEventosByData(anoLetivoId, data, escolaId),
    enabled: !!anoLetivoId && !!data,
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}

export function useCreateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof calendarioApi.createEvento>[0]) =>
      calendarioApi.createEvento(data),
    onSuccess: (_, variables) => {
      // Invalidar todas as queries de eventos
      queryClient.invalidateQueries({
        queryKey: ["eventos"],
      });
      queryClient.invalidateQueries({ queryKey: ["anos-letivos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-calendario"] });
      toast.success("Evento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar evento");
    },
  });
}

export function useUpdateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      anoLetivoId,
    }: {
      id: string;
      data: Parameters<typeof calendarioApi.updateEvento>[1];
      anoLetivoId: string;
    }) => calendarioApi.updateEvento(id, data),
    onSuccess: () => {
      // Invalidar todas as queries de eventos
      queryClient.invalidateQueries({
        queryKey: ["eventos"],
      });
      queryClient.invalidateQueries({ queryKey: ["anos-letivos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-calendario"] });
      toast.success("Evento atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar evento");
    },
  });
}

export function useDeleteEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, anoLetivoId }: { id: string; anoLetivoId: string }) =>
      calendarioApi.deleteEvento(id),
    onSuccess: () => {
      // Invalidar todas as queries de eventos
      queryClient.invalidateQueries({
        queryKey: ["eventos"],
      });
      queryClient.invalidateQueries({ queryKey: ["anos-letivos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-calendario"] });
      toast.success("Evento removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover evento");
    },
  });
}

export function useEstatisticasCalendario(
  anoLetivoId: string,
  escolaId?: string
) {
  return useQuery({
    queryKey: ["estatisticas-calendario", anoLetivoId, escolaId],
    queryFn: () => calendarioApi.getEstatisticas(anoLetivoId, escolaId),
    enabled: !!anoLetivoId,
    staleTime: CALENDARIO_STALE_TIME,
    gcTime: CALENDARIO_CACHE_TIME,
  });
}
