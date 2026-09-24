"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportacaoEducacenso } from "@/components/exportacoes/ExportacaoEducacenso";
import { ExportacaoSistemaPresenca } from "@/components/exportacoes/ExportacaoSistemaPresenca";

const TABS = [
  {
    value: "educacenso",
    label: "Educacenso (INEP)",
    component: <ExportacaoEducacenso />,
  },
  {
    value: "sistema-presenca",
    label: "Sistema Presença (PBF)",
    component: <ExportacaoSistemaPresenca />,
  },
];

export default function ExportacoesPage() {
  return (
    <PageWrap
      title="Exportações Oficiais"
      subtitle="Educacenso (INEP) e Sistema Presença (Bolsa Família)"
      breadcrumb={[{ label: "Operação" }, { label: "Exportações" }]}
    >
      <Tabs defaultValue="educacenso">
        <div className="overflow-x-auto">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-4">
            {t.component}
          </TabsContent>
        ))}
      </Tabs>
    </PageWrap>
  );
}
