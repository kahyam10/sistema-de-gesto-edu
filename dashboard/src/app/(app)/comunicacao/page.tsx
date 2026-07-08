"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { ComunicacaoTab } from "@/components/comunicacao/ComunicacaoTab";

export default function ComunicacaoPage() {
  return (
    <PageWrap
      title="Comunicação e Eventos"
      subtitle="Comunicados, notificações, plantão pedagógico e reuniões de pais"
      breadcrumb={[{ label: "Operação" }, { label: "Comunicação" }]}
    >
      <ComunicacaoTab />
    </PageWrap>
  );
}
