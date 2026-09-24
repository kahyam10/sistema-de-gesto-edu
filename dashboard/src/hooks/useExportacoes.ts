"use client";

// Hooks do módulo Exportações Oficiais (Educacenso / Sistema Presença) —
// mesmo padrão TanStack Query + sonner do useApi.ts.

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { exportacoesApi } from "@/lib/api-exportacoes";

// ==================== EDUCACENSO ====================

export function usePreviaEducacenso(
  params: { anoLetivoId?: string; escolaId?: string },
  enabled: boolean
) {
  return useQuery({
    queryKey: ["exportacao", "educacenso-previa", params],
    queryFn: () =>
      exportacoesApi.previaEducacenso({
        anoLetivoId: params.anoLetivoId!,
        escolaId: params.escolaId || undefined,
      }),
    enabled: enabled && !!params.anoLetivoId,
  });
}

export function useDownloadEducacenso() {
  return useMutation({
    mutationFn: exportacoesApi.downloadEducacenso,
    onSuccess: () => {
      toast.success("Arquivo do Educacenso gerado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar arquivo do Educacenso");
    },
  });
}

// ==================== SISTEMA PRESENÇA ====================

export function usePreviaSistemaPresenca(
  params: { anoLetivoId?: string; mes?: number; escolaId?: string },
  enabled: boolean
) {
  return useQuery({
    queryKey: ["exportacao", "presenca-previa", params],
    queryFn: () =>
      exportacoesApi.previaSistemaPresenca({
        anoLetivoId: params.anoLetivoId!,
        mes: params.mes!,
        escolaId: params.escolaId || undefined,
      }),
    enabled: enabled && !!params.anoLetivoId && !!params.mes,
  });
}

export function useDownloadSistemaPresenca() {
  return useMutation({
    mutationFn: exportacoesApi.downloadSistemaPresenca,
    onSuccess: () => {
      toast.success("Arquivo do Sistema Presença gerado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar arquivo do Sistema Presença");
    },
  });
}
