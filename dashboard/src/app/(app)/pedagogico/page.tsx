"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrequenciaManager } from "@/components/pedagogico/FrequenciaManager";
import { NotasManager } from "@/components/pedagogico/NotasManager";
import { BoletimDigital } from "@/components/pedagogico/BoletimDigital";
import { GradeHorariaManager } from "@/components/pedagogico/GradeHorariaManager";
import { RelatorioFrequenciaMensal } from "@/components/pedagogico/RelatorioFrequenciaMensal";
import { DisciplinasManager } from "@/components/pedagogico/DisciplinasManager";
import { ConfiguracaoAvaliacaoManager } from "@/components/pedagogico/ConfiguracaoAvaliacaoManager";
import { RecuperacaoManager } from "@/components/pedagogico/RecuperacaoManager";
import { ConselhoClasseManager } from "@/components/pedagogico/ConselhoClasseManager";
import { ConflitosHorarioManager } from "@/components/pedagogico/ConflitosHorarioManager";

const TABS = [
  { value: "frequencia", label: "Frequência", component: <FrequenciaManager /> },
  { value: "notas", label: "Notas", component: <NotasManager /> },
  { value: "boletim", label: "Boletim", component: <BoletimDigital /> },
  { value: "grade", label: "Grade Horária", component: <GradeHorariaManager /> },
  { value: "relatorio", label: "Relatório Mensal", component: <RelatorioFrequenciaMensal /> },
  { value: "recuperacao", label: "Recuperação", component: <RecuperacaoManager /> },
  { value: "conselho", label: "Conselho de Classe", component: <ConselhoClasseManager /> },
  { value: "conflitos", label: "Conflitos", component: <ConflitosHorarioManager /> },
  { value: "disciplinas", label: "Disciplinas", component: <DisciplinasManager /> },
  { value: "configuracao", label: "Configuração", component: <ConfiguracaoAvaliacaoManager /> },
];

export default function PedagogicoPage() {
  return (
    <PageWrap
      title="Gestão Pedagógica"
      subtitle="Frequência, notas, boletim, grade horária e avaliações da rede"
      breadcrumb={[{ label: "Operação" }, { label: "Pedagógico" }]}
    >
      <Tabs defaultValue="frequencia">
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
