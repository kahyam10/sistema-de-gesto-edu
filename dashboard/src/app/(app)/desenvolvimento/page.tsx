"use client";

import { DevelopmentTab } from "@/components/DevelopmentTab";

export default function DesenvolvimentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Desenvolvimento</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o progresso do desenvolvimento dos módulos
        </p>
      </div>
      <DevelopmentTab />
    </div>
  );
}
