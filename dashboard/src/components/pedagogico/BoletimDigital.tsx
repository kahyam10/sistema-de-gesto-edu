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
import { Progress } from "@/components/ui/progress";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useTurmas,
  useBoletim,
} from "@/hooks/useApi";
import { useConfiguracaoDaTurma } from "@/hooks/useAvaliacaoTurma";
import {
  formatarFrequenciaDisciplina,
  formatarMedia,
  limitesDaConfiguracao,
  mediaDasMedias,
  tomDaMedia,
} from "@/lib/medias";
import {
  Certificate,
  Printer,
  ChartBar,
  Clock,
} from "@phosphor-icons/react";

function getSituacaoBadge(situacao: string, size: "sm" | "lg" = "sm") {
  const className = size === "lg" ? "text-sm px-3 py-1" : "";
  switch (situacao) {
    case "APROVADO":
      return <Badge className={`bg-green-600 ${className}`}>Aprovado</Badge>;
    case "REPROVADO":
      return <Badge variant="destructive" className={className}>Reprovado</Badge>;
    case "RECUPERACAO":
      return <Badge className={`bg-yellow-500 text-black ${className}`}>Recuperação</Badge>;
    case "EM_CURSO":
      return <Badge variant="secondary" className={className}>Em Curso</Badge>;
    default:
      return <Badge variant="outline" className={className}>{situacao || "-"}</Badge>;
  }
}

/**
 * Cor pelos limites da configuração de avaliação da turma (sem número fixo):
 * verde = atinge a média mínima; âmbar = faixa de recuperação; vermelho =
 * abaixo da nota mínima para recuperação (reprovado direto).
 */
