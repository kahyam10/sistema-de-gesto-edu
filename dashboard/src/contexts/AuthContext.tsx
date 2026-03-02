"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  escolaId?: string | null;
  matriculaId?: string | null;
  profissionalId?: string | null;
  escola?: any;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const logout = useCallback(() => {
    // Revogar refresh token no backend
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedToken = localStorage.getItem("token");
    if (storedRefreshToken && storedToken) {
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      }).catch(() => {}); // fire-and-forget
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    router.push("/login");
  }, [router]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshingRef.current) return null;
    isRefreshingRef.current = true;

    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        logout();
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        logout();
        return null;
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      scheduleRefresh();
      return data.token;
    } catch {
      logout();
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout]);

  // Agenda refresh 1 minuto antes de expirar (token expira em 15 min)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    // Refresh 13 minutos após o login (2 min antes de expirar)
    refreshTimerRef.current = setTimeout(() => {
      refreshAccessToken();
    }, 13 * 60 * 1000);
  }, [refreshAccessToken]);

  useEffect(() => {
    // Carrega os dados do localStorage
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Se temos refresh token, agendar renovação automática
      if (storedRefreshToken) {
        scheduleRefresh();
      }
    } else if (pathname !== "/login") {
      router.push("/login");
    }

    setLoading(false);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [pathname, router, scheduleRefresh]);

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
