import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Fuso da rede municipal (Ibirapitanga-BA). */
export const FUSO_REDE = "America/Bahia";

/**
 * "Hoje" como AAAA-MM-DD no fuso da rede. Não usar new Date().toISOString():
 * isso é UTC, e depois das 21h na Bahia já devolve o dia seguinte.
 */
export function hojeNaRede(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO_REDE }).format(agora);
}

/**
 * Idade completa em anos a partir de uma data pura ("AAAA-MM-DD" ou ISO à
 * meia-noite UTC), comparando só ano/mês/dia com o "hoje" da rede. new Date()
 * no fuso da Bahia leria o nascimento como 21h do dia anterior.
 */
export function idadeEm(dataNascimento: string, hoje: string = hojeNaRede()): number {
  const [an, mn, dn] = dataNascimento.slice(0, 10).split("-").map(Number);
  const [ah, mh, dh] = hoje.slice(0, 10).split("-").map(Number);
  return ah - an - (mh < mn || (mh === mn && dh < dn) ? 1 : 0);
}

/** Dias entre hoje (da rede) e uma data pura; negativo = já passou. */
export function diasAte(data: string, hoje: string = hojeNaRede()): number {
  const utc = (s: string) => {
    const [a, m, d] = s.slice(0, 10).split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((utc(data) - utc(hoje)) / 86_400_000);
}
