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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  UsersThree,
  Pencil,
  Trash,
  Buildings,
  GraduationCap,
  UserPlus,
  X,
  Eye,
  Spinner,
} from "@phosphor-icons/react";
import { Turma } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTurmas,
  useEscolas,
  useEtapas,
  useSeries,
  useMatriculas,
  useCreateTurma,
  useUpdateTurma,
  useDeleteTurma,
  useAddAlunoToTurma,
  useRemoveAlunoFromTurma,
} from "@/hooks/useApi";

interface TurmasManagerProps {
  onViewDetails?: (turma: Turma) => void;
}

export function TurmasManager({ onViewDetails }: TurmasManagerProps) {
  const { data: turmas, isLoading: loadingTurmas } = useTurmas();
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const { data: series, isLoading: loadingSeries } = useSeries();
  const { data: matriculas } = useMatriculas();

  const createTurma = useCreateTurma();
  const updateTurma = useUpdateTurma();
  const deleteTurma = useDeleteTurma();
  const addAluno = useAddAlunoToTurma();
  const removeAluno = useRemoveAlunoFromTurma();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [isAssignStudentsOpen, setIsAssignStudentsOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    escolaId: "",
    serieId: "",
    nome: "",
    turno: "MATUTINO" as "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL",
    anoLetivo: new Date().getFullYear(),
    capacidadeMaxima: 30,
    limitePCD: 2,
    ativo: true,
  });

  const escolasAtivas = (escolas || []).filter((e) => e.ativo);

  // Encontrar as séries disponíveis para a escola selecionada
  const escolaSelecionada = escolasAtivas.find(
    (e) => e.id === formData.escolaId
  );
  const etapasIds = escolaSelecionada?.etapas?.map((e) => e.etapa.id) || [];
  
  // Enriquecer séries com nome da etapa
  const seriesDisponiveis = (series || [])
    .filter((s) => etapasIds.includes(s.etapaId))
    .map((s) => {
      const etapa = etapas?.find((e) => e.id === s.etapaId);
      return {
        ...s,
        etapaNome: etapa?.nome || "",
      };
    });

  const isLoading = loadingTurmas || loadingEscolas || loadingEtapas || loadingSeries;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.escolaId || !formData.serieId) {
      return;
    }

    if (editingTurma) {
      await updateTurma.mutateAsync({
        id: editingTurma.id,
        data: {
          nome: formData.nome,
          turno: formData.turno,
          anoLetivo: formData.anoLetivo,
          capacidadeMaxima: formData.capacidadeMaxima,
          limitePCD: formData.limitePCD,
          ativo: formData.ativo,
        },
      });
    } else {
      await createTurma.mutateAsync({
        nome: formData.nome,
        turno: formData.turno,
        anoLetivo: formData.anoLetivo,
        capacidadeMaxima: formData.capacidadeMaxima,
        limitePCD: formData.limitePCD,
        escolaId: formData.escolaId,
        serieId: formData.serieId,
        ativo: formData.ativo,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      escolaId: "",
      serieId: "",
      nome: "",
      turno: "MATUTINO",
      anoLetivo: new Date().getFullYear(),
      capacidadeMaxima: 30,
      limitePCD: 2,
      ativo: true,
    });
    setEditingTurma(null);
    setIsFormOpen(false);
  };

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      escolaId: turma.escolaId,
      serieId: turma.serieId,
      nome: turma.nome,
      turno: turma.turno,
      anoLetivo: turma.anoLetivo,
      capacidadeMaxima: turma.capacidadeMaxima,
      limitePCD: turma.limitePCD,
      ativo: turma.ativo,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta turma?")) {
      await deleteTurma.mutateAsync(id);
    }
  };

  const getEscolaNome = (escolaId: string) => {
    return escolas?.find((e) => e.id === escolaId)?.nome || "N/A";
  };

  const getSerieNome = (serieId: string) => {
    const serie = series?.find((s) => s.id === serieId);
    if (!serie) return "N/A";
    const etapa = etapas?.find((e) => e.id === serie.etapaId);
    return etapa ? `${etapa.nome} - ${serie.nome}` : serie.nome;
  };

  const getAlunosNaTurma = (turmaId: string) => {
    return (matriculas || []).filter(
      (m) => m.turmaId === turmaId && m.status === "ATIVA"
    );
  };

  const getAlunosPCDNaTurma = (turmaId: string) => {
    return (matriculas || []).filter(
      (m) => m.turmaId === turmaId && m.status === "ATIVA" && m.possuiDeficiencia
    );
  };

  const getAlunosSemTurma = (turma: Turma) => {
    return (matriculas || []).filter(
      (m) => m.status === "ATIVA" && m.escolaId === turma.escolaId && !m.turmaId
    );
  };

  const handleOpenAssignStudents = (turma: Turma) => {
    setSelectedTurma(turma);
    setIsAssignStudentsOpen(true);
  };

  const handleToggleAlunoNaTurma = async (matriculaId: string) => {
    if (!selectedTurma) return;
    await addAluno.mutateAsync({ turmaId: selectedTurma.id, matriculaId });
  };

  const handleRemoveAlunoFromTurma = async (matriculaId: string) => {
    if (!selectedTurma) return;
    await removeAluno.mutateAsync({ turmaId: selectedTurma.id, matriculaId });
  };

  const turmasPorEscola = (turmas || []).reduce((acc, turma) => {
    if (!acc[turma.escolaId]) acc[turma.escolaId] = [];
    acc[turma.escolaId].push(turma);
    return acc;
  }, {} as Record<string, Turma[]>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestão de Turmas</h3>
          <p className="text-muted-foreground mt-1">
            Crie turmas e atribua alunos matriculados
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          size="lg"
          className="gap-2"
          disabled={escolasAtivas.length === 0}
        >
          <Plus size={20} weight="bold" />
          Nova Turma
        </Button>
      </div>

      {escolasAtivas.length === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Nenhuma escola ativa cadastrada. Cadastre escolas antes de
              criar turmas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar/editar turma */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersThree className="text-primary" size={24} weight="duotone" />
              {editingTurma ? "Editar Turma" : "Nova Turma"}
            </DialogTitle>
            <DialogDescription>
              {editingTurma
                ? "Atualize os dados da turma"
                : "Crie uma nova turma para agrupar alunos"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="escolaId">Escola *</Label>
                <Select
                  value={formData.escolaId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      escolaId: value,
                      serieId: "",
                    }))
                  }
                  required
                  disabled={!!editingTurma}
                >
                  <SelectTrigger id="escolaId">
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolasAtivas.map((escola) => (
                      <SelectItem key={escola.id} value={escola.id}>
                        {escola.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="serieId">Série *</Label>
                <Select
                  value={formData.serieId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, serieId: value }))
                  }
                  disabled={!formData.escolaId || seriesDisponiveis.length === 0 || !!editingTurma}
                  required
                >
                  <SelectTrigger id="serieId">
                    <SelectValue placeholder="Selecione a série" />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesDisponiveis.map((serie) => (
                      <SelectItem key={serie.id} value={serie.id}>
                        {serie.etapaNome} - {serie.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Turma *</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex: Turma A, Turma B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL") =>
                    setFormData((prev) => ({ ...prev, turno: value }))
                  }
                  required
                >
                  <SelectTrigger id="turno">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATUTINO">Matutino</SelectItem>
                    <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                    <SelectItem value="NOTURNO">Noturno</SelectItem>
                    <SelectItem value="INTEGRAL">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anoLetivo">Ano Letivo *</Label>
                <Input
                  id="anoLetivo"
                  type="number"
                  required
                  value={formData.anoLetivo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      anoLetivo: parseInt(e.target.value) || new Date().getFullYear(),
                    }))
                  }
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidadeMaxima">Capacidade Máxima *</Label>
                <Input
                  id="capacidadeMaxima"
                  type="number"
                  required
                  min="1"
                  value={formData.capacidadeMaxima}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacidadeMaxima: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limitePCD">Limite de Alunos PCD *</Label>
                <Input
                  id="limitePCD"
                  type="number"
                  required
                  min="0"
                  value={formData.limitePCD}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      limitePCD: parseInt(e.target.value) || 2,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Limite de alunos com necessidades especiais por turma
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Turma Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Turma disponível para receber alunos
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, ativo: checked }))
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={createTurma.isPending || updateTurma.isPending}
              >
                {(createTurma.isPending || updateTurma.isPending) && (
                  <Spinner className="animate-spin" size={16} />
                )}
                {editingTurma ? "Atualizar" : "Criar Turma"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar alunos */}
      <Dialog open={isAssignStudentsOpen} onOpenChange={setIsAssignStudentsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="text-primary" size={24} weight="duotone" />
              Gerenciar Alunos - {selectedTurma?.nome}
            </DialogTitle>
            <DialogDescription>
              Atribua ou remova alunos da turma
              {selectedTurma && (
                <span className="block mt-1 text-sm">
                  PCD na turma: {getAlunosPCDNaTurma(selectedTurma.id).length}/
                  {selectedTurma.limitePCD}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedTurma && (
            <Tabs defaultValue="enrolled" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="enrolled">
                  Alunos na Turma (
                  {getAlunosNaTurma(selectedTurma.id).length}/
                  {selectedTurma.capacidadeMaxima})
                </TabsTrigger>
                <TabsTrigger value="available">
                  Alunos Disponíveis ({getAlunosSemTurma(selectedTurma).length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="enrolled" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {getAlunosNaTurma(selectedTurma.id).length === 0 ? (
                    <div className="text-center py-12">
                      <UsersThree
                        className="mx-auto mb-4 text-muted-foreground"
                        size={48}
                        weight="duotone"
                      />
                      <p className="text-muted-foreground">
                        Nenhum aluno na turma ainda
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAlunosNaTurma(selectedTurma.id).map((matricula) => (
                        <div
                          key={matricula.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap
                                className="text-primary"
                                size={20}
                                weight="duotone"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium">
                                  {matricula.nomeAluno}
                                </h5>
                                {matricula.possuiDeficiencia && (
                                  <Badge variant="secondary" className="text-xs">
                                    PCD
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Responsável: {matricula.nomeResponsavel}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveAlunoFromTurma(matricula.id)
                            }
                            disabled={removeAluno.isPending}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="available" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {getAlunosSemTurma(selectedTurma).length === 0 ? (
                    <div className="text-center py-12">
                      <UsersThree
                        className="mx-auto mb-4 text-muted-foreground"
                        size={48}
                        weight="duotone"
                      />
                      <p className="text-muted-foreground">
                        Nenhum aluno disponível
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos os alunos desta escola já estão em turmas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAlunosSemTurma(selectedTurma).map((matricula) => (
                        <div
                          key={matricula.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap
                                className="text-primary"
                                size={20}
                                weight="duotone"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium">
                                  {matricula.nomeAluno}
                                </h5>
                                {matricula.possuiDeficiencia && (
                                  <Badge variant="secondary" className="text-xs">
                                    PCD
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Responsável: {matricula.nomeResponsavel}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleToggleAlunoNaTurma(matricula.id)
                            }
                            disabled={
                              addAluno.isPending ||
                              getAlunosNaTurma(selectedTurma.id).length >=
                                selectedTurma.capacidadeMaxima
                            }
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsAssignStudentsOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de turmas */}
      <div className="space-y-6">
        {Object.keys(turmasPorEscola).length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Turmas Cadastradas</CardTitle>
              <CardDescription>0 turma(s) no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UsersThree
                  className="mx-auto mb-4 text-muted-foreground"
                  size={48}
                  weight="duotone"
                />
                <p className="text-muted-foreground">
                  Nenhuma turma cadastrada ainda
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Nova Turma" para começar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(turmasPorEscola).map(([escolaId, turmasEscola]) => (
            <Card key={escolaId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Buildings
                    className="text-primary"
                    size={20}
                    weight="duotone"
                  />
                  {getEscolaNome(escolaId)}
                </CardTitle>
                <CardDescription>
                  {turmasEscola.length} turma(s) cadastrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {turmasEscola.map((turma) => {
                    const alunosNaTurma = getAlunosNaTurma(turma.id);
                    const percentualOcupacao =
                      (alunosNaTurma.length / turma.capacidadeMaxima) * 100;

                    return (
                      <div
                        key={turma.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <UsersThree
                                className="text-primary"
                                size={24}
                                weight="duotone"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{turma.nome}</h4>
                                <Badge
                                  variant={turma.ativo ? "default" : "secondary"}
                                >
                                  {turma.ativo ? "Ativa" : "Inativa"}
                                </Badge>
                                <Badge variant="outline">
                                  {turma.turno.charAt(0) +
                                    turma.turno.slice(1).toLowerCase()}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <GraduationCap size={14} />
                                  {getSerieNome(turma.serieId)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    Ano Letivo:
                                  </span>{" "}
                                  {turma.anoLetivo}
                                </div>
                                <div className="flex items-center gap-2">
                                  <UsersThree size={14} />
                                  <span>
                                    {alunosNaTurma.length}/
                                    {turma.capacidadeMaxima} alunos
                                  </span>
                                  <span
                                    className={`ml-2 text-xs ${
                                      percentualOcupacao >= 90
                                        ? "text-red-500"
                                        : percentualOcupacao >= 70
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                    }`}
                                  >
                                    ({percentualOcupacao.toFixed(0)}% ocupado)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">
                                    PCD: {getAlunosPCDNaTurma(turma.id).length}/
                                    {turma.limitePCD}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {onViewDetails && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onViewDetails(turma)}
                                className="gap-2"
                              >
                                <Eye size={16} />
                                <span className="hidden md:inline">
                                  Ver Detalhes
                                </span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssignStudents(turma);
                              }}
                              className="gap-2"
                            >
                              <UserPlus size={16} />
                              <span className="hidden lg:inline">
                                Gerenciar Alunos
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(turma);
                              }}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(turma.id);
                              }}
                              disabled={deleteTurma.isPending}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
