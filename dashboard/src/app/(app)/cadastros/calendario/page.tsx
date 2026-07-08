"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { CalendarioLetivoManager } from "@/components/enrollment/CalendarioLetivoManager";

export default function Page() {
  return (
    <PageWrap
      title="Calendário Letivo"
      subtitle="Anos letivos, eventos e contagem de dias letivos"
      breadcrumb={[{ label: 'Operação' }, { label: 'Calendário Letivo' }]}
    >
      <CalendarioLetivoManager />
    </PageWrap>
  );
}
