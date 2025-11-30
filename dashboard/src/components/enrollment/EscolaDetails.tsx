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
  ArrowLeft,
  Plus,
  UsersThree,
  Pencil,
  Trash,
  Buildings,
  GraduationCap,
  UserPlus,
  Eye,
  Spinner,
  Phone,
  Envelope,
  MapPin,
  Student,
  Users,
  Warning,
} from "@phosphor-icons/react";
import { Escola, Turma } from "@/lib/api";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTurmas,
  useSeries,
  useMatriculas,
  useCreateTurma,
  useUpdateTurma,
  useDeleteTurma,
  useAddAlunoToTurma,
  useRemoveAlunoFromTurma,
  useEscolas,
} from "@/hooks/useApi";
import { TurmaDetails } from "./TurmaDetails";

interface EscolaDetailsProps {
  escolaId: string;
  onBack: () => void;
}

const turnoLabels = {
  MATUTINO: "Matutino",
  VESPERTINO: "Vespertino",
  NOTURNO: "Noturno",
  INTEGRAL: "Integral",
};

const turnoBadgeColors = {
  MATUTINO: "bg-amber-100 text-amber-800",
  VESPERTINO: "bg-orange-100 text-orange-800",
  NOTURNO: "bg-indigo-100 text-indigo-800",
  INTEGRAL: "bg-green-100 text-green-800",
};

