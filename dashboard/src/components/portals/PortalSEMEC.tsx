"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { House, Building, ChartBar, FileText } from "@phosphor-icons/react";
import { OverviewTab } from "../OverviewTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEscolas, useMatriculas, useProfissionais } from "@/hooks/useApi";
import { useState } from "react";

export function PortalSEMEC() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const anoAtual = new Date().getFullYear();

  const { data: escolas = [] } = useEscolas();
  const { data: matriculas = [] } = useMatriculas({ anoLetivo: anoAtual });
  const { data: profissionais = [] } = useProfissionais();

  const escolasAtivas = escolas.filter((e) => e.ativo).length;
  const matriculasAtivas = matriculas.filter((m) => m.status === "ATIVA").length;
  const professoresAtivos = profissionais.filter((p) => p.tipo === "PROFESSOR" && p.ativo).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal SEMEC</h1>
        <p className="text-muted-foreground">
          Secretaria Municipal de Educação | {user?.nome}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <House className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="escolas" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Rede Municipal
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            Indicadores
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Escolas Ativas</CardDescription>
                <CardTitle className="text-3xl">{escolasAtivas}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {escolas.length} total cadastradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Matrículas Ativas</CardDescription>
                <CardTitle className="text-3xl">{matriculasAtivas}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Ano letivo {anoAtual}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Professores</CardDescription>
                <CardTitle className="text-3xl">{professoresAtivos}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {profissionais.length} profissionais cadastrados
                </p>
              </CardContent>
            </Card>
          </div>

          <OverviewTab />
        </TabsContent>

        <TabsContent value="escolas">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral da Rede Municipal</CardTitle>
              <CardDescription>
                Todas as escolas da rede municipal de Ibirapitanga-BA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de gestão de escolas disponível na aba Cadastros
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicadores">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Educacionais</CardTitle>
              <CardDescription>
                Métricas e KPIs da rede municipal de ensino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Dashboards de indicadores em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerenciais</CardTitle>
              <CardDescription>
                Relatórios consolidados da rede municipal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sistema de relatórios em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
