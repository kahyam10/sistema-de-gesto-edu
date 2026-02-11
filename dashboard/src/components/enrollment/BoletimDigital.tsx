"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useTurmas,
  useBoletim,
} from "@/hooks/useApi";
import {
  Certificate,
  Printer,
  Student,
  ChartBar,
} from "@phosphor-icons/react";
import type { Turma, Matricula } from "@/lib/api";

function getSituacaoBadge(situacao: string) {
  switch (situacao) {
    case "APROVADO":
      return <Badge className="bg-green-600">Aprovado</Badge>;
    case "REPROVADO":
      return <Badge variant="destructive">Reprovado</Badge>;
    case "RECUPERACAO":
      return <Badge className="bg-yellow-500 text-black">Recuperacao</Badge>;
    case "EM_CURSO":
      return <Badge variant="secondary">Em Curso</Badge>;
    default:
      return <Badge variant="outline">{situacao || "-"}</Badge>;
  }
}

function getNotaColor(valor: number | null) {
  if (valor === null) return "text-muted-foreground";
  if (valor >= 6) return "text-green-600 font-semibold";
  if (valor >= 3) return "text-yellow-600 font-semibold";
  return "text-red-600 font-semibold";
}

export function BoletimDigital() {
  const [turmaId, setTurmaId] = useState<string>("");
  const [matriculaId, setMatriculaId] = useState<string>("");

  const anoAtual = new Date().getFullYear();
  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas();
  const { data: boletim, isLoading: loadingBoletim } = useBoletim(
    matriculaId || undefined,
    turmaId || undefined
  );

  const turmasAtivas = turmas.filter(
    (t) => t.anoLetivo === anoAtual && t.ativo
  );
  const turmaSelecionada = turmas.find((t) => t.id === turmaId);
  const matriculasAtivas =
    turmaSelecionada?.matriculas?.filter((m) => m.status === "ATIVA") || [];

  const handlePrint = () => {
    window.print();
  };

  if (loadingTurmas) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Certificate size={20} />
            Boletim Digital
          </CardTitle>
          <CardDescription>
            Selecione a turma e o aluno para visualizar o boletim
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select
                value={turmaId}
                onValueChange={(v) => {
                  setTurmaId(v);
                  setMatriculaId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmasAtivas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.serie?.nome} - {t.nome} ({t.turno})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aluno</Label>
              <Select
                value={matriculaId}
                onValueChange={setMatriculaId}
                disabled={!turmaId || matriculasAtivas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !turmaId
                        ? "Selecione a turma primeiro"
                        : matriculasAtivas.length === 0
                          ? "Nenhum aluno na turma"
                          : "Selecione o aluno"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {matriculasAtivas
                    .sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nomeAluno} ({m.numeroMatricula})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!boletim}
              >
                <Printer size={16} className="mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loadingBoletim && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Boletim */}
      {boletim && !loadingBoletim && (
        <div className="space-y-6" id="boletim-print">
          {/* Cabecalho */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {boletim.matricula.nomeAluno}
                  </CardTitle>
                  <CardDescription className="mt-1 space-y-1">
                    <div>
                      Matricula: {boletim.matricula.numeroMatricula}
                    </div>
                    {boletim.turma && (
                      <div>
                        Turma: {boletim.turma.nome}
                        {boletim.turma.serie && ` - ${boletim.turma.serie.nome}`}
                        {boletim.turma.escola && ` | ${boletim.turma.escola.nome}`}
                      </div>
                    )}
                  </CardDescription>
                </div>
                <Student size={48} className="text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>

          {/* Tabela de Notas */}
          {boletim.disciplinas.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar size={18} />
                  Desempenho por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead className="text-center">1o Bim</TableHead>
                        <TableHead className="text-center">2o Bim</TableHead>
                        <TableHead className="text-center">3o Bim</TableHead>
                        <TableHead className="text-center">4o Bim</TableHead>
                        <TableHead className="text-center">Media Final</TableHead>
                        <TableHead className="text-center">Situacao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boletim.disciplinas.map((disc) => (
                        <TableRow key={disc.disciplinaId}>
                          <TableCell className="font-medium">
                            {disc.disciplinaNome}
                          </TableCell>
                          {[1, 2, 3, 4].map((bim) => {
                            const bimData = disc.bimestres.find(
                              (b) => b.bimestre === bim
                            );
                            return (
                              <TableCell
                                key={bim}
                                className={`text-center ${getNotaColor(bimData?.media ?? null)}`}
                              >
                                {bimData?.media !== null && bimData?.media !== undefined
                                  ? bimData.media.toFixed(1)
                                  : "-"}
                              </TableCell>
                            );
                          })}
                          <TableCell
                            className={`text-center text-base ${getNotaColor(disc.mediaFinal)}`}
                          >
                            {disc.mediaFinal !== null
                              ? disc.mediaFinal.toFixed(1)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {getSituacaoBadge(disc.situacao)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Certificate size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma nota lancada para este aluno
                </p>
              </CardContent>
            </Card>
          )}

          {/* Frequencia por disciplina */}
          {boletim.disciplinas.some((d) => d.frequencia) && (
            <Card>
              <CardHeader>
                <CardTitle>Frequencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boletim.disciplinas
                    .filter((d) => d.frequencia)
                    .map((disc) => (
                      <div
                        key={disc.disciplinaId}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <p className="font-medium text-sm">
                          {disc.disciplinaNome}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Presencas:
                          </span>
                          <span className="font-medium">
                            {disc.frequencia!.presencas}/
                            {disc.frequencia!.totalAulas}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Faltas:</span>
                          <span className="font-medium text-red-600">
                            {disc.frequencia!.faltas}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Frequencia:
                          </span>
                          <Badge
                            variant={
                              disc.frequencia!.percentualPresenca >= 75
                                ? "default"
                                : "destructive"
                            }
                          >
                            {disc.frequencia!.percentualPresenca.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {!boletim && !loadingBoletim && turmaId && matriculaId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Certificate size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum dado encontrado para este aluno
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
