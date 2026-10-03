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
import { useTurmas, useDisciplinas, useCreateNota } from "@/hooks/useApi";
import { useBoletinsDaTurma, useConfiguracaoDaTurma } from "@/hooks/useAvaliacaoTurma";
import {
  comoSituacao,
  formatarMedia,
  limitesDaConfiguracao,
  tomDaMedia,
  type SituacaoApi,
} from "@/lib/medias";
import { CheckCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";

interface AlunoRecuperacao {
  matriculaId: string;
  nomeAluno: string;
  /** Média final da disciplina devolvida pela API (boletim); null = sem média. */
  mediaAtual: number | null;
  situacao: SituacaoApi;
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
  const createNota = useCreateNota();

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);
  // Média vem do boletim da API (mesma conta do backend); limite = média
  // mínima da configuração de avaliação da rede para a turma.
  const { porMatricula, isLoading: loadingNotas } = useBoletinsDaTurma(
    disciplinaSelecionada ? turmaSelecionada : undefined
  );
  const { config } = useConfiguracaoDaTurma(turmaSelecionada);
  // Piso (nota mínima para recuperação) da mesma configuração: abaixo dele a
  // situação da API já é REPROVADO direto
  const { mediaMinima, notaMinimaRecuperacao } = limitesDaConfiguracao(config);
  const rotuloPiso = notaMinimaRecuperacao !== null ? notaMinimaRecuperacao.toFixed(1) : null;
  const rotuloMinima = mediaMinima !== null ? mediaMinima.toFixed(1) : "não configurada";
  const abaixoDaMinima = mediaMinima !== null ? `abaixo de ${mediaMinima.toFixed(1)}` : "abaixo da média mínima da rede";

  const alunosRecuperacao = useMemo(() => {
    if (!turmaSelecionada || !disciplinaSelecionada) return [];

    const alunos: AlunoRecuperacao[] = (turmaSelecionada.matriculas ?? []).map((matricula) => {
      const disc = porMatricula
        .get(matricula.id)
        ?.disciplinas.find((d) => d.disciplinaNome === disciplinaSelecionada);
      return {
        matriculaId: matricula.id,
        nomeAluno: matricula.nomeAluno,
        mediaAtual: disc?.mediaFinal ?? null,
        situacao: comoSituacao(disc?.situacao),
      };
    });

    // Sem média não entra (não vira 0). Abaixo da mínima da configuração, ou
    // em RECUPERACAO segundo a API (vale também sem configuração cadastrada).
    return alunos
      .filter(
        (a) =>
          a.situacao === "RECUPERACAO" ||
          (a.mediaAtual !== null && mediaMinima !== null && a.mediaAtual < mediaMinima)
      )
      .sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno));
  }, [turmaSelecionada, disciplinaSelecionada, porMatricula, mediaMinima]);

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
            Lance notas de recuperação paralela ou final para alunos com média {abaixoDaMinima}
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
                  {alunosRecuperacao.length} aluno(s) com média {abaixoDaMinima}
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
                  Nenhum aluno com média {abaixoDaMinima} nesta disciplina (alunos ainda sem média não aparecem)
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
                      const mediaFinal = notaRecup > 0 && aluno.mediaAtual !== null
                        ? parseFloat(calcularMediaFinal(aluno.mediaAtual, notaRecup))
                        : 0;
                      const aprovado = mediaMinima !== null && mediaFinal >= mediaMinima;

                      return (
                        <TableRow key={aluno.matriculaId}>
                          <TableCell className="font-medium">{aluno.nomeAluno}</TableCell>
                          <TableCell className="text-center">
                            {tomDaMedia(aluno.mediaAtual, mediaMinima, notaMinimaRecuperacao) === "reprovacao" ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <Badge variant="destructive">{formatarMedia(aluno.mediaAtual, 2)}</Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  abaixo de {rotuloPiso} (reprovação direta)
                                </span>
                              </div>
                            ) : (
                              <Badge variant="warning">{formatarMedia(aluno.mediaAtual, 2)}</Badge>
                            )}
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
                              <Badge variant={aprovado ? "default" : "destructive"}>
                                {mediaFinal.toFixed(2)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {mediaFinal > 0 && mediaMinima !== null && (
                              aprovado ? (
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
            atingiram a média mínima ({rotuloMinima})
          </p>
          {rotuloPiso !== null && (
            <p>
              • <strong>Nota mínima para recuperação:</strong> {rotuloPiso} — média final abaixo dela é
              reprovação direta (configuração de avaliação da rede)
            </p>
          )}
          <p>
            • <strong>Cálculo da Média Final:</strong> (Média Atual + Nota Recuperação) / 2
          </p>
          <p>
            • <strong>Aprovação:</strong> Média final ≥ média mínima da configuração de avaliação da rede ({rotuloMinima})
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
