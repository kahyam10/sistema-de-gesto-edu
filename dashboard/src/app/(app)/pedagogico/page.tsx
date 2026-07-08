"use client";

import dynamic from "next/dynamic";
import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyWidget } from "@/components/ui/empty-state";
import { FrequenciaManager } from "@/components/pedagogico/FrequenciaManager";
import { NotasManager } from "@/components/pedagogico/NotasManager";
import { BoletimDigital } from "@/components/pedagogico/BoletimDigital";
import { DisciplinasManager } from "@/components/pedagogico/DisciplinasManager";
import { ConfiguracaoAvaliacaoManager } from "@/components/pedagogico/ConfiguracaoAvaliacaoManager";
import { RecuperacaoManager } from "@/components/pedagogico/RecuperacaoManager";
import { ConselhoClasseManager } from "@/components/pedagogico/ConselhoClasseManager";
import { ConflitosHorarioManager } from "@/components/pedagogico/ConflitosHorarioManager";

// Abas que dependem do @react-pdf/renderer (pesado) carregam sob demanda
const carregando = () => (
  <EmptyWidget icon="clock" label="Carregando módulo..." />
);
const GradeHorariaManager = dynamic(
  () =>
    import("@/components/pedagogico/GradeHorariaManager").then(
      (m) => m.GradeHorariaManager
    ),
  { ssr: false, loading: carregando }
);
const RelatorioFrequenciaMensal = dynamic(
  () =>
    import("@/components/pedagogico/RelatorioFrequenciaMensal").then(
      (m) => m.RelatorioFrequenciaMensal
    ),
  { ssr: false, loading: carregando }
);

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
