/**
 * Hoje no formato AAAA-MM-DD no fuso da Bahia (UTC-3 fixo, sem horário de
 * verão). Cálculo manual: o Intl do Hermes nem sempre traz fusos/locales.
 */
export function hojeISO(agora: Date = new Date()): string {
  return new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "2026-09-24" ou ISO completo → "24/09/2026" (sem deslocar o dia por fuso). */
export function dataBR(valor: string): string {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function nota(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : valor.toFixed(1).replace(".", ",");
}

export const rotuloPapel: Record<string, string> = {
  PROFESSOR: "Professor(a)",
  RESPONSAVEL: "Responsável",
  USER: "Aluno(a)",
  ADMIN: "Administrador",
  SEMEC: "SEMEC",
  DIRETOR: "Direção",
  COORDENADOR: "Coordenação",
  SECRETARIA: "Secretaria",
};
