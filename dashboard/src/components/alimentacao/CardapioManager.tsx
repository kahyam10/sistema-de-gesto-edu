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
  ForkKnife,
  Calendar,
  Buildings,
  Spinner,
  X,
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
import { DateInputBR } from "@/components/ui/date-input-br";
import { useEscolas } from "@/hooks/useApi";
import {
  useCardapios,
  useCreateCardapio,
  useUpdateCardapio,
  useDeleteCardapio,
} from "@/hooks/useAlimentacao";
import type {
  Cardapio,
  ItemCardapio,
  TurnoRefeicao,
  TipoRefeicao,
} from "@/lib/api-alimentacao";
import { toast } from "sonner";

const turnoLabels: Record<string, string> = {
  MATUTINO: "Matutino",
  VESPERTINO: "Vespertino",
  NOTURNO: "Noturno",
  INTEGRAL: "Integral",
};

const tipoRefeicaoLabels: Record<string, string> = {
  CAFE_MANHA: "Café da Manhã",
  LANCHE_MANHA: "Lanche da Manhã",
  ALMOCO: "Almoço",
  LANCHE_TARDE: "Lanche da Tarde",
  JANTAR: "Jantar",
  CEIA: "Ceia",
};

interface CardapioFormData {
  data: string;
  turno: string;
  tipoRefeicao: string;
  descricao: string;
  observacoesNutricionais: string;
  escolaId: string; // "" = cardápio da rede
  ativo: boolean;
  itens: ItemCardapio[];
}

const initialFormData: CardapioFormData = {
  data: "",
  turno: "MATUTINO",
  tipoRefeicao: "ALMOCO",
  descricao: "",
  observacoesNutricionais: "",
  escolaId: "",
  ativo: true,
  itens: [],
};

