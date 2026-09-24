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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash, BowlFood, Spinner } from "@phosphor-icons/react";
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
  useRefeicoes,
  useCreateRefeicao,
  useUpdateRefeicao,
  useDeleteRefeicao,
  useCardapios,
} from "@/hooks/useAlimentacao";
import type {
  RegistroRefeicao,
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

interface RefeicaoFormData {
  data: string;
  turno: string;
  tipoRefeicao: string;
  quantidadeServida: string;
  quantidadePlanejada: string;
  observacoes: string;
  escolaId: string;
  cardapioId: string;
}

const initialFormData: RefeicaoFormData = {
  data: "",
  turno: "MATUTINO",
  tipoRefeicao: "ALMOCO",
  quantidadeServida: "",
  quantidadePlanejada: "",
  observacoes: "",
  escolaId: "",
  cardapioId: "",
};

/** Formata "YYYY-MM-DD..." como DD/MM/AAAA sem deslocar o dia por fuso */
function formatarDataBR(iso: string) {
  const [ano, mes, dia] = iso.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

export function RefeicaoManager() {
  const { data: escolas = [] } = useEscolas();

  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const { data: refeicoes = [], isLoading } = useRefeicoes({
    escolaId: filterEscola !== "ALL" ? filterEscola : undefined,
    dataInicio: filterDataInicio || undefined,
    dataFim: filterDataFim || undefined,
  });

  const createRefeicao = useCreateRefeicao();
  const updateRefeicao = useUpdateRefeicao();
  const deleteRefeicao = useDeleteRefeicao();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRefeicao, setEditingRefeicao] =
    useState<RegistroRefeicao | null>(null);
  const [formData, setFormData] = useState<RefeicaoFormData>(initialFormData);

  // Cardápios disponíveis para vínculo (escola selecionada + rede, na data)
  const { data: cardapiosDisponiveis = [] } = useCardapios({
    escolaId: formData.escolaId || undefined,
    dataInicio: formData.data || undefined,
    dataFim: formData.data || undefined,
  });

  const handleOpenForm = (refeicao?: RegistroRefeicao) => {
    if (refeicao) {
      setEditingRefeicao(refeicao);
      setFormData({
        data: refeicao.data.split("T")[0],
        turno: refeicao.turno,
        tipoRefeicao: refeicao.tipoRefeicao,
        quantidadeServida: String(refeicao.quantidadeServida),
        quantidadePlanejada:
          refeicao.quantidadePlanejada != null
            ? String(refeicao.quantidadePlanejada)
            : "",
        observacoes: refeicao.observacoes || "",
        escolaId: refeicao.escolaId,
        cardapioId: refeicao.cardapioId || "",
      });
    } else {
      setEditingRefeicao(null);
      setFormData({
        ...initialFormData,
        escolaId: filterEscola !== "ALL" ? filterEscola : "",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRefeicao(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.data || !formData.escolaId || !formData.quantidadeServida) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dataToSubmit = {
      data: formData.data,
      turno: formData.turno as TurnoRefeicao,
      tipoRefeicao: formData.tipoRefeicao as TipoRefeicao,
      quantidadeServida: parseInt(formData.quantidadeServida),
      quantidadePlanejada: formData.quantidadePlanejada
        ? parseInt(formData.quantidadePlanejada)
        : undefined,
      observacoes: formData.observacoes || undefined,
      escolaId: formData.escolaId,
      cardapioId: formData.cardapioId || undefined,
    };

    try {
      if (editingRefeicao) {
        await updateRefeicao.mutateAsync({
          id: editingRefeicao.id,
          data: dataToSubmit,
        });
      } else {
        await createRefeicao.mutateAsync(dataToSubmit);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      await deleteRefeicao.mutateAsync(id);
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
              <CardTitle>Refeições Servidas</CardTitle>
              <CardDescription>
                Registro diário por escola, turno e tipo de refeição — base do
                relatório PNAE
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Refeição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label>Escola</Label>
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
              <Label>De</Label>
              <DateInputBR
                value={filterDataInicio}
                onChange={setFilterDataInicio}
              />
            </div>
            <div className="flex-1">
              <Label>Até</Label>
              <DateInputBR value={filterDataFim} onChange={setFilterDataFim} />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : refeicoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BowlFood className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma refeição registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Refeição</TableHead>
                    <TableHead className="text-right">Servidas</TableHead>
                    <TableHead className="text-right">Planejadas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refeicoes.map((refeicao) => (
                    <TableRow key={refeicao.id}>
                      <TableCell>{formatarDataBR(refeicao.data)}</TableCell>
                      <TableCell>{refeicao.escola?.nome || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {turnoLabels[refeicao.turno] || refeicao.turno}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tipoRefeicaoLabels[refeicao.tipoRefeicao] ||
                          refeicao.tipoRefeicao}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {refeicao.quantidadeServida.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {refeicao.quantidadePlanejada != null
                          ? refeicao.quantidadePlanejada.toLocaleString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(refeicao)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(refeicao.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRefeicao ? "Editar Registro" : "Registrar Refeição"}
            </DialogTitle>
            <DialogDescription>
              Um registro por escola, data, turno e tipo de refeição
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataRefeicao">Data *</Label>
                <DateInputBR
                  id="dataRefeicao"
                  value={formData.data}
                  onChange={(value) => setFormData({ ...formData, data: value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Escola *</Label>
                <Select
                  value={formData.escolaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, escolaId: value, cardapioId: "" })
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turno *</Label>
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
                <Label>Tipo de Refeição *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidadeServida">Quantidade Servida *</Label>
                <Input
                  id="quantidadeServida"
                  type="number"
                  min="0"
                  value={formData.quantidadeServida}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantidadeServida: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadePlanejada">Quantidade Planejada</Label>
                <Input
                  id="quantidadePlanejada"
                  type="number"
                  min="0"
                  value={formData.quantidadePlanejada}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantidadePlanejada: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cardápio Vinculado</Label>
              <Select
                value={formData.cardapioId || "NENHUM"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    cardapioId: value === "NENHUM" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NENHUM">Nenhum</SelectItem>
                  {cardapiosDisponiveis.map((cardapio) => (
                    <SelectItem key={cardapio.id} value={cardapio.id}>
                      {(tipoRefeicaoLabels[cardapio.tipoRefeicao] ||
                        cardapio.tipoRefeicao) +
                        " — " +
                        cardapio.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createRefeicao.isPending || updateRefeicao.isPending}
              >
                {(createRefeicao.isPending || updateRefeicao.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingRefeicao ? "Atualizar" : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
