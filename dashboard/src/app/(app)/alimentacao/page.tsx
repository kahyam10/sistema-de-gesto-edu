"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardapioManager } from "@/components/alimentacao/CardapioManager";
import { EstoqueManager } from "@/components/alimentacao/EstoqueManager";
import { RefeicaoManager } from "@/components/alimentacao/RefeicaoManager";
import { RelatorioPnae } from "@/components/alimentacao/RelatorioPnae";

const TABS = [
  { value: "cardapios", label: "Cardápios", component: <CardapioManager /> },
  { value: "estoque", label: "Estoque", component: <EstoqueManager /> },
  { value: "refeicoes", label: "Refeições", component: <RefeicaoManager /> },
  { value: "pnae", label: "Relatório PNAE", component: <RelatorioPnae /> },
];

export default function AlimentacaoPage() {
  return (
    <PageWrap
      title="Alimentação Escolar"
      subtitle="Cardápios, estoque da merenda, refeições servidas e prestação de contas PNAE"
      breadcrumb={[{ label: "Operação" }, { label: "Alimentação" }]}
    >
      <Tabs defaultValue="cardapios">
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
