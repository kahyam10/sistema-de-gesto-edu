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
