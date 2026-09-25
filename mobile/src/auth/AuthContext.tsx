import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/endpoints";
import { registrarAoExpirarSessao } from "../api/client";
import { lerRefresh, limparTokens, salvarTokens } from "../api/tokens";
import type { Usuario } from "../api/types";

interface Contexto {
  usuario: Usuario | null;
  iniciando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<Contexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const queryClient = useQueryClient();

  const encerrarLocal = useCallback(async () => {
    await limparTokens();
    queryClient.clear();
    setUsuario(null);
  }, [queryClient]);

  // Sessão expirada em qualquer request → volta para o login
  useEffect(() => {
    registrarAoExpirarSessao(() => {
      void encerrarLocal();
    });
    return () => registrarAoExpirarSessao(null);
  }, [encerrarLocal]);

  // Reabre a sessão guardada no secure-store (o cliente renova o access se preciso)
  useEffect(() => {
    (async () => {
      try {
        if (await lerRefresh()) {
          const { user } = await authApi.me();
          setUsuario(user);
        }
      } catch {
        // sem rede ou sessão inválida: segue para o login
      } finally {
        setIniciando(false);
      }
    })();
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const r = await authApi.login(email.trim(), senha);
    await salvarTokens(r.accessToken, r.refreshToken);
    setUsuario(r.user);
  }, []);

  const sair = useCallback(async () => {
    const refresh = await lerRefresh();
    try {
      if (refresh) await authApi.logout(refresh); // revoga no servidor
    } catch {
      // sem rede: o token local é apagado mesmo assim
    }
    await encerrarLocal();
  }, [encerrarLocal]);

  const valor = useMemo(() => ({ usuario, iniciando, entrar, sair }), [usuario, iniciando, entrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}
