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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DateInputBR } from "@/components/ui/date-input-br";
import { Wrench, Plus, Pencil, Trash } from "@phosphor-icons/react";
import {
  useManutencoes,
  useCreateManutencao,
  useUpdateManutencao,
  useDeleteManutencao,
  useVeiculos,
} from "@/hooks/useTransporte";
import { ManutencaoVeiculo } from "@/lib/api-transporte";
import { toast } from "sonner";

const tipoManutencaoLabels: Record<string, string> = {
  PREVENTIVA: "Preventiva",
  CORRETIVA: "Corretiva",
  REVISAO: "Revisão",
  TROCA_OLEO: "Troca de Óleo",
  PNEUS: "Pneus",
  FREIOS: "Freios",
  OUTRA: "Outra",
};

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const statusColors: Record<string, string> = {
  AGENDADA: "bg-blue-100 text-blue-800",
  EM_ANDAMENTO: "bg-yellow-100 text-yellow-800",
  CONCLUIDA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ManutencaoFormData {
  veiculoId: string;
  tipo: string;
  descricao: string;
  dataAgendada: string;
  dataRealizada: string;
  custo: string;
  kmRegistrado: string;
  oficina: string;
  status: string;
  observacoes: string;
}

const initialFormData: ManutencaoFormData = {
  veiculoId: "",
  tipo: "PREVENTIVA",
  descricao: "",
  dataAgendada: "",
  dataRealizada: "",
  custo: "",
  kmRegistrado: "",
  oficina: "",
  status: "AGENDADA",
  observacoes: "",
};

export function ManutencaoManager() {
  const [filterVeiculo, setFilterVeiculo] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingManutencao, setEditingManutencao] =
    useState<ManutencaoVeiculo | null>(null);
  const [formData, setFormData] = useState<ManutencaoFormData>(initialFormData);

  const filters: { veiculoId?: string; status?: string } = {};
  if (filterVeiculo !== "ALL") filters.veiculoId = filterVeiculo;
  if (filterStatus !== "ALL") filters.status = filterStatus;

  const { data: manutencoes = [], isLoading } = useManutencoes(filters);
  const { data: veiculos = [] } = useVeiculos();

  const createManutencao = useCreateManutencao();
  const updateManutencao = useUpdateManutencao();
  const deleteManutencao = useDeleteManutencao();

  // Stat cards
  const agendadas = manutencoes.filter((m) => m.status === "AGENDADA").length;
  const agora = new Date();
  const concluidasNoMes = manutencoes.filter((m) => {
    if (m.status !== "CONCLUIDA") return false;
    const data = new Date(m.dataRealizada || m.dataAgendada);
    return (
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  }).length;
  const custoTotal = manutencoes
    .filter((m) => m.status === "CONCLUIDA")
    .reduce((acc, m) => acc + (m.custo || 0), 0);

  const handleOpenForm = (manutencao?: ManutencaoVeiculo) => {
    if (manutencao) {
      setEditingManutencao(manutencao);
      setFormData({
        veiculoId: manutencao.veiculoId,
        tipo: manutencao.tipo,
        descricao: manutencao.descricao,
        dataAgendada: manutencao.dataAgendada?.split("T")[0] || "",
        dataRealizada: manutencao.dataRealizada?.split("T")[0] || "",
        custo: manutencao.custo?.toString() || "",
        kmRegistrado: manutencao.kmRegistrado?.toString() || "",
        oficina: manutencao.oficina || "",
        status: manutencao.status,
        observacoes: manutencao.observacoes || "",
      });
    } else {
      setEditingManutencao(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingManutencao(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao || !formData.dataAgendada) {
      toast.error("Preencha descrição e data agendada");
      return;
    }
    if (!editingManutencao && !formData.veiculoId) {
      toast.error("Selecione o veículo");
      return;
    }

    const payload = {
      tipo: formData.tipo as ManutencaoVeiculo["tipo"],
      descricao: formData.descricao,
      dataAgendada: formData.dataAgendada,
      dataRealizada: formData.dataRealizada || undefined,
      custo: formData.custo ? parseFloat(formData.custo) : undefined,
      kmRegistrado: formData.kmRegistrado
        ? parseInt(formData.kmRegistrado)
        : undefined,
      oficina: formData.oficina || undefined,
      status: formData.status as ManutencaoVeiculo["status"],
      observacoes: formData.observacoes || undefined,
    };

    try {
      if (editingManutencao) {
        // veiculoId não pode ser alterado (updateManutencaoSchema omite)
        await updateManutencao.mutateAsync({
          id: editingManutencao.id,
          data: payload,
        });
      } else {
        await createManutencao.mutateAsync({
          ...payload,
          veiculoId: formData.veiculoId,
        });
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta manutenção?"))
      return;
    try {
      await deleteManutencao.mutateAsync(id);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{agendadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Concluídas no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {concluidasNoMes}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Custo Total (concluídas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatarMoeda(custoTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench size={24} />
                Manutenções da Frota
              </CardTitle>
              <CardDescription>
                {manutencoes.length} manutenção(ões) registrada(s)
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterVeiculo} onValueChange={setFilterVeiculo}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os veículos</SelectItem>
                  {veiculos.map((veiculo) => (
                    <SelectItem key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-1 h-4 w-4" />
                Nova Manutenção
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {manutencoes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Agendada</TableHead>
                  <TableHead>Realizada</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manutencoes.map((manutencao) => (
                  <TableRow key={manutencao.id}>
                    <TableCell className="font-medium">
                      {manutencao.veiculo?.placa || "—"}
                    </TableCell>
                    <TableCell>
                      {tipoManutencaoLabels[manutencao.tipo]}
                    </TableCell>
                    <TableCell>
                      {manutencao.descricao}
                      {manutencao.oficina && (
                        <>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {manutencao.oficina}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(manutencao.dataAgendada).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                    </TableCell>
                    <TableCell>
                      {manutencao.dataRealizada
                        ? new Date(manutencao.dataRealizada).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {manutencao.custo != null
                        ? formatarMoeda(manutencao.custo)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[manutencao.status]}>
                        {statusLabels[manutencao.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenForm(manutencao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(manutencao.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench size={48} className="mx-auto mb-4" weight="duotone" />
              <p className="text-lg font-medium">
                Nenhuma manutenção registrada
              </p>
              <p className="text-sm mt-2">
                Agende a primeira manutenção da frota
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulário */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => !open && handleCloseForm()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingManutencao ? "Editar Manutenção" : "Nova Manutenção"}
            </DialogTitle>
            <DialogDescription>
              Agendamento e registro de manutenções da frota
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Veículo *</Label>
                <Select
                  value={formData.veiculoId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, veiculoId: v })
                  }
                  disabled={!!editingManutencao}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map((veiculo) => (
                      <SelectItem key={veiculo.id} value={veiculo.id}>
                        {veiculo.placa} —{" "}
                        {[veiculo.marca, veiculo.modelo]
                          .filter(Boolean)
                          .join(" ") || veiculo.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoManutencaoLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Agendada *</Label>
                <DateInputBR
                  value={formData.dataAgendada}
                  onChange={(v) =>
                    setFormData({ ...formData, dataAgendada: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data Realizada</Label>
                <DateInputBR
                  value={formData.dataRealizada}
                  onChange={(v) =>
                    setFormData({ ...formData, dataRealizada: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Custo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.custo}
                  onChange={(e) =>
                    setFormData({ ...formData, custo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Km Registrado</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.kmRegistrado}
                  onChange={(e) =>
                    setFormData({ ...formData, kmRegistrado: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Oficina</Label>
                <Input
                  value={formData.oficina}
                  onChange={(e) =>
                    setFormData({ ...formData, oficina: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createManutencao.isPending || updateManutencao.isPending
                }
              >
                {editingManutencao
                  ? "Salvar Alterações"
                  : "Agendar Manutenção"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
