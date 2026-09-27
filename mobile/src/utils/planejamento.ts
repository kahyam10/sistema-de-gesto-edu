import type { StatusPlano } from "../api/types";
import type { Tom } from "../components/ui";

export const STATUS_PLANO: Record<StatusPlano, { rotulo: string; tom: Tom }> = {
  RASCUNHO: { rotulo: "Rascunho", tom: "neutro" },
  ENVIADO: { rotulo: "Aguardando revisão", tom: "marca" },
  APROVADO: { rotulo: "Aprovado", tom: "sucesso" },
  DEVOLVIDO: { rotulo: "Devolvido", tom: "alerta" },
};

/** O professor só altera e envia o que ainda não está com a coordenação. */
export const planoEditavel = (status: StatusPlano) => status === "RASCUNHO" || status === "DEVOLVIDO";

/** "ef05ma01, EF05MA02" → ["EF05MA01", "EF05MA02"] (a API confere o formato). */
export function lerHabilidades(texto: string): string[] {
  return [...new Set(texto.split(/[\s,;]+/).map((x) => x.trim().toUpperCase()).filter(Boolean))];
}

const FORMATO_BNCC = /^[A-Z0-9]{4,15}$/;
/** Códigos que a API vai recusar (mostrados antes de enviar). */
export const habilidadesInvalidas = (codigos: string[]) => codigos.filter((c) => !FORMATO_BNCC.test(c));
