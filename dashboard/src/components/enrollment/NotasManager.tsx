"use client";

import { useState, useEffect, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useTurmas,
  useDisciplinasByEtapa,
  useAvaliacoes,
  useCreateAvaliacao,
  useLancarNotasTurma,
} from "@/hooks/useApi";
import {
  PencilLine,
  Plus,
  FloppyDisk,
  ChartBar,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Turma, Avaliacao } from "@/lib/api";

interface NotaAluno {
  matriculaId: string;
  numeroMatricula: string;
  nomeAluno: string;
  valor: string;
  observacao: string;
}

const BIMESTRES = [
  { value: "1", label: "1o Bimestre" },
  { value: "2", label: "2o Bimestre" },
  { value: "3", label: "3o Bimestre" },
  { value: "4", label: "4o Bimestre" },
];

const TIPOS_AVALIACAO = [
  { value: "PROVA", label: "Prova" },
  { value: "TRABALHO", label: "Trabalho" },
  { value: "ATIVIDADE", label: "Atividade" },
  { value: "PARTICIPACAO", label: "Participacao" },
  { value: "RECUPERACAO", label: "Recuperacao" },
];

export function NotasManager() {
  const [turmaId, setTurmaId] = useState<string>("");
  const [disciplinaId, setDisciplinaId] = useState<string>("");
  const [bimestre, setBimestre] = useState<string>("");
  const [avaliacaoId, setAvaliacaoId] = useState<string>("");
  const [notas, setNotas] = useState<NotaAluno[]>([]);
  const [dialogNovaAvaliacao, setDialogNovaAvaliacao] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    nome: "",
    tipo: "PROVA",
    peso: "1",
    valorMaximo: "10",
    data: new Date().toISOString().split("T")[0],
  });

  const anoAtual = new Date().getFullYear();
  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas();

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);
  const etapaId = turmaSelecionada?.serie?.etapa?.id || turmaSelecionada?.serie?.etapaId;

  const { data: disciplinas = [] } = useDisciplinasByEtapa(etapaId);
  const { data: avaliacoes = [] } = useAvaliacoes(
    turmaId && disciplinaId && bimestre
      ? { turmaId, disciplinaId, bimestre: parseInt(bimestre) }
      : undefined
  );

  const createAvaliacaoMutation = useCreateAvaliacao();
  const lancarNotasMutation = useLancarNotasTurma();

  const turmasAtivas = turmas.filter(
    (t) => t.anoLetivo === anoAtual && t.ativo
  );

  // Preencher tabela de notas quando avaliacao selecionada
  const avaliacaoSelecionada = avaliacoes.find((a) => a.id === avaliacaoId);

  useEffect(() => {
    if (!avaliacaoSelecionada || !turmaSelecionada) {
      setNotas([]);
      return;
    }

    const matriculasAtivas =
      turmaSelecionada.matriculas?.filter((m) => m.status === "ATIVA") || [];

    const notasPreenchidas = matriculasAtivas.map((m) => {
      const notaExistente = avaliacaoSelecionada.notas?.find(
        (n) => n.matriculaId === m.id
      );
      return {
        matriculaId: m.id,
        numeroMatricula: m.numeroMatricula,
        nomeAluno: m.nomeAluno,
        valor: notaExistente ? notaExistente.valor.toString() : "",
        observacao: notaExistente?.observacao || "",
      };
    });

    setNotas(notasPreenchidas.sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno)));
  }, [avaliacaoSelecionada, turmaSelecionada]);

  // Reset cascata
  useEffect(() => {
    setDisciplinaId("");
    setBimestre("");
    setAvaliacaoId("");
  }, [turmaId]);

  useEffect(() => {
    setBimestre("");
    setAvaliacaoId("");
  }, [disciplinaId]);

  useEffect(() => {
    setAvaliacaoId("");
  }, [bimestre]);

  const handleNotaChange = (matriculaId: string, valor: string) => {
    const num = parseFloat(valor);
    if (valor !== "" && (isNaN(num) || num < 0 || num > 10)) return;
    setNotas((prev) =>
      prev.map((n) => (n.matriculaId === matriculaId ? { ...n, valor } : n))
    );
  };

  const handleObsChange = (matriculaId: string, observacao: string) => {
    setNotas((prev) =>
      prev.map((n) =>
        n.matriculaId === matriculaId ? { ...n, observacao } : n
      )
    );
  };

  const getNotaColor = (valor: string) => {
    const num = parseFloat(valor);
    if (isNaN(num) || valor === "") return "";
    if (num >= 6) return "text-green-600 font-semibold";
    if (num >= 3) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const estatisticas = useMemo(() => {
    const vals = notas
      .map((n) => parseFloat(n.valor))
      .filter((v) => !isNaN(v));
    if (vals.length === 0)
      return { media: 0, maior: 0, menor: 0, total: 0 };
    return {
      media: vals.reduce((a, b) => a + b, 0) / vals.length,
      maior: Math.max(...vals),
      menor: Math.min(...vals),
      total: vals.length,
    };
  }, [notas]);

  const handleCriarAvaliacao = () => {
    if (!turmaId || !disciplinaId || !bimestre) {
      toast.error("Selecione turma, disciplina e bimestre primeiro");
      return;
    }
    createAvaliacaoMutation.mutate(
      {
        nome: novaAvaliacao.nome,
        tipo: novaAvaliacao.tipo,
        peso: parseFloat(novaAvaliacao.peso) || 1,
        valorMaximo: parseFloat(novaAvaliacao.valorMaximo) || 10,
        data: novaAvaliacao.data,
        bimestre: parseInt(bimestre),
        turmaId,
        disciplinaId,
      },
      {
        onSuccess: (avaliacao) => {
          setDialogNovaAvaliacao(false);
          setAvaliacaoId(avaliacao.id);
          setNovaAvaliacao({
            nome: "",
            tipo: "PROVA",
            peso: "1",
            valorMaximo: "10",
            data: new Date().toISOString().split("T")[0],
          });
        },
      }
    );
  };

  const handleSalvarNotas = () => {
    if (!avaliacaoId) {
      toast.error("Selecione uma avaliacao");
      return;
    }

    const notasParaSalvar = notas
      .filter((n) => n.valor !== "")
      .map((n) => ({
        matriculaId: n.matriculaId,
        valor: parseFloat(n.valor),
        observacao: n.observacao || undefined,
      }));

    if (notasParaSalvar.length === 0) {
      toast.error("Nenhuma nota para salvar");
      return;
    }

    lancarNotasMutation.mutate({
      avaliacaoId,
      notas: notasParaSalvar,
    });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PencilLine size={20} />
            Lancamento de Notas
          </CardTitle>
          <CardDescription>
            Selecione turma, disciplina, bimestre e avaliacao para lancar as notas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Turma */}
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
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

            {/* Disciplina */}
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select
                value={disciplinaId}
                onValueChange={setDisciplinaId}
                disabled={!turmaId || disciplinas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !turmaId
                        ? "Selecione a turma primeiro"
                        : disciplinas.length === 0
                          ? "Nenhuma disciplina"
                          : "Selecione a disciplina"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas
                    .filter((d) => d.ativo)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome} ({d.codigo})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bimestre */}
            <div className="space-y-2">
              <Label>Bimestre</Label>
              <Select
                value={bimestre}
                onValueChange={setBimestre}
                disabled={!disciplinaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bimestre" />
                </SelectTrigger>
                <SelectContent>
                  {BIMESTRES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Avaliacao */}
            <div className="space-y-2">
              <Label>Avaliacao</Label>
              <div className="flex gap-2">
                <Select
                  value={avaliacaoId}
                  onValueChange={setAvaliacaoId}
                  disabled={!bimestre}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        !bimestre
                          ? "Selecione o bimestre"
                          : avaliacoes.length === 0
                            ? "Nenhuma avaliacao"
                            : "Selecione"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {avaliacoes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome} ({a.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setDialogNovaAvaliacao(true)}
                  disabled={!bimestre}
                  title="Nova avaliacao"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notas */}
      {avaliacaoId && notas.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {avaliacaoSelecionada?.nome} - Peso:{" "}
                  {avaliacaoSelecionada?.peso}
                </CardTitle>
                <CardDescription>
                  Valor maximo: {avaliacaoSelecionada?.valorMaximo} |{" "}
                  {notas.length} alunos
                </CardDescription>
              </div>
              <Button
                onClick={handleSalvarNotas}
                disabled={lancarNotasMutation.isPending}
              >
                <FloppyDisk size={16} className="mr-2" />
                {lancarNotasMutation.isPending
                  ? "Salvando..."
                  : "Salvar Notas"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Matricula</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="w-28 text-center">Nota</TableHead>
                    <TableHead className="w-48">Observacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notas.map((n) => (
                    <TableRow key={n.matriculaId}>
                      <TableCell className="font-mono text-sm">
                        {n.numeroMatricula}
                      </TableCell>
                      <TableCell className="font-medium">
                        {n.nomeAluno}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={n.valor}
                          onChange={(e) =>
                            handleNotaChange(n.matriculaId, e.target.value)
                          }
                          className={`w-20 text-center mx-auto ${getNotaColor(n.valor)}`}
                          placeholder="-"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={n.observacao}
                          onChange={(e) =>
                            handleObsChange(n.matriculaId, e.target.value)
                          }
                          placeholder="Obs..."
                          className="text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Estatisticas */}
            {estatisticas.total > 0 && (
              <div className="mt-4 flex items-center gap-6 rounded-lg bg-muted p-4">
                <ChartBar size={20} className="text-muted-foreground" />
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Media: </span>
                    <span className="font-semibold">
                      {estatisticas.media.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Maior: </span>
                    <span className="font-semibold text-green-600">
                      {estatisticas.maior.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Menor: </span>
                    <span className="font-semibold text-red-600">
                      {estatisticas.menor.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lancadas: </span>
                    <span className="font-semibold">
                      {estatisticas.total}/{notas.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando sem avaliacao */}
      {turmaId && disciplinaId && bimestre && !avaliacaoId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PencilLine size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {avaliacoes.length === 0
                ? "Nenhuma avaliacao cadastrada para este filtro"
                : "Selecione uma avaliacao para lancar as notas"}
            </p>
            {avaliacoes.length === 0 && (
              <Button onClick={() => setDialogNovaAvaliacao(true)}>
                <Plus size={16} className="mr-2" />
                Criar Avaliacao
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Nova Avaliacao */}
      <Dialog
        open={dialogNovaAvaliacao}
        onOpenChange={setDialogNovaAvaliacao}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Avaliacao</DialogTitle>
            <DialogDescription>
              Crie uma nova avaliacao para {BIMESTRES.find((b) => b.value === bimestre)?.label || ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="av-nome">Nome *</Label>
              <Input
                id="av-nome"
                value={novaAvaliacao.nome}
                onChange={(e) =>
                  setNovaAvaliacao({ ...novaAvaliacao, nome: e.target.value })
                }
                placeholder="Prova 1, Trabalho Final..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={novaAvaliacao.tipo}
                  onValueChange={(v) =>
                    setNovaAvaliacao({ ...novaAvaliacao, tipo: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_AVALIACAO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="av-data">Data *</Label>
                <Input
                  id="av-data"
                  type="date"
                  value={novaAvaliacao.data}
                  onChange={(e) =>
                    setNovaAvaliacao({ ...novaAvaliacao, data: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="av-peso">Peso</Label>
                <Input
                  id="av-peso"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={novaAvaliacao.peso}
                  onChange={(e) =>
                    setNovaAvaliacao({ ...novaAvaliacao, peso: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="av-max">Valor Maximo</Label>
                <Input
                  id="av-max"
                  type="number"
                  min="1"
                  value={novaAvaliacao.valorMaximo}
                  onChange={(e) =>
                    setNovaAvaliacao({
                      ...novaAvaliacao,
                      valorMaximo: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogNovaAvaliacao(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarAvaliacao}
              disabled={
                !novaAvaliacao.nome || createAvaliacaoMutation.isPending
              }
            >
              {createAvaliacaoMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
