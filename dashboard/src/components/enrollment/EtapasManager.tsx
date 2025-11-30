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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  GraduationCap,
  Pencil,
  Trash,
  ListChecks,
  Spinner,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEtapas,
  useCreateEtapa,
  useUpdateEtapa,
  useDeleteEtapa,
  useCreateSerie,
  useUpdateSerie,
  useDeleteSerie,
} from "@/hooks/useApi";
import { EtapaEnsino as EtapaType, Serie } from "@/lib/api";

export function EtapasManager() {
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const createEtapa = useCreateEtapa();
  const updateEtapa = useUpdateEtapa();
  const deleteEtapa = useDeleteEtapa();
  const createSerie = useCreateSerie();
  const updateSerie = useUpdateSerie();
  const deleteSerie = useDeleteSerie();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<EtapaType | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ordem: 1,
  });

  // Para adicionar série diretamente na etapa
  const [addingSerieToEtapa, setAddingSerieToEtapa] = useState<string | null>(null);
  const [newSerieName, setNewSerieName] = useState("");
  const [newSerieOrdem, setNewSerieOrdem] = useState(1);
  
  // Para editar série
  const [editingSerie, setEditingSerie] = useState<Serie | null>(null);
  const [editSerieData, setEditSerieData] = useState({ nome: "", ordem: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEtapa) {
      await updateEtapa.mutateAsync({
        id: editingEtapa.id,
        data: {
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          ordem: formData.ordem,
        },
      });
    } else {
      await createEtapa.mutateAsync({
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        ordem: formData.ordem,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: "", descricao: "", ordem: (etapas?.length || 0) + 1 });
    setEditingEtapa(null);
    setIsFormOpen(false);
  };

  const handleEdit = (etapa: EtapaType) => {
    setEditingEtapa(etapa);
    setFormData({
      nome: etapa.nome,
      descricao: etapa.descricao || "",
      ordem: etapa.ordem,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta etapa? As séries vinculadas também serão removidas.")) {
      await deleteEtapa.mutateAsync(id);
    }
  };

  const handleAddSerie = async (etapaId: string) => {
    if (!newSerieName.trim()) return;

    await createSerie.mutateAsync({
      nome: newSerieName,
      ordem: newSerieOrdem,
      etapaId,
    });

    setNewSerieName("");
    setNewSerieOrdem(1);
    setAddingSerieToEtapa(null);
  };

  const handleDeleteSerie = async (serieId: string) => {
    if (confirm("Tem certeza que deseja remover esta série?")) {
      await deleteSerie.mutateAsync(serieId);
    }
  };

  const handleEditSerie = (serie: Serie) => {
    setEditingSerie(serie);
    setEditSerieData({ nome: serie.nome, ordem: serie.ordem });
  };

  const handleUpdateSerie = async () => {
    if (!editingSerie || !editSerieData.nome.trim()) return;

    await updateSerie.mutateAsync({
      id: editingSerie.id,
      data: {
        nome: editSerieData.nome,
        ordem: editSerieData.ordem,
      },
    });

    setEditingSerie(null);
    setEditSerieData({ nome: "", ordem: 1 });
  };

  const cancelEditSerie = () => {
    setEditingSerie(null);
    setEditSerieData({ nome: "", ordem: 1 });
  };

  if (loadingEtapas) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
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
              <Skeleton key={i} className="h-24 w-full" />
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
          <h3 className="text-2xl font-bold">Cadastro de Etapas de Ensino</h3>
          <p className="text-muted-foreground mt-1">
            Gerencie as etapas escolares e suas séries
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              ordem: (etapas?.length || 0) + 1,
            }));
            setIsFormOpen(true);
          }}
          size="lg"
          className="gap-2"
        >
          <Plus size={20} weight="bold" />
          Nova Etapa
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap
                className="text-primary"
                size={24}
                weight="duotone"
              />
              {editingEtapa ? "Editar Etapa" : "Nova Etapa"}
            </DialogTitle>
            <DialogDescription>
              {editingEtapa
                ? "Atualize os dados da etapa de ensino"
                : "Cadastre uma nova etapa de ensino. As séries podem ser adicionadas depois."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Etapa *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Ensino Fundamental I, Ensino Médio..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem *</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                required
                value={formData.ordem}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ordem: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Descrição da etapa de ensino"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={createEtapa.isPending || updateEtapa.isPending}
              >
                {(createEtapa.isPending || updateEtapa.isPending) && (
                  <Spinner className="animate-spin" size={16} />
                )}
                {editingEtapa ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Etapas Cadastradas</CardTitle>
          <CardDescription>
            {etapas?.length || 0} etapa(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!etapas || etapas.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap
                className="mx-auto mb-4 text-muted-foreground"
                size={48}
                weight="duotone"
              />
              <p className="text-muted-foreground">
                Nenhuma etapa cadastrada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Etapa" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...etapas]
                .sort((a, b) => a.ordem - b.ordem)
                .map((etapa) => (
                  <div
                    key={etapa.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">
                            {etapa.ordem}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{etapa.nome}</h4>
                          {etapa.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {etapa.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(etapa)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(etapa.id)}
                          disabled={deleteEtapa.isPending}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Séries da etapa */}
                    <div className="pl-13 mt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <ListChecks size={16} />
                        <span className="font-medium">
                          {etapa.series?.length || 0} série(s):
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            setAddingSerieToEtapa(etapa.id);
                            setNewSerieOrdem((etapa.series?.length || 0) + 1);
                          }}
                        >
                          <Plus size={12} className="mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {addingSerieToEtapa === etapa.id && (
                        <div className="flex items-center gap-2 mb-2 p-2 border rounded bg-muted/30">
                          <Input
                            placeholder="Nome da série"
                            value={newSerieName}
                            onChange={(e) => setNewSerieName(e.target.value)}
                            className="h-8 flex-1"
                          />
                          <Input
                            type="number"
                            min="1"
                            value={newSerieOrdem}
                            onChange={(e) =>
                              setNewSerieOrdem(parseInt(e.target.value) || 1)
                            }
                            className="h-8 w-16"
                            placeholder="Ordem"
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleAddSerie(etapa.id)}
                            disabled={createSerie.isPending}
                          >
                            {createSerie.isPending ? (
                              <Spinner className="animate-spin" size={14} />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setAddingSerieToEtapa(null);
                              setNewSerieName("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {etapa.series
                          ?.sort((a, b) => a.ordem - b.ordem)
                          .map((serie) => (
                            editingSerie?.id === serie.id ? (
                              <div
                                key={serie.id}
                                className="flex items-center gap-2 p-2 border rounded bg-muted/30"
                              >
                                <Input
                                  placeholder="Nome da série"
                                  value={editSerieData.nome}
                                  onChange={(e) =>
                                    setEditSerieData((prev) => ({
                                      ...prev,
                                      nome: e.target.value,
                                    }))
                                  }
                                  className="h-7 w-32 text-xs"
                                />
                                <Input
                                  type="number"
                                  min="1"
                                  value={editSerieData.ordem}
                                  onChange={(e) =>
                                    setEditSerieData((prev) => ({
                                      ...prev,
                                      ordem: parseInt(e.target.value) || 1,
                                    }))
                                  }
                                  className="h-7 w-14 text-xs"
                                  placeholder="Ordem"
                                />
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={handleUpdateSerie}
                                  disabled={updateSerie.isPending}
                                >
                                  {updateSerie.isPending ? (
                                    <Spinner className="animate-spin" size={12} />
                                  ) : (
                                    "Salvar"
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={cancelEditSerie}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <div
                                key={serie.id}
                                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-2 group"
                              >
                                <span>
                                  <span className="font-bold">{serie.ordem}.</span>{" "}
                                  {serie.nome}
                                </span>
                                <button
                                  onClick={() => handleEditSerie(serie)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80"
                                  title="Editar série"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSerie(serie.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                                  title="Excluir série"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>
                            )
                          ))}
                        {(!etapa.series || etapa.series.length === 0) && (
                          <span className="text-xs text-muted-foreground">
                            Nenhuma série cadastrada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
