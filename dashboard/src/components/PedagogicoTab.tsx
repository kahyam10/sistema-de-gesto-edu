"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PencilLine, Certificate, GearSix, CalendarCheck } from "@phosphor-icons/react";
import { DisciplinasManager } from "@/components/enrollment/DisciplinasManager";
import { FrequenciaManager } from "@/components/enrollment/FrequenciaManager";
import { NotasManager } from "@/components/enrollment/NotasManager";
import { BoletimDigital } from "@/components/enrollment/BoletimDigital";
import { ConfiguracaoAvaliacaoManager } from "@/components/enrollment/ConfiguracaoAvaliacaoManager";

export function PedagogicoTab() {
  const [activeSubTab, setActiveSubTab] = useState("frequencia");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Gestao Pedagogica
        </h2>
        <p className="text-muted-foreground">
          Frequencia, disciplinas, lancamento de notas, boletim digital e configuracoes de avaliacao
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger
            value="frequencia"
            className="flex items-center gap-2 py-3"
          >
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Frequencia</span>
            <span className="sm:hidden">Freq.</span>
          </TabsTrigger>
          <TabsTrigger
            value="disciplinas"
            className="flex items-center gap-2 py-3"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Disciplinas</span>
            <span className="sm:hidden">Disc.</span>
          </TabsTrigger>
          <TabsTrigger
            value="notas"
            className="flex items-center gap-2 py-3"
          >
            <PencilLine className="h-4 w-4" />
            <span className="hidden sm:inline">Lancar Notas</span>
            <span className="sm:hidden">Notas</span>
          </TabsTrigger>
          <TabsTrigger
            value="boletim"
            className="flex items-center gap-2 py-3"
          >
            <Certificate className="h-4 w-4" />
            <span className="hidden sm:inline">Boletim Digital</span>
            <span className="sm:hidden">Boletim</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuracao"
            className="flex items-center gap-2 py-3"
          >
            <GearSix className="h-4 w-4" />
            <span className="hidden sm:inline">Configuracao</span>
            <span className="sm:hidden">Config.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frequencia" className="mt-6">
          <FrequenciaManager />
        </TabsContent>

        <TabsContent value="disciplinas" className="mt-6">
          <DisciplinasManager />
        </TabsContent>

        <TabsContent value="notas" className="mt-6">
          <NotasManager />
        </TabsContent>

        <TabsContent value="boletim" className="mt-6">
          <BoletimDigital />
        </TabsContent>

        <TabsContent value="configuracao" className="mt-6">
          <ConfiguracaoAvaliacaoManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
