"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, FileText, Printer, Users } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatriculasManager } from "../enrollment/MatriculasManager";
import { AlunosManager } from "../enrollment/AlunosManager";
import { useState } from "react";
import { useMatriculas } from "@/hooks/useApi";

export function PortalSecretaria() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("matriculas");
  const anoAtual = new Date().getFullYear();

  const { data: matriculas = [] } = useMatriculas(
    user?.escolaId ? { escolaId: user.escolaId, anoLetivo: anoAtual } : undefined
  );

  const matriculasAtivas = matriculas.filter((m) => m.status === "ATIVA").length;
  const aguardandoVaga = matriculas.filter((m) => m.status === "AGUARDANDO_VAGA").length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal da Secretaria</h1>
        <p className="text-muted-foreground">
          Gestão de Matrículas e Documentos | {user?.nome}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
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
            <CardDescription>Aguardando Vaga</CardDescription>
            <CardTitle className="text-3xl">{aguardandoVaga}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Fila de espera</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matriculas" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Matrículas
          </TabsTrigger>
          <TabsTrigger value="alunos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="impressoes" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Impressões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matriculas">
          <MatriculasManager />
        </TabsContent>

        <TabsContent value="alunos">
          <AlunosManager />
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Documentos</CardTitle>
              <CardDescription>
                Upload e gerenciamento de documentos dos alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sistema de documentos disponível na ficha do aluno
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impressoes">
          <Card>
            <CardHeader>
              <CardTitle>Impressões e Declarações</CardTitle>
              <CardDescription>
                Emissão de fichas, declarações e outros documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>✓ Ficha de matrícula (PDF)</p>
              <p>✓ Declaração de matrícula (PDF)</p>
              <p>✓ Boletim escolar</p>
              <p>✓ Relatórios de frequência</p>
              <p className="text-sm text-muted-foreground mt-4">
                Disponíveis na ficha individual de cada aluno
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
