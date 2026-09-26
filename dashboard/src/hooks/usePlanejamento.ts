"use client";

// Hooks TanStack Query do Módulo 2 — planejamento pedagógico
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  planejamentoApi as api,
  type DadosAtividade, type DadosConteudo, type DadosPlano,
} from "@/lib/api-planejamento";

const erro = (padrao: string) => (e: Error) => toast.error(e.message || padrao);

function useInvalidar() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["planejamento"] });
}

// ---------- Conteúdo programático ----------
export function useConteudos(f: Parameters<typeof api.conteudos.list>[0], enabled = true) {
  return useQuery({ queryKey: ["planejamento", "conteudos", f], queryFn: () => api.conteudos.list(f), enabled });
}

export function useSalvarConteudo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosConteudo }) =>
      id ? api.conteudos.update(id, dados) : api.conteudos.create(dados),
    onSuccess: (_r, v) => {
      invalidar();
      toast.success(v.id ? "Conteúdo atualizado" : "Conteúdo cadastrado");
    },
    onError: erro("Não foi possível salvar o conteúdo"),
  });
}

export function useRemoverConteudo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => api.conteudos.remove(id),
    onSuccess: () => {
      invalidar();
      toast.success("Conteúdo excluído");
    },
    onError: erro("Não foi possível excluir o conteúdo"),
  });
}

// ---------- Banco de atividades ----------
export function useAtividadesPedagogicas(f: Parameters<typeof api.atividades.list>[0], enabled = true) {
  return useQuery({ queryKey: ["planejamento", "atividades", f], queryFn: () => api.atividades.list(f), enabled });
}

export function useSalvarAtividade() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosAtividade }) =>
      id ? api.atividades.update(id, dados) : api.atividades.create(dados),
    onSuccess: (_r, v) => {
      invalidar();
      toast.success(v.id ? "Atividade atualizada" : "Atividade cadastrada");
    },
    onError: erro("Não foi possível salvar a atividade"),
  });
}

export function useRemoverAtividade() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => api.atividades.remove(id),
    onSuccess: () => {
      invalidar();
      toast.success("Atividade excluída");
    },
    onError: erro("Não foi possível excluir a atividade"),
  });
}

// ---------- Planos de aula ----------
export function usePlanos(f: Parameters<typeof api.planos.list>[0]) {
  return useQuery({ queryKey: ["planejamento", "planos", f], queryFn: () => api.planos.list(f) });
}

export function usePlano(id: string | null) {
  return useQuery({ queryKey: ["planejamento", "plano", id], queryFn: () => api.planos.get(id!), enabled: !!id });
}

export function useSalvarPlano() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosPlano }) => {
      if (!id) return api.planos.create(dados);
      // Turma e disciplina não mudam depois de criado o plano
      const resto: Partial<DadosPlano> = { ...dados };
      delete resto.turmaId;
      delete resto.disciplinaId;
      return api.planos.update(id, resto);
    },
    onSuccess: (_r, v) => {
      invalidar();
      toast.success(v.id ? "Plano atualizado" : "Plano salvo como rascunho");
    },
    onError: erro("Não foi possível salvar o plano"),
  });
}

export function useAcaoPlano() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (a:
      | { tipo: "enviar"; id: string }
      | { tipo: "remover"; id: string }
      | { tipo: "revisar"; id: string; decisao: "APROVADO" | "DEVOLVIDO"; parecer?: string }): Promise<unknown> => {
      if (a.tipo === "enviar") return api.planos.enviar(a.id);
      if (a.tipo === "remover") return api.planos.remove(a.id);
      return api.planos.revisar(a.id, { decisao: a.decisao, parecer: a.parecer });
    },
    onSuccess: (_r, a) => {
      invalidar();
      const msg =
        a.tipo === "enviar" ? "Plano enviado para a coordenação"
          : a.tipo === "remover" ? "Plano excluído"
            : a.decisao === "APROVADO" ? "Plano aprovado" : "Plano devolvido ao professor";
      toast.success(msg);
    },
    onError: erro("Não foi possível concluir a ação"),
  });
}

// ---------- Cobertura ----------
export function useCobertura(turmaId: string | undefined, bimestre?: number) {
  return useQuery({
    queryKey: ["planejamento", "cobertura", turmaId, bimestre ?? null],
    queryFn: () => api.cobertura(turmaId!, bimestre),
    enabled: !!turmaId,
  });
}
