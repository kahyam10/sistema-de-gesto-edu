"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { HierarquiaEnsinoManager } from "@/components/enrollment/HierarquiaEnsinoManager";

export default function Page() {
  return (
    <PageWrap
      title="Hierarquia de Ensino"
      subtitle="Tipos de educação, etapas, níveis e séries da rede"
      breadcrumb={[{ label: 'Estrutura' }, { label: 'Hierarquia de Ensino' }]}
    >
      <HierarquiaEnsinoManager />
    </PageWrap>
  );
}
