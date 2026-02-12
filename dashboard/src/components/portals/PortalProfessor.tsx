"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { House, CalendarCheck, PencilLine, Clock } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FrequenciaManager } from "../enrollment/FrequenciaManager";
import { NotasManager } from "../enrollment/NotasManager";
import { GradeHorariaManager } from "../enrollment/GradeHorariaManager";
import { useTurmas } from "@/hooks/useApi";
import { useState } from "react";

export function PortalProfessor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const anoAtual = new Date().getFullYear();

  // Busca turmas do professor (se tiver profissionalId vinculado)
  const { data: turmas = [] } = useTurmas({ anoLetivo: anoAtual });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal do Professor</h1>
        <p className="text-muted-foreground">Bem-vindo, Professor(a) {user?.nome}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <House className="h-4 w-4" />
            Início
          </TabsTrigger>
          <TabsTrigger value="frequencia" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Frequência
          </TabsTrigger>
          <TabsTrigger value="notas" className="flex items-center gap-2">
            <PencilLine className="h-4 w-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="horario" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Minhas Turmas</CardTitle>
              <CardDescription>Turmas que você leciona no ano letivo {anoAtual}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {turmas.length === 0 ? (
                  <p className="text-muted-foreground col-span-full">
                    Nenhuma turma atribuída no momento
                  </p>
                ) : (
                  turmas.slice(0, 6).map((turma) => (
                    <Card key={turma.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{turma.nome}</CardTitle>
                        <CardDescription>{turma.turno}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {turma.matriculas?.length || 0} alunos
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
              <CardDescription>Funcionalidades principais do professor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>✓ Registro de frequência diária</p>
              <p>✓ Lançamento de notas e avaliações</p>
              <p>✓ Consulta de horários e grade</p>
              <p>✓ Acompanhamento de alunos</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequencia">
          <FrequenciaManager />
        </TabsContent>

        <TabsContent value="notas">
          <NotasManager />
        </TabsContent>

        <TabsContent value="horario">
          <GradeHorariaManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