/** Formata "YYYY-MM-DD..." como DD/MM/AAAA sem deslocar o dia por fuso */
function formatarDataBR(iso: string) {
  const [ano, mes, dia] = iso.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

export function CardapioManager() {
  const { data: escolas = [] } = useEscolas();

  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterTurno, setFilterTurno] = useState<string>("ALL");
  const [filterTipo, setFilterTipo] = useState<string>("ALL");

  const { data: cardapios = [], isLoading } = useCardapios({
    escolaId: filterEscola !== "ALL" ? filterEscola : undefined,
    turno: filterTurno !== "ALL" ? filterTurno : undefined,
    tipoRefeicao: filterTipo !== "ALL" ? filterTipo : undefined,
  });

  const createCardapio = useCreateCardapio();
  const updateCardapio = useUpdateCardapio();
  const deleteCardapio = useDeleteCardapio();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCardapio, setEditingCardapio] = useState<Cardapio | null>(null);
  const [formData, setFormData] = useState<CardapioFormData>(initialFormData);

  const handleOpenForm = (cardapio?: Cardapio) => {
    if (cardapio) {
      setEditingCardapio(cardapio);
      setFormData({
        data: cardapio.data.split("T")[0],
        turno: cardapio.turno,
        tipoRefeicao: cardapio.tipoRefeicao,
        descricao: cardapio.descricao,
        observacoesNutricionais: cardapio.observacoesNutricionais || "",
        escolaId: cardapio.escolaId || "",
        ativo: cardapio.ativo,
        itens: cardapio.itens || [],
      });
    } else {
      setEditingCardapio(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCardapio(null);
    setFormData(initialFormData);
  };

  const handleItemChange = (
    index: number,
    campo: keyof ItemCardapio,
    valor: string
  ) => {
    const itens = [...formData.itens];
    if (campo === "quantidadePorAluno") {
      itens[index] = {
        ...itens[index],
        quantidadePorAluno: valor ? parseFloat(valor) : undefined,
      };
    } else {
      itens[index] = { ...itens[index], [campo]: valor };
    }
    setFormData({ ...formData, itens });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.data || !formData.descricao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const itensValidos = formData.itens.filter((i) => i.alimento.trim());

    const dataToSubmit = {
      data: formData.data,
      turno: formData.turno as TurnoRefeicao,
      tipoRefeicao: formData.tipoRefeicao as TipoRefeicao,
      descricao: formData.descricao,
      observacoesNutricionais: formData.observacoesNutricionais || undefined,
      escolaId: formData.escolaId || undefined,
      ativo: formData.ativo,
      itens: itensValidos.length > 0 ? itensValidos : undefined,
    };

    try {
      if (editingCardapio) {
        await updateCardapio.mutateAsync({
          id: editingCardapio.id,
          data: dataToSubmit,
        });
      } else {
        await createCardapio.mutateAsync(dataToSubmit);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este cardápio?")) return;

    try {
      await deleteCardapio.mutateAsync(id);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cardápios</CardTitle>
              <CardDescription>
                Planejamento das refeições da rede e das escolas
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cardápio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
              <Label>Turno</Label>
              <Select value={filterTurno} onValueChange={setFilterTurno}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Turnos</SelectItem>
                  {Object.entries(turnoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Tipo de Refeição</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  {Object.entries(tipoRefeicaoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : cardapios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ForkKnife className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cardápio encontrado</p>
              </div>
            ) : (
              cardapios.map((cardapio) => (
                <Card key={cardapio.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">
                            {tipoRefeicaoLabels[cardapio.tipoRefeicao] ||
                              cardapio.tipoRefeicao}
                          </h3>
                          <Badge variant="outline">
                            {turnoLabels[cardapio.turno] || cardapio.turno}
                          </Badge>
                          {!cardapio.escolaId && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Rede
                            </Badge>
                          )}
                          {!cardapio.ativo && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {cardapio.descricao}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatarDataBR(cardapio.data)}</span>
                          </div>
                          {cardapio.escola && (
                            <div className="flex items-center gap-1">
                              <Buildings className="h-4 w-4" />
                              <span>{cardapio.escola.nome}</span>
                            </div>
                          )}
                          {cardapio.itens && cardapio.itens.length > 0 && (
                            <span>
                              {cardapio.itens.length} item(ns) planejado(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(cardapio)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cardapio.id)}
                          aria-label="Excluir"
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCardapio ? "Editar Cardápio" : "Novo Cardápio"}
            </DialogTitle>
            <DialogDescription>
              Sem escola selecionada, o cardápio vale para toda a rede
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <DateInputBR
                  id="data"
                  value={formData.data}
                  onChange={(value) => setFormData({ ...formData, data: value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escolaId">Escola</Label>
                <Select
                  value={formData.escolaId || "REDE"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      escolaId: value === "REDE" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REDE">Toda a rede (SEMEC)</SelectItem>
                    {escolas.map((escola) => (
                      <SelectItem key={escola.id} value={escola.id}>
                        {escola.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value) =>
                    setFormData({ ...formData, turno: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(turnoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoRefeicao">Tipo de Refeição *</Label>
                <Select
                  value={formData.tipoRefeicao}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoRefeicao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoRefeicaoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={3}
                placeholder="Descreva o prato/refeição planejada"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens do Cardápio</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      itens: [...formData.itens, { alimento: "" }],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar item
                </Button>
              </div>
              {formData.itens.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={item.alimento}
                    onChange={(e) =>
                      handleItemChange(index, "alimento", e.target.value)
                    }
                    placeholder="Alimento (ex: Arroz)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.quantidadePorAluno ?? ""}
                    onChange={(e) =>
                      handleItemChange(index, "quantidadePorAluno", e.target.value)
                    }
                    placeholder="Qtd/aluno"
                    className="w-28"
                  />
                  <Input
                    value={item.unidade ?? ""}
                    onChange={(e) =>
                      handleItemChange(index, "unidade", e.target.value)
                    }
                    placeholder="Unid."
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        itens: formData.itens.filter((_, i) => i !== index),
                      })
                    }
                    aria-label="Remover"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoesNutricionais">
                Observações Nutricionais
              </Label>
              <Textarea
                id="observacoesNutricionais"
                value={formData.observacoesNutricionais}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observacoesNutricionais: e.target.value,
                  })
                }
                rows={2}
                placeholder="Ex: Adequado para alunos com intolerância à lactose"
              />
            </div>

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
              <Label htmlFor="ativo">Ativo</Label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCardapio.isPending || updateCardapio.isPending}
              >
                {(createCardapio.isPending || updateCardapio.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCardapio ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
