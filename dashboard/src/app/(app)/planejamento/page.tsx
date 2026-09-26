"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanosAulaManager } from "@/components/planejamento/PlanosAulaManager";
import { CoberturaPlanejamento } from "@/components/planejamento/CoberturaPlanejamento";
import { ConteudosProgramaticosManager } from "@/components/planejamento/ConteudosProgramaticosManager";
import { BancoAtividadesManager } from "@/components/planejamento/BancoAtividadesManager";

const TABS = [
  { value: "planos", label: "Planos de aula", component: <PlanosAulaManager /> },
  { value: "cobertura", label: "Cobertura", component: <CoberturaPlanejamento /> },
  { value: "conteudos", label: "Conteúdo programático", component: <ConteudosProgramaticosManager /> },
  { value: "atividades", label: "Banco de atividades", component: <BancoAtividadesManager /> },
];

export default function PlanejamentoPage() {
  return (
    <PageWrap
      title="Planejamento Pedagógico"
      subtitle="Conteúdo programático, planos de aula com revisão da coordenação e banco de atividades"
      breadcrumb={[{ label: "Operação" }, { label: "Planejamento" }]}
    >
      <Tabs defaultValue="planos">
        <div className="overflow-x-auto">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
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
