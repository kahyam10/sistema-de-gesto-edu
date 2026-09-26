"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PontoDigitalManager } from "@/components/rh/PontoDigitalManager";
import { LicencasManager } from "@/components/rh/LicencasManager";
import { QuadroLotacao } from "@/components/rh/QuadroLotacao";
import { AtividadesComplementaresManager } from "@/components/rh/AtividadesComplementaresManager";

export default function RHPage() {
  return (
    <PageWrap
      title="Recursos Humanos"
      subtitle="Ponto digital, licenças, quadro de lotação e ACs dos profissionais da rede"
      breadcrumb={[{ label: "Operação" }, { label: "RH" }]}
    >
      <Tabs defaultValue="ponto">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ponto">Ponto Digital</TabsTrigger>
            <TabsTrigger value="licencas">Licenças</TabsTrigger>
            <TabsTrigger value="lotacao">Quadro de lotação</TabsTrigger>
            <TabsTrigger value="acs">ACs por área</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="ponto" className="pt-4"><PontoDigitalManager /></TabsContent>
        <TabsContent value="licencas" className="pt-4"><LicencasManager /></TabsContent>
        <TabsContent value="lotacao" className="pt-4"><QuadroLotacao /></TabsContent>
        <TabsContent value="acs" className="pt-4"><AtividadesComplementaresManager /></TabsContent>
      </Tabs>
    </PageWrap>
  );
}
