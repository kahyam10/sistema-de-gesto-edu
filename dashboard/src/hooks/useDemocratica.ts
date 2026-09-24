"use client";

// Hooks TanStack Query do Módulo 8 — Gestão Democrática
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  colegiadosApi,
  gremiosApi,
  lideresTurmaApi,
  reunioesDemocraticasApi,
  type ColegiadoEscolar,
  type GremioEstudantil,
  type LiderTurma,
  type ReuniaoDemocratica,
  type ReuniaoDemocraticaFilters,
} from "@/lib/api-democratica";
import { toast } from "sonner";

// ==================== COLEGIADO ESCOLAR ====================

export function useColegiados(filters?: { escolaId?: string; ativo?: boolean }) {
  return useQuery<ColegiadoEscolar[]>({
    queryKey: ["colegiados", filters],
    queryFn: () => colegiadosApi.list(filters),
  });
}

export function useColegiado(id: string) {
  return useQuery<ColegiadoEscolar>({
    queryKey: ["colegiados", id],
    queryFn: () => colegiadosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateColegiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof colegiadosApi.create>[0]) =>
      colegiadosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegiados"] });
      toast.success("Colegiado cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar colegiado");
    },
  });
}

export function useUpdateColegiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof colegiadosApi.update>[1];
    }) => colegiadosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegiados"] });
      toast.success("Colegiado atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar colegiado");
    },
  });
}

export function useDeleteColegiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => colegiadosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegiados"] });
      toast.success("Colegiado removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover colegiado");
    },
  });
}

export function useAddMembroColegiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      colegiadoId,
      data,
    }: {
      colegiadoId: string;
      data: Parameters<typeof colegiadosApi.addMembro>[1];
    }) => colegiadosApi.addMembro(colegiadoId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["colegiados"] });
      queryClient.invalidateQueries({
        queryKey: ["colegiados", variables.colegiadoId],
      });
      toast.success("Membro adicionado ao colegiado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar membro");
    },
  });
}

export function useUpdateMembroColegiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      membroId,
      data,
    }: {
      membroId: string;
      colegiadoId: string;
      data: Parameters<typeof colegiadosApi.updateMembro>[1];
    }) => colegiadosApi.updateMembro(membroId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["colegiados"] });
      queryClient.invalidateQueries({
        queryKey: ["colegiados", variables.colegiadoId],
      });
      toast.success("Membro atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar membro");
    },
  });
}

export function useRemoveMembroColegiado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ membroId }: { membroId: string; colegiadoId: string }) =>
      colegiadosApi.removeMembro(membroId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["colegiados"] });
      queryClient.invalidateQueries({
        queryKey: ["colegiados", variables.colegiadoId],
      });
      toast.success("Membro removido do colegiado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover membro");
    },
  });
}

// ==================== GRÊMIO ESTUDANTIL ====================

export function useGremios(filters?: {
  escolaId?: string;
  anoLetivo?: number;
  status?: string;
}) {
  return useQuery<GremioEstudantil[]>({
    queryKey: ["gremios", filters],
    queryFn: () => gremiosApi.list(filters),
  });
}

export function useGremio(id: string) {
  return useQuery<GremioEstudantil>({
    queryKey: ["gremios", id],
    queryFn: () => gremiosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof gremiosApi.create>[0]) =>
      gremiosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      toast.success("Grêmio cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar grêmio");
    },
  });
}

export function useUpdateGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof gremiosApi.update>[1];
    }) => gremiosApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({ queryKey: ["gremios", variables.id] });
      toast.success("Grêmio atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar grêmio");
    },
  });
}

export function useDeleteGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gremiosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      toast.success("Grêmio removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover grêmio");
    },
  });
}

export function useAddChapaGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gremioId,
      data,
    }: {
      gremioId: string;
      data: Parameters<typeof gremiosApi.addChapa>[1];
    }) => gremiosApi.addChapa(gremioId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({
        queryKey: ["gremios", variables.gremioId],
      });
      toast.success("Chapa cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar chapa");
    },
  });
}

export function useUpdateChapaGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapaId,
      data,
    }: {
      chapaId: string;
      gremioId: string;
      data: Parameters<typeof gremiosApi.updateChapa>[1];
    }) => gremiosApi.updateChapa(chapaId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({
        queryKey: ["gremios", variables.gremioId],
      });
      toast.success("Chapa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar chapa");
    },
  });
}

