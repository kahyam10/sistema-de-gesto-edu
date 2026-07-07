"use client";

import { ModulesTab } from "@/components/ModulesTab";

export default function ModulosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Módulos do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os módulos e funcionalidades do sistema
        </p>
      </div>
      <ModulesTab />
    </div>
  );
}
