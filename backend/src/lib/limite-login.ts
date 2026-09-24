// Bloqueio de força bruta no login, contando só FALHAS por (IP + e-mail).
// Escolas costumam sair para a internet por um único IP (NAT): limitar só por
// IP travaria a secretaria inteira. Aqui cada conta tem sua cota por origem,
// e o rate limit global por IP (app.ts / rota de login) cobre o resto.
// Memória local: suficiente para uma instância da API. Com várias réplicas,
// trocar por Redis.
const JANELA_MS = 15 * 60 * 1000;
const MAX_FALHAS = Number(process.env.LOGIN_MAX_FALHAS ?? 5);

const falhas = new Map<string, { quantidade: number; expiraEm: number }>();

const chave = (ip: string, email: string) => `${ip}|${email.trim().toLowerCase()}`;

function limparExpirados(agora: number) {
  if (falhas.size < 5000) return;
  for (const [k, v] of falhas) if (v.expiraEm <= agora) falhas.delete(k);
}

/** Segundos até liberar, ou 0 se pode tentar. */
export function segundosBloqueado(ip: string, email: string): number {
  const agora = Date.now();
  const r = falhas.get(chave(ip, email));
  if (!r || r.expiraEm <= agora) return 0;
  return r.quantidade >= MAX_FALHAS ? Math.ceil((r.expiraEm - agora) / 1000) : 0;
}

export function registrarFalha(ip: string, email: string) {
  const agora = Date.now();
  limparExpirados(agora);
  const k = chave(ip, email);
  const r = falhas.get(k);
  if (!r || r.expiraEm <= agora) {
    falhas.set(k, { quantidade: 1, expiraEm: agora + JANELA_MS });
  } else {
    r.quantidade += 1;
  }
}

export function limparFalhas(ip: string, email: string) {
  falhas.delete(chave(ip, email));
}

/** Só para testes */
export function _resetarLimiteLogin() {
  falhas.clear();
}
