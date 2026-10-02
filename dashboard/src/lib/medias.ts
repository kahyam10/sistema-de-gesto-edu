// Médias e situação nas telas pedagógicas. A fonte da média é o backend
// (boletim: média ponderada, avaliação realizada sem nota = 0, futura fica de
// fora, regra da configuração de avaliação). Aqui só se lê o que a API deu e
// se agrega para exibição — nunca se recalcula a partir de notas brutas.

import type { Boletim, ConfiguracaoAvaliacao } from "./api";

/** Situação devolvida pela API (boletim / situação final). */
export type SituacaoApi = "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";

export const SITUACOES_API: readonly SituacaoApi[] = ["APROVADO", "RECUPERACAO", "REPROVADO", "EM_CURSO"];

/** Valor desconhecido (ex.: situação nova no backend) vira EM_CURSO, nunca APROVADO. */
export function comoSituacao(valor: string | null | undefined): SituacaoApi {
  return SITUACOES_API.includes(valor as SituacaoApi) ? (valor as SituacaoApi) : "EM_CURSO";
}

/**
 * Configuração de avaliação vigente para a turma — mesma prioridade do
 * backend (configuracaoAvaliacaoService.findByAnoLetivo):
 * escola+etapa > etapa > escola > rede (sem escola e sem etapa).
 * null = não há configuração; a tela não deve inventar limite.
 */
export function configuracaoVigente(
  configs: ConfiguracaoAvaliacao[],
  turma: { anoLetivo: number; escolaId?: string | null; etapaId?: string | null },
): ConfiguracaoAvaliacao | null {
  const doAno = configs.filter((c) => c.anoLetivo === turma.anoLetivo);
  // O serializador pode mandar "" no lugar de null: falsy = ausente
  const { escolaId, etapaId } = turma;
  if (escolaId && etapaId) {
    const c = doAno.find((x) => x.escolaId === escolaId && x.etapaId === etapaId);
    if (c) return c;
  }
  if (etapaId) {
    const c = doAno.find((x) => x.etapaId === etapaId && !x.escolaId);
    if (c) return c;
  }
  if (escolaId) {
    const c = doAno.find((x) => x.escolaId === escolaId && !x.etapaId);
    if (c) return c;
  }
  return doAno.find((x) => !x.escolaId && !x.etapaId) ?? null;
}

/**
 * Média simples de médias que a API já devolveu (ex.: média geral do aluno
 * = média das médias finais das disciplinas). null/undefined ficam de fora
 * (não viram 0); sem nenhuma → null. Duas casas, como o backend.
 */
export function mediaDasMedias(valores: Array<number | null | undefined>): number | null {
  const v = valores.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (v.length === 0) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
}

/** "—" quando não há média (nunca "0.0" nem "NaN"). */
export function formatarMedia(valor: number | null | undefined, casas = 1): string {
  return typeof valor === "number" && Number.isFinite(valor) ? valor.toFixed(casas) : "—";
}

/** Comparação com a média mínima da configuração; sem média ou sem configuração = "neutro". */
export function tomDaMedia(
  valor: number | null | undefined,
  mediaMinima: number | null | undefined,
): "ok" | "abaixo" | "neutro" {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "neutro";
  if (typeof mediaMinima !== "number") return "neutro";
  return valor >= mediaMinima ? "ok" : "abaixo";
}

export interface DisciplinaConselho {
  disciplinaId: string;
  nome: string;
  media: number | null;
  situacao: SituacaoApi;
}

export interface AlunoConselho {
  matriculaId: string;
  nomeAluno: string;
  /** Média das médias finais (API) das disciplinas com média; null = nenhuma. */
  mediaGeral: number | null;
  disciplinas: DisciplinaConselho[];
  /** situacaoGeral do boletim; null = boletim ainda não carregado / com erro. */
  situacao: SituacaoApi | null;
}

/** Linha do conselho de classe a partir do boletim da API (sem recalcular nada). */
export function alunoDoBoletim(
  matricula: { id: string; nomeAluno: string },
  boletim: Boletim | undefined,
): AlunoConselho {
  if (!boletim) {
    return { matriculaId: matricula.id, nomeAluno: matricula.nomeAluno, mediaGeral: null, disciplinas: [], situacao: null };
  }
  const disciplinas = boletim.disciplinas.map((d) => ({
    disciplinaId: d.disciplinaId,
    nome: d.disciplinaNome,
    media: d.mediaFinal ?? null,
    situacao: comoSituacao(d.situacao),
  }));
  return {
    matriculaId: matricula.id,
    nomeAluno: matricula.nomeAluno,
    mediaGeral: mediaDasMedias(disciplinas.map((d) => d.media)),
    disciplinas,
    situacao: comoSituacao(boletim.situacaoGeral),
  };
}
