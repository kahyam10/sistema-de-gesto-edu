"use client";

import { CalendarioLetivoManager } from "@/components/enrollment/CalendarioLetivoManager";

export default function CalendarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendário Letivo</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie o calendário letivo, feriados e eventos escolares
        </p>
      </div>
      <CalendarioLetivoManager />
    </div>
  );
}
