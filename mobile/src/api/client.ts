// Cliente HTTP do app: Bearer do secure-store, renovação única (single-flight)
// quando o access expira, e aviso ao AuthContext se a sessão acabar.
import { API_URL } from "../config";
import { lerAccess, lerRefresh, limparTokens, salvarTokens } from "./tokens";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

let aoExpirarSessao: (() => void) | null = null;
export function registrarAoExpirarSessao(fn: (() => void) | null) {
  aoExpirarSessao = fn;
}

async function mensagemDeErro(res: Response): Promise<ApiError> {
  const p = (await res.json().catch(() => null)) as
    | { message?: unknown; error?: unknown; code?: unknown; issues?: Array<{ mensagem?: string }> }
    | null;
  const msg =
    (Array.isArray(p?.issues) && p!.issues[0]?.mensagem) ||
    (typeof p?.message === "string" && p.message) ||
    (typeof p?.error === "string" && p.error) ||
    (typeof (p?.error as { message?: unknown })?.message === "string" &&
      (p!.error as { message: string }).message) ||
    (res.status >= 500 ? "Erro no servidor. Tente de novo em instantes." : "Não foi possível concluir a operação.");
  return new ApiError(res.status, msg, typeof p?.code === "string" ? p.code : undefined);
}

/**
 * Resultado de uma renovação:
 * - "ok": par novo salvo (ou outra renovação já tinha salvo um par diferente);
 * - "expirada": o servidor recusou — a sessão acabou;
 * - "sem-rede": a resposta não chegou. Os tokens ficam como estão: se o
 *   servidor chegou a rotacionar, reapresentar o mesmo refresh logo em seguida
 *   devolve um par novo (o servidor reemite enquanto o sucessor perdido não
 *   foi usado), então a próxima tentativa recupera a sessão.
 */
export type ResultadoRenovacao = "ok" | "expirada" | "sem-rede";

let renovacao: Promise<ResultadoRenovacao> | null = null;

async function renovarAgora(): Promise<ResultadoRenovacao> {
  const refreshToken = await lerRefresh();
  if (!refreshToken) return "expirada";
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return "sem-rede";
  }
  if (res.ok) {
    let body: { accessToken?: unknown; refreshToken?: unknown };
    try {
      body = (await res.json()) as typeof body;
    } catch {
      // corpo cortado no meio: é resposta perdida, não sessão encerrada
      return "sem-rede";
    }
    if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") return "sem-rede";
    await salvarTokens(body.accessToken, body.refreshToken);
    return "ok";
  }
  if (res.status === 409) {
    // O sucessor deste refresh já foi usado. Se outro fluxo salvou um par
    // novo enquanto isso, ele vale; senão não há par utilizável.
    const atual = await lerRefresh();
    return atual && atual !== refreshToken ? "ok" : "expirada";
  }
  if (res.status >= 500 || res.status === 429) return "sem-rede"; // temporário: mantém os tokens
  await limparTokens();
  return "expirada";
}

/** Troca o refresh token por um novo par. Uma renovação por vez (single-flight). */
export function renovarSessaoDetalhado(): Promise<ResultadoRenovacao> {
  if (!renovacao) {
    renovacao = renovarAgora().finally(() => {
      renovacao = null;
    });
  }
  return renovacao;
}

/** Compatível com a versão anterior: true quando há um par novo pronto. */
export async function renovarSessao(): Promise<boolean> {
  return (await renovarSessaoDetalhado()) === "ok";
}

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

export async function api<T>(caminho: string, opcoes: { method?: Metodo; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opcoes;

  const executar = async () => {
    const token = auth ? await lerAccess() : null;
    return fetch(`${API_URL}${caminho}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await executar();
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor. Verifique a internet.");
  }

  if (res.status === 401 && auth) {
    const renovou = await renovarSessaoDetalhado();
    if (renovou === "sem-rede") {
      // Não derruba a sessão por falta de rede: os tokens continuam guardados
      throw new ApiError(0, "Sem conexão com o servidor. Verifique a internet.");
    }
    if (renovou === "ok") {
      try {
        res = await executar();
      } catch {
        throw new ApiError(0, "Sem conexão com o servidor. Verifique a internet.");
      }
    }
    if (res.status === 401) {
      aoExpirarSessao?.();
      throw new ApiError(401, "Sua sessão expirou. Entre novamente.");
    }
  }

  if (!res.ok) throw await mensagemDeErro(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
