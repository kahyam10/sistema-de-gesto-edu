"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTurmas } from "@/hooks/useApi";
import { Warning, CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";

interface AlertaTurma {
  id: string;
  nome: string;
  escolaNome: string;
  capacidade: number;
  ocupacao: number;
  percentual: number;
  nivel: "ok" | "atencao" | "critico" | "lotada";
  turno: string;
  serie: string;
}

export function AlertasTurmas() {
  const anoAtual = new Date().getFullYear();
  const { data: turmas = [], isLoading } = useTurmas({ anoLetivo: anoAtual });

  const alertas = useMemo(() => {
    const turmasComAlerta: AlertaTurma[] = [];

    turmas.forEach((turma) => {
      const capacidade = turma.capacidadeMaxima || 0;
      const ocupacao = turma.matriculas?.length || 0;
      const percentual = capacidade > 0 ? (ocupacao / capacidade) * 100 : 0;

      let nivel: AlertaTurma["nivel"] = "ok";
      if (percentual >= 100) {
        nivel = "lotada";
      } else if (percentual >= 90) {
        nivel = "critico";
      } else if (percentual >= 75) {
        nivel = "atencao";
      }

      // Só adiciona se tiver algum alerta (75% ou mais)
      if (percentual >= 75) {
        turmasComAlerta.push({
          id: turma.id,
          nome: turma.nome,
          escolaNome: turma.escola?.nome || "Escola não informada",
          capacidade,
          ocupacao,
          percentual: Math.round(percentual),
          nivel,
          turno: turma.turno,
          serie: turma.serie?.nome || "Série não informada",
        });
      }
    });

    // Ordena por percentual (mais críticos primeiro)
    return turmasComAlerta.sort((a, b) => b.percentual - a.percentual);
  }, [turmas]);

  const getNivelBadge = (nivel: AlertaTurma["nivel"]) => {
    switch (nivel) {
      case "lotada":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle size={14} weight="fill" />
            Lotada
          </Badge>
        );
      case "critico":
        return (
          <Badge variant="destructive" className="gap-1 bg-orange-600">
            <WarningCircle size={14} weight="fill" />
            Crítico
          </Badge>
        );
      case "atencao":
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
            <Warning size={14} weight="fill" />
            Atenção
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-green-600">
            <CheckCircle size={14} weight="fill" />
            OK
          </Badge>
        );
    }
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 100) return "[&>div]:bg-red-600";
    if (percentual >= 90) return "[&>div]:bg-orange-600";
    if (percentual >= 75) return "[&>div]:bg-yellow-600";
    return "";
  };

  const resumo = useMemo(() => {
    return {
      total: turmas.length,
      lotadas: alertas.filter((a) => a.nivel === "lotada").length,
      criticas: alertas.filter((a) => a.nivel === "critico").length,
      atencao: alertas.filter((a) => a.nivel === "atencao").length,
    };
  }, [turmas, alertas]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo dos Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Turmas</p>
              <p className="text-3xl font-bold">{resumo.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Turmas Lotadas</p>
              <p className="text-3xl font-bold text-red-600">{resumo.lotadas}</p>
              <p className="text-xs text-muted-foreground mt-1">100% ou mais</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Críticas</p>
              <p className="text-3xl font-bold text-orange-600">{resumo.criticas}</p>
              <p className="text-xs text-muted-foreground mt-1">90-99%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Atenção</p>
              <p className="text-3xl font-bold text-yellow-600">{resumo.atencao}</p>
              <p className="text-xs text-muted-foreground mt-1">75-89%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning size={24} />
            Alertas de Ocupação de Turmas
          </CardTitle>
          <CardDescription>
            Turmas com ocupação igual ou superior a 75% da capacidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle size={48} className="text-green-600 mb-4" weight="duotone" />
              <p className="text-lg font-medium text-green-600">
                Nenhuma turma com alerta de ocupação
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Todas as turmas estão com ocupação abaixo de 75%
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Ocupação</TableHead>
                    <TableHead>Percentual</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell className="font-medium">{alerta.nome}</TableCell>
                      <TableCell>{alerta.escolaNome}</TableCell>
                      <TableCell>{alerta.serie}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {alerta.turno}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alerta.ocupacao} / {alerta.capacidade}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(alerta.percentual, 100)}
                              className={`h-2 flex-1 ${getProgressColor(alerta.percentual)}`}
                            />
                            <span className="text-sm font-medium min-w-[3rem] text-right">
                              {alerta.percentual}%
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getNivelBadge(alerta.nivel)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações */}
      {alertas.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-blue-900 dark:text-blue-100">
            {resumo.lotadas > 0 && (
              <p>
                • <strong>{resumo.lotadas} turma(s) lotada(s)</strong>: Considere criar novas
                turmas ou redistribuir alunos.
              </p>
            )}
            {resumo.criticas > 0 && (
              <p>
                • <strong>{resumo.criticas} turma(s) crítica(s)</strong>: Monitore as
                matrículas de perto, pois estão próximas da capacidade máxima.
              </p>
            )}
            {resumo.atencao > 0 && (
              <p>
                • <strong>{resumo.atencao} turma(s) em atenção</strong>: Planeje com
                antecedência para evitar lotação.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
