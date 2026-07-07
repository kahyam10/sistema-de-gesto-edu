"use client";

import { MatriculasManager } from "@/components/enrollment/MatriculasManager";

export default function MatriculasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matrículas</h1>
        <p className="text-muted-foreground mt-1">
          Realize e gerencie matrículas de alunos
        </p>
      </div>
      <MatriculasManager />
    </div>
  );
}
