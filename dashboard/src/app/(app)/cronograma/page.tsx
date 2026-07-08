"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { TimelineTab } from "@/components/TimelineTab";

export default function Page() {
  return (
    <PageWrap
      title="Cronograma"
      subtitle="Fases de implementação do projeto"
      breadcrumb={[{ label: 'Projeto' }, { label: 'Cronograma' }]}
    >
      <TimelineTab />
    </PageWrap>
  );
}
