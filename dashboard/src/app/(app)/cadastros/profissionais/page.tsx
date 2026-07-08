"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { ProfissionaisManager } from "@/components/enrollment/ProfissionaisManager";

export default function Page() {
  return (
    <PageWrap
      title="Profissionais"
      subtitle="Professores, coordenadores e equipe das escolas"
      breadcrumb={[{ label: 'Cadastros' }, { label: 'Profissionais' }]}
    >
      <ProfissionaisManager />
    </PageWrap>
  );
}
