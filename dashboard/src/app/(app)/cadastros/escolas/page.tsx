"use client";

import { useState } from "react";
import { PageWrap } from "@/components/ui/page-wrap";
import { EscolasManager } from "@/components/enrollment/EscolasManager";
import { EscolaDetails } from "@/components/enrollment/EscolaDetails";
import type { Escola } from "@/lib/api";

export default function EscolasPage() {
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

  if (selectedEscola) {
    return (
      <div className="px-6 py-5">
        <EscolaDetails
          escolaId={selectedEscola.id}
          onBack={() => setSelectedEscola(null)}
        />
      </div>
    );
  }

  return (
    <PageWrap
      title="Escolas"
      subtitle="Cadastre e gerencie as escolas da rede municipal"
      breadcrumb={[{ label: "Cadastros" }, { label: "Escolas" }]}
    >
      <EscolasManager onSelectEscola={setSelectedEscola} />
    </PageWrap>
  );
}
