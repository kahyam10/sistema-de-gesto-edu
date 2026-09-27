// Datas do calendário escolar são dias "puros": gravados à meia-noite UTC de
// AAAA-MM-DD. O "hoje" precisa ser o da rede (Bahia, UTC-3): com setHours(0)
// no servidor em UTC, depois das 21h locais já seria o dia seguinte.

export const FUSO_REDE = "America/Bahia";

/** Hoje na rede como "AAAA-MM-DD". */
export function hojeNaRedeISO(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO_REDE }).format(agora);
}

/** Hoje na rede como data pura (meia-noite UTC), no mesmo formato gravado no banco. */
export function hojeNaRede(agora: Date = new Date()): Date {
  return new Date(`${hojeNaRedeISO(agora)}T00:00:00.000Z`);
}
