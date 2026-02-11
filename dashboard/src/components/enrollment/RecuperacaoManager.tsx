"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTurmas, useDisciplinas, useNotas, useCreateNota } from "@/hooks/useApi";
import { GraduationCap, Warning, CheckCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";

interface AlunoRecuperacao {
  matriculaId: string;
  nomeAluno: string;
  mediaAtual: number;
  precisaRecuperacao: boolean;
  notaRecuperacao?: number;
}

export function RecuperacaoManager() {
  const anoAtual = new Date().getFullYear();
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [tipoRecuperacao, setTipoRecuperacao] = useState<"PARALELA" | "FINAL">("PARALELA");
  const [notasRecuperacao, setNotasRecuperacao] = useState<Record<string, string>>({});

  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas({ anoLetivo: anoAtual });
  const { data: disciplinas = [] } = useDisciplinas();
  const { data: notas = [], isLoading: loadingNotas } = useNotas(
    turmaId && disciplinaSelecionada
      ? { turmaId, disciplina: disciplinaSelecionada }
      : undefined
  );
  const createNota = useCreateNota();

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  // Agrupa alunos e calcula médias
  const alunosRecuperacao = useMemo(() => {
    if (!turmaSelecionada || !disciplinaSelecionada) return [];

    const alunosMap = new Map<string, AlunoRecuperacao>();

    // Inicializa todos os alunos da turma
    turmaSelecionada.matriculas?.forEach((matricula) => {
      alunosMap.set(matricula.id, {
        matriculaId: matricula.id,
        nomeAluno: matricula.nomeAluno,
        mediaAtual: 0,
        precisaRecuperacao: false,
      });
    });

    // Calcula média de cada aluno
    const notasPorAluno = new Map<string, number[]>();
    notas.forEach((nota) => {
      if (!notasPorAluno.has(nota.matriculaId)) {
        notasPorAluno.set(nota.matriculaId, []);
      }
      // Ignora notas de recuperação no cálculo da média atual
      if (nota.avaliacao?.tipo !== "RECUPERACAO") {
        notasPorAluno.get(nota.matriculaId)!.push(nota.valor);
      }
    });

    notasPorAluno.forEach((valores, matriculaId) => {
      const media = valores.length > 0
        ? valores.reduce((sum, v) => sum + v, 0) / valores.length
        : 0;

      const aluno = alunosMap.get(matriculaId);
      if (aluno) {
        aluno.mediaAtual = media;
        aluno.precisaRecuperacao = media < 7.0;
      }
    });

    return Array.from(alunosMap.values())
      .filter((a) => a.precisaRecuperacao)
      .sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno));
  }, [turmaSelecionada, disciplinaSelecionada, notas]);

  const handleLancarRecuperacao = async (matriculaId: string) => {
    const notaStr = notasRecuperacao[matriculaId];
    if (!notaStr) {
      toast.error("Digite a nota de recuperação");
      return;
    }

    const nota = parseFloat(notaStr);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      toast.error("Nota deve estar entre 0 e 10");
      return;
    }

    try {
      await createNota.mutateAsync({
        matriculaId,
        turmaId,
        disciplina: disciplinaSelecionada,
        bimestre: tipoRecuperacao === "PARALELA" ? 4 : 5, // 5 = recuperação final
        avaliacaoId: null,
        valor: nota,
        observacao: `Recuperação ${tipoRecuperacao === "PARALELA" ? "Paralela" : "Final"}`,
      });

      // Limpa o campo
      setNotasRecuperacao((prev) => {
        const newState = { ...prev };
        delete newState[matriculaId];
        return newState;
      });
    } catch {
      // Erro tratado pelo hook
    }
  };

  const handleLancarTodas = async () => {
    const notasParaLancar = Object.entries(notasRecuperacao).filter(
      ([_, valor]) => valor && !isNaN(parseFloat(valor))
    );

    if (notasParaLancar.length === 0) {
      toast.error("Digite pelo menos uma nota de recuperação");
      return;
    }

    try {
      for (const [matriculaId, notaStr] of notasParaLancar) {
        const nota = parseFloat(notaStr);
        if (nota >= 0 && nota <= 10) {
          await createNota.mutateAsync({
            matriculaId,
            turmaId,
            disciplina: disciplinaSelecionada,
            bimestre: tipoRecuperacao === "PARALELA" ? 4 : 5,
            avaliacaoId: null,
            valor: nota,
            observacao: `Recuperação ${tipoRecuperacao === "PARALELA" ? "Paralela" : "Final"}`,
          });
        }
      }
      setNotasRecuperacao({});
      toast.success(`${notasParaLancar.length} nota(s) de recuperação lançada(s)!`);
    } catch {
      // Erro tratado pelo hook
    }
  };

  const calcularMediaFinal = (mediaAtual: number, notaRecup: number) => {
    // Média final = (média atual + nota recuperação) / 2
    return ((mediaAtual + notaRecup) / 2).toFixed(2);
  };

  if (loadingTurmas) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowCounterClockwise size={24} />
            Sistema de Recuperação
          </CardTitle>
          <CardDescription>
            Lance notas de recuperação paralela ou final para alunos com média abaixo de 7.0
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas
                    .filter((t) => t.ativo)
                    .map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.turno}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={disciplinaSelecionada} onValueChange={setDisciplinaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas
                    .filter((d) => d.ativo)
                    .map((disc) => (
                      <SelectItem key={disc.id} value={disc.nome}>
                        {disc.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Recuperação</Label>
              <Select
                value={tipoRecuperacao}
                onValueChange={(v: "PARALELA" | "FINAL") => setTipoRecuperacao(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARALELA">Paralela</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {turmaId && disciplinaSelecionada && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alunos em Recuperação</CardTitle>
                <CardDescription>
                  {alunosRecuperacao.length} aluno(s) com média abaixo de 7.0
                </CardDescription>
              </div>
              {alunosRecuperacao.length > 0 && Object.keys(notasRecuperacao).length > 0 && (
                <Button onClick={handleLancarTodas} disabled={createNota.isPending}>
                  Lançar Todas as Notas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingNotas ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : alunosRecuperacao.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle size={48} className="text-green-600 mb-4" weight="duotone" />
                <p className="text-lg font-medium text-green-600">
                  Nenhum aluno precisa de recuperação!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todos os alunos estão com média igual ou superior a 7.0
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead className="text-center">Média Atual</TableHead>
                      <TableHead className="text-center">Nota Recuperação</TableHead>
                      <TableHead className="text-center">Média Final</TableHead>
                      <TableHead className="text-center">Status Final</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunosRecuperacao.map((aluno) => {
                      const notaRecup = parseFloat(notasRecuperacao[aluno.matriculaId] || "0");
                      const mediaFinal = notaRecup > 0
                        ? parseFloat(calcularMediaFinal(aluno.mediaAtual, notaRecup))
                        : 0;

                      return (
                        <TableRow key={aluno.matriculaId}>
                          <TableCell className="font-medium">{aluno.nomeAluno}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">{aluno.mediaAtual.toFixed(2)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              placeholder="0.0"
                              value={notasRecuperacao[aluno.matriculaId] || ""}
                              onChange={(e) =>
                                setNotasRecuperacao((prev) => ({
                                  ...prev,
                                  [aluno.matriculaId]: e.target.value,
                                }))
                              }
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {mediaFinal > 0 && (
                              <Badge variant={mediaFinal >= 7.0 ? "default" : "destructive"}>
                                {mediaFinal.toFixed(2)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {mediaFinal > 0 && (
                              mediaFinal >= 7.0 ? (
                                <Badge className="bg-green-600">Aprovado</Badge>
                              ) : (
                                <Badge variant="destructive">Reprovado</Badge>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleLancarRecuperacao(aluno.matriculaId)}
                              disabled={
                                !notasRecuperacao[aluno.matriculaId] || createNota.isPending
                              }
                            >
                              Lançar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações sobre o sistema */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
            Como funciona a recuperação
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900 dark:text-blue-100">
          <p>
            • <strong>Recuperação Paralela:</strong> Realizada durante o ano letivo para alunos com
            dificuldades
          </p>
          <p>
            • <strong>Recuperação Final:</strong> Realizada ao final do ano para alunos que não
            atingiram média 7.0
          </p>
          <p>
            • <strong>Cálculo da Média Final:</strong> (Média Atual + Nota Recuperação) / 2
          </p>
          <p>
            • <strong>Aprovação:</strong> Média final ≥ 7.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
