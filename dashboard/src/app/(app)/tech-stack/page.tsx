"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { TechStackTab } from "@/components/TechStackTab";

export default function Page() {
  return (
    <PageWrap
      title="Tech Stack"
      subtitle="Tecnologias que sustentam o sistema"
      breadcrumb={[{ label: 'Projeto' }, { label: 'Tech Stack' }]}
    >
      <TechStackTab />
    </PageWrap>
  );
}
