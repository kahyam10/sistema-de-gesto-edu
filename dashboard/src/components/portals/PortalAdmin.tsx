"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { House, Users, GraduationCap, BookOpen } from "@phosphor-icons/react";
import { OverviewTab } from "../OverviewTab";
import { CadastrosTab } from "../CadastrosTab";
import { PedagogicoTab } from "../PedagogicoTab";
import { useState } from "react";

export function PortalAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal Administrativo</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.nome} | Perfil: Administrador
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <House className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="cadastros" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cadastros
          </TabsTrigger>
          <TabsTrigger value="pedagogico" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Pedagógico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="cadastros">
          <CadastrosTab />
        </TabsContent>

        <TabsContent value="pedagogico">
          <PedagogicoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
