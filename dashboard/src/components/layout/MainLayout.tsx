"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
