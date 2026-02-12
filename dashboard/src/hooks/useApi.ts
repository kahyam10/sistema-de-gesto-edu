"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  etapasApi,
  seriesApi,
  escolasApi,
  turmasApi,
  gradeHorariaApi,
  matriculasApi,
  profissionaisApi,
  modulesApi,
  phasesApi,
  salasApi,
  calendarioApi,
  frequenciaApi,
  uploadApi,
  disciplinasApi,
  configuracaoAvaliacaoApi,
  avaliacoesApi,
  notasApi,
  pontosApi,
  licencasApi,
  EtapaEnsino,
  Serie,
  Escola,
  Turma,
  Matricula,
  ProfissionalEducacao,
  Module,
  SubModule,
  Phase,
  Frequencia,
  EstatisticasFrequencia,
  AlunoComBaixaFrequencia,
  Disciplina,
  ConfiguracaoAvaliacao,
  Avaliacao,
  Nota,
  Boletim,
  Ponto,
  RelatorioMensal,
  Licenca,
  RelatorioLicencas,
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

export function useVagasResumo(escolaId?: string, anoLetivo?: number) {
  return useQuery({
    queryKey: ["turmas", "vagas-resumo", escolaId, anoLetivo],
    queryFn: () => turmasApi.getVagasResumo(escolaId, anoLetivo),
  });
}

export function useTurma(id: string) {
  return useQuery({
    queryKey: ["turmas", id],
    queryFn: () => turmasApi.get(id),
    enabled: !!id,
  });
}

// ==================== GRADE HORÁRIA ====================

export function useGradeHoraria(turmaId?: string) {
  return useQuery({
    queryKey: ["grade-horaria", turmaId],
    queryFn: () => gradeHorariaApi.list({ turmaId }),
    enabled: !!turmaId,
  });
}

export function useGradeHorariaByProfissional(profissionalId?: string) {
  return useQuery({
    queryKey: ["grade-horaria", "profissional", profissionalId],
    queryFn: () => gradeHorariaApi.list({ profissionalId }),
    enabled: !!profissionalId,
  });
}

export function useCargaHorariaResumo(profissionalId?: string) {
  return useQuery({
    queryKey: ["grade-horaria", "carga", profissionalId],
    queryFn: () => gradeHorariaApi.getCargaResumo(profissionalId),
    enabled: profissionalId === undefined ? true : !!profissionalId,
  });
}

export function useCargaHorariaPorEscola() {
  return useQuery({
    queryKey: ["grade-horaria", "carga", "escola"],
    queryFn: () => gradeHorariaApi.getCargaResumoPorEscola(),
  });
}

export function useCargaHorariaPorTurma() {
  return useQuery({
    queryKey: ["grade-horaria", "carga", "turma"],
    queryFn: () => gradeHorariaApi.getCargaResumoPorTurma(),
  });
}

export function useCreateGradeHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof gradeHorariaApi.create>[0]) =>
      gradeHorariaApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["grade-horaria", variables.turmaId],
      });
      toast.success("Horário adicionado à grade!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar horário");
    },
  });
}

export function useUpdateGradeHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof gradeHorariaApi.update>[1];
    }) => gradeHorariaApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["grade-horaria", data.turmaId],
      });
      toast.success("Horário atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar horário");
    },
  });
}

export function useDeleteGradeHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, turmaId }: { id: string; turmaId: string }) =>
      gradeHorariaApi.delete(id).then(() => ({ turmaId })),
    onSuccess: ({ turmaId }) => {
      queryClient.invalidateQueries({
        queryKey: ["grade-horaria", turmaId],
      });
      toast.success("Horário removido!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover horário");
    },
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

export function useMatriculasEstatisticas(anoLetivo: number, escolaId?: string) {
  return useQuery({
    queryKey: ["matriculas", "estatisticas", anoLetivo, escolaId],
    queryFn: () => matriculasApi.getEstatisticas(anoLetivo, escolaId),
    enabled: !!anoLetivo,
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

export function useCancelarMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matriculasApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      toast.success("Matrícula cancelada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar matrícula");
    },
  });
}