export function EscolaDetails({ escolaId, onBack }: EscolaDetailsProps) {
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: allTurmas, isLoading: loadingTurmas } = useTurmas();
  const { data: allSeries, isLoading: loadingSeries } = useSeries();
  const { data: allMatriculas } = useMatriculas();

  const createTurma = useCreateTurma();
  const updateTurma = useUpdateTurma();
  const deleteTurma = useDeleteTurma();
  const addAluno = useAddAlunoToTurma();
  const removeAluno = useRemoveAlunoFromTurma();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [isAssignStudentsOpen, setIsAssignStudentsOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [viewingTurma, setViewingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    serieId: "",
    nome: "",
    turno: "MATUTINO" as "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL",
    anoLetivo: new Date().getFullYear(),
    capacidadeMaxima: 30,
    limitePCD: 2,
    ativo: true,
  });

  // Buscar escola atual pelo ID
  const escola = escolas?.find((e) => e.id === escolaId);

  // Filtrar turmas desta escola
  const turmas = (allTurmas || []).filter((t) => t.escolaId === escolaId);
  
  // Séries disponíveis baseadas nas etapas da escola
  const etapasIds = escola?.etapas?.map((e) => e.etapa.id) || [];
  const seriesDisponiveis = (allSeries || [])
    .filter((s) => etapasIds.includes(s.etapaId))
    .map((s) => ({
      ...s,
      etapaNome: escola?.etapas?.find((e) => e.etapa.id === s.etapaId)?.etapa.nome || "",
    }));

  // Calcular estatísticas
  const totalAlunos = turmas.reduce((acc, t) => acc + (t.matriculas?.length || 0), 0);
  const capacidadeTotal = turmas.reduce((acc, t) => acc + t.capacidadeMaxima, 0);
  const vagasDisponiveis = capacidadeTotal - totalAlunos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTurma) {
      await updateTurma.mutateAsync({
        id: editingTurma.id,
        data: {
          ...formData,
          escolaId,
        },
      });
    } else {
      await createTurma.mutateAsync({
        ...formData,
        escolaId,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
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

  const handleDelete = async (turma: Turma) => {
    if (confirm(`Deseja realmente excluir a turma "${turma.nome}"?`)) {
      await deleteTurma.mutateAsync(turma.id);
    }
  };

  const openAssignStudents = (turma: Turma) => {
    setSelectedTurma(turma);
    setIsAssignStudentsOpen(true);
  };

  const handleAddAluno = async (matriculaId: string) => {
    if (!selectedTurma) return;
    await addAluno.mutateAsync({ turmaId: selectedTurma.id, matriculaId });
  };

  const handleRemoveAluno = async (matriculaId: string) => {
    if (!selectedTurma) return;
    await removeAluno.mutateAsync({ turmaId: selectedTurma.id, matriculaId });
  };

  // Se está visualizando detalhes de uma turma
  if (viewingTurma) {
    return (
      <TurmaDetails
        turma={viewingTurma}
        onBack={() => setViewingTurma(null)}
      />
    );
  }

  const isLoading = loadingEscolas || loadingTurmas || loadingSeries;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!escola) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Escola não encontrada</h2>
            <p className="text-muted-foreground">
              A escola solicitada não foi encontrada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Buildings className="h-6 w-6" />
            {escola.nome}
          </h2>
          <p className="text-muted-foreground">
            Código: {escola.codigo}
            {escola.endereco && ` • ${escola.endereco}`}
          </p>
        </div>
        <Badge variant={escola.ativo ? "default" : "secondary"}>
          {escola.ativo ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersThree className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{turmas.length}</p>
                <p className="text-sm text-muted-foreground">Turmas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Student className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAlunos}</p>
                <p className="text-sm text-muted-foreground">Alunos Matriculados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Warning className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vagasDisponiveis}</p>
                <p className="text-sm text-muted-foreground">Vagas Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {capacidadeTotal > 0 
                    ? Math.round((totalAlunos / capacidadeTotal) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Ocupação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da escola */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Escola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {escola.endereco && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{escola.endereco}</span>
              </div>
            )}
            {escola.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{escola.telefone}</span>
              </div>
            )}
            {escola.email && (
              <div className="flex items-center gap-2 text-sm">
                <Envelope className="h-4 w-4 text-muted-foreground" />
                <span>{escola.email}</span>
              </div>
            )}
          </div>
          {escola.etapas && escola.etapas.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Etapas de Ensino:</p>
              <div className="flex flex-wrap gap-2">
                {escola.etapas.map((e) => (
                  <Badge key={e.etapa.id} variant="outline">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {e.etapa.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de turmas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersThree className="h-5 w-5" />
                Turmas da Escola
              </CardTitle>
              <CardDescription>
                Gerencie as turmas desta unidade escolar
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Turma
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : turmas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UsersThree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma turma cadastrada nesta escola</p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira turma
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmas.map((turma) => {
                const alunosCount = turma.matriculas?.length || 0;
                const ocupacao = Math.round((alunosCount / turma.capacidadeMaxima) * 100);
                const serieName = turma.serie?.nome || "Série não definida";
                const etapaName = turma.serie?.etapa?.nome || "";

                return (
                  <Card
                    key={turma.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      !turma.ativo ? "opacity-60" : ""
                    }`}
                    onClick={() => setViewingTurma(turma)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{turma.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {serieName}
                            {etapaName && ` • ${etapaName}`}
                          </p>
                        </div>
                        <Badge className={turnoBadgeColors[turma.turno]}>
                          {turnoLabels[turma.turno]}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Alunos</span>
                          <span className="font-medium">
                            {alunosCount} / {turma.capacidadeMaxima}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              ocupacao >= 90
                                ? "bg-red-500"
                                : ocupacao >= 70
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(ocupacao, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <Badge variant={turma.ativo ? "default" : "secondary"}>
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openAssignStudents(turma)}
                            title="Gerenciar alunos"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(turma)}
                            title="Editar turma"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(turma)}
                            title="Excluir turma"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulário de turma */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTurma ? "Editar Turma" : "Nova Turma"}
            </DialogTitle>
            <DialogDescription>
              {editingTurma
                ? "Atualize as informações da turma"
                : "Preencha os dados da nova turma"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Turma *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: 5º Ano A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serie">Série *</Label>
              <Select
                value={formData.serieId}
                onValueChange={(value) =>
                  setFormData({ ...formData, serieId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {seriesDisponiveis.map((serie) => (
                    <SelectItem key={serie.id} value={serie.id}>
                      {serie.nome} ({serie.etapaNome})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value: typeof formData.turno) =>
                    setFormData({ ...formData, turno: value })
                  }
                >
                  <SelectTrigger>
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
                  value={formData.anoLetivo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      anoLetivo: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade Máxima</Label>
                <Input
                  id="capacidade"
                  type="number"
                  value={formData.capacidadeMaxima}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacidadeMaxima: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limitePCD">Limite PCD</Label>
                <Input
                  id="limitePCD"
                  type="number"
                  value={formData.limitePCD}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limitePCD: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <Label htmlFor="ativo">Turma ativa</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTurma.isPending || updateTurma.isPending}
              >
                {(createTurma.isPending || updateTurma.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingTurma ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de gerenciamento de alunos */}
      <Dialog open={isAssignStudentsOpen} onOpenChange={setIsAssignStudentsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Alunos - {selectedTurma?.nome}</DialogTitle>
            <DialogDescription>
              Adicione ou remova alunos desta turma
            </DialogDescription>
          </DialogHeader>

          {selectedTurma && (
            <Tabs defaultValue="matriculados">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="matriculados">
                  Matriculados ({selectedTurma.matriculas?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="disponiveis">
                  Disponíveis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matriculados">
                <ScrollArea className="h-[400px] pr-4">
                  {selectedTurma.matriculas && selectedTurma.matriculas.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTurma.matriculas.map((matricula) => (
                        <div
                          key={matricula.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{matricula.nomeAluno}</p>
                            <p className="text-sm text-muted-foreground">
                              {matricula.cpfAluno}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveAluno(matricula.id)}
                            disabled={removeAluno.isPending}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      Nenhum aluno matriculado nesta turma
                    </p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="disponiveis">
                <ScrollArea className="h-[400px] pr-4">
                  {(() => {
                    const alunosDisponiveis = (allMatriculas || []).filter(
                      (m) =>
                        m.status === "ATIVA" &&
                        !selectedTurma.matriculas?.some((tm) => tm.id === m.id)
                    );

                    return alunosDisponiveis.length > 0 ? (
                      <div className="space-y-2">
                        {alunosDisponiveis.map((matricula) => (
                          <div
                            key={matricula.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{matricula.nomeAluno}</p>
                              <p className="text-sm text-muted-foreground">
                                {matricula.cpfAluno}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddAluno(matricula.id)}
                              disabled={addAluno.isPending}
                            >
                              Adicionar
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhum aluno disponível para adicionar
                      </p>
                    );
                  })()}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
