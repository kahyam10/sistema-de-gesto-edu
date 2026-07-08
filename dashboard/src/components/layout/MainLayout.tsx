"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { filterNavForRole } from "@/components/shell/nav";
import { useAuth } from "@/lib/auth";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const sections = filterNavForRole(user?.role);

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <Sidebar sections={sections} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
