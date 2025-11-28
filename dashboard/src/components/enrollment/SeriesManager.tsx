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
  Plus,
  ListNumbers,
  Pencil,
  Trash,
  Spinner,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSeries,
  useEtapas,
  useCreateSerie,
  useUpdateSerie,
  useDeleteSerie,
} from "@/hooks/useApi";
import { Serie as SerieType } from "@/lib/api";

export function SeriesManager() {
  const { data: series, isLoading: loadingSeries } = useSeries();
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const createSerie = useCreateSerie();
  const updateSerie = useUpdateSerie();
  const deleteSerie = useDeleteSerie();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSerie, setEditingSerie] = useState<SerieType | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    ordem: 1,
    etapaId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.etapaId) {
      return;
    }

    if (editingSerie) {
      await updateSerie.mutateAsync({
        id: editingSerie.id,
        data: {
          nome: formData.nome,
          ordem: formData.ordem,
          etapaId: formData.etapaId,
        },
      });
    } else {
      await createSerie.mutateAsync({
        nome: formData.nome,
        ordem: formData.ordem,
        etapaId: formData.etapaId,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: "", ordem: (series?.length || 0) + 1, etapaId: "" });
    setEditingSerie(null);
    setIsFormOpen(false);
  };

  const handleEdit = (serie: SerieType) => {
    setEditingSerie(serie);
    setFormData({
      nome: serie.nome,
      ordem: serie.ordem,
      etapaId: serie.etapaId,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta série?")) {
      await deleteSerie.mutateAsync(id);
    }
  };

  const sortedSeries = [...(series || [])].sort((a, b) => a.ordem - b.ordem);
  const isLoading = loadingSeries || loadingEtapas;

  const getEtapaNome = (etapaId: string) => {
    return etapas?.find((e) => e.id === etapaId)?.nome || "Sem etapa";
  };

  if (isLoading) {
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
              <Skeleton key={i} className="h-16 w-full" />
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
          <h3 className="text-2xl font-bold">Cadastro de Séries Escolares</h3>
          <p className="text-muted-foreground mt-1">
            Gerencie as séries/anos escolares disponíveis
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              ordem: (series?.length || 0) + 1,
            }));
            setIsFormOpen(true);
          }}
          size="lg"
          className="gap-2"
        >
          <Plus size={20} weight="bold" />
          Nova Série
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListNumbers
                className="text-primary"
                size={24}
                weight="duotone"
              />
              {editingSerie ? "Editar Série" : "Nova Série"}
            </DialogTitle>
            <DialogDescription>
              {editingSerie
                ? "Atualize os dados da série"
                : "Cadastre uma nova série escolar"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Série *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: 1º Ano, 2º Ano..."
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
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etapaId">Etapa de Ensino *</Label>
              <Select
                value={formData.etapaId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, etapaId: value }))
                }
                required
              >
                <SelectTrigger id="etapaId">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas?.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={
                  createSerie.isPending ||
                  updateSerie.isPending ||
                  !formData.etapaId
                }
              >
                {(createSerie.isPending || updateSerie.isPending) && (
                  <Spinner className="animate-spin" size={16} />
                )}
                {editingSerie ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Séries Cadastradas</CardTitle>
          <CardDescription>
            {sortedSeries.length} série(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSeries.length === 0 ? (
            <div className="text-center py-12">
              <ListNumbers
                className="mx-auto mb-4 text-muted-foreground"
                size={48}
                weight="duotone"
              />
              <p className="text-muted-foreground">
                Nenhuma série cadastrada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Série" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSeries.map((serie) => (
                <div
                  key={serie.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {serie.ordem}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{serie.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        Etapa: {getEtapaNome(serie.etapaId)} | Ordem:{" "}
                        {serie.ordem}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(serie)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(serie.id)}
                      disabled={deleteSerie.isPending}
                    >
                      <Trash size={16} />
                    </Button>
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
