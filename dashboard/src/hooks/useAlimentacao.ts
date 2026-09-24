"use client";

// Módulo 6 — Alimentação Escolar: hooks TanStack Query (mesmo padrão do useApi.ts)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cardapiosApi,
  estoqueApi,
  refeicoesApi,
  type Cardapio,
  type ItemEstoque,
  type MovimentacaoEstoque,
  type AlertaEstoque,
  type RegistroRefeicao,
  type RelatorioPnae,
  type CardapioFilters,
  type ItemEstoqueFilters,
  type MovimentacaoEstoqueFilters,
  type RefeicaoFilters,
  type RelatorioPnaeFilters,
  type CreateCardapioInput,
  type UpdateCardapioInput,
  type CreateItemEstoqueInput,
  type UpdateItemEstoqueInput,
  type CreateMovimentacaoEstoqueInput,
  type CreateRegistroRefeicaoInput,
  type UpdateRegistroRefeicaoInput,
} from "@/lib/api-alimentacao";
import { toast } from "sonner";

// ==================== CARDÁPIOS ====================

export function useCardapios(filters?: CardapioFilters) {
  return useQuery<Cardapio[]>({
    queryKey: ["cardapios", filters],
    queryFn: () => cardapiosApi.list(filters) as Promise<Cardapio[]>,
  });
}

export function useCardapio(id: string | undefined) {
  return useQuery({
    queryKey: ["cardapios", id],
    queryFn: () => cardapiosApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateCardapio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCardapioInput) => cardapiosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapios"] });
      toast.success("Cardápio criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar cardápio");
    },
  });
}

export function useUpdateCardapio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardapioInput }) =>
      cardapiosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapios"] });
      toast.success("Cardápio atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar cardápio");
    },
  });
}

export function useDeleteCardapio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cardapiosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapios"] });
      toast.success("Cardápio removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover cardápio");
    },
  });
}

// ==================== ESTOQUE — ITENS ====================

export function useItensEstoque(filters?: ItemEstoqueFilters) {
  return useQuery<ItemEstoque[]>({
    queryKey: ["itens-estoque", filters],
    queryFn: () => estoqueApi.listItens(filters),
  });
}

export function useItemEstoque(id: string | undefined) {
  return useQuery({
    queryKey: ["itens-estoque", id],
    queryFn: () => estoqueApi.getItem(id!),
    enabled: !!id,
  });
}

export function useCreateItemEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemEstoqueInput) => estoqueApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-estoque"] });
      toast.success("Item de estoque criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar item de estoque");
    },
  });
}

export function useUpdateItemEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemEstoqueInput }) =>
      estoqueApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-estoque"] });
      toast.success("Item de estoque atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar item de estoque");
    },
  });
}

export function useDeleteItemEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => estoqueApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-estoque"] });
      toast.success("Item de estoque removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover item de estoque");
    },
  });
}

// ==================== ESTOQUE — MOVIMENTAÇÕES ====================

export function useMovimentacoesEstoque(filters?: MovimentacaoEstoqueFilters) {
  return useQuery<MovimentacaoEstoque[]>({
    queryKey: ["movimentacoes-estoque", filters],
    queryFn: () =>
      estoqueApi.listMovimentacoes(filters) as Promise<MovimentacaoEstoque[]>,
  });
}

/**
 * Movimentação altera o saldo derivado dos itens — invalidations cruzadas
 * obrigatórias: movimentações + itens + alertas.
 */
export function useCreateMovimentacaoEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovimentacaoEstoqueInput) =>
      estoqueApi.createMovimentacao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["itens-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-estoque"] });
      toast.success("Movimentação registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar movimentação");
    },
  });
}

export function useDeleteMovimentacaoEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => estoqueApi.deleteMovimentacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["itens-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-estoque"] });
      toast.success("Movimentação removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover movimentação");
    },
  });
}

export function useAlertasEstoque(escolaId?: string) {
  return useQuery<AlertaEstoque[]>({
    queryKey: ["alertas-estoque", escolaId],
    queryFn: () => estoqueApi.alertas(escolaId),
  });
}

// ==================== REFEIÇÕES ====================

export function useRefeicoes(filters?: RefeicaoFilters) {
  return useQuery<RegistroRefeicao[]>({
    queryKey: ["refeicoes", filters],
    queryFn: () => refeicoesApi.list(filters) as Promise<RegistroRefeicao[]>,
  });
}

export function useCreateRefeicao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRegistroRefeicaoInput) => refeicoesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refeicoes"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-pnae"] });
      toast.success("Refeição registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar refeição");
    },
  });
}

export function useUpdateRefeicao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRegistroRefeicaoInput;
    }) => refeicoesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refeicoes"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-pnae"] });
      toast.success("Registro de refeição atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar registro de refeição");
    },
  });
}

export function useDeleteRefeicao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => refeicoesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refeicoes"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-pnae"] });
      toast.success("Registro de refeição removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover registro de refeição");
    },
  });
}

// ==================== RELATÓRIO PNAE ====================

export function useRelatorioPnae(filters: Partial<RelatorioPnaeFilters>) {
  return useQuery<RelatorioPnae>({
    queryKey: ["relatorio-pnae", filters],
    queryFn: () => refeicoesApi.relatorioPnae(filters as RelatorioPnaeFilters),
    enabled: !!filters.dataInicio && !!filters.dataFim,
  });
}