export function useConfirmarMatricula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, turmaId }: { id: string; turmaId: string }) =>
      matriculasApi.confirmar(id, turmaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Matrícula confirmada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao confirmar matrícula");
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
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Matrícula transferida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao transferir matrícula");
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

export function useLotacaoResumo(escolaId?: string) {
  return useQuery({
    queryKey: ["profissionais", "lotacao", escolaId],
    queryFn: () => profissionaisApi.getLotacaoResumo(escolaId),
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

// ==================== FREQUÊNCIA ====================

export function useFrequencias(params?: {
  turmaId?: string;
  matriculaId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery({
    queryKey: ["frequencias", params],
    queryFn: () => frequenciaApi.list(params),
    enabled: !!(params?.turmaId || params?.matriculaId),
  });
}

export function useFrequencia(id: string | undefined) {
  return useQuery({
    queryKey: ["frequencias", id],
    queryFn: () => frequenciaApi.get(id!),
    enabled: !!id,
  });
}

export function useFrequenciasPorData(turmaId: string, data: string) {
  return useQuery({
    queryKey: ["frequencias", "turma", turmaId, "data", data],
    queryFn: () => frequenciaApi.buscarPorData(turmaId, data),
    enabled: !!turmaId && !!data,
  });
}

export function useEstatisticasFrequencia(
  matriculaId: string | undefined,
  turmaId: string | undefined,
  dataInicio?: string,
  dataFim?: string
) {
  return useQuery({
    queryKey: ["frequencias", "estatisticas", matriculaId, turmaId, dataInicio, dataFim],
    queryFn: () => frequenciaApi.getEstatisticas(matriculaId!, turmaId!, dataInicio, dataFim),
    enabled: !!matriculaId && !!turmaId,
  });
}

export function useAlunosBaixaFrequencia(
  turmaId: string | undefined,
  dataInicio?: string,
  dataFim?: string
) {
  return useQuery({
    queryKey: ["frequencias", "baixa-frequencia", turmaId, dataInicio, dataFim],
    queryFn: () => frequenciaApi.listarBaixaFrequencia(turmaId!, dataInicio, dataFim),
    enabled: !!turmaId,
  });
}

export function useResumoFrequenciaTurma(
  turmaId: string | undefined,
  dataInicio?: string,
  dataFim?: string
) {
  return useQuery({
    queryKey: ["frequencias", "resumo-turma", turmaId, dataInicio, dataFim],
    queryFn: () => frequenciaApi.getResumoTurma(turmaId!, dataInicio, dataFim),
    enabled: !!turmaId,
  });
}

export function useCreateFrequencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      matriculaId: string;
      turmaId: string;
      data: string;
      status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
      justificativa?: string;
      observacao?: string;
    }) => frequenciaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias"] });
      toast.success("Frequência registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar frequência");
    },
  });
}

export function useRegistrarFrequenciaTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      turmaId: string;
      data: string;
      presencas: Array<{
        matriculaId: string;
        status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
        justificativa?: string;
        observacao?: string;
      }>;
    }) => frequenciaApi.registrarTurma(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias"] });
      toast.success("Frequência da turma registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar frequência da turma");
    },
  });
}

export function useUpdateFrequencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status?: "PRESENTE" | "FALTA" | "JUSTIFICADA";
        justificativa?: string;
        observacao?: string;
      };
    }) => frequenciaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias"] });
      toast.success("Frequência atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar frequência");
    },
  });
}

export function useDeleteFrequencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => frequenciaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias"] });
      toast.success("Frequência removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover frequência");
    },
  });
}

// ==================== UPLOAD DE DOCUMENTOS ====================

export function useDocumentosMatricula(matriculaId: string | undefined) {
  return useQuery({
    queryKey: ["documentos", matriculaId],
    queryFn: () => uploadApi.getDocumentos(matriculaId!),
    enabled: !!matriculaId,
  });
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matriculaId,
      file,
      tipo,
    }: {
      matriculaId: string;
      file: File;
      tipo: string;
    }) => uploadApi.uploadDocumento(matriculaId, file, tipo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documentos", variables.matriculaId],
      });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      toast.success("Documento enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar documento");
    },
  });
}

