"use client";

import { OverviewTab } from "@/components/OverviewTab";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do Sistema de Gestão Educacional
        </p>
      </div>
      <OverviewTab />
    </div>
  );
}
