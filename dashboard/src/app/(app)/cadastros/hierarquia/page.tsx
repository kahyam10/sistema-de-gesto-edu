"use client";

import { HierarquiaEnsinoManager } from "@/components/enrollment/HierarquiaEnsinoManager";

export default function HierarquiaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hierarquia de Ensino</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie tipos de educação, etapas, níveis e séries
        </p>
      </div>
      <HierarquiaEnsinoManager />
    </div>
  );
}
