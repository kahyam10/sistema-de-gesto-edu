// Expurgo periódico da tabela de refresh tokens (refresh_tokens).
// Cada login e cada renovação gravam uma linha; sem limpeza ela cresce para
// sempre e guarda IP/user-agent além do necessário (LGPD: minimização).
//
// Apaga só sessões MORTAS há mais de RETENCAO_DIAS:
// - família com limite absoluto (familiaExpiraEm) vencido há mais de N dias;
// - linhas revogadas (logout, reuso, reemissão, usuário inativo) há mais de N dias.
// A família inteira compartilha familiaExpiraEm e é revogada de uma vez, então
// ela sai inteira — a detecção de reuso de uma sessão viva nunca perde as
// linhas antigas dela. Os N dias de folga mantêm o histórico recente para
// investigação de incidente (a trilha de auditoria guarda o resto).
import { prismaSemEscopo } from "./prisma.js";
import { logger } from "../utils/logger.js";

/** Dias que uma sessão expirada/revogada permanece no banco antes do expurgo. */
export const RETENCAO_SESSOES_DIAS = 30;
/** Intervalo entre execuções do expurgo (6 h). */
export const INTERVALO_EXPURGO_MS = 6 * 60 * 60 * 1000;
/** Primeira execução pouco depois do boot (não disputa com a subida). */
const ATRASO_INICIAL_MS = 60 * 1000;

const DIA_MS = 24 * 60 * 60 * 1000;

/** Apaga as sessões mortas há mais de RETENCAO_SESSOES_DIAS. Devolve a quantidade. */
export async function expurgarSessoesAntigas(agora: Date = new Date()): Promise<number> {
  const limite = new Date(agora.getTime() - RETENCAO_SESSOES_DIAS * DIA_MS);
  const r = await prismaSemEscopo.sessaoRefresh.deleteMany({
    where: {
      OR: [{ familiaExpiraEm: { lt: limite } }, { revogadoEm: { lt: limite } }],
    },
  });
  return r.count;
}

async function executar() {
  try {
    const quantidade = await expurgarSessoesAntigas();
    logger.info("Expurgo de sessões expiradas/revogadas", { quantidade });
  } catch (err) {
    logger.error("Falha no expurgo de sessões", err instanceof Error ? err : undefined);
  }
}

/**
 * Agenda o expurgo no próprio processo da API (timers com unref: não seguram o
 * processo vivo). Não roda em NODE_ENV=test. Devolve a função que cancela.
 */
export function agendarExpurgoSessoes(): () => void {
  if (process.env.NODE_ENV === "test") return () => {};
  const inicial = setTimeout(executar, ATRASO_INICIAL_MS);
  inicial.unref();
  const periodico = setInterval(executar, INTERVALO_EXPURGO_MS);
  periodico.unref();
  return () => {
    clearTimeout(inicial);
    clearInterval(periodico);
  };
}
