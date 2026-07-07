"use client";

import { KPITab } from "@/components/KPITab";

export default function KPIsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Indicadores de Desempenho</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe os KPIs e métricas do sistema educacional
        </p>
      </div>
      <KPITab />
    </div>
  );
}
