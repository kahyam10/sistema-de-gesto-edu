"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { usePathname } from "next/navigation";
import { filterNavForRole, podeAcessarRota } from "@/components/shell/nav";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const sections = filterNavForRole(user?.role);
  // Área fora do papel (endereço digitado ou link antigo): avisa em vez de
  // mostrar a página vazia. A API continua recusando os dados (403).
  const bloqueado = !!user && !podeAcessarRota(pathname, user.role);

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <Sidebar sections={sections} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar sections={sections} />
        <main className="flex-1 overflow-x-hidden">
          {bloqueado ? (
            <EmptyState
              icon="shield"
              title="Acesso restrito"
              description="Seu perfil não tem acesso a esta área. Se precisar dela, fale com a gestão da rede."
              className="py-24"
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
