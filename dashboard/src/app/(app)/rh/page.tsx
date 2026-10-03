"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PontoDigitalManager } from "@/components/rh/PontoDigitalManager";
import { LicencasManager } from "@/components/rh/LicencasManager";
import { QuadroLotacao } from "@/components/rh/QuadroLotacao";
import { AtividadesComplementaresManager } from "@/components/rh/AtividadesComplementaresManager";
import { usePodeRH } from "@/hooks/use-papel";

export default function RHPage() {
  // Ponto e licenças: só ADMIN, SEMEC e COORDENADOR (o servidor recusa os
  // demais com 403). Lotação e ACs seguem com a equipe operacional.
  const podeRH = usePodeRH();
  return (
    <PageWrap
      title="Recursos Humanos"
      subtitle={
        podeRH
          ? "Ponto digital, licenças, quadro de lotação e ACs dos profissionais da rede"
          : "Quadro de lotação e ACs dos profissionais da escola"
      }
      breadcrumb={[{ label: "Operação" }, { label: "RH" }]}
    >
      <Tabs key={podeRH ? "rh" : "lotacao"} defaultValue={podeRH ? "ponto" : "lotacao"}>
        <div className="overflow-x-auto">
          <TabsList>
            {podeRH && <TabsTrigger value="ponto">Ponto Digital</TabsTrigger>}
            {podeRH && <TabsTrigger value="licencas">Licenças</TabsTrigger>}
            <TabsTrigger value="lotacao">Quadro de lotação</TabsTrigger>
            <TabsTrigger value="acs">ACs por área</TabsTrigger>
          </TabsList>
        </div>
        {podeRH && <TabsContent value="ponto" className="pt-4"><PontoDigitalManager /></TabsContent>}
        {podeRH && <TabsContent value="licencas" className="pt-4"><LicencasManager /></TabsContent>}
        <TabsContent value="lotacao" className="pt-4"><QuadroLotacao /></TabsContent>
        <TabsContent value="acs" className="pt-4"><AtividadesComplementaresManager /></TabsContent>
      </Tabs>
    </PageWrap>
  );
}
