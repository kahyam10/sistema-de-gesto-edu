"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { KPITab } from "@/components/KPITab";

export default function Page() {
  return (
    <PageWrap
      title="Indicadores de Sucesso"
      subtitle="Metas do projeto e linha de base do diagnóstico municipal"
      breadcrumb={[{ label: 'Projeto' }, { label: 'KPIs' }]}
    >
      <KPITab />
    </PageWrap>
  );
}
