// Camada de API do Módulo 2 — planejamento pedagógico
import { request } from "./api";

export type StatusPlano = "RASCUNHO" | "ENVIADO" | "APROVADO" | "DEVOLVIDO";
export type TipoAtividade =
  | "EXERCICIO" | "LEITURA" | "PRODUCAO_TEXTO" | "PROJETO" | "JOGO" | "EXPERIMENTO" | "OUTRO";

export const STATUS_PLANO: Record<StatusPlano, { rotulo: string; variante: "neutral" | "info" | "success" | "warning" }> = {
  RASCUNHO: { rotulo: "Rascunho", variante: "neutral" },
  ENVIADO: { rotulo: "Aguardando revisão", variante: "info" },
  APROVADO: { rotulo: "Aprovado", variante: "success" },
  DEVOLVIDO: { rotulo: "Devolvido", variante: "warning" },
};

export const TIPOS_ATIVIDADE: Array<{ valor: TipoAtividade; rotulo: string }> = [
  { valor: "EXERCICIO", rotulo: "Exercício" },
  { valor: "LEITURA", rotulo: "Leitura" },
  { valor: "PRODUCAO_TEXTO", rotulo: "Produção de texto" },
  { valor: "PROJETO", rotulo: "Projeto" },
  { valor: "JOGO", rotulo: "Jogo" },
  { valor: "EXPERIMENTO", rotulo: "Experimento" },
  { valor: "OUTRO", rotulo: "Outro" },
];
export const rotuloTipo = (t: string) => TIPOS_ATIVIDADE.find((x) => x.valor === t)?.rotulo ?? t;

/** Quem cria conteúdo programático e revisa planos (sem a secretaria). */
export const COORDENACAO_PEDAGOGICA = ["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR"];

type Ref = { id: string; nome: string };

export interface ConteudoProgramatico {
  id: string;
  anoLetivo: number;
  bimestre: number;
  titulo: string;
  descricao: string | null;
  habilidadesBncc: string[];
  ordem: number;
  ativo: boolean;
  serieId: string;
  disciplinaId: string;
  escolaId: string | null;
  serie: Ref;
  disciplina: Ref;
  escola: Ref | null;
  _count: { planosAula: number };
}

export interface DadosConteudo {
  anoLetivo: number;
  bimestre: number;
  serieId: string;
  disciplinaId: string;
  escolaId?: string;
  titulo: string;
  descricao?: string;
  habilidadesBncc: string[];
  ordem?: number;
}

export interface AtividadePedagogica {
  id: string;
  titulo: string;
  tipo: TipoAtividade;
  descricao: string;
  habilidadesBncc: string[];
  ativo: boolean;
  disciplinaId: string;
  serieId: string | null;
  escolaId: string | null;
  autorId: string;
  disciplina: Ref;
  serie: Ref | null;
  escola: Ref | null;
  autor: Ref;
  _count: { planos: number };
}

export interface DadosAtividade {
  titulo: string;
  tipo: TipoAtividade;
  descricao: string;
  disciplinaId: string;
  serieId?: string;
  escolaId?: string;
  habilidadesBncc: string[];
}

export interface PlanoResumo {
  id: string;
  bimestre: number;
  dataAula: string;
  titulo: string;
  objetivos: string;
  status: StatusPlano;
  enviadoEm: string | null;
  parecer: string | null;
  revisadoEm: string | null;
  turmaId: string;
  disciplinaId: string;
  autorId: string;
  conteudoProgramaticoId: string | null;
  turma: { id: string; nome: string; anoLetivo: number; escola: Ref };
  disciplina: Ref;
  autor: Ref;
  revisadoPor: Ref | null;
  conteudoProgramatico: { id: string; titulo: string } | null;
  _count: { atividades: number };
}

export interface PlanoAula extends PlanoResumo {
  desenvolvimento: string | null;
  recursos: string | null;
  avaliacao: string | null;
  habilidadesBncc: string[];
  atividades: Array<{ id: string; titulo: string; tipo: TipoAtividade; descricao: string; habilidadesBncc: string[] }>;
}

