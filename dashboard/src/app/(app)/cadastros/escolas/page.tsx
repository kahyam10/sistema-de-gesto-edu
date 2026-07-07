"use client";

import { useState } from "react";
import { EscolasManager } from "@/components/enrollment/EscolasManager";
import { EscolaDetails } from "@/components/enrollment/EscolaDetails";
import type { Escola } from "@/lib/api";

export default function EscolasPage() {
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

  const handleSelectEscola = (escola: Escola) => {
    setSelectedEscola(escola);
  };

  const handleBackToList = () => {
    setSelectedEscola(null);
  };

  if (selectedEscola) {
    return <EscolaDetails escolaId={selectedEscola.id} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Escolas</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre e gerencie as escolas da rede municipal
        </p>
      </div>
      <EscolasManager onSelectEscola={handleSelectEscola} />
    </div>
  );
}
