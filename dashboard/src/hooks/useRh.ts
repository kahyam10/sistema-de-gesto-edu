"use client";

// Hooks TanStack Query do Módulo 4 — ACs e quadro de lotação
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acsApi, lotacaoApi, type DadosAC } from "@/lib/api-rh";

export function useAtividadesComplementares(escolaId: string | undefined) {
  return useQuery({
    queryKey: ["acs", escolaId],
    queryFn: () => acsApi.list({ escolaId }),
    enabled: !!escolaId,
  });
}

export function useQuadroLotacao(escolaId: string | undefined) {
  return useQuery({
    queryKey: ["lotacao", escolaId],
    queryFn: () => lotacaoApi.quadro(escolaId!),
    enabled: !!escolaId,
  });
}

function useInvalidarHorarios() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["acs"] });
    void qc.invalidateQueries({ queryKey: ["lotacao"] });
  };
}

export function useSalvarAC() {
  const invalidar = useInvalidarHorarios();
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosAC }) =>
      id ? acsApi.update(id, dados) : acsApi.create(dados),
    onSuccess: (_r, v) => {
      invalidar();
      toast.success(v.id ? "AC atualizada" : "AC cadastrada");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar a AC"),
  });
}

export function useAlternarAC() {
  const invalidar = useInvalidarHorarios();
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => acsApi.update(id, { ativo }),
    onSuccess: (_r, v) => {
      invalidar();
      toast.success(v.ativo ? "AC reativada" : "AC desativada");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível alterar a AC"),
  });
}
