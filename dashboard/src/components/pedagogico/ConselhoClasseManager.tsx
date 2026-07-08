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
import { Checkbox } from "@/components/ui/checkbox";
import { useTurmas, useNotas, useDisciplinas, useUpdateMatricula } from "@/hooks/useApi";
import { GraduationCap, CheckCircle, XCircle, Warning, Users } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Matricula } from "@/lib/api";

interface AlunoConselho {
  matriculaId: string;
  nomeAluno: string;
  mediaGeral: number;
  disciplinas: Record<string, number>;
  statusCalculado: "APROVADO" | "REPROVADO" | "EM_RECUPERACAO";
  frequenciaGeral?: number;
}

export function ConselhoClasseManager() {
  const anoAtual = new Date().getFullYear();
  const [turmaId, setTurmaId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "APROVADO" | "REPROVADO" | "EM_RECUPERACAO">("TODOS");
  const [alunosSelecionados, setAlunosSelecionados] = useState<Set<string>>(new Set());
  const [novoStatus, setNovoStatus] = useState<"ATIVA" | "CONCLUIDA" | "CANCELADA">("CONCLUIDA");

  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas({ anoLetivo: anoAtual });
  const { data: disciplinas = [] } = useDisciplinas();
  const { data: notas = [], isLoading: loadingNotas } = useNotas(turmaId ? { turmaId } : undefined);
  const updateMatricula = useUpdateMatricula();

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  // Calcula médias e status dos alunos
  const alunosConselho = useMemo(() => {
    if (!turmaSelecionada) return [];

    const alunosMap = new Map<string, AlunoConselho>();

    // Inicializa todos os alunos da turma
    turmaSelecionada.matriculas?.forEach((matricula) => {
      alunosMap.set(matricula.id, {
        matriculaId: matricula.id,
        nomeAluno: matricula.nomeAluno,
        mediaGeral: 0,
        disciplinas: {},
        statusCalculado: "EM_RECUPERACAO",
      });
    });

    // Agrupa notas por aluno e disciplina
    const notasPorAlunoDisc = new Map<string, Map<string, number[]>>();

    notas.forEach((nota) => {
      if (!notasPorAlunoDisc.has(nota.matriculaId)) {
        notasPorAlunoDisc.set(nota.matriculaId, new Map());
      }
      const discMap = notasPorAlunoDisc.get(nota.matriculaId)!;
      if (!discMap.has(nota.disciplina)) {
        discMap.set(nota.disciplina, []);
      }
      discMap.get(nota.disciplina)!.push(nota.valor);
    });

    // Calcula médias por disciplina e média geral
    notasPorAlunoDisc.forEach((discMap, matriculaId) => {
      const aluno = alunosMap.get(matriculaId);
      if (!aluno) return;

      const mediasPorDisciplina: number[] = [];

      discMap.forEach((valores, disciplina) => {
        const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
        aluno.disciplinas[disciplina] = media;
        mediasPorDisciplina.push(media);
      });

      if (mediasPorDisciplina.length > 0) {
        aluno.mediaGeral = mediasPorDisciplina.reduce((sum, m) => sum + m, 0) / mediasPorDisciplina.length;
      }

      // Calcula status
      const todasAcimaDe7 = mediasPorDisciplina.every((m) => m >= 7.0);
      const algumaBaixoDe5 = mediasPorDisciplina.some((m) => m < 5.0);

      if (todasAcimaDe7) {
        aluno.statusCalculado = "APROVADO";
      } else if (algumaBaixoDe5 || aluno.mediaGeral < 5.0) {
        aluno.statusCalculado = "REPROVADO";
      } else {
        aluno.statusCalculado = "EM_RECUPERACAO";
      }
    });

    return Array.from(alunosMap.values()).sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno));
  }, [turmaSelecionada, notas]);

  // Filtra alunos por status
  const alunosFiltrados = useMemo(() => {
    if (filtroStatus === "TODOS") return alunosConselho;
    return alunosConselho.filter((a) => a.statusCalculado === filtroStatus);
  }, [alunosConselho, filtroStatus]);

  const handleToggleAluno = (matriculaId: string) => {
    setAlunosSelecionados((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matriculaId)) {
        newSet.delete(matriculaId);
      } else {
        newSet.add(matriculaId);
      }
      return newSet;
    });
  };

  const handleSelecionarTodos = () => {
    if (alunosSelecionados.size === alunosFiltrados.length) {
      setAlunosSelecionados(new Set());
    } else {
      setAlunosSelecionados(new Set(alunosFiltrados.map((a) => a.matriculaId)));
    }
  };

  const handleAtualizarStatus = async () => {
    if (alunosSelecionados.size === 0) {
      toast.error("Selecione pelo menos um aluno");
      return;
    }

    try {
      const promises = Array.from(alunosSelecionados).map((matriculaId) =>
        updateMatricula.mutateAsync({
          id: matriculaId,
          data: { status: novoStatus },
        })
      );

      await Promise.all(promises);
      setAlunosSelecionados(new Set());
      toast.success(`${promises.length} matrícula(s) atualizada(s) para ${novoStatus}`);
    } catch {
      // Erro tratado pelo hook
    }
  };

  const getStatusBadge = (status: AlunoConselho["statusCalculado"]) => {
    switch (status) {
      case "APROVADO":
        return <Badge className="bg-green-600">Aprovado</Badge>;
      case "REPROVADO":
        return <Badge variant="destructive">Reprovado</Badge>;
      case "EM_RECUPERACAO":
        return <Badge className="bg-yellow-600">Em Recuperação</Badge>;
    }
  };

  const getStatusIcon = (status: AlunoConselho["statusCalculado"]) => {
    switch (status) {
      case "APROVADO":
        return <CheckCircle size={20} className="text-green-600" weight="fill" />;
      case "REPROVADO":
        return <XCircle size={20} className="text-red-600" weight="fill" />;
      case "EM_RECUPERACAO":
        return <Warning size={20} className="text-yellow-600" weight="fill" />;
    }
  };

  const contadores = useMemo(() => {
    return {
      aprovados: alunosConselho.filter((a) => a.statusCalculado === "APROVADO").length,
      reprovados: alunosConselho.filter((a) => a.statusCalculado === "REPROVADO").length,
      recuperacao: alunosConselho.filter((a) => a.statusCalculado === "EM_RECUPERACAO").length,
    };
  }, [alunosConselho]);

  if (loadingTurmas) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={24} />
            Conselho de Classe
          </CardTitle>
          <CardDescription>
            Avalie o desempenho dos alunos e defina aprovação ou reprovação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Filtrar por Status</Label>
              <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="APROVADO">Aprovados</SelectItem>
                  <SelectItem value="EM_RECUPERACAO">Em Recuperação</SelectItem>
                  <SelectItem value="REPROVADO">Reprovados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {turmaId && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-green-900 dark:text-green-100">
                    Aprovados
                  </CardTitle>
                  <CheckCircle size={20} className="text-green-600" weight="fill" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {contadores.aprovados}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-yellow-900 dark:text-yellow-100">
                    Em Recuperação
                  </CardTitle>
                  <Warning size={20} className="text-yellow-600" weight="fill" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {contadores.recuperacao}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-red-900 dark:text-red-100">
                    Reprovados
                  </CardTitle>
                  <XCircle size={20} className="text-red-600" weight="fill" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {contadores.reprovados}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de alunos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Alunos</CardTitle>
                  <CardDescription>
                    {alunosFiltrados.length} aluno(s) • {alunosSelecionados.size} selecionado(s)
                  </CardDescription>
                </div>
                {alunosSelecionados.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={novoStatus} onValueChange={(v: any) => setNovoStatus(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVA">Ativa</SelectItem>
                        <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAtualizarStatus} disabled={updateMatricula.isPending}>
                      Atualizar Status
                    </Button>
                  </div>
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
              ) : alunosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={48} className="text-muted-foreground mb-4" weight="duotone" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum aluno encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajuste os filtros ou selecione outra turma
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              alunosFiltrados.length > 0 &&
                              alunosSelecionados.size === alunosFiltrados.length
                            }
                            onCheckedChange={handleSelecionarTodos}
                          />
                        </TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead className="text-center">Média Geral</TableHead>
                        <TableHead className="text-center">Disciplinas</TableHead>
                        <TableHead className="text-center">Status Calculado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alunosFiltrados.map((aluno) => (
                        <TableRow key={aluno.matriculaId}>
                          <TableCell>
                            <Checkbox
                              checked={alunosSelecionados.has(aluno.matriculaId)}
                              onCheckedChange={() => handleToggleAluno(aluno.matriculaId)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{aluno.nomeAluno}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={aluno.mediaGeral >= 7.0 ? "default" : "destructive"}
                            >
                              {aluno.mediaGeral.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {Object.entries(aluno.disciplinas).map(([disc, media]) => (
                                <Badge
                                  key={disc}
                                  variant={media >= 7.0 ? "outline" : "destructive"}
                                  className="text-xs"
                                >
                                  {disc.substring(0, 4)}: {media.toFixed(1)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(aluno.statusCalculado)}
                              {getStatusBadge(aluno.statusCalculado)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                Critérios de Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-blue-900 dark:text-blue-100">
              <p>
                • <strong>Aprovado:</strong> Todas as disciplinas com média ≥ 7.0
              </p>
              <p>
                • <strong>Em Recuperação:</strong> Uma ou mais disciplinas com média entre 5.0 e 6.9
              </p>
              <p>
                • <strong>Reprovado:</strong> Uma ou mais disciplinas com média &lt; 5.0 ou média geral &lt; 5.0
              </p>
              <p className="mt-4">
                <strong>Atenção:</strong> A mudança de status da matrícula é permanente. Certifique-se da decisão antes de atualizar.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
