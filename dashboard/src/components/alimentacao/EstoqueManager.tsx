"use client";

import { useMemo, useState } from "react";
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
import {
  Plus,
  Pencil,
  Trash,
  Package,
  ArrowsDownUp,
  Warning,
  Spinner,
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
import { KpiCard } from "@/components/ui/kpi-card";
import { useEscolas } from "@/hooks/useApi";
import {
  useItensEstoque,
  useCreateItemEstoque,
  useUpdateItemEstoque,
  useDeleteItemEstoque,
  useMovimentacoesEstoque,
  useCreateMovimentacaoEstoque,
  useAlertasEstoque,
} from "@/hooks/useAlimentacao";
import type {
  ItemEstoque,
  CategoriaItemEstoque,
  UnidadeMedida,
  TipoMovimentacaoEstoque,
} from "@/lib/api-alimentacao";
import { toast } from "sonner";

const categoriaLabels: Record<string, string> = {
  PERECIVEL: "Perecível",
  NAO_PERECIVEL: "Não Perecível",
  HORTIFRUTI: "Hortifruti",
  PROTEINA: "Proteína",
  GRAO: "Grão",
  LATICINIO: "Laticínio",
  OUTRO: "Outro",
};

const unidadeLabels: Record<string, string> = {
  KG: "kg",
  G: "g",
  L: "L",
  ML: "mL",
  UN: "un",
  PCT: "pct",
  CX: "cx",
};

const tipoMovimentacaoLabels: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  PERDA: "Perda",
  AJUSTE_ENTRADA: "Ajuste (entrada)",
  AJUSTE_SAIDA: "Ajuste (saída)",
};

const TIPOS_ENTRADA = ["ENTRADA", "AJUSTE_ENTRADA"];
const MOTIVO_OBRIGATORIO = ["PERDA", "AJUSTE_ENTRADA", "AJUSTE_SAIDA"];

interface ItemFormData {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: string;
  escolaId: string;
  ativo: boolean;
}

const initialItemForm: ItemFormData = {
  nome: "",
  categoria: "NAO_PERECIVEL",
  unidadeMedida: "KG",
  estoqueMinimo: "0",
  escolaId: "",
  ativo: true,
};

interface MovimentacaoFormData {
  tipo: string;
  quantidade: string;
  custoUnitario: string;
  fornecedor: string;
  notaFiscal: string;
  motivo: string;
}

const initialMovForm: MovimentacaoFormData = {
  tipo: "ENTRADA",
  quantidade: "",
  custoUnitario: "",
  fornecedor: "",
  notaFiscal: "",
  motivo: "",
};