function getNotaColor(valor: number | null, mediaMinima: number | null, piso: number | null) {
  switch (tomDaMedia(valor, mediaMinima, piso)) {
    case "ok":
      return "text-green-600 font-semibold";
    case "abaixo":
      return "text-amber-600 font-semibold";
    case "reprovacao":
      return "text-red-600 font-semibold";
    default:
      return valor === null ? "text-muted-foreground" : "font-semibold";
  }
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

  const { config } = useConfiguracaoDaTurma(turmaSelecionada);
  const { mediaMinima, notaMinimaRecuperacao } = limitesDaConfiguracao(config);
  const cor = (valor: number | null) => getNotaColor(valor, mediaMinima, notaMinimaRecuperacao);

  // A API não devolve média geral: é a média simples das médias finais (da
  // API) das disciplinas que têm média — null não entra como 0.
  const mediaGeral = boletim ? mediaDasMedias(boletim.disciplinas.map((d) => d.mediaFinal)) : null;
  const geralParcial = boletim?.situacaoGeral === "EM_CURSO";

  // Média de todas as disciplinas em cada bimestre (bimestre sem média fica de fora)
  const mediasPorBimestre = [1, 2, 3, 4].map((bim) =>
    boletim
      ? mediaDasMedias(boletim.disciplinas.map((d) => d.bimestres.find((b) => b.bimestre === bim)?.media))
      : null
  );

  const handlePrint = () => {
    window.print();
  };

  // Resolve turma.serie que pode ser string ou { nome: string }
  const getTurmaSerie = () => {
    if (!boletim?.turma?.serie) return null;
    if (typeof boletim.turma.serie === "string") return boletim.turma.serie;
    return boletim.turma.serie.nome;
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
          {/* Cabecalho com situacao geral */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {boletim.matricula.nomeAluno}
                  </CardTitle>
                  <CardDescription className="mt-1 space-y-1">
                    <div>
                      Matrícula: {boletim.matricula.numeroMatricula}
                    </div>
                    {boletim.turma && (
                      <div>
                        Turma: {boletim.turma.nome}
                        {getTurmaSerie() && ` - ${getTurmaSerie()}`}
                        {boletim.turma.escola && ` | ${typeof boletim.turma.escola === 'string' ? boletim.turma.escola : boletim.turma.escola.nome}`}
                      </div>
                    )}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {boletim.situacaoGeral && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Situação Geral</p>
                      {getSituacaoBadge(boletim.situacaoGeral, "lg")}
                    </div>
                  )}
                  {mediaGeral !== null && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Média Geral{geralParcial ? " (parcial)" : ""}
                      </p>
                      <p className={`text-2xl font-bold ${cor(mediaGeral)}`}>
                        {formatarMedia(mediaGeral)}
                      </p>
                    </div>
                  )}
                </div>
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
                        <TableHead className="text-center">1º Bim</TableHead>
                        <TableHead className="text-center">2º Bim</TableHead>
                        <TableHead className="text-center">3º Bim</TableHead>
                        <TableHead className="text-center">4º Bim</TableHead>
                        <TableHead className="text-center">Média Final</TableHead>
                        <TableHead
                          className="text-center"
                          title="Presença nas aulas desta disciplina (chamada por aula). A situação segue a frequência geral."
                        >
                          Freq.
                        </TableHead>
                        <TableHead className="text-center">Situação</TableHead>
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
                                className={`text-center ${cor(bimData?.media ?? null)}`}
                              >
                                {formatarMedia(bimData?.media)}
                              </TableCell>
                            );
                          })}
                          <TableCell
                            className={`text-center text-base ${cor(disc.mediaFinal)}`}
                          >
                            {formatarMedia(disc.mediaFinal)}
                            {disc.mediaFinal !== null && disc.situacao === "EM_CURSO" && (
                              <span className="block text-[10px] font-normal text-muted-foreground">parcial</span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-center text-xs text-muted-foreground tabular-nums"
                            title={
                              disc.frequencia
                                ? `${disc.frequencia.presencas} presença(s) em ${disc.frequencia.totalAulas} aula(s)`
                                : "Sem aula registrada desta disciplina"
                            }
                          >
                            {formatarFrequenciaDisciplina(disc.frequencia)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getSituacaoBadge(disc.situacao)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Média Geral</TableCell>
                        {mediasPorBimestre.map((media, idx) => (
                          <TableCell
                            key={idx}
                            className={`text-center ${cor(media)}`}
                          >
                            {formatarMedia(media)}
                          </TableCell>
                        ))}
                        <TableCell
                          className={`text-center text-base ${cor(mediaGeral)}`}
                        >
                          {formatarMedia(mediaGeral)}
                          {mediaGeral !== null && geralParcial && (
                            <span className="block text-[10px] font-normal text-muted-foreground">parcial</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-center text-xs text-muted-foreground tabular-nums"
                          title="Frequência geral (vale para a situação)"
                        >
                          {boletim.frequencia && boletim.frequencia.totalAulas > 0
                            ? `${boletim.frequencia.percentualPresenca}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {boletim.situacaoGeral
                            ? getSituacaoBadge(boletim.situacaoGeral)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                {mediaMinima !== null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="text-green-600 font-semibold">Verde</span>: média ≥ {mediaMinima.toFixed(1)}
                    {" · "}
                    <span className="text-amber-600 font-semibold">Âmbar</span>: recuperação
                    {notaMinimaRecuperacao !== null && (
                      <>
                        {" · "}
                        <span className="text-red-600 font-semibold">Vermelho</span>: abaixo de{" "}
                        {notaMinimaRecuperacao.toFixed(1)} (reprovação direta)
                      </>
                    )}
                    {" · "}Freq. = presença nas aulas da disciplina; a situação segue a frequência geral.
                  </p>
                )}
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

          {/* Frequencia Geral */}
          {boletim.frequencia && boletim.frequencia.totalAulas > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} />
                  Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Percentual de presenca
                    </span>
                    <Badge
                      variant={
                        boletim.frequencia.abaixoDoLimite
                          ? "destructive"
                          : "default"
                      }
                      className="text-sm"
                    >
                      {boletim.frequencia.percentualPresenca.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress
                    value={boletim.frequencia.percentualPresenca}
                    className={`h-3 ${boletim.frequencia.abaixoDoLimite ? "[&>div]:bg-red-500" : ""}`}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {boletim.frequencia.presencas}
                      </p>
                      <p className="text-xs text-muted-foreground">Presencas</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {boletim.frequencia.faltas}
                      </p>
                      <p className="text-xs text-muted-foreground">Faltas</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-2xl font-bold">
                        {boletim.frequencia.totalAulas}
                      </p>
                      <p className="text-xs text-muted-foreground">Total de Aulas</p>
                    </div>
                  </div>
                  {boletim.frequencia.abaixoDoLimite && (
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                      Atenção: frequência abaixo do mínimo exigido
                      {config ? ` de ${config.percentualFrequenciaMinima}%` : ""}. O aluno pode ser reprovado por faltas.
                    </div>
                  )}
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
