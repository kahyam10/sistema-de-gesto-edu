"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { DevelopmentTab } from "@/components/DevelopmentTab";

export default function Page() {
  return (
    <PageWrap
      title="Desenvolvimento"
      subtitle="Status real de cada módulo e submódulo"
      breadcrumb={[{ label: 'Projeto' }, { label: 'Desenvolvimento' }]}
    >
      <DevelopmentTab />
    </PageWrap>
  );
}
