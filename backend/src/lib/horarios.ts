// Utilitários de horário semanal (grade de aulas e AC).

export const DIAS_SEMANA_UTEIS = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;
export type DiaSemana = (typeof DIAS_SEMANA_UTEIS)[number];

/** "07:30" → 450 minutos desde 00:00. */
export function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Duração em minutos (0 se o fim não passar do início). */
export function duracao(inicio: string, fim: string): number {
  return Math.max(minutos(fim) - minutos(inicio), 0);
}

export interface Intervalo {
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
}

/** Dois intervalos no mesmo dia se sobrepõem (encostar não conta: 08:00–09:00 e 09:00–10:00 é OK). */
export function sobrepoe(a: Intervalo, b: Intervalo): boolean {
  return (
    a.diaSemana === b.diaSemana &&
    minutos(a.horaInicio) < minutos(b.horaFim) &&
    minutos(b.horaInicio) < minutos(a.horaFim)
  );
}

/** Todos os pares que se sobrepõem numa lista. */
export function paresConflitantes<T extends Intervalo>(itens: T[]): Array<[T, T]> {
  const pares: Array<[T, T]> = [];
  for (let i = 0; i < itens.length; i++) {
    for (let j = i + 1; j < itens.length; j++) {
      if (sobrepoe(itens[i], itens[j])) pares.push([itens[i], itens[j]]);
    }
  }
  return pares;
}

/**
 * Fração máxima da jornada em regência (interação com alunos).
 * Padrão 2/3: Lei nº 11.738/2008 (Lei do Piso), art. 2º, § 4º. O plano de
 * carreira municipal pode definir outro valor: FRACAO_MAXIMA_REGENCIA
 * (aceita "2/3" ou "0.6667").
 */
export function fracaoMaximaRegencia(valor = process.env.FRACAO_MAXIMA_REGENCIA): number {
  if (!valor) return 2 / 3;
  const partes = valor.split("/").map((x) => Number(x.trim()));
  const f = partes.length === 2 ? partes[0] / partes[1] : partes[0];
  return Number.isFinite(f) && f > 0 && f <= 1 ? f : 2 / 3;
}
