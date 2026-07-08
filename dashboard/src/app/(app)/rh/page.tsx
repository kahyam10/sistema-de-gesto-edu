"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PontoDigitalManager } from "@/components/rh/PontoDigitalManager";
import { LicencasManager } from "@/components/rh/LicencasManager";

export default function RHPage() {
  return (
    <PageWrap
      title="Recursos Humanos"
      subtitle="Ponto digital e licenças/afastamentos dos profissionais da rede"
      breadcrumb={[{ label: "Operação" }, { label: "RH" }]}
    >
      <Tabs defaultValue="ponto">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ponto">Ponto Digital</TabsTrigger>
            <TabsTrigger value="licencas">Licenças</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="ponto" className="pt-4"><PontoDigitalManager /></TabsContent>
        <TabsContent value="licencas" className="pt-4"><LicencasManager /></TabsContent>
      </Tabs>
    </PageWrap>
  );
}