// ==================== DISCIPLINAS ====================

export function useDisciplinas(filters?: { etapaId?: string; ativo?: boolean }) {
  return useQuery({
    queryKey: ["disciplinas", filters],
    queryFn: () => disciplinasApi.list(filters),
  });
}

export function useDisciplinasByEtapa(etapaId: string | undefined) {
  return useQuery({
    queryKey: ["disciplinas", "etapa", etapaId],
    queryFn: () => disciplinasApi.getByEtapa(etapaId!),
    enabled: !!etapaId,
  });
}

export function useCreateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof disciplinasApi.create>[0]) =>
      disciplinasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
      toast.success("Disciplina cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar disciplina");
    },
  });
}

export function useUpdateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof disciplinasApi.update>[1];
    }) => disciplinasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
      toast.success("Disciplina atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar disciplina");
    },
  });
}

export function useDeleteDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => disciplinasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinas"] });
      toast.success("Disciplina removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover disciplina");
    },
  });
}

// ==================== CONFIGURAÇÃO DE AVALIAÇÃO ====================

export function useConfiguracoesAvaliacao(filters?: {
  anoLetivo?: number;
  escolaId?: string;
  etapaId?: string;
}) {
  return useQuery({
    queryKey: ["configuracoes-avaliacao", filters],
    queryFn: () => configuracaoAvaliacaoApi.list(filters),
  });
}

export function useCreateConfiguracaoAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof configuracaoAvaliacaoApi.create>[0]) =>
      configuracaoAvaliacaoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-avaliacao"] });
      toast.success("Configuração criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar configuração");
    },
  });
}

export function useUpdateConfiguracaoAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof configuracaoAvaliacaoApi.update>[1];
    }) => configuracaoAvaliacaoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-avaliacao"] });
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar configuração");
    },
  });
}

export function useDeleteConfiguracaoAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => configuracaoAvaliacaoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-avaliacao"] });
      toast.success("Configuração removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover configuração");
    },
  });
}

// ==================== AVALIAÇÕES ====================

export function useAvaliacoes(filters?: {
  turmaId?: string;
  disciplinaId?: string;
  bimestre?: number;
}) {
  return useQuery({
    queryKey: ["avaliacoes", filters],
    queryFn: () => avaliacoesApi.list(filters),
    enabled: !!(filters?.turmaId),
  });
}

export function useAvaliacao(id: string | undefined) {
  return useQuery({
    queryKey: ["avaliacoes", id],
    queryFn: () => avaliacoesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof avaliacoesApi.create>[0]) =>
      avaliacoesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast.success("Avaliação criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar avaliação");
    },
  });
}

export function useUpdateAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof avaliacoesApi.update>[1];
    }) => avaliacoesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast.success("Avaliação atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar avaliação");
    },
  });
}

export function useDeleteAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => avaliacoesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast.success("Avaliação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover avaliação");
    },
  });
}

// ==================== NOTAS ====================

export function useNotas(filters?: {
  turmaId?: string;
  disciplina?: string;
  matriculaId?: string;
  bimestre?: number;
}) {
  return useQuery({
    queryKey: ["notas", filters],
    queryFn: () => notasApi.list(filters),
    enabled: !!filters,
  });
}

export function useCreateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof notasApi.create>[0]) =>
      notasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas"] });
      queryClient.invalidateQueries({ queryKey: ["boletim"] });
      toast.success("Nota criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar nota");
    },
  });
}

export function useLancarNotasTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof notasApi.lancarTurma>[0]) =>
      notasApi.lancarTurma(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["notas"] });
      queryClient.invalidateQueries({ queryKey: ["boletim"] });
      toast.success("Notas lançadas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao lançar notas");
    },
  });
}

