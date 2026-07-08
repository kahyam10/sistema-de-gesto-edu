"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { MatriculasManager } from "@/components/enrollment/MatriculasManager";

export default function Page() {
  return (
    <PageWrap
      title="Matrículas"
      subtitle="Gerencie as matrículas dos alunos da rede municipal"
      breadcrumb={[{ label: 'Cadastros' }, { label: 'Matrículas' }]}
    >
      <MatriculasManager />
    </PageWrap>
  );
}
