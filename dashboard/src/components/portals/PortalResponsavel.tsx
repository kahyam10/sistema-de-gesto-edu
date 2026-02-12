"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Certificate, CalendarCheck, Bell } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BoletimDigital } from "../enrollment/BoletimDigital";
import { useMatricula } from "@/hooks/useApi";
import { useState } from "react";

export function PortalResponsavel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("info");

  // Busca dados da matrícula vinculada ao responsável
  const { data: matricula } = useMatricula(user?.matriculaId || "");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal do Responsável</h1>
        <p className="text-muted-foreground">Bem-vindo, {user?.nome}</p>
      </div>

      {matricula && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Aluno</CardTitle>
            <CardDescription>Informações do estudante vinculado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{matricula.nomeAluno}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matrícula</p>
                <p className="font-medium">{matricula.numeroMatricula}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{matricula.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ano Letivo</p>
                <p className="font-medium">{matricula.anoLetivo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="boletim" className="flex items-center gap-2">
            <Certificate className="h-4 w-4" />
            Boletim
          </TabsTrigger>
          <TabsTrigger value="frequencia" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Frequência
          </TabsTrigger>
          <TabsTrigger value="comunicados" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Comunicados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Aluno</CardTitle>
              <CardDescription>Dados cadastrais e escolares</CardDescription>
            </CardHeader>
            <CardContent>
              {matricula ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Dados Pessoais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome Completo</p>
                        <p>{matricula.nomeAluno}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                        <p>{new Date(matricula.dataNascimento).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sexo</p>
                        <p>{matricula.sexo === "M" ? "Masculino" : "Feminino"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Dados Escolares</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Número de Matrícula</p>
                        <p>{matricula.numeroMatricula}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ano Letivo</p>
                        <p>{matricula.anoLetivo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="capitalize">{matricula.status.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum aluno vinculado a este responsável</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletim">
          {matricula?.id ? (
            <BoletimDigital />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Nenhum aluno vinculado para visualizar o boletim
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="frequencia">
          <Card>
            <CardHeader>
              <CardTitle>Frequência Escolar</CardTitle>
              <CardDescription>Acompanhamento de presença nas aulas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Relatório de frequência em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comunicados">
          <Card>
            <CardHeader>
              <CardTitle>Comunicados da Escola</CardTitle>
              <CardDescription>Avisos e notificações importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sistema de comunicados em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
