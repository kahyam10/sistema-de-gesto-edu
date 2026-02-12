"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, Users } from "@phosphor-icons/react";
import { PontoDigitalManager } from "@/components/enrollment/PontoDigitalManager";
import { LicencasManager } from "@/components/enrollment/LicencasManager";
import { ProfissionaisManager } from "@/components/enrollment/ProfissionaisManager";

export function RHTab() {
  const [activeSubTab, setActiveSubTab] = useState("ponto");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Recursos Humanos
        </h2>
        <p className="text-muted-foreground">
          Gestão de profissionais, ponto digital e licenças
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger
            value="ponto"
            className="flex items-center gap-2 py-3"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Ponto Digital</span>
            <span className="sm:hidden">Ponto</span>
          </TabsTrigger>
          <TabsTrigger
            value="licencas"
            className="flex items-center gap-2 py-3"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Licenças</span>
            <span className="sm:hidden">Lic.</span>
          </TabsTrigger>
          <TabsTrigger
            value="profissionais"
            className="flex items-center gap-2 py-3"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Profissionais</span>
            <span className="sm:hidden">Prof.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ponto" className="mt-6">
          <PontoDigitalManager />
        </TabsContent>

        <TabsContent value="licencas" className="mt-6">
          <LicencasManager />
        </TabsContent>

        <TabsContent value="profissionais" className="mt-6">
          <ProfissionaisManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
