// Bloqueio de força bruta no login, PERSISTENTE (sobrevive a restart e vale
// para várias réplicas): as falhas são contadas na própria trilha de auditoria
// (audit_logs, acao = LOGIN_FALHA), sem tabela nova.
//
// Dois limites, ambos por janela deslizante:
// 1. IP + e-mail: escolas saem para a internet por um único IP (NAT); limitar
//    só por IP travaria a secretaria inteira. Cada conta tem sua cota por origem.
// 2. Conta (todas as origens): segura quem troca de IP a cada tentativa.
//    ATENÇÃO (decisão aprovada): isso permite a um terceiro bloquear de
//    propósito o login de alguém por até JANELA_CONTA. A mensagem é genérica.
// Um login bem-sucedido zera a contagem (falhas anteriores a ele não contam):
// o limite por IP+e-mail zera com sucesso naquela origem; o da conta, com
// sucesso em qualquer origem.
//
// O e-mail NÃO vai em claro para a trilha: guarda-se um HMAC dele
// (detalhes.emailHash). O limite vale igual para e-mail existente ou não —
// a resposta 429 não revela se a conta existe.
//
// O rate limit global por IP (app.ts / rota de login) cobre o resto.
import { createHmac } from "node:crypto";
import { prismaSemEscopo } from "./prisma.js";

const MINUTO_MS = 60 * 1000;

/** Falhas permitidas por IP + e-mail dentro da janela (env LOGIN_MAX_FALHAS). */
export const MAX_FALHAS_IP_EMAIL = Number(process.env.LOGIN_MAX_FALHAS ?? 5);
/** Janela do limite por IP + e-mail (env LOGIN_JANELA_MINUTOS, padrão 15 min). */
export const JANELA_IP_EMAIL_MS = Number(process.env.LOGIN_JANELA_MINUTOS ?? 15) * MINUTO_MS;
/** Falhas permitidas por conta, somando todas as origens (env LOGIN_MAX_FALHAS_CONTA). */
export const MAX_FALHAS_CONTA = Number(process.env.LOGIN_MAX_FALHAS_CONTA ?? 20);
/**
 * Janela do teto por conta (env LOGIN_JANELA_CONTA_MINUTOS, padrão 60 min).
 * Atingido o teto, a conta fica bloqueada até a falha mais antiga das
 * MAX_FALHAS_CONTA últimas sair da janela (no pior caso, 60 min).
 */
export const JANELA_CONTA_MS = Number(process.env.LOGIN_JANELA_CONTA_MINUTOS ?? 60) * MINUTO_MS;

/** HMAC do e-mail normalizado — chave de contagem sem guardar o e-mail em claro. */
export function hashEmailLogin(email: string): string {
  const segredo = process.env.JWT_SECRET ?? "";
  return createHmac("sha256", segredo)
    .update(`limite-login:${email.trim().toLowerCase()}`)
    .digest("hex");
}

// Só para testes: ignora falhas anteriores ao último reset (não apaga nada).
let ignorarAntesDe = new Date(0);

const maisRecente = (...datas: Array<Date | null | undefined>) =>
  new Date(Math.max(...datas.map((d) => (d ? d.getTime() : 0))));

/**
 * Segundos até o bloqueio da janela deslizante acabar (0 = pode tentar):
 * pega as `max` falhas mais recentes desde `desde`; se forem `max`, o bloqueio
 * dura até a mais antiga delas sair da janela.
 */
async function esperaPorFalhas(
  filtro: { ip?: string },
  emailHash: string,
  desde: Date,
  max: number,
  janelaMs: number,
  agora: number
): Promise<number> {
  if (max <= 0) return 0;
  const falhas = await prismaSemEscopo.auditLog.findMany({
    where: {
      acao: "LOGIN_FALHA",
      createdAt: { gt: desde },
      ...filtro,
      detalhes: { path: ["emailHash"], equals: emailHash },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: max,
  });
  if (falhas.length < max) return 0;
  const liberaEm = falhas[max - 1].createdAt.getTime() + janelaMs;
  return liberaEm > agora ? Math.ceil((liberaEm - agora) / 1000) : 0;
}

async function ultimoSucesso(emailHash: string, desde: Date, ip?: string) {
  const r = await prismaSemEscopo.auditLog.findFirst({
    where: {
      acao: "LOGIN_SUCESSO",
      createdAt: { gt: desde },
      ...(ip !== undefined ? { ip } : {}),
      detalhes: { path: ["emailHash"], equals: emailHash },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return r?.createdAt ?? null;
}

/** Segundos até liberar, ou 0 se pode tentar. Mesmo resultado para e-mail existente ou não. */
export async function segundosBloqueado(ip: string, email: string): Promise<number> {
  const agora = Date.now();
  const h = hashEmailLogin(email);
  const inicioIp = new Date(agora - JANELA_IP_EMAIL_MS);
  const inicioConta = new Date(agora - JANELA_CONTA_MS);

  const [sucessoIp, sucessoConta] = await Promise.all([
    ultimoSucesso(h, inicioIp, ip),
    ultimoSucesso(h, inicioConta),
  ]);
  const [esperaIp, esperaConta] = await Promise.all([
    esperaPorFalhas({ ip }, h, maisRecente(inicioIp, sucessoIp, ignorarAntesDe), MAX_FALHAS_IP_EMAIL, JANELA_IP_EMAIL_MS, agora),
    esperaPorFalhas({}, h, maisRecente(inicioConta, sucessoConta, ignorarAntesDe), MAX_FALHAS_CONTA, JANELA_CONTA_MS, agora),
  ]);
  return Math.max(esperaIp, esperaConta);
}

/** Só para testes: passa a ignorar as falhas já registradas (não apaga a trilha). */
export function _resetarLimiteLogin() {
  ignorarAntesDe = new Date();
}
