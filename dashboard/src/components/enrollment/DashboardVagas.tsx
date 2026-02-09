"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVagasResumo } from "@/hooks/useApi";
import { Buildings, Users, Warning, CheckCircle } from "@phosphor-icons/react";

export function DashboardVagas() {
  const anoAtual = new Date().getFullYear();
  const { data: vagas = [], isLoading } = useVagasResumo(undefined, anoAtual);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Calcula totais gerais
  const totais = vagas.reduce(
    (acc, escola) => ({
      capacidade: acc.capacidade + escola.capacidadeTotal,
      alunos: acc.alunos + escola.alunosTotal,
      vagas: acc.vagas + escola.vagasDisponiveis,
      lotadas: acc.lotadas + escola.turmasLotadas,
    }),
    { capacidade: 0, alunos: 0, vagas: 0, lotadas: 0 }
  );

  const percentualOcupacao = totais.capacidade > 0
    ? Math.round((totais.alunos / totais.capacidade) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Card de resumo geral */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={24} className="text-blue-500" />
            Resumo Geral de Vagas - {anoAtual}
          </CardTitle>
          <CardDescription>
            Visão consolidada de vagas em todas as escolas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Capacidade Total</p>
              <p className="text-2xl font-bold">{totais.capacidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alunos Matriculados</p>
              <p className="text-2xl font-bold">{totais.alunos}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vagas Disponíveis</p>
              <p className="text-2xl font-bold text-green-600">{totais.vagas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ocupação</p>
              <p className="text-2xl font-bold">
                {percentualOcupacao}%
              </p>
            </div>
          </div>

          {totais.lotadas > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <Warning size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Atenção: {totais.lotadas} turma(s) lotada(s)
                </p>
                <p className="text-xs text-amber-700">
                  Algumas turmas atingiram a capacidade máxima
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards por escola */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vagas.map((escola) => {
          const percentual = escola.capacidadeTotal > 0
            ? Math.round((escola.alunosTotal / escola.capacidadeTotal) * 100)
            : 0;

          const statusColor =
            percentual >= 95
              ? "bg-red-100 border-red-300"
              : percentual >= 80
              ? "bg-amber-100 border-amber-300"
              : "bg-green-100 border-green-300";

          const statusIcon =
            percentual >= 95 ? (
              <Warning size={20} className="text-red-600" />
            ) : (
              <CheckCircle size={20} className="text-green-600" />
            );

          return (
            <Card key={escola.escolaId} className={`border-2 ${statusColor}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Buildings size={20} />
                  {escola.escolaNome}
                </CardTitle>
                <CardDescription>
                  {escola.totalTurmas} turma(s) • {percentual}% ocupado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Capacidade:</span>
                  <span className="font-semibold">{escola.capacidadeTotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Matriculados:</span>
                  <span className="font-semibold">{escola.alunosTotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Vagas livres:</span>
                  <span className="font-semibold text-green-600">
                    {escola.vagasDisponiveis}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Vagas PCD:</span>
                  <span className="font-semibold text-blue-600">
                    {escola.vagasPCDDisponiveis}
                  </span>
                </div>

                {escola.turmasLotadas > 0 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    {escola.turmasLotadas} turma(s) lotada(s)
                  </Badge>
                )}

                {escola.vagasDisponiveis <= 5 && escola.vagasDisponiveis > 0 && (
                  <Badge variant="outline" className="w-full justify-center bg-amber-50 text-amber-700 border-amber-300">
                    {statusIcon}
                    <span className="ml-1">Poucas vagas restantes</span>
                  </Badge>
                )}

                {escola.vagasDisponiveis === 0 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Sem vagas disponíveis
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {vagas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Buildings size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma escola com turmas cadastradas para {anoAtual}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
