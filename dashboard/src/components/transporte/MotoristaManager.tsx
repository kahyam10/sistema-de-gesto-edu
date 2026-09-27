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
import {
  IdentificationCard,
  Plus,
  Pencil,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import {
  useMotoristas,
  useAlertasCnh,
  useCreateMotorista,
  useUpdateMotorista,
  useDeleteMotorista,
} from "@/hooks/useTransporte";
import { Motorista } from "@/lib/api-transporte";
import { toast } from "sonner";
import { diasAte } from "@/lib/utils";


const vinculoLabels: Record<string, string> = {
  EFETIVO: "Efetivo",
  CONTRATADO: "Contratado",
  TERCEIRIZADO: "Terceirizado",
};

// Badge de validade da CNH/curso: vencido = vermelho, <30 dias = amarelo
function BadgeValidade({
  rotulo,
  vencimento,
}: {
  rotulo: string;
  vencimento?: string | null;
}) {
  if (!vencimento) return null;

  const dataBR = new Date(vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" }); // data pura (meia-noite UTC)
  // Conta por dia no fuso da rede: vale até o fim do dia do vencimento
  const dias = diasAte(vencimento);

  if (dias < 0) {
    return (
      <Badge className="bg-red-100 text-red-800">
        {rotulo} vencida em {dataBR}
      </Badge>
    );
  }
  if (dias <= 30) {
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

interface MotoristaFormData {
  nome: string;
  cpf: string;
  telefone: string;
  cnhNumero: string;
  cnhCategoria: string;
  cnhValidade: string;
  cursoTransporteEscolar: boolean;
  vencimentoCursoTransporte: string;
  vinculo: string;
  ativo: boolean;
}

const initialFormData: MotoristaFormData = {
  nome: "",
  cpf: "",
  telefone: "",
  cnhNumero: "",
  cnhCategoria: "D",
  cnhValidade: "",
  cursoTransporteEscolar: false,
  vencimentoCursoTransporte: "",
  vinculo: "EFETIVO",
  ativo: true,
};

export function MotoristaManager() {
  const [filterVinculo, setFilterVinculo] = useState<string>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMotorista, setEditingMotorista] = useState<Motorista | null>(
    null
  );
  const [formData, setFormData] = useState<MotoristaFormData>(initialFormData);

  const { data: motoristas = [], isLoading } = useMotoristas(
    filterVinculo !== "ALL" ? { vinculo: filterVinculo } : undefined
  );
  const { data: alertasCnh = [] } = useAlertasCnh(30);

  const createMotorista = useCreateMotorista();
  const updateMotorista = useUpdateMotorista();
  const deleteMotorista = useDeleteMotorista();

  const agora = new Date();
  const cnhVencidas = motoristas.filter(
    (m) => new Date(m.cnhValidade) < agora
  ).length;
  const semCurso = motoristas.filter(
    (m) => !m.cursoTransporteEscolar
  ).length;

  const handleOpenForm = (motorista?: Motorista) => {
    if (motorista) {
      setEditingMotorista(motorista);
      setFormData({
        nome: motorista.nome,
        cpf: motorista.cpf,
        telefone: motorista.telefone || "",
        cnhNumero: motorista.cnhNumero,
        cnhCategoria: motorista.cnhCategoria,
        cnhValidade: motorista.cnhValidade?.split("T")[0] || "",
        cursoTransporteEscolar: motorista.cursoTransporteEscolar,
        vencimentoCursoTransporte:
          motorista.vencimentoCursoTransporte?.split("T")[0] || "",
        vinculo: motorista.vinculo,
        ativo: motorista.ativo,
      });
    } else {
      setEditingMotorista(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMotorista(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nome ||
      !formData.cpf ||
      !formData.cnhNumero ||
      !formData.cnhValidade
    ) {
      toast.error("Preencha nome, CPF, CNH e validade da CNH");
      return;
    }

    const payload = {
      nome: formData.nome,
      cpf: formData.cpf,
      telefone: formData.telefone || undefined,
      cnhNumero: formData.cnhNumero,
      cnhCategoria: formData.cnhCategoria as Motorista["cnhCategoria"],
      cnhValidade: formData.cnhValidade,
      cursoTransporteEscolar: formData.cursoTransporteEscolar,
      vencimentoCursoTransporte:
        formData.vencimentoCursoTransporte || undefined,
      vinculo: formData.vinculo as Motorista["vinculo"],
      ativo: formData.ativo,
    };

    try {
      if (editingMotorista) {
        await updateMotorista.mutateAsync({
          id: editingMotorista.id,
          data: payload,
        });
      } else {
        await createMotorista.mutateAsync(payload);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este motorista?"))
      return;
    try {
      await deleteMotorista.mutateAsync(id);
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
              Total de Motoristas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{motoristas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {motoristas.filter((m) => m.ativo).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              CNH Vencida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{cnhVencidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Sem Curso de Transporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{semCurso}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de CNH */}
      {alertasCnh.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Warning size={20} className="text-yellow-600" />
              CNH ou curso vencendo nos próximos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertasCnh.map((alerta) => (
              <div
                key={alerta.motorista.id}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="font-medium">{alerta.motorista.nome}</span>
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
                    {new Date(doc.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
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
                <IdentificationCard size={24} />
                Motoristas
              </CardTitle>
              <CardDescription>
                {motoristas.length} motorista(s) cadastrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterVinculo} onValueChange={setFilterVinculo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os vínculos</SelectItem>
                  {Object.entries(vinculoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-1 h-4 w-4" />
                Novo Motorista
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {motoristas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>Curso Transporte Escolar</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motoristas.map((motorista) => (
                  <TableRow key={motorista.id}>
                    <TableCell className="font-medium">
                      {motorista.nome}
                      {motorista.telefone && (
                        <>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {motorista.telefone}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{motorista.cpf}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {motorista.cnhNumero} — Cat. {motorista.cnhCategoria}
                        </span>
                        <BadgeValidade
                          rotulo="CNH"
                          vencimento={motorista.cnhValidade}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {motorista.cursoTransporteEscolar ? (
                        motorista.vencimentoCursoTransporte ? (
                          <BadgeValidade
                            rotulo="Curso"
                            vencimento={motorista.vencimentoCursoTransporte}
                          />
                        ) : (
                          <Badge variant="default">Possui</Badge>
                        )
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          Curso ausente (CTB art. 138)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{vinculoLabels[motorista.vinculo]}</TableCell>
                    <TableCell>
                      <Badge variant={motorista.ativo ? "default" : "outline"}>
                        {motorista.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenForm(motorista)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(motorista.id)}
                          aria-label="Excluir"
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
              <IdentificationCard
                size={48}
                className="mx-auto mb-4"
                weight="duotone"
              />
              <p className="text-lg font-medium">
                Nenhum motorista cadastrado
              </p>
              <p className="text-sm mt-2">
                Cadastre o primeiro motorista do transporte escolar
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
              {editingMotorista ? "Editar Motorista" : "Novo Motorista"}
            </DialogTitle>
            <DialogDescription>
              Dados pessoais, CNH e curso de transporte escolar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Número da CNH *</Label>
                <Input
                  value={formData.cnhNumero}
                  onChange={(e) =>
                    setFormData({ ...formData, cnhNumero: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria da CNH *</Label>
                <Select
                  value={formData.cnhCategoria}
                  onValueChange={(v) =>
                    setFormData({ ...formData, cnhCategoria: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validade da CNH *</Label>
                <DateInputBR
                  value={formData.cnhValidade}
                  onChange={(v) => setFormData({ ...formData, cnhValidade: v })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vínculo</Label>
                <Select
                  value={formData.vinculo}
                  onValueChange={(v) =>
                    setFormData({ ...formData, vinculo: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vinculoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Venc. Curso Transporte Escolar</Label>
                <DateInputBR
                  value={formData.vencimentoCursoTransporte}
                  onChange={(v) =>
                    setFormData({ ...formData, vencimentoCursoTransporte: v })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.cursoTransporteEscolar}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      cursoTransporteEscolar: checked,
                    })
                  }
                />
                <Label>Possui curso de transporte escolar</Label>
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
                disabled={
                  createMotorista.isPending || updateMotorista.isPending
                }
              >
                {editingMotorista ? "Salvar Alterações" : "Cadastrar Motorista"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
