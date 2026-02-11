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
import { Skeleton } from "@/components/ui/skeleton";
import { useMatriculas } from "@/hooks/useApi";
import { ClockCounterClockwise, GraduationCap } from "@phosphor-icons/react";
import type { Matricula } from "@/lib/api";

interface HistoricoMatriculasProps {
  nomeAluno: string;
  cpfAluno?: string;
  currentMatriculaId?: string;
}

export function HistoricoMatriculas({
  nomeAluno,
  cpfAluno,
  currentMatriculaId,
}: HistoricoMatriculasProps) {
  // Busca todas as matrículas sem filtro de ano
  const { data: todasMatriculas = [], isLoading } = useMatriculas({});

  // Filtra matrículas do mesmo aluno
  const historicoMatriculas = useMemo(() => {
    const matriculasDoAluno = todasMatriculas.filter((m) => {
      // Tenta match por CPF primeiro (mais confiável), depois por nome
      const matriculaCpf = (m as any).cpf;
      if (cpfAluno && matriculaCpf) {
        return matriculaCpf === cpfAluno;
      }
      return m.nomeAluno.toLowerCase() === nomeAluno.toLowerCase();
    });

    // Ordena por ano letivo (mais recente primeiro)
    return matriculasDoAluno.sort((a, b) => b.anoLetivo - a.anoLetivo);
  }, [todasMatriculas, nomeAluno, cpfAluno]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ATIVA":
        return "default";
      case "TRANSFERIDA":
        return "secondary";
      case "CANCELADA":
        return "destructive";
      case "CONCLUIDA":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatDataMatricula = (data: string | Date) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

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

  if (historicoMatriculas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockCounterClockwise size={24} />
            Histórico de Matrículas
          </CardTitle>
          <CardDescription>Registro de todas as matrículas do aluno</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap size={48} className="text-muted-foreground mb-4" weight="duotone" />
          <p className="text-muted-foreground">
            Nenhuma matrícula encontrada no histórico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockCounterClockwise size={24} />
          Histórico de Matrículas
        </CardTitle>
        <CardDescription>
          {historicoMatriculas.length} matrícula(s) encontrada(s) no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano Letivo</TableHead>
                <TableHead>Matrícula Nº</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Data Matrícula</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicoMatriculas.map((matricula) => {
                const isCurrentMatricula = matricula.id === currentMatriculaId;
                return (
                  <TableRow
                    key={matricula.id}
                    className={isCurrentMatricula ? "bg-blue-50 dark:bg-blue-950" : ""}
                  >
                    <TableCell className="font-medium">
                      {matricula.anoLetivo}
                      {isCurrentMatricula && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Atual
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {matricula.numeroMatricula}
                    </TableCell>
                    <TableCell>{matricula.escola?.nome || "-"}</TableCell>
                    <TableCell>{matricula.etapa?.nome || "-"}</TableCell>
                    <TableCell>
                      {matricula.turma?.serie?.nome || "-"}
                    </TableCell>
                    <TableCell>{matricula.turma?.nome || "-"}</TableCell>
                    <TableCell>{formatDataMatricula(matricula.dataMatricula)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(matricula.status)}>
                        {matricula.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Anos no Sistema</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(historicoMatriculas.map((m) => m.anoLetivo)).size}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {historicoMatriculas.filter((m) => m.status === "ATIVA").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-950">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {historicoMatriculas.filter((m) => m.status === "CONCLUIDA").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-950">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Escolas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(historicoMatriculas.map((m) => m.escolaId)).size}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
