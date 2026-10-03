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
import { useTurmas, useUpdateMatricula } from "@/hooks/useApi";
import { useBoletinsDaTurma, useConfiguracaoDaTurma } from "@/hooks/useAvaliacaoTurma";
import {
  alunoDoBoletim,
  formatarMedia,
  limitesDaConfiguracao,
  tomDaMedia,
  type AlunoConselho,
  type SituacaoApi,
} from "@/lib/medias";
import { CheckCircle, XCircle, Warning, Users, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";

type FiltroStatus = "TODOS" | SituacaoApi;

export function ConselhoClasseManager() {
  const anoAtual = new Date().getFullYear();
  const [turmaId, setTurmaId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("TODOS");
  const [alunosSelecionados, setAlunosSelecionados] = useState<Set<string>>(new Set());
  const [novoStatus, setNovoStatus] = useState<"ATIVA" | "CONCLUIDA" | "CANCELADA">("CONCLUIDA");

  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas({ anoLetivo: anoAtual });
  const updateMatricula = useUpdateMatricula();

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);
  // Média e situação vêm do boletim da API (mesma regra do backend: pesos,
  // avaliação realizada sem nota = 0, configuração de avaliação da rede).
  const { porMatricula, isLoading: loadingBoletins, erros: errosBoletim } = useBoletinsDaTurma(turmaSelecionada);
  const { config, isLoading: loadingConfig } = useConfiguracaoDaTurma(turmaSelecionada);
  const { mediaMinima, notaMinimaRecuperacao } = limitesDaConfiguracao(config);
  // Variante do badge pelos limites da configuração: faixa de recuperação em
  // âmbar, abaixo do piso (reprovação direta) em vermelho
  const varianteDaMedia = (valor: number | null, ok: "default" | "outline") => {
    switch (tomDaMedia(valor, mediaMinima, notaMinimaRecuperacao)) {
      case "ok":
        return ok;
      case "abaixo":
        return "warning" as const;
      case "reprovacao":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const alunosConselho = useMemo(() => {
    if (!turmaSelecionada) return [];
    return (turmaSelecionada.matriculas ?? [])
      .map((m) => alunoDoBoletim(m, porMatricula.get(m.id)))
      .sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno));
  }, [turmaSelecionada, porMatricula]);

  // Filtra alunos por status
  const alunosFiltrados = useMemo(() => {
    if (filtroStatus === "TODOS") return alunosConselho;
    return alunosConselho.filter((a) => a.situacao === filtroStatus);
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

  const getStatusBadge = (status: AlunoConselho["situacao"]) => {
    switch (status) {
      case "APROVADO":
        return <Badge className="bg-green-600">Aprovado</Badge>;
      case "REPROVADO":
        return <Badge variant="destructive">Reprovado</Badge>;
      case "RECUPERACAO":
        return <Badge className="bg-yellow-600">Em Recuperação</Badge>;
      case "EM_CURSO":
        return <Badge variant="secondary">Em Curso</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  const getStatusIcon = (status: AlunoConselho["situacao"]) => {
    switch (status) {
      case "APROVADO":
        return <CheckCircle size={20} className="text-green-600" weight="fill" />;
      case "REPROVADO":
        return <XCircle size={20} className="text-red-600" weight="fill" />;
      case "RECUPERACAO":
        return <Warning size={20} className="text-yellow-600" weight="fill" />;
      case "EM_CURSO":
        return <Clock size={20} className="text-muted-foreground" weight="fill" />;
      default:
        return null;
    }
  };

  const contadores = useMemo(() => {
    return {
      aprovados: alunosConselho.filter((a) => a.situacao === "APROVADO").length,
      reprovados: alunosConselho.filter((a) => a.situacao === "REPROVADO").length,
      recuperacao: alunosConselho.filter((a) => a.situacao === "RECUPERACAO").length,
      emCurso: alunosConselho.filter((a) => a.situacao === "EM_CURSO").length,
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
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="APROVADO">Aprovados</SelectItem>
                  <SelectItem value="RECUPERACAO">Em Recuperação</SelectItem>
                  <SelectItem value="REPROVADO">Reprovados</SelectItem>
                  <SelectItem value="EM_CURSO">Em Curso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {turmaId && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Em Curso</CardTitle>
                  <Clock size={20} className="text-muted-foreground" weight="fill" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{contadores.emCurso}</p>
              </CardContent>
            </Card>
          </div>

          {errosBoletim > 0 && (
            <p className="text-sm text-destructive">
              Não foi possível carregar o boletim de {errosBoletim} aluno(s); a situação deles aparece como &quot;—&quot;.
            </p>
          )}

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
                    <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as typeof novoStatus)}>
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
              {loadingBoletins ? (
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
                        <TableHead className="text-center">Situação (sistema)</TableHead>
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
                              variant={varianteDaMedia(aluno.mediaGeral, "default")}
                            >
                              {formatarMedia(aluno.mediaGeral, 2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {aluno.disciplinas
                                .filter((d) => d.media !== null)
                                .map((d) => (
                                  <Badge
                                    key={d.disciplinaId}
                                    variant={varianteDaMedia(d.media, "outline")}
                                    className="text-xs"
                                    title={`${d.nome}: ${formatarMedia(d.media, 2)}${d.situacao === "EM_CURSO" ? " (parcial)" : ""}`}
                                  >
                                    {d.nome.substring(0, 4)}: {formatarMedia(d.media)}
                                  </Badge>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(aluno.situacao)}
                              {getStatusBadge(aluno.situacao)}
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
                A média e a situação de cada disciplina são calculadas pelo sistema (boletim), com a
                configuração de avaliação da rede para esta turma.
              </p>
              {loadingConfig ? null : config ? (
                <p>
                  • <strong>Média mínima:</strong> {config.mediaMinima.toFixed(1)} •{" "}
                  {notaMinimaRecuperacao !== null && (
                    <>
                      <strong>Nota mínima para recuperação:</strong> {notaMinimaRecuperacao.toFixed(1)} (abaixo
                      dela, reprovação direta) •{" "}
                    </>
                  )}
                  <strong>Frequência mínima:</strong> {config.percentualFrequenciaMinima}%
                </p>
              ) : (
                <p>
                  • <strong>Configuração de avaliação não encontrada</strong> para esta turma — cadastre-a em
                  Configuração de Avaliação. As cores de média ficam neutras até lá.
                </p>
              )}
              <p>
                • <strong>Situação geral:</strong> Em Curso se alguma disciplina ainda não fechou todos os
                períodos; senão Reprovado se alguma disciplina reprovou; senão Em Recuperação se alguma está em
                recuperação; senão Aprovado.
              </p>
              <p>
                • <strong>Média geral:</strong> média simples das médias finais das disciplinas que já têm média
                (disciplina sem média não conta como zero).
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
