"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, CalendarDots, Bell, Users } from "@phosphor-icons/react";
import { PlantaoPedagogicoManager } from "./enrollment/PlantaoPedagogicoManager";
import { ReuniaoPaisManager } from "./enrollment/ReuniaoPaisManager";
import { ComunicadoManager } from "./enrollment/ComunicadoManager";
import { NotificacaoManager } from "./enrollment/NotificacaoManager";
import {
  usePlantoesPedagogicos,
  useReunioesPais,
  useComunicados,
  useCountNotificacoesNaoLidas,
} from "@/hooks/useApi";

export function ComunicacaoTab() {
  const { data: plantoes = [] } = usePlantoesPedagogicos({ ativo: true });
  const { data: reunioes = [] } = useReunioesPais({ status: "AGENDADA" });
  const { data: comunicados = [] } = useComunicados({ ativo: true });
  // TODO: Get actual userId from auth context
  const userId = "user-id"; // Placeholder
  const { data: countNaoLidas } = useCountNotificacoesNaoLidas(userId);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={24} className="text-primary" />
              <CardTitle className="text-lg">Comunicados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{comunicados.length}</p>
            <CardDescription>Comunicados ativos</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarDots size={24} className="text-primary" />
              <CardTitle className="text-lg">Reuniões</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reunioes.length}</p>
            <CardDescription>Reuniões agendadas</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users size={24} className="text-primary" />
              <CardTitle className="text-lg">Plantões</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plantoes.length}</p>
            <CardDescription>Plantões pedagógicos</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell size={24} className="text-primary" />
              <CardTitle className="text-lg">Notificações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{countNaoLidas?.count || 0}</p>
            <CardDescription>Não lidas</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Manager Tabs */}
      <Tabs defaultValue="plantoes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plantoes">
            <Users className="h-4 w-4 mr-2" />
            Plantões Pedagógicos
          </TabsTrigger>
          <TabsTrigger value="reunioes">
            <CalendarDots className="h-4 w-4 mr-2" />
            Reuniões de Pais
          </TabsTrigger>
          <TabsTrigger value="comunicados">
            <Megaphone className="h-4 w-4 mr-2" />
            Comunicados
          </TabsTrigger>
          <TabsTrigger value="notificacoes">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantoes">
          <PlantaoPedagogicoManager />
        </TabsContent>

        <TabsContent value="reunioes">
          <ReuniaoPaisManager />
        </TabsContent>

        <TabsContent value="comunicados">
          <ComunicadoManager />
        </TabsContent>

        <TabsContent value="notificacoes">
          <NotificacaoManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
