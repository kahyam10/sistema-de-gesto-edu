"use client";

// Hooks TanStack Query do Módulo 2 — acompanhamento de aprendizagens (somente leitura)
import { useQuery } from "@tanstack/react-query";
import { aprendizagemApi } from "@/lib/api-aprendizagem";

export function useAprendizagemEscola(escolaId: string | undefined, anoLetivo?: number) {
  return useQuery({
    queryKey: ["aprendizagem", "escola", escolaId, anoLetivo ?? null],
    queryFn: () => aprendizagemApi.escola(escolaId!, anoLetivo),
    enabled: !!escolaId,
  });
}

export function useAprendizagemTurma(turmaId: string | undefined, bimestre?: number) {
  return useQuery({
    queryKey: ["aprendizagem", "turma", turmaId, bimestre ?? null],
    queryFn: () => aprendizagemApi.turma(turmaId!, bimestre),
    enabled: !!turmaId,
  });
}
