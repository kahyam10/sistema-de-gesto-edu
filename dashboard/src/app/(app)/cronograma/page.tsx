"use client";

import { TimelineTab } from "@/components/TimelineTab";

export default function CronogramaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cronograma</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o cronograma de implementação do sistema
        </p>
      </div>
      <TimelineTab />
    </div>
  );
}
