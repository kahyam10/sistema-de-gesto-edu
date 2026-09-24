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
import { Switch } from "@/components/ui/switch";
import { DateInputBR } from "@/components/ui/date-input-br";
import { Bus, Plus, Pencil, Trash, Warning } from "@phosphor-icons/react";
import {
  useVeiculos,
  useAlertasVeiculos,
  useCreateVeiculo,
  useUpdateVeiculo,
  useDeleteVeiculo,
} from "@/hooks/useTransporte";
import { Veiculo } from "@/lib/api-transporte";
import { toast } from "sonner";

const DIA_MS = 86400000;

const tipoVeiculoLabels: Record<string, string> = {
  ONIBUS: "Ônibus",
  MICRO_ONIBUS: "Micro-ônibus",
  VAN: "Van",
  KOMBI: "Kombi",
  LANCHA: "Lancha",
  OUTRO: "Outro",
};

const tipoPropriedadeLabels: Record<string, string> = {
  PROPRIO: "Próprio",
  TERCEIRIZADO: "Terceirizado",
  CEDIDO: "Cedido",
};

// Badge de vencimento: vencido = vermelho, <30 dias = amarelo, em dia = neutro
function BadgeVencimento({
  rotulo,
  vencimento,
}: {
  rotulo: string;
  vencimento?: string | null;
}) {
  if (!vencimento) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {rotulo}: —
      </Badge>
    );
  }

  const data = new Date(vencimento);
  const dataBR = data.toLocaleDateString("pt-BR");
  const agora = new Date();
  const em30Dias = new Date(Date.now() + 30 * DIA_MS);

  if (data < agora) {
    return (
      <Badge className="bg-red-100 text-red-800">
        {rotulo} vencido em {dataBR}
      </Badge>
    );
  }
  if (data <= em30Dias) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        {rotulo} vence em {dataBR}
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {rotulo}: {dataBR}
    </Badge>
  );
}

interface VeiculoFormData {
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  anoFabricacao: string;
  capacidade: string;
  renavam: string;
  chassi: string;
  tipoPropriedade: string;
  adaptadoPCD: boolean;
  vencimentoLicenciamento: string;
  vencimentoSeguro: string;
  vencimentoVistoria: string;
  ativo: boolean;
}

const initialFormData: VeiculoFormData = {
  placa: "",
  tipo: "ONIBUS",
  marca: "",
  modelo: "",
  anoFabricacao: "",
  capacidade: "",
  renavam: "",
  chassi: "",
  tipoPropriedade: "PROPRIO",
  adaptadoPCD: false,
  vencimentoLicenciamento: "",
  vencimentoSeguro: "",
  vencimentoVistoria: "",
  ativo: true,
};

