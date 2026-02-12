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
import {
  Plus,
  Pencil,
  Trash,
  Users,
  Calendar,
  Clock,
  Spinner,
  ChalkboardTeacher,
  MapPin,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  usePlantoesPedagogicos,
  useCreatePlantaoPedagogico,
  useUpdatePlantaoPedagogico,
  useDeletePlantaoPedagogico,
  useEstatisticasPlantaoPedagogico,
  useEscolas,
  useTurmas,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface PlantaoPedagogico {
  id: string;
  escolaId: string;
  escola?: { nome: string };
  data: string;
  tipo: string;
  horarioInicio: string;
  horarioFim: string;
  profissionais?: string;
  turmaId?: string;
  turma?: { nome: string };
  local?: string;
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlantaoPedagogicoFormData {
  escolaId: string;
  data: string;
  tipo: string;
  horarioInicio: string;
  horarioFim: string;
  profissionais?: string;
  turmaId?: string;
  local?: string;
  observacoes?: string;
  ativo: boolean;
}

const initialFormData: PlantaoPedagogicoFormData = {
  escolaId: "",
  data: "",
  tipo: "INDIVIDUAL",
  horarioInicio: "",
  horarioFim: "",
  profissionais: "",
  turmaId: "",
  local: "",
  observacoes: "",
  ativo: true,
};

const tipoPlantaoLabels = {
  INDIVIDUAL: "Individual",
  COLETIVO: "Coletivo",
  POR_TURMA: "Por Turma",
};

const tipoPlantaoBadgeColors = {
  INDIVIDUAL: "bg-blue-100 text-blue-800",
  COLETIVO: "bg-purple-100 text-purple-800",
  POR_TURMA: "bg-green-100 text-green-800",
};

export function PlantaoPedagogicoManager() {
  const { data: escolas = [] } = useEscolas();
  const { data: plantoes = [], isLoading } = usePlantoesPedagogicos();
  const { data: estatisticas } = useEstatisticasPlantaoPedagogico();

  const createPlantao = useCreatePlantaoPedagogico();
  const updatePlantao = useUpdatePlantaoPedagogico();
  const deletePlantao = useDeletePlantaoPedagogico();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantao, setEditingPlantao] = useState<PlantaoPedagogico | null>(null);
  const [formData, setFormData] = useState<PlantaoPedagogicoFormData>(initialFormData);
  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterTipo, setFilterTipo] = useState<string>("ALL");

  const { data: turmas = [] } = useTurmas(
    formData.escolaId ? { escolaId: formData.escolaId } : undefined
  );

  const filteredPlantoes = plantoes.filter((p) => {
    if (filterEscola !== "ALL" && p.escolaId !== filterEscola) return false;
    if (filterTipo !== "ALL" && p.tipo !== filterTipo) return false;
    return true;
  });

  const handleOpenForm = (plantao?: PlantaoPedagogico) => {
    if (plantao) {
      setEditingPlantao(plantao);
      setFormData({
        escolaId: plantao.escolaId,
        data: plantao.data.split("T")[0],
        tipo: plantao.tipo,
        horarioInicio: plantao.horarioInicio,
        horarioFim: plantao.horarioFim,
        profissionais: plantao.profissionais || "",
        turmaId: plantao.turmaId || "",
        local: plantao.local || "",
        observacoes: plantao.observacoes || "",
        ativo: plantao.ativo,
      });
    } else {
      setEditingPlantao(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPlantao(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.escolaId || !formData.data || !formData.horarioInicio || !formData.horarioFim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        turmaId: formData.turmaId || undefined,
        profissionais: formData.profissionais || undefined,
        local: formData.local || undefined,
        observacoes: formData.observacoes || undefined,
      };

      if (editingPlantao) {
        await updatePlantao.mutateAsync({
          id: editingPlantao.id,
          data: dataToSubmit,
        });
      } else {
        await createPlantao.mutateAsync(dataToSubmit);
      }
      handleCloseForm();
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plantão?")) return;

    try {
      await deletePlantao.mutateAsync(id);
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Plantões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Plantões Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.ativos || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Individuais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.porTipo?.INDIVIDUAL || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Por Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.porTipo?.POR_TURMA || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plantões Pedagógicos</CardTitle>
              <CardDescription>Gerencie os plantões pedagógicos das escolas</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plantão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label>Filtrar por Escola</Label>
              <Select value={filterEscola} onValueChange={setFilterEscola}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Escolas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filtrar por Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COLETIVO">Coletivo</SelectItem>
                  <SelectItem value="POR_TURMA">Por Turma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Plantões */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : filteredPlantoes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ChalkboardTeacher className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum plantão encontrado</p>
              </div>
            ) : (
              filteredPlantoes.map((plantao) => (
                <Card key={plantao.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={tipoPlantaoBadgeColors[plantao.tipo as keyof typeof tipoPlantaoBadgeColors]}>
                            {tipoPlantaoLabels[plantao.tipo as keyof typeof tipoPlantaoLabels]}
                          </Badge>
                          {!plantao.ativo && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{plantao.escola?.nome}</span>
                          </div>
                          {plantao.turma && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Turma: {plantao.turma.nome}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(plantao.data).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{plantao.horarioInicio} - {plantao.horarioFim}</span>
                          </div>
                          {plantao.local && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{plantao.local}</span>
                            </div>
                          )}
                          {plantao.observacoes && (
                            <p className="text-muted-foreground mt-2">{plantao.observacoes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(plantao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(plantao.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlantao ? "Editar Plantão" : "Novo Plantão"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do plantão pedagógico
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="escolaId">Escola *</Label>
                <Select
                  value={formData.escolaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, escolaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolas.map((escola) => (
                      <SelectItem key={escola.id} value={escola.id}>
                        {escola.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="COLETIVO">Coletivo</SelectItem>
                    <SelectItem value="POR_TURMA">Por Turma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipo === "POR_TURMA" && (
              <div className="space-y-2">
                <Label htmlFor="turmaId">Turma</Label>
                <Select
                  value={formData.turmaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, turmaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horarioInicio">Horário Início *</Label>
                <Input
                  id="horarioInicio"
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, horarioInicio: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horarioFim">Horário Fim *</Label>
                <Input
                  id="horarioFim"
                  type="time"
                  value={formData.horarioFim}
                  onChange={(e) =>
                    setFormData({ ...formData, horarioFim: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) =>
                  setFormData({ ...formData, local: e.target.value })
                }
                placeholder="Ex: Sala dos professores, Biblioteca..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profissionais">Profissionais (separar por vírgula)</Label>
              <Input
                id="profissionais"
                value={formData.profissionais}
                onChange={(e) =>
                  setFormData({ ...formData, profissionais: e.target.value })
                }
                placeholder="Ex: Maria Silva, João Santos..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="ativo">Plantão Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createPlantao.isPending || updatePlantao.isPending}
                >
                  {(createPlantao.isPending || updatePlantao.isPending) && (
                    <Spinner className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingPlantao ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