export function EstoqueManager() {
  const { data: escolas = [] } = useEscolas();

  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterCategoria, setFilterCategoria] = useState<string>("ALL");
  const [busca, setBusca] = useState("");

  const escolaId = filterEscola !== "ALL" ? filterEscola : undefined;

  const { data: itens = [], isLoading } = useItensEstoque({
    escolaId,
    categoria: filterCategoria !== "ALL" ? filterCategoria : undefined,
    busca: busca || undefined,
  });
  const { data: alertas = [] } = useAlertasEstoque(escolaId);

  // Movimentações do mês corrente para os stat cards
  const inicioMes = useMemo(() => {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    return `${agora.getFullYear()}-${mes}-01`;
  }, []);
  const { data: movimentacoesMes = [] } = useMovimentacoesEstoque({
    escolaId,
    dataInicio: inicioMes,
  });

  const entradasMes = movimentacoesMes.filter((m) =>
    TIPOS_ENTRADA.includes(m.tipo)
  ).length;
  const saidasMes = movimentacoesMes.length - entradasMes;

  const createItem = useCreateItemEstoque();
  const updateItem = useUpdateItemEstoque();
  const deleteItem = useDeleteItemEstoque();
  const createMovimentacao = useCreateMovimentacaoEstoque();

  // Dialog de item
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemEstoque | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(initialItemForm);

  // Dialog de movimentação
  const [movItem, setMovItem] = useState<ItemEstoque | null>(null);
  const [movForm, setMovForm] = useState<MovimentacaoFormData>(initialMovForm);

  const handleOpenItemForm = (item?: ItemEstoque) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        nome: item.nome,
        categoria: item.categoria,
        unidadeMedida: item.unidadeMedida,
        estoqueMinimo: String(item.estoqueMinimo),
        escolaId: item.escolaId,
        ativo: item.ativo,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        ...initialItemForm,
        escolaId: escolaId || "",
      });
    }
    setIsItemFormOpen(true);
  };

  const handleCloseItemForm = () => {
    setIsItemFormOpen(false);
    setEditingItem(null);
    setItemForm(initialItemForm);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemForm.nome || (!editingItem && !itemForm.escolaId)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          data: {
            nome: itemForm.nome,
            categoria: itemForm.categoria as CategoriaItemEstoque,
            unidadeMedida: itemForm.unidadeMedida as UnidadeMedida,
            estoqueMinimo: parseFloat(itemForm.estoqueMinimo) || 0,
            ativo: itemForm.ativo,
          },
        });
      } else {
        await createItem.mutateAsync({
          nome: itemForm.nome,
          categoria: itemForm.categoria as CategoriaItemEstoque,
          unidadeMedida: itemForm.unidadeMedida as UnidadeMedida,
          estoqueMinimo: parseFloat(itemForm.estoqueMinimo) || 0,
          escolaId: itemForm.escolaId,
          ativo: itemForm.ativo,
        });
      }
      handleCloseItemForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (
      !window.confirm(
        "Excluir este item remove também toda a trilha de movimentações. Continuar?"
      )
    )
      return;

    try {
      await deleteItem.mutateAsync(id);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleOpenMovForm = (item: ItemEstoque) => {
    setMovItem(item);
    setMovForm(initialMovForm);
  };

  const handleSubmitMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movItem) return;

    const quantidade = parseFloat(movForm.quantidade);
    if (!quantidade || quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    if (MOTIVO_OBRIGATORIO.includes(movForm.tipo) && !movForm.motivo) {
      toast.error("Motivo é obrigatório para perdas e ajustes");
      return;
    }

    try {
      await createMovimentacao.mutateAsync({
        itemId: movItem.id,
        tipo: movForm.tipo as TipoMovimentacaoEstoque,
        quantidade,
        custoUnitario: movForm.custoUnitario
          ? parseFloat(movForm.custoUnitario)
          : undefined,
        fornecedor: movForm.fornecedor || undefined,
        notaFiscal: movForm.notaFiscal || undefined,
        motivo: movForm.motivo || undefined,
      });
      setMovItem(null);
      setMovForm(initialMovForm);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Itens cadastrados" value={itens.length} icon="package" />
        <KpiCard
          label="Itens em alerta"
          value={alertas.length}
          icon="warning"
          color={alertas.length > 0 ? "#DC2626" : undefined}
        />
        <KpiCard label="Entradas no mês" value={entradasMes} icon="arrowDown" />
        <KpiCard label="Saídas no mês" value={saidasMes} icon="arrowUp" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estoque da Merenda</CardTitle>
              <CardDescription>
                Saldo sempre derivado das movimentações de entrada e saída
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenItemForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
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
              <Label>Categoria</Label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Categorias</SelectItem>
                  {Object.entries(categoriaLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Buscar</Label>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome do item..."
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : itens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item de estoque encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => {
                    const saldo = item.saldo ?? 0;
                    const emAlerta = saldo <= item.estoqueMinimo;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.nome}
                        </TableCell>
                        <TableCell>
                          {categoriaLabels[item.categoria] || item.categoria}
                        </TableCell>
                        <TableCell>{item.escola?.nome || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              emAlerta
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {saldo.toLocaleString("pt-BR")}{" "}
                            {unidadeLabels[item.unidadeMedida] ||
                              item.unidadeMedida}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.estoqueMinimo.toLocaleString("pt-BR")}{" "}
                          {unidadeLabels[item.unidadeMedida] ||
                            item.unidadeMedida}
                        </TableCell>
                        <TableCell>
                          {!item.ativo ? (
                            <Badge variant="secondary">Inativo</Badge>
                          ) : emAlerta ? (
                            <Badge className="bg-red-100 text-red-800">
                              <Warning className="h-3 w-3 mr-1" />
                              Alerta
                            </Badge>
                          ) : (
                            <Badge variant="outline">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Registrar movimentação"
                              onClick={() => handleOpenMovForm(item)}
                            >
                              <ArrowsDownUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenItemForm(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Dialog de item */}
      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Novo Item de Estoque"}
            </DialogTitle>
            <DialogDescription>
              O saldo é sempre calculado a partir das movimentações
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={itemForm.nome}
                onChange={(e) =>
                  setItemForm({ ...itemForm, nome: e.target.value })
                }
                placeholder="Ex: Arroz tipo 1"
                required
              />
            </div>

            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="escolaItem">Escola *</Label>
                <Select
                  value={itemForm.escolaId}
                  onValueChange={(value) =>
                    setItemForm({ ...itemForm, escolaId: value })
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
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={itemForm.categoria}
                  onValueChange={(value) =>
                    setItemForm({ ...itemForm, categoria: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoriaLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade *</Label>
                <Select
                  value={itemForm.unidadeMedida}
                  onValueChange={(value) =>
                    setItemForm({ ...itemForm, unidadeMedida: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(unidadeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                <Input
                  id="estoqueMinimo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.estoqueMinimo}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, estoqueMinimo: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="itemAtivo"
                checked={itemForm.ativo}
                onChange={(e) =>
                  setItemForm({ ...itemForm, ativo: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="itemAtivo">Ativo</Label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseItemForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createItem.isPending || updateItem.isPending}
              >
                {(createItem.isPending || updateItem.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingItem ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de movimentação */}
      <Dialog
        open={!!movItem}
        onOpenChange={(open) => {
          if (!open) setMovItem(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
            <DialogDescription>
              {movItem
                ? `${movItem.nome} — saldo atual: ${(movItem.saldo ?? 0).toLocaleString("pt-BR")} ${unidadeLabels[movItem.unidadeMedida] || movItem.unidadeMedida}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitMovimentacao} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={movForm.tipo}
                  onValueChange={(value) =>
                    setMovForm({ ...movForm, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoMovimentacaoLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movForm.quantidade}
                  onChange={(e) =>
                    setMovForm({ ...movForm, quantidade: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {movForm.tipo === "ENTRADA" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custoUnitario">Custo Unitário (R$)</Label>
                  <Input
                    id="custoUnitario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={movForm.custoUnitario}
                    onChange={(e) =>
                      setMovForm({ ...movForm, custoUnitario: e.target.value })
                    }
                    placeholder="Prestação PNAE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={movForm.fornecedor}
                    onChange={(e) =>
                      setMovForm({ ...movForm, fornecedor: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notaFiscal">Nota Fiscal</Label>
                  <Input
                    id="notaFiscal"
                    value={movForm.notaFiscal}
                    onChange={(e) =>
                      setMovForm({ ...movForm, notaFiscal: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="motivo">
                Motivo{" "}
                {MOTIVO_OBRIGATORIO.includes(movForm.tipo) ? "*" : "(opcional)"}
              </Label>
              <Textarea
                id="motivo"
                value={movForm.motivo}
                onChange={(e) =>
                  setMovForm({ ...movForm, motivo: e.target.value })
                }
                rows={2}
                placeholder={
                  MOTIVO_OBRIGATORIO.includes(movForm.tipo)
                    ? "Obrigatório para perdas e ajustes"
                    : "Ex: consumo do dia"
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovItem(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovimentacao.isPending}>
                {createMovimentacao.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