export function VeiculoManager() {
  const [filterTipo, setFilterTipo] = useState<string>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [formData, setFormData] = useState<VeiculoFormData>(initialFormData);

  const { data: veiculos = [], isLoading } = useVeiculos(
    filterTipo !== "ALL" ? { tipo: filterTipo } : undefined
  );
  const { data: alertas = [] } = useAlertasVeiculos(30);

  const createVeiculo = useCreateVeiculo();
  const updateVeiculo = useUpdateVeiculo();
  const deleteVeiculo = useDeleteVeiculo();

  const documentosVencidos = alertas
    .flatMap((a) => a.documentosVencendo)
    .filter((d) => d.vencido).length;

  const handleOpenForm = (veiculo?: Veiculo) => {
    if (veiculo) {
      setEditingVeiculo(veiculo);
      setFormData({
        placa: veiculo.placa,
        tipo: veiculo.tipo,
        marca: veiculo.marca || "",
        modelo: veiculo.modelo || "",
        anoFabricacao: veiculo.anoFabricacao?.toString() || "",
        capacidade: veiculo.capacidade.toString(),
        renavam: veiculo.renavam || "",
        chassi: veiculo.chassi || "",
        tipoPropriedade: veiculo.tipoPropriedade,
        adaptadoPCD: veiculo.adaptadoPCD,
        vencimentoLicenciamento:
          veiculo.vencimentoLicenciamento?.split("T")[0] || "",
        vencimentoSeguro: veiculo.vencimentoSeguro?.split("T")[0] || "",
        vencimentoVistoria: veiculo.vencimentoVistoria?.split("T")[0] || "",
        ativo: veiculo.ativo,
      });
    } else {
      setEditingVeiculo(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVeiculo(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.placa || !formData.capacidade) {
      toast.error("Preencha placa e capacidade");
      return;
    }

    const payload = {
      placa: formData.placa.toUpperCase(),
      tipo: formData.tipo as Veiculo["tipo"],
      marca: formData.marca || undefined,
      modelo: formData.modelo || undefined,
      anoFabricacao: formData.anoFabricacao
        ? parseInt(formData.anoFabricacao)
        : undefined,
      capacidade: parseInt(formData.capacidade),
      renavam: formData.renavam || undefined,
      chassi: formData.chassi || undefined,
      tipoPropriedade: formData.tipoPropriedade as Veiculo["tipoPropriedade"],
      adaptadoPCD: formData.adaptadoPCD,
      vencimentoLicenciamento: formData.vencimentoLicenciamento || undefined,
      vencimentoSeguro: formData.vencimentoSeguro || undefined,
      vencimentoVistoria: formData.vencimentoVistoria || undefined,
      ativo: formData.ativo,
    };

    try {
      if (editingVeiculo) {
        await updateVeiculo.mutateAsync({
          id: editingVeiculo.id,
          data: payload,
        });
      } else {
        await createVeiculo.mutateAsync(payload);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este veículo?")) return;
    try {
      await deleteVeiculo.mutateAsync(id);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Frota Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{veiculos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Veículos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {veiculos.filter((v) => v.ativo).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Docs. Vencendo (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {alertas.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Documentos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {documentosVencidos}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de vencimento */}
      {alertas.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Warning size={20} className="text-yellow-600" />
              Documentação vencendo nos próximos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertas.map((alerta) => (
              <div
                key={alerta.veiculo.id}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="font-medium">{alerta.veiculo.placa}</span>
                {alerta.documentosVencendo.map((doc) => (
                  <Badge
                    key={doc.documento}
                    className={
                      doc.vencido
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {doc.documento}:{" "}
                    {new Date(doc.vencimento).toLocaleDateString("pt-BR")}
                  </Badge>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bus size={24} />
                Frota Escolar
              </CardTitle>
              <CardDescription>
                {veiculos.length} veículo(s) cadastrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  {Object.entries(tipoVeiculoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-1 h-4 w-4" />
                Novo Veículo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {veiculos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculos.map((veiculo) => (
                  <TableRow key={veiculo.id}>
                    <TableCell className="font-medium">
                      {veiculo.placa}
                      {veiculo.adaptadoPCD && (
                        <Badge variant="outline" className="ml-2">
                          PCD
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{tipoVeiculoLabels[veiculo.tipo]}</TableCell>
                    <TableCell>
                      {[veiculo.marca, veiculo.modelo]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </TableCell>
                    <TableCell>{veiculo.capacidade} lugares</TableCell>
                    <TableCell>
                      {tipoPropriedadeLabels[veiculo.tipoPropriedade]}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <BadgeVencimento
                          rotulo="Licenciamento"
                          vencimento={veiculo.vencimentoLicenciamento}
                        />
                        <BadgeVencimento
                          rotulo="Seguro"
                          vencimento={veiculo.vencimentoSeguro}
                        />
                        <BadgeVencimento
                          rotulo="Vistoria"
                          vencimento={veiculo.vencimentoVistoria}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={veiculo.ativo ? "default" : "outline"}>
                        {veiculo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenForm(veiculo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(veiculo.id)}
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
              <Bus size={48} className="mx-auto mb-4" weight="duotone" />
              <p className="text-lg font-medium">Nenhum veículo cadastrado</p>
              <p className="text-sm mt-2">
                Cadastre o primeiro veículo da frota escolar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulário */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVeiculo ? "Editar Veículo" : "Novo Veículo"}
            </DialogTitle>
            <DialogDescription>
              Dados do veículo e vencimentos da documentação
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placa *</Label>
                <Input
                  value={formData.placa}
                  onChange={(e) =>
                    setFormData({ ...formData, placa: e.target.value })
                  }
                  placeholder="ABC1D23"
                  maxLength={8}
                />
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
                    {Object.entries(tipoVeiculoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={formData.marca}
                  onChange={(e) =>
                    setFormData({ ...formData, marca: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={formData.modelo}
                  onChange={(e) =>
                    setFormData({ ...formData, modelo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ano de Fabricação</Label>
                <Input
                  type="number"
                  value={formData.anoFabricacao}
                  onChange={(e) =>
                    setFormData({ ...formData, anoFabricacao: e.target.value })
                  }
                  min={1980}
                  max={2100}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (lugares) *</Label>
                <Input
                  type="number"
                  value={formData.capacidade}
                  onChange={(e) =>
                    setFormData({ ...formData, capacidade: e.target.value })
                  }
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>RENAVAM</Label>
                <Input
                  value={formData.renavam}
                  onChange={(e) =>
                    setFormData({ ...formData, renavam: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Chassi</Label>
                <Input
                  value={formData.chassi}
                  onChange={(e) =>
                    setFormData({ ...formData, chassi: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Propriedade</Label>
                <Select
                  value={formData.tipoPropriedade}
                  onValueChange={(v) =>
                    setFormData({ ...formData, tipoPropriedade: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoPropriedadeLabels).map(
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
                <Label>Venc. Licenciamento</Label>
                <DateInputBR
                  value={formData.vencimentoLicenciamento}
                  onChange={(v) =>
                    setFormData({ ...formData, vencimentoLicenciamento: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Venc. Seguro</Label>
                <DateInputBR
                  value={formData.vencimentoSeguro}
                  onChange={(v) =>
                    setFormData({ ...formData, vencimentoSeguro: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Venc. Vistoria</Label>
                <DateInputBR
                  value={formData.vencimentoVistoria}
                  onChange={(v) =>
                    setFormData({ ...formData, vencimentoVistoria: v })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.adaptadoPCD}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, adaptadoPCD: checked })
                  }
                />
                <Label>Adaptado para PCD</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createVeiculo.isPending || updateVeiculo.isPending}
              >
                {editingVeiculo ? "Salvar Alterações" : "Cadastrar Veículo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