export function useDeleteChapaGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chapaId }: { chapaId: string; gremioId: string }) =>
      gremiosApi.deleteChapa(chapaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({
        queryKey: ["gremios", variables.gremioId],
      });
      toast.success("Chapa removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover chapa");
    },
  });
}

export function useApurarEleicao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      resultados,
    }: {
      id: string;
      resultados: { chapaId: string; votosRecebidos: number }[];
    }) => gremiosApi.apurarEleicao(id, resultados),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({ queryKey: ["gremios", variables.id] });
      toast.success("Eleição apurada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao apurar eleição");
    },
  });
}

export function useAddAtividadeGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      gremioId,
      data,
    }: {
      gremioId: string;
      data: Parameters<typeof gremiosApi.addAtividade>[1];
    }) => gremiosApi.addAtividade(gremioId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({
        queryKey: ["gremios", variables.gremioId],
      });
      toast.success("Atividade cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar atividade");
    },
  });
}

export function useUpdateAtividadeGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      atividadeId,
      data,
    }: {
      atividadeId: string;
      gremioId: string;
      data: Parameters<typeof gremiosApi.updateAtividade>[1];
    }) => gremiosApi.updateAtividade(atividadeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({
        queryKey: ["gremios", variables.gremioId],
      });
      toast.success("Atividade atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar atividade");
    },
  });
}

export function useDeleteAtividadeGremio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ atividadeId }: { atividadeId: string; gremioId: string }) =>
      gremiosApi.deleteAtividade(atividadeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gremios"] });
      queryClient.invalidateQueries({
        queryKey: ["gremios", variables.gremioId],
      });
      toast.success("Atividade removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover atividade");
    },
  });
}

// ==================== LÍDERES DE TURMA ====================

export function useLideresTurma(filters?: {
  turmaId?: string;
  anoLetivo?: number;
  escolaId?: string;
  ativo?: boolean;
}) {
  return useQuery<LiderTurma[]>({
    queryKey: ["lideres-turma", filters],
    queryFn: () => lideresTurmaApi.list(filters),
  });
}

export function useCreateLiderTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof lideresTurmaApi.create>[0]) =>
      lideresTurmaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lideres-turma"] });
      toast.success("Líder de turma registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar líder de turma");
    },
  });
}

export function useUpdateLiderTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof lideresTurmaApi.update>[1];
    }) => lideresTurmaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lideres-turma"] });
      toast.success("Líder de turma atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar líder de turma");
    },
  });
}

export function useDeleteLiderTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lideresTurmaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lideres-turma"] });
      toast.success("Líder de turma removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover líder de turma");
    },
  });
}

// ==================== REUNIÕES DEMOCRÁTICAS ====================

export function useReunioesDemocraticas(filters?: ReuniaoDemocraticaFilters) {
  return useQuery<ReuniaoDemocratica[]>({
    queryKey: ["reunioes-democraticas", filters],
    queryFn: () =>
      reunioesDemocraticasApi.list(filters) as Promise<ReuniaoDemocratica[]>,
  });
}

export function useReuniaoDemocratica(id: string) {
  return useQuery<ReuniaoDemocratica>({
    queryKey: ["reunioes-democraticas", id],
    queryFn: () => reunioesDemocraticasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateReuniaoDemocratica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof reunioesDemocraticasApi.create>[0]) =>
      reunioesDemocraticasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunioes-democraticas"] });
      toast.success("Reunião agendada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao agendar reunião");
    },
  });
}

export function useUpdateReuniaoDemocratica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof reunioesDemocraticasApi.update>[1];
    }) => reunioesDemocraticasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunioes-democraticas"] });
      toast.success("Reunião atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar reunião");
    },
  });
}

export function useDeleteReuniaoDemocratica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reunioesDemocraticasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunioes-democraticas"] });
      toast.success("Reunião removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover reunião");
    },
  });
}

export function useRegistrarAta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof reunioesDemocraticasApi.registrarAta>[1];
    }) => reunioesDemocraticasApi.registrarAta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunioes-democraticas"] });
      toast.success("Ata registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar ata");
    },
  });
}

export function useCancelarReuniaoDemocratica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reunioesDemocraticasApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reunioes-democraticas"] });
      toast.success("Reunião cancelada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar reunião");
    },
  });
}
