"use client";

import { ProfissionaisManager } from "@/components/enrollment/ProfissionaisManager";

export default function ProfissionaisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profissionais</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie professores, auxiliares e demais profissionais da educação
        </p>
      </div>
      <ProfissionaisManager />
    </div>
  );
}
