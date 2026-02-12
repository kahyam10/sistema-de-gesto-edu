"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuscaAtivaManager } from "./enrollment/BuscaAtivaManager";
import { EducacaoEspecialManager } from "./enrollment/EducacaoEspecialManager";
import { AcompanhamentoManager } from "./enrollment/AcompanhamentoManager";
import { MagnifyingGlass, Student, ChartLine } from "@phosphor-icons/react";

export function ProgramasEspeciaisTab() {
  const [activeSubTab, setActiveSubTab] = useState("busca-ativa");

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="busca-ativa" className="flex items-center gap-2">
          <MagnifyingGlass size={18} />
          <span>Busca Ativa</span>
        </TabsTrigger>
        <TabsTrigger value="aee" className="flex items-center gap-2">
          <Student size={18} />
          <span>Educação Especial / AEE</span>
        </TabsTrigger>
        <TabsTrigger value="acompanhamento" className="flex items-center gap-2">
          <ChartLine size={18} />
          <span>Acompanhamento</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="busca-ativa" className="mt-6">
        <BuscaAtivaManager />
      </TabsContent>

      <TabsContent value="aee" className="mt-6">
        <EducacaoEspecialManager />
      </TabsContent>

      <TabsContent value="acompanhamento" className="mt-6">
        <AcompanhamentoManager />
      </TabsContent>
    </Tabs>
  );
}
