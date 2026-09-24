"use client";

// ==================== MÓDULO 7 — TRANSPORTE ESCOLAR (hooks) ====================
// Mesmo padrão TanStack Query + sonner do useApi.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  veiculosApi,
  motoristasApi,
  rotasTransporteApi,
  manutencoesApi,
  Veiculo,
  Motorista,
  RotaTransporte,
  ManutencaoVeiculo,
} from "@/lib/api-transporte";

// ==================== VEÍCULOS ====================

export function useVeiculos(filters?: {
  tipo?: string;
  ativo?: boolean;
  tipoPropriedade?: string;
}) {
  return useQuery({
    queryKey: ["veiculos", filters],
    queryFn: () => veiculosApi.list(filters),
  });
}

export function useVeiculo(id: string) {
  return useQuery({
    queryKey: ["veiculos", id],
    queryFn: () => veiculosApi.get(id),
    enabled: !!id,
  });
}

export function useAlertasVeiculos(dias?: number) {
  return useQuery({
    queryKey: ["alertas-veiculos", dias],
    queryFn: () => veiculosApi.alertasVencimento(dias),
  });
}

export function useCreateVeiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Veiculo>) => veiculosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-veiculos"] });
      toast.success("Veículo cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar veículo");
    },
  });
}

export function useUpdateVeiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Veiculo> }) =>
      veiculosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-veiculos"] });
      toast.success("Veículo atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar veículo");
    },
  });
}

export function useDeleteVeiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => veiculosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-veiculos"] });
      toast.success("Veículo removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover veículo");
    },
  });
}

// ==================== MOTORISTAS ====================

export function useMotoristas(filters?: { ativo?: boolean; vinculo?: string }) {
  return useQuery({
    queryKey: ["motoristas", filters],
    queryFn: () => motoristasApi.list(filters),
  });
}

export function useMotorista(id: string) {
  return useQuery({
    queryKey: ["motoristas", id],
    queryFn: () => motoristasApi.get(id),
    enabled: !!id,
  });
}

export function useAlertasCnh(dias?: number) {
  return useQuery({
    queryKey: ["alertas-cnh", dias],
    queryFn: () => motoristasApi.alertasCnh(dias),
  });
}

export function useCreateMotorista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Motorista>) => motoristasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-cnh"] });
      toast.success("Motorista cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar motorista");
    },
  });
}

export function useUpdateMotorista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Motorista> }) =>
      motoristasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-cnh"] });
      toast.success("Motorista atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar motorista");
    },
  });
}

export function useDeleteMotorista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => motoristasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] });
      queryClient.invalidateQueries({ queryKey: ["alertas-cnh"] });
      toast.success("Motorista removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover motorista");
    },
  });
}

// ==================== ROTAS DE TRANSPORTE ====================

export function useRotasTransporte(filters?: {
  turno?: string;
  tipo?: string;
  escolaId?: string;
  ativo?: boolean;
}) {
  return useQuery({
    queryKey: ["rotas-transporte", filters],
    queryFn: () => rotasTransporteApi.list(filters),
  });
}

export function useRotaTransporte(id: string) {
  return useQuery({
    queryKey: ["rotas-transporte", id],
    queryFn: () => rotasTransporteApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRotaTransporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<RotaTransporte>) =>
      rotasTransporteApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      toast.success("Rota criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar rota");
    },
  });
}

export function useUpdateRotaTransporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RotaTransporte> }) =>
      rotasTransporteApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      toast.success("Rota atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar rota");
    },
  });
}

export function useDeleteRotaTransporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rotasTransporteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      toast.success("Rota removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover rota");
    },
  });
}

export function useVincularEscolaRota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, escolaId }: { id: string; escolaId: string }) =>
      rotasTransporteApi.vincularEscola(id, escolaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      queryClient.invalidateQueries({
        queryKey: ["rotas-transporte", variables.id],
      });
      toast.success("Escola vinculada à rota!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao vincular escola à rota");
    },
  });
}

export function useDesvincularEscolaRota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, escolaId }: { id: string; escolaId: string }) =>
      rotasTransporteApi.desvincularEscola(id, escolaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      queryClient.invalidateQueries({
        queryKey: ["rotas-transporte", variables.id],
      });
      toast.success("Escola desvinculada da rota!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desvincular escola da rota");
    },
  });
}

export function useVincularAlunoRota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { matriculaId: string; pontoEmbarque?: string };
    }) => rotasTransporteApi.vincularAluno(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      queryClient.invalidateQueries({
        queryKey: ["rotas-transporte", variables.id],
      });
      toast.success("Aluno vinculado à rota!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao vincular aluno à rota");
    },
  });
}

export function useDesvincularAlunoRota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, matriculaId }: { id: string; matriculaId: string }) =>
      rotasTransporteApi.desvincularAluno(id, matriculaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rotas-transporte"] });
      queryClient.invalidateQueries({
        queryKey: ["rotas-transporte", variables.id],
      });
      toast.success("Aluno desvinculado da rota!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desvincular aluno da rota");
    },
  });
}

// ==================== MANUTENÇÕES ====================

export function useManutencoes(filters?: {
  veiculoId?: string;
  status?: string;
  tipo?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery({
    queryKey: ["manutencoes", filters],
    queryFn: () => manutencoesApi.list(filters) as Promise<ManutencaoVeiculo[]>,
  });
}

export function useManutencao(id: string) {
  return useQuery({
    queryKey: ["manutencoes", id],
    queryFn: () => manutencoesApi.get(id),
    enabled: !!id,
  });
}

export function useCustosPorVeiculo(filters?: {
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery({
    queryKey: ["custos-por-veiculo", filters],
    queryFn: () => manutencoesApi.custosPorVeiculo(filters),
  });
}

export function useCreateManutencao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ManutencaoVeiculo>) =>
      manutencoesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["custos-por-veiculo"] });
      toast.success("Manutenção agendada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao agendar manutenção");
    },
  });
}

export function useUpdateManutencao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ManutencaoVeiculo>;
    }) => manutencoesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["custos-por-veiculo"] });
      toast.success("Manutenção atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar manutenção");
    },
  });
}

export function useDeleteManutencao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => manutencoesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["custos-por-veiculo"] });
      toast.success("Manutenção removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover manutenção");
    },
  });
}
