// Eventos recorrentes do calendário letivo (EventoCalendario.recorrente).
//
// Regras (as datas do calendário são dias "puros", gravados à meia-noite UTC):
// - a primeira ocorrência é a própria dataInicio;
// - SEMANAL: repete no dia da semana de diaRecorrencia (SEGUNDA…DOMINGO) ou,
//   se vazio, no dia da semana da dataInicio;
// - MENSAL: repete no dia do mês de diaRecorrencia ("1"…"31") ou no dia da
//   dataInicio; meses sem esse dia (ex.: 31 em abril) são pulados;
// - ANUAL: mesmo dia e mês da dataInicio (29/02 só em ano bissexto);
// - dataFim, quando existe, é a DURAÇÃO de cada ocorrência (como num evento
//   comum), não o fim da repetição;
// - a repetição termina no fim do ano letivo (FIM_ANO_LETIVO) do evento.

export const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;
export type TipoRecorrencia = "SEMANAL" | "MENSAL" | "ANUAL";

export interface EventoRecorrente {
  dataInicio: Date;
  dataFim: Date | null;
  tipoRecorrencia: string | null;
  diaRecorrencia: string | null;
}

const DIA_MS = 24 * 60 * 60 * 1000;
const diaUTC = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const MAX_OCORRENCIAS = 400;

/** Datas (meia-noite UTC) das ocorrências dentro de [de, ate], sem passar de `limite`. */
export function ocorrencias(ev: EventoRecorrente, de: Date, ate: Date, limite: Date | null): Date[] {
  const inicio = diaUTC(ev.dataInicio);
  const fim = Math.min(diaUTC(ate), limite ? diaUTC(limite) : Infinity);
  const desde = Math.max(diaUTC(de), inicio);
  if (fim < desde) return [];
  const out: Date[] = [];
  const empurra = (t: number) => { if (t >= desde && t <= fim && out.length < MAX_OCORRENCIAS) out.push(new Date(t)); };

  if (ev.tipoRecorrencia === "SEMANAL") {
    const alvo = DIAS_SEMANA.indexOf((ev.diaRecorrencia ?? "") as (typeof DIAS_SEMANA)[number]);
    const diaSemana = alvo >= 0 ? alvo : new Date(inicio).getUTCDay();
    let t = inicio + (((diaSemana - new Date(inicio).getUTCDay()) + 7) % 7) * DIA_MS;
    if (t < desde) t += Math.ceil((desde - t) / (7 * DIA_MS)) * 7 * DIA_MS;
    for (; t <= fim && out.length < MAX_OCORRENCIAS; t += 7 * DIA_MS) empurra(t);
  } else if (ev.tipoRecorrencia === "MENSAL") {
    const n = Number(ev.diaRecorrencia);
    const dia = Number.isInteger(n) && n >= 1 && n <= 31 ? n : new Date(inicio).getUTCDate();
    const i = new Date(inicio);
    for (let a = i.getUTCFullYear(), m = i.getUTCMonth(); Date.UTC(a, m, 1) <= fim; m === 11 ? (a++, (m = 0)) : m++) {
      const t = Date.UTC(a, m, dia);
      if (new Date(t).getUTCMonth() === m) empurra(t); // pula meses sem esse dia
      if (out.length >= MAX_OCORRENCIAS) break;
    }
  } else if (ev.tipoRecorrencia === "ANUAL") {
    const i = new Date(inicio);
    for (let a = i.getUTCFullYear(); Date.UTC(a, 0, 1) <= fim; a++) {
      const t = Date.UTC(a, i.getUTCMonth(), i.getUTCDate());
      if (new Date(t).getUTCDate() === i.getUTCDate()) empurra(t); // 29/02 só em ano bissexto
    }
  } else {
    empurra(inicio);
  }
  return out;
}

/** Duração em dias de cada ocorrência (dataFim − dataInicio). */
export function duracaoDias(ev: EventoRecorrente): number {
  return ev.dataFim ? Math.max(0, Math.round((diaUTC(ev.dataFim) - diaUTC(ev.dataInicio)) / DIA_MS)) : 0;
}

/**
 * Expande um evento recorrente em cópias por ocorrência. Cada cópia leva
 * `id` = "<id>@AAAA-MM-DD" e `ocorrenciaDe` com o evento base (para editar).
 */
export function expandir<T extends EventoRecorrente & { id: string }>(
  ev: T, de: Date, ate: Date, limite: Date | null
): Array<T & { ocorrenciaDe: { id: string; dataInicio: Date; dataFim: Date | null } }> {
  const dur = duracaoDias(ev);
  // Recua a janela pela duração: ocorrência que começa antes e ainda está em curso entra
  return ocorrencias(ev, new Date(de.getTime() - dur * DIA_MS), ate, limite).map((d) => ({
    ...ev,
    id: `${ev.id}@${d.toISOString().slice(0, 10)}`,
    dataInicio: d,
    dataFim: ev.dataFim ? new Date(d.getTime() + dur * DIA_MS) : null,
    ocorrenciaDe: { id: ev.id, dataInicio: ev.dataInicio, dataFim: ev.dataFim },
  }));
}