export function useUpdateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { valor?: number; observacao?: string };
    }) => notasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["notas"] });
      queryClient.invalidateQueries({ queryKey: ["boletim"] });
      toast.success("Nota atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar nota");
    },
  });
}

export function useDeleteNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["notas"] });
      queryClient.invalidateQueries({ queryKey: ["boletim"] });
      toast.success("Nota removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover nota");
    },
  });
}

// ==================== BOLETIM ====================

export function useBoletim(matriculaId: string | undefined, turmaId?: string) {
  return useQuery({
    queryKey: ["boletim", matriculaId, turmaId],
    queryFn: () => notasApi.getBoletim(matriculaId!, turmaId),
    enabled: !!matriculaId,
  });
}

// ==================== PONTO DIGITAL ====================

export function usePontos(filters?: {
  profissionalId?: string;
  escolaId?: string;
  dataInicio?: string;
  dataFim?: string;
  tipoRegistro?: string;
}) {
  return useQuery({
    queryKey: ["pontos", filters],
    queryFn: () => pontosApi.list(filters),
  });
}

export function usePonto(id: string) {
  return useQuery({
    queryKey: ["pontos", id],
    queryFn: () => pontosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Ponto>) => pontosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos"] });
      toast.success("Ponto registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar ponto");
    },
  });
}

export function useRegistrarPonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      profissionalId: string;
      escolaId?: string;
      tipo: "ENTRADA" | "SAIDA" | "ENTRADA2" | "SAIDA2";
      horario: string;
      latitude?: number;
      longitude?: number;
    }) => pontosApi.registrar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos"] });
      toast.success("Ponto registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar ponto");
    },
  });
}

export function useUpdatePonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ponto> }) =>
      pontosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos"] });
      toast.success("Ponto atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar ponto");
    },
  });
}

export function useDeletePonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pontosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos"] });
      toast.success("Ponto removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover ponto");
    },
  });
}

export function useRelatorioMensal(
  profissionalId: string | undefined,
  mes: number,
  ano: number
) {
  return useQuery({
    queryKey: ["relatorio-mensal", profissionalId, mes, ano],
    queryFn: () => pontosApi.relatorioMensal(profissionalId!, mes, ano),
    enabled: !!profissionalId,
  });
}

// ==================== LICENÇAS ====================

export function useLicencas(filters?: {
  profissionalId?: string;
  status?: string;
  tipo?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery({
    queryKey: ["licencas", filters],
    queryFn: () => licencasApi.list(filters),
  });
}

export function useLicenca(id: string) {
  return useQuery({
    queryKey: ["licencas", id],
    queryFn: () => licencasApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLicenca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Licenca>) => licencasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licencas"] });
      toast.success("Licença solicitada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao solicitar licença");
    },
  });
}

export function useUpdateLicenca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Licenca> }) =>
      licencasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licencas"] });
      toast.success("Licença atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar licença");
    },
  });
}

export function useAprovarLicenca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        aprovadaPor: string;
        status: "APROVADA" | "REJEITADA";
        justificativaRejeicao?: string;
      };
    }) => licencasApi.aprovar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licencas"] });
      toast.success("Licença processada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao processar licença");
    },
  });
}

export function useCancelarLicenca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => licencasApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licencas"] });
      toast.success("Licença cancelada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar licença");
    },
  });
}

export function useDeleteLicenca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => licencasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licencas"] });
      toast.success("Licença removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover licença");
    },
  });
}

export function useLicencasAtivas() {
  return useQuery({
    queryKey: ["licencas", "ativas"],
    queryFn: () => licencasApi.listAtivas(),
  });
}

export function useRelatorioLicencas(
  profissionalId: string | undefined,
  anoInicio?: number,
  anoFim?: number
) {
  return useQuery({
    queryKey: ["relatorio-licencas", profissionalId, anoInicio, anoFim],
    queryFn: () => licencasApi.relatorio(profissionalId!, anoInicio, anoFim),
    enabled: !!profissionalId,
  });
}
