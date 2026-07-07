"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

// Protege todas as rotas (inclusive os questionários, fora do grupo (app)).
// Apenas /login é pública.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
