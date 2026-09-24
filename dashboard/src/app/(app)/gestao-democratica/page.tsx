"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColegiadoManager } from "@/components/democratica/ColegiadoManager";
import { GremioManager } from "@/components/democratica/GremioManager";
import { LiderTurmaManager } from "@/components/democratica/LiderTurmaManager";
import { ReuniaoDemocraticaManager } from "@/components/democratica/ReuniaoDemocraticaManager";

const TABS = [
  { value: "colegiado", label: "Colegiado", component: <ColegiadoManager /> },
  { value: "gremio", label: "Grêmio Estudantil", component: <GremioManager /> },
  { value: "lideres", label: "Líderes de Turma", component: <LiderTurmaManager /> },
  { value: "reunioes", label: "Reuniões", component: <ReuniaoDemocraticaManager /> },
];

export default function GestaoDemocraticaPage() {
  return (
    <PageWrap
      title="Gestão Democrática"
      subtitle="Colegiado escolar, grêmio estudantil, líderes de turma e assembleias"
      breadcrumb={[{ label: "Operação" }, { label: "Gestão Democrática" }]}
    >
      <Tabs defaultValue="colegiado">
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
