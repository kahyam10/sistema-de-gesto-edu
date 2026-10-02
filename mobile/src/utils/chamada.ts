// Frequência POR AULA no app do professor: qual aula do dia abrir primeiro.

/** "07:30" → minutos desde 00:00. */
export function minutosDoDia(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Hora atual na Bahia (UTC-3 fixo, sem horário de verão) como "HH:MM".
 * Cálculo manual, como em hojeISO: o Intl do Hermes nem sempre traz fusos.
 */
export function horaAtualNaRede(agora: Date = new Date()): string {
  const d = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

interface AulaComHorario {
  gradeHorariaId: string;
  horaInicio: string;
  horaFim: string;
}

/**
 * Aula pré-selecionada pelo horário da rede: a que está acontecendo agora;
 * senão a próxima do dia; senão (todas já passaram) a última que terminou.
 * null quando não há aulas.
 */
export function aulaPreSelecionada(aulas: AulaComHorario[], agoraHHMM: string): string | null {
  if (aulas.length === 0) return null;
  const agora = minutosDoDia(agoraHHMM);
  const ordenadas = [...aulas].sort((a, b) => minutosDoDia(a.horaInicio) - minutosDoDia(b.horaInicio));
  const emAndamento = ordenadas.find(
    (a) => minutosDoDia(a.horaInicio) <= agora && agora < minutosDoDia(a.horaFim)
  );
  if (emAndamento) return emAndamento.gradeHorariaId;
  const proxima = ordenadas.find((a) => minutosDoDia(a.horaInicio) > agora);
  if (proxima) return proxima.gradeHorariaId;
  return ordenadas[ordenadas.length - 1].gradeHorariaId;
}
