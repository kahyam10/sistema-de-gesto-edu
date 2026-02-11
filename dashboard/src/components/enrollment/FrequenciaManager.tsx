"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  useTurmas,
  useRegistrarFrequenciaTurma,
  useFrequenciasPorData,
  useAlunosBaixaFrequencia,
  useResumoFrequenciaTurma,
} from "@/hooks/useApi";
import { Check, X, FileText, Users, Warning, CalendarCheck, ChartLine } from "@phosphor-icons/react";
import { toast } from "sonner";

interface FrequenciaAluno {
  matriculaId: string;
  nomeAluno: string;
  numeroMatricula: string;
  status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
  justificativa?: string;
  observacao?: string;
}

export function FrequenciaManager() {
  const anoAtual = new Date().getFullYear();
  const dataHoje = new Date().toISOString().split("T")[0];

  const [turmaId, setTurmaId] = useState<string>("");
  const [data, setData] = useState<string>(dataHoje);
  const [frequencias, setFrequencias] = useState<FrequenciaAluno[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<FrequenciaAluno | null>(null);
  const [dialogJustificativa, setDialogJustificativa] = useState(false);

  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas();
  const { data: frequenciasExistentes, isLoading: loadingFrequencias } = useFrequenciasPorData(
    turmaId,
    data
  );
  const { data: alunosBaixaFreq = [], isLoading: loadingBaixaFreq } = useAlunosBaixaFrequencia(
    turmaId
  );
  const { data: resumoTurma = [], isLoading: loadingResumo } = useResumoFrequenciaTurma(turmaId);
  const registrarMutation = useRegistrarFrequenciaTurma();

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  // Carrega alunos da turma quando turma é selecionada
  useEffect(() => {
    if (turmaSelecionada?.matriculas) {
      const alunosAtivos = turmaSelecionada.matriculas.filter(
        (m) => m.status === "ATIVA"
      );

      // Se já existem frequências para esta data, carrega elas
      if (frequenciasExistentes && frequenciasExistentes.length > 0) {
        const freqMap = new Map(
          frequenciasExistentes.map((f) => [
            f.matriculaId,
            {
              matriculaId: f.matriculaId,
              nomeAluno: f.matricula?.nomeAluno || "",
              numeroMatricula: f.matricula?.numeroMatricula || "",
              status: f.status,
              justificativa: f.justificativa,
              observacao: f.observacao,
            },
          ])
        );

        setFrequencias(
          alunosAtivos.map((aluno) => {
            const freq = freqMap.get(aluno.id);
            return (
              freq || {
                matriculaId: aluno.id,
                nomeAluno: aluno.nomeAluno,
                numeroMatricula: aluno.numeroMatricula,
                status: "PRESENTE" as const,
              }
            );
          })
        );
      } else {
        // Inicializa todos como presentes
        setFrequencias(
          alunosAtivos.map((aluno) => ({
            matriculaId: aluno.id,
            nomeAluno: aluno.nomeAluno,
            numeroMatricula: aluno.numeroMatricula,
            status: "PRESENTE" as const,
          }))
        );
      }
    } else {
      setFrequencias([]);
    }
  }, [turmaSelecionada, frequenciasExistentes]);

  const handleStatusChange = (matriculaId: string, status: "PRESENTE" | "FALTA" | "JUSTIFICADA") => {
    setFrequencias((prev) =>
      prev.map((f) =>
        f.matriculaId === matriculaId
          ? {
              ...f,
              status,
              justificativa: status === "PRESENTE" ? undefined : f.justificativa,
            }
          : f
      )
    );
  };

  const handleJustificativaDialog = (aluno: FrequenciaAluno) => {
    setAlunoSelecionado(aluno);
    setDialogJustificativa(true);
  };

  const handleSaveJustificativa = () => {
    if (alunoSelecionado) {
      setFrequencias((prev) =>
        prev.map((f) =>
          f.matriculaId === alunoSelecionado.matriculaId
            ? {
                ...f,
                justificativa: alunoSelecionado.justificativa,
                observacao: alunoSelecionado.observacao,
              }
            : f
        )
      );
    }
    setDialogJustificativa(false);
    setAlunoSelecionado(null);
  };

  const handleMarcarTodos = (status: "PRESENTE" | "FALTA") => {
    setFrequencias((prev) =>
      prev.map((f) => ({
        ...f,
        status,
        justificativa: status === "PRESENTE" ? undefined : f.justificativa,
      }))
    );
  };

  const handleSalvar = async () => {
    if (!turmaId || !data) {
      toast.error("Selecione uma turma e uma data");
      return;
    }

    // Valida se faltas justificadas têm justificativa
    const faltasJustificadasSemTexto = frequencias.filter(
      (f) => f.status === "JUSTIFICADA" && !f.justificativa
    );

    if (faltasJustificadasSemTexto.length > 0) {
      toast.error(
        "Faltas justificadas devem ter uma justificativa. Adicione justificativas antes de salvar."
      );
      return;
    }

    try {
      await registrarMutation.mutateAsync({
        turmaId,
        data,
        presencas: frequencias.map((f) => ({
          matriculaId: f.matriculaId,
          status: f.status,
          justificativa: f.justificativa,
          observacao: f.observacao,
        })),
      });
    } catch (error) {
      // Error já é tratado pelo hook
    }
  };

  const contadores = {
    presentes: frequencias.filter((f) => f.status === "PRESENTE").length,
    faltas: frequencias.filter((f) => f.status === "FALTA").length,
    justificadas: frequencias.filter((f) => f.status === "JUSTIFICADA").length,
    total: frequencias.length,
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
      {/* Card de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck size={24} />
            Registro de Frequência
          </CardTitle>
          <CardDescription>
            Selecione a turma e a data para registrar a frequência dos alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="turma">Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger id="turma">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas
                    .filter((t) => t.anoLetivo === anoAtual && t.ativo)
                    .map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.serie?.nome} - {turma.nome} ({turma.turno})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                max={dataHoje}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Alunos com Baixa Frequência */}
      {turmaId && alunosBaixaFreq.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <Warning size={20} />
              Alunos com Frequência Abaixo de 75%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alunosBaixaFreq.map((item) => (
                <div
                  key={item.matricula.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-amber-200"
                >
                  <div>
                    <p className="font-medium text-sm">{item.matricula.nomeAluno}</p>
                    <p className="text-xs text-muted-foreground">
                      Mat: {item.matricula.numeroMatricula}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {item.estatisticas.percentualPresenca}% de presença
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Frequência */}
      {turmaId && frequencias.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users size={24} />
                  Lista de Frequência
                </CardTitle>
                <CardDescription>
                  {turmaSelecionada?.serie?.nome} - {turmaSelecionada?.nome} •{" "}
                  {new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarcarTodos("PRESENTE")}
                >
                  Todos Presentes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarcarTodos("FALTA")}
                >
                  Todos Falta
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contadores */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{contadores.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{contadores.presentes}</p>
                <p className="text-sm text-muted-foreground">Presentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{contadores.faltas}</p>
                <p className="text-sm text-muted-foreground">Faltas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{contadores.justificadas}</p>
                <p className="text-sm text-muted-foreground">Justificadas</p>
              </div>
            </div>

            {/* Tabela */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frequencias.map((freq) => (
                    <TableRow key={freq.matriculaId}>
                      <TableCell className="font-mono text-sm">
                        {freq.numeroMatricula}
                      </TableCell>
                      <TableCell className="font-medium">{freq.nomeAluno}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant={freq.status === "PRESENTE" ? "default" : "outline"}
                            onClick={() => handleStatusChange(freq.matriculaId, "PRESENTE")}
                            className="w-24"
                          >
                            <Check size={16} className="mr-1" />
                            Presente
                          </Button>
                          <Button
                            size="sm"
                            variant={freq.status === "FALTA" ? "destructive" : "outline"}
                            onClick={() => handleStatusChange(freq.matriculaId, "FALTA")}
                            className="w-24"
                          >
                            <X size={16} className="mr-1" />
                            Falta
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              freq.status === "JUSTIFICADA" ? "secondary" : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(freq.matriculaId, "JUSTIFICADA")
                            }
                            className="w-28"
                          >
                            <FileText size={16} className="mr-1" />
                            Justificada
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(freq.status === "FALTA" || freq.status === "JUSTIFICADA") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleJustificativaDialog(freq)}
                          >
                            {freq.justificativa ? "Editar" : "Adicionar"} Justificativa
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end gap-2">
              <Button
                size="lg"
                onClick={handleSalvar}
                disabled={registrarMutation.isPending || loadingFrequencias}
              >
                {registrarMutation.isPending ? "Salvando..." : "Salvar Frequência"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Frequência da Turma */}
      {turmaId && resumoTurma.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine size={20} />
              Resumo de Frequência da Turma
            </CardTitle>
            <CardDescription>
              Percentual acumulado de presença por aluno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resumoTurma.map((item) => {
                const pct = item.estatisticas.percentualPresenca;
                return (
                  <div key={item.matricula.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.matricula.nomeAluno}</span>
                        <span className="text-xs text-muted-foreground">
                          ({item.estatisticas.presencas}/{item.estatisticas.totalAulas})
                        </span>
                      </div>
                      <Badge
                        variant={pct >= 75 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {pct.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2 ${
                        pct < 75
                          ? "[&>div]:bg-red-500"
                          : pct < 85
                            ? "[&>div]:bg-yellow-500"
                            : ""
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {turmaId && frequencias.length === 0 && !loadingFrequencias && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum aluno ativo encontrado nesta turma
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Justificativa */}
      <Dialog open={dialogJustificativa} onOpenChange={setDialogJustificativa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificativa de Falta</DialogTitle>
            <DialogDescription>
              Adicione uma justificativa para a falta de {alunoSelecionado?.nomeAluno}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa</Label>
              <Textarea
                id="justificativa"
                placeholder="Ex: Atestado médico, consulta, etc."
                value={alunoSelecionado?.justificativa || ""}
                onChange={(e) =>
                  setAlunoSelecionado((prev) =>
                    prev ? { ...prev, justificativa: e.target.value } : null
                  )
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea
                id="observacao"
                placeholder="Observações adicionais"
                value={alunoSelecionado?.observacao || ""}
                onChange={(e) =>
                  setAlunoSelecionado((prev) =>
                    prev ? { ...prev, observacao: e.target.value } : null
                  )
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogJustificativa(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveJustificativa}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
