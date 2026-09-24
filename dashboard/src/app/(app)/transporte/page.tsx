"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotaManager } from "@/components/transporte/RotaManager";
import { VeiculoManager } from "@/components/transporte/VeiculoManager";
import { MotoristaManager } from "@/components/transporte/MotoristaManager";
import { ManutencaoManager } from "@/components/transporte/ManutencaoManager";

const TABS = [
  { value: "rotas", label: "Rotas", component: <RotaManager /> },
  { value: "veiculos", label: "Veículos", component: <VeiculoManager /> },
  { value: "motoristas", label: "Motoristas", component: <MotoristaManager /> },
  { value: "manutencoes", label: "Manutenções", component: <ManutencaoManager /> },
];

export default function TransportePage() {
  return (
    <PageWrap
      title="Transporte Escolar"
      subtitle="Rotas, frota, motoristas e manutenção preventiva"
      breadcrumb={[{ label: "Operação" }, { label: "Transporte" }]}
    >
      <Tabs defaultValue="rotas">
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