export interface DadosPlano {
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  dataAula: string;
  titulo: string;
  objetivos: string;
  desenvolvimento?: string;
  recursos?: string;
  avaliacao?: string;
  habilidadesBncc: string[];
  conteudoProgramaticoId?: string;
  atividades: string[];
}

export interface Paginado<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Cobertura {
  turma: { id: string; nome: string; anoLetivo: number; serie: string };
  bimestre: number | null;
  resumo: { previstos: number; aprovados: number; semPlano: number };
  disciplinas: Array<{
    disciplinaId: string;
    nome: string;
    previstos: number;
    aprovados: number;
    semPlano: number;
    planosSemConteudo: number;
    conteudos: Array<{
      id: string;
      titulo: string;
      bimestre: number;
      habilidadesBncc: string[];
      daRede: boolean;
      situacao: "APROVADO" | "PLANEJADO" | "EM_RASCUNHO" | "SEM_PLANO";
      planos: Array<{ id: string; titulo: string; dataAula: string; status: StatusPlano }>;
    }>;
  }>;
}

/** Monta a query string ignorando vazios. */
function qs(params: Record<string, string | number | boolean | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** "ef03lp01, EF03LP02" → ["EF03LP01", "EF03LP02"] (a API confere o formato). */
export function lerHabilidades(texto: string): string[] {
  return [...new Set(texto.split(/[\s,;]+/).map((x) => x.trim().toUpperCase()).filter(Boolean))];
}

export const planejamentoApi = {
  conteudos: {
    list: (f: { anoLetivo?: number; bimestre?: number; serieId?: string; disciplinaId?: string; escolaId?: string }) =>
      request<ConteudoProgramatico[]>(`/api/planejamento/conteudos${qs(f)}`),
    create: (d: DadosConteudo) => request<ConteudoProgramatico>("/api/planejamento/conteudos", { method: "POST", body: d }),
    update: (id: string, d: Partial<DadosConteudo> & { ativo?: boolean }) =>
      request<ConteudoProgramatico>(`/api/planejamento/conteudos/${id}`, { method: "PUT", body: d }),
    remove: (id: string) => request<{ ok: true }>(`/api/planejamento/conteudos/${id}`, { method: "DELETE" }),
  },
  atividades: {
    list: (f: { disciplinaId?: string; serieId?: string; escolaId?: string; tipo?: string; busca?: string; minhas?: boolean }) =>
      request<AtividadePedagogica[]>(`/api/planejamento/atividades${qs(f)}`),
    create: (d: DadosAtividade) => request<AtividadePedagogica>("/api/planejamento/atividades", { method: "POST", body: d }),
    update: (id: string, d: Partial<DadosAtividade> & { ativo?: boolean }) =>
      request<AtividadePedagogica>(`/api/planejamento/atividades/${id}`, { method: "PUT", body: d }),
    remove: (id: string) => request<{ ok: true }>(`/api/planejamento/atividades/${id}`, { method: "DELETE" }),
  },
  planos: {
    list: (f: { turmaId?: string; disciplinaId?: string; bimestre?: number; status?: string; meus?: boolean; page?: number; limit?: number }) =>
      request<Paginado<PlanoResumo>>(`/api/planejamento/planos${qs(f)}`),
    get: (id: string) => request<PlanoAula>(`/api/planejamento/planos/${id}`),
    create: (d: DadosPlano) => request<PlanoAula>("/api/planejamento/planos", { method: "POST", body: d }),
    update: (id: string, d: Partial<Omit<DadosPlano, "turmaId" | "disciplinaId">>) =>
      request<PlanoAula>(`/api/planejamento/planos/${id}`, { method: "PUT", body: d }),
    remove: (id: string) => request<{ ok: true }>(`/api/planejamento/planos/${id}`, { method: "DELETE" }),
    enviar: (id: string) => request<PlanoAula>(`/api/planejamento/planos/${id}/enviar`, { method: "POST", body: {} }),
    revisar: (id: string, d: { decisao: "APROVADO" | "DEVOLVIDO"; parecer?: string }) =>
      request<PlanoAula>(`/api/planejamento/planos/${id}/revisar`, { method: "POST", body: d }),
  },
  cobertura: (turmaId: string, bimestre?: number) =>
    request<Cobertura>(`/api/planejamento/cobertura${qs({ turmaId, bimestre })}`),
};
