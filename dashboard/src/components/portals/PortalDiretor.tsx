"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { House, Users, BookOpen, CalendarBlank } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTurmas, useMatriculas, useProfissionais } from "@/hooks/useApi";
import { TurmasManager } from "../enrollment/TurmasManager";
import { ProfissionaisManager } from "../enrollment/ProfissionaisManager";
import { FrequenciaManager } from "../enrollment/FrequenciaManager";
import { NotasManager } from "../enrollment/NotasManager";
import { useState } from "react";

export function PortalDiretor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const anoAtual = new Date().getFullYear();

  const { data: turmas = [] } = useTurmas(
    user?.escolaId ? { escolaId: user.escolaId } : undefined
  );
  const { data: matriculas = [] } = useMatriculas(
    user?.escolaId ? { escolaId: user.escolaId, anoLetivo: anoAtual } : undefined
  );
  const { data: profissionais = [] } = useProfissionais();

  const turmasAtivas = turmas.filter((t) => t.ativo).length;
  const matriculasAtivas = matriculas.filter((m) => m.status === "ATIVA").length;
  const professores = profissionais.filter((p) => p.tipo === "PROFESSOR").length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Portal do {user?.role === "DIRETOR" ? "Diretor" : "Coordenador"}
        </h1>
        <p className="text-muted-foreground">Gestão Escolar | {user?.nome}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <House className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="turmas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="pedagogico" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Pedagógico
          </TabsTrigger>
          <TabsTrigger value="equipe" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Turmas Ativas</CardDescription>
                <CardTitle className="text-3xl">{turmasAtivas}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Ano letivo {anoAtual}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Alunos Matriculados</CardDescription>
                <CardTitle className="text-3xl">{matriculasAtivas}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Matrículas ativas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Professores</CardDescription>
                <CardTitle className="text-3xl">{professores}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Na sua escola</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo ao Portal do Diretor</CardTitle>
              <CardDescription>
                Gerencie turmas, acompanhe o desempenho pedagógico e coordene sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>✓ Gestão de turmas e matrículas</p>
              <p>✓ Acompanhamento pedagógico (notas e frequência)</p>
              <p>✓ Coordenação da equipe de professores</p>
              <p>✓ Relatórios gerenciais da escola</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turmas">
          <TurmasManager />
        </TabsContent>

        <TabsContent value="pedagogico">
          <Tabs defaultValue="frequencia">
            <TabsList>
              <TabsTrigger value="frequencia">Frequência</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>
            <TabsContent value="frequencia">
              <FrequenciaManager />
            </TabsContent>
            <TabsContent value="notas">
              <NotasManager />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="equipe">
          <ProfissionaisManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
