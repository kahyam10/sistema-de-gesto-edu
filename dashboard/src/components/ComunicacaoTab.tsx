"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, CalendarDots, Bell, Users } from "@phosphor-icons/react";

export function ComunicacaoTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={24} className="text-primary" />
              <CardTitle className="text-lg">Comunicados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
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
            <p className="text-2xl font-bold">0</p>
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
            <p className="text-2xl font-bold">0</p>
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
            <p className="text-2xl font-bold">0</p>
            <CardDescription>Não lidas</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo 9: Comunicação e Eventos</CardTitle>
          <CardDescription>
            Sistema de comunicação e eventos - Em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">✅ Backend Implementado</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Plantão Pedagógico - API completa</li>
                <li>Reuniões de Pais - API completa com controle de presença</li>
                <li>Comunicados Gerais - API completa com sistema de leitura</li>
                <li>Notificações - API completa com múltiplos canais</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🚧 Frontend (Próximo passo)</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Gerenciador de Plantões Pedagógicos</li>
                <li>Gerenciador de Reuniões de Pais</li>
                <li>Gerenciador de Comunicados</li>
                <li>Central de Notificações</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
