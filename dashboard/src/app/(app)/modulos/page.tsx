"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { ModulesTab } from "@/components/ModulesTab";

export default function Page() {
  return (
    <PageWrap
      title="Módulos do Sistema"
      subtitle="Roadmap funcional dos 9 módulos planejados"
      breadcrumb={[{ label: 'Projeto' }, { label: 'Módulos' }]}
    >
      <ModulesTab />
    </PageWrap>
  );
}
