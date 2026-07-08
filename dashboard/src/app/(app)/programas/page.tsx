"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuscaAtivaManager } from "@/components/programas/BuscaAtivaManager";
import { EducacaoEspecialManager } from "@/components/programas/EducacaoEspecialManager";
import { AcompanhamentoManager } from "@/components/programas/AcompanhamentoManager";

export default function ProgramasPage() {
  return (
    <PageWrap
      title="Programas Especiais"
      subtitle="Busca ativa escolar, educação especial (AEE) e acompanhamento individualizado"
      breadcrumb={[{ label: "Operação" }, { label: "Programas Especiais" }]}
    >
      <Tabs defaultValue="busca-ativa">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="busca-ativa">Busca Ativa</TabsTrigger>
            <TabsTrigger value="aee">Educação Especial (AEE)</TabsTrigger>
            <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="busca-ativa" className="pt-4"><BuscaAtivaManager /></TabsContent>
        <TabsContent value="aee" className="pt-4"><EducacaoEspecialManager /></TabsContent>
        <TabsContent value="acompanhamento" className="pt-4"><AcompanhamentoManager /></TabsContent>
      </Tabs>
    </PageWrap>
  );
}
