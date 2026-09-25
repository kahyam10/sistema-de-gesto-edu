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

let renovacao: Promise<boolean> | null = null;

/** Troca o refresh token por um novo par. Uma renovação por vez. */
export function renovarSessao(): Promise<boolean> {
  if (!renovacao) {
    renovacao = (async () => {
      const refreshToken = await lerRefresh();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (res.status === 409) return true; // outra requisição acabou de renovar
        if (!res.ok) {
          await limparTokens();
          return false;
        }
        const body = (await res.json()) as { accessToken: string; refreshToken: string };
        await salvarTokens(body.accessToken, body.refreshToken);
        return true;
      } catch {
        // Sem rede: mantém os tokens para tentar depois
        return false;
      }
    })().finally(() => {
      renovacao = null;
    });
  }
  return renovacao;
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
    if (await renovarSessao()) {
      res = await executar();
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
