import type { Boletim, FrequenciaAluno } from "../api/types";
import { nota } from "./formato";

/**
 * Médias no app do responsável. A média de cada disciplina é a que a API
 * devolve (mediaFinal: pesos, avaliação realizada sem nota = 0, futura fora,
 * configuração da rede); null = ainda sem média → "—", nunca 0 nem uma conta
 * feita aqui com as médias dos bimestres.
 */
export interface MediaExibida {
  valor: number | null;
  /** true quando a API diz que o período ainda não fechou (EM_CURSO). */
  parcial: boolean;
}

type DisciplinaBoletim = Boletim["disciplinas"][number];

/** Média de uma disciplina, como veio da API. */
export function mediaDaDisciplina(d: DisciplinaBoletim): MediaExibida {
  const valor = typeof d.mediaFinal === "number" ? d.mediaFinal : null;
  return { valor, parcial: valor !== null && d.situacao === "EM_CURSO" };
}

/**
 * Média geral do aluno. A API não devolve uma média geral: é a média simples
 * das médias finais (da API) das disciplinas que têm média; disciplina sem
 * média fica de fora. Parcial = situacaoGeral EM_CURSO. Duas casas.
 */
export function mediaGeralDoAluno(b: Boletim): MediaExibida {
  const v = b.disciplinas.map((d) => d.mediaFinal).filter((x): x is number => typeof x === "number");
  const valor = v.length ? Math.round((v.reduce((a, c) => a + c, 0) / v.length) * 100) / 100 : null;
  return { valor, parcial: valor !== null && b.situacaoGeral === "EM_CURSO" };
}

/**
 * Frequência da disciplina no boletim: "Freq. 92%"; "Freq. —" quando não há
 * aula registrada da disciplina (null/ausente). Só exibição.
 */
export function textoFrequenciaDisciplina(d: Pick<DisciplinaBoletim, "frequencia">): string {
  const f = d.frequencia;
  if (!f || !(f.totalAulas > 0) || !Number.isFinite(f.percentualPresenca)) return "Freq. —";
  return `Freq. ${f.percentualPresenca}%`;
}

/** "Média parcial" / "Média" (sem média não é "parcial": é só "—"). */
export function rotuloMedia(m: MediaExibida, base = "Média"): string {
  return m.parcial ? `${base} parcial` : base;
}

/** Texto do selo: "Média parcial 7,5", "Média 8,0", "Média —". */
export function textoMedia(m: MediaExibida, base = "Média"): string {
  return `${rotuloMedia(m, base)} ${nota(m.valor)}`;
}

type Registro = FrequenciaAluno["registros"][number];

/**
 * Frequência por aula: vários registros no mesmo dia. Mais recentes
 * primeiro; no mesmo dia, a aula mais tarde primeiro (sem hora = chamada
 * diária, vai por último no dia).
 */
export function ordenarRegistros(registros: Registro[]): Registro[] {
  return [...registros].sort((a, b) => {
    const dia = b.data.slice(0, 10).localeCompare(a.data.slice(0, 10));
    if (dia !== 0) return dia;
    return (b.horaInicio ?? "").localeCompare(a.horaInicio ?? "");
  });
}

/** "07:30 · Matemática", "07:30", "Matemática" ou null (chamada diária). */
export function descricaoAula(r: Pick<Registro, "horaInicio" | "disciplina">): string | null {
  const partes = [r.horaInicio?.trim().slice(0, 5), r.disciplina?.trim()].filter((x): x is string => !!x);
  return partes.length ? partes.join(" · ") : null;
}
