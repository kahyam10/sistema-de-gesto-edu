"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole =
  | "ADMIN"
  | "SEMEC"
  | "DIRETOR"
  | "COORDENADOR"
  | "SECRETARIA"
  | "PROFESSOR"
  | "RESPONSAVEL";

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  escolaId?: string;
  profissionalId?: string;
  matriculaId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Carrega o usuário do localStorage
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simula login - em produção, fazer chamada real à API
    const mockUser: User = {
      id: "1",
      email,
      nome: "Usuário Teste",
      role: "ADMIN", // Pode ser qualquer role para teste
    };

    const mockToken = "mock-jwt-token";

    localStorage.setItem("auth_token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]) => {
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      ADMIN: 7,
      SEMEC: 6,
      DIRETOR: 5,
      COORDENADOR: 4,
      SECRETARIA: 3,
      PROFESSOR: 2,
      RESPONSAVEL: 1,
    };

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
