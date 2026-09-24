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
import { Textarea } from "@/components/ui/textarea";
import {
  MapTrifold,
  Plus,
  Pencil,
  Trash,
  Eye,
  Buildings,
  Student,
} from "@phosphor-icons/react";
import {
  useRotasTransporte,
  useRotaTransporte,
  useCreateRotaTransporte,
  useUpdateRotaTransporte,
  useDeleteRotaTransporte,
  useVincularEscolaRota,
  useDesvincularEscolaRota,
  useVincularAlunoRota,
  useDesvincularAlunoRota,
  useVeiculos,
  useMotoristas,
} from "@/hooks/useTransporte";
import { useEscolas, useMatriculas } from "@/hooks/useApi";
import { RotaTransporte } from "@/lib/api-transporte";
import { toast } from "sonner";

const turnoLabels: Record<string, string> = {
  MATUTINO: "Matutino",
  VESPERTINO: "Vespertino",
  NOTURNO: "Noturno",
  INTEGRAL: "Integral",
};

const tipoRotaLabels: Record<string, string> = {
  RURAL: "Rural",
  URBANA: "Urbana",
  FLUVIAL: "Fluvial",
};

interface RotaFormData {
  nome: string;
  codigo: string;
  turno: string;
  tipo: string;
  itinerario: string;
  kmDiario: string;
  horarioSaida: string;
  horarioRetorno: string;
  veiculoId: string;
  motoristaId: string;
  ativo: boolean;
}

const initialFormData: RotaFormData = {
  nome: "",
  codigo: "",
  turno: "MATUTINO",
  tipo: "RURAL",
  itinerario: "",
  kmDiario: "",
  horarioSaida: "",
  horarioRetorno: "",
  veiculoId: "",
  motoristaId: "",
  ativo: true,
};

export function RotaManager() {
  const [filterTurno, setFilterTurno] = useState<string>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRota, setEditingRota] = useState<RotaTransporte | null>(null);
  const [formData, setFormData] = useState<RotaFormData>(initialFormData);

  // Painel de detalhe (escolas/alunos vinculados)
  const [detalheRotaId, setDetalheRotaId] = useState<string>("");
  const [abaDetalhe, setAbaDetalhe] = useState<"escolas" | "alunos">("escolas");
  const [escolaVincular, setEscolaVincular] = useState<string>("");
  const [escolaAluno, setEscolaAluno] = useState<string>("");
  const [matriculaVincular, setMatriculaVincular] = useState<string>("");
  const [pontoEmbarque, setPontoEmbarque] = useState<string>("");

  const { data: rotas = [], isLoading } = useRotasTransporte(
    filterTurno !== "ALL" ? { turno: filterTurno } : undefined
  );
  const { data: rotaDetalhe } = useRotaTransporte(detalheRotaId);
  const { data: veiculos = [] } = useVeiculos({ ativo: true });
  const { data: motoristas = [] } = useMotoristas({ ativo: true });
  const { data: escolas = [] } = useEscolas();
  const { data: matriculas = [] } = useMatriculas(
    escolaAluno ? { escolaId: escolaAluno, status: "ATIVA" } : undefined
  );

  const createRota = useCreateRotaTransporte();
  const updateRota = useUpdateRotaTransporte();
  const deleteRota = useDeleteRotaTransporte();
  const vincularEscola = useVincularEscolaRota();
  const desvincularEscola = useDesvincularEscolaRota();
  const vincularAluno = useVincularAlunoRota();
  const desvincularAluno = useDesvincularAlunoRota();

  const handleOpenForm = (rota?: RotaTransporte) => {
    if (rota) {
      setEditingRota(rota);
      setFormData({
        nome: rota.nome,
        codigo: rota.codigo,
        turno: rota.turno,
        tipo: rota.tipo,
        itinerario: rota.itinerario,
        kmDiario: rota.kmDiario?.toString() || "",
        horarioSaida: rota.horarioSaida || "",
        horarioRetorno: rota.horarioRetorno || "",
        veiculoId: rota.veiculoId || "",
        motoristaId: rota.motoristaId || "",
        ativo: rota.ativo,
      });
    } else {
      setEditingRota(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRota(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.codigo || !formData.itinerario) {
      toast.error("Preencha nome, código e itinerário");
      return;
    }

    const payload = {
      nome: formData.nome,
      codigo: formData.codigo,
      turno: formData.turno as RotaTransporte["turno"],
      tipo: formData.tipo as RotaTransporte["tipo"],
      itinerario: formData.itinerario,
      kmDiario: formData.kmDiario ? parseFloat(formData.kmDiario) : undefined,
      horarioSaida: formData.horarioSaida || undefined,
      horarioRetorno: formData.horarioRetorno || undefined,
      veiculoId: formData.veiculoId || undefined,
      motoristaId: formData.motoristaId || undefined,
      ativo: formData.ativo,
    };

    try {
      if (editingRota) {
        await updateRota.mutateAsync({ id: editingRota.id, data: payload });
      } else {
        await createRota.mutateAsync(payload);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta rota?")) return;
    try {
      await deleteRota.mutateAsync(id);
      if (detalheRotaId === id) setDetalheRotaId("");
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleAbrirDetalhe = (rota: RotaTransporte) => {
    setDetalheRotaId(rota.id);
    setAbaDetalhe("escolas");
    setEscolaVincular("");
    setEscolaAluno("");
    setMatriculaVincular("");
    setPontoEmbarque("");
  };

  const handleVincularEscola = async () => {
    if (!detalheRotaId || !escolaVincular) return;
    try {
      await vincularEscola.mutateAsync({
        id: detalheRotaId,
        escolaId: escolaVincular,
      });
      setEscolaVincular("");
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDesvincularEscola = async (escolaId: string) => {
    if (!window.confirm("Desvincular esta escola da rota?")) return;
    try {
      await desvincularEscola.mutateAsync({ id: detalheRotaId, escolaId });
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleVincularAluno = async () => {
    if (!detalheRotaId || !matriculaVincular) return;
    try {
      await vincularAluno.mutateAsync({
        id: detalheRotaId,
        data: {
          matriculaId: matriculaVincular,
          pontoEmbarque: pontoEmbarque || undefined,
        },
      });
      setMatriculaVincular("");
      setPontoEmbarque("");
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDesvincularAluno = async (matriculaId: string) => {
    if (!window.confirm("Desvincular este aluno da rota?")) return;
    try {
      await desvincularAluno.mutateAsync({ id: detalheRotaId, matriculaId });
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

  const ocupacao = rotaDetalhe?.alunos?.length ?? 0;
  const capacidade = rotaDetalhe?.veiculo?.capacidade;

  return (
    <div className="space-y-6">
      {/* Lista de rotas */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapTrifold size={24} />
                Rotas de Transporte
              </CardTitle>
              <CardDescription>
                {rotas.length} rota(s) cadastrada(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterTurno} onValueChange={setFilterTurno}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os turnos</SelectItem>
                  {Object.entries(turnoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-1 h-4 w-4" />
                Nova Rota
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rotas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotas.map((rota) => (
                  <TableRow key={rota.id}>
                    <TableCell className="font-medium">{rota.codigo}</TableCell>
                    <TableCell>
                      {rota.nome}
                      {(rota.horarioSaida || rota.horarioRetorno) && (
                        <>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {rota.horarioSaida || "—"} →{" "}
                            {rota.horarioRetorno || "—"}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{turnoLabels[rota.turno]}</TableCell>
                    <TableCell>{tipoRotaLabels[rota.tipo]}</TableCell>
                    <TableCell>
                      {rota.veiculo
                        ? `${rota.veiculo.placa} (${rota.veiculo.capacidade} lug.)`
                        : "—"}
                    </TableCell>
                    <TableCell>{rota.motorista?.nome || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rota._count?.alunos ?? 0}
                        {rota.veiculo ? ` / ${rota.veiculo.capacidade}` : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rota.ativo ? "default" : "outline"}>
                        {rota.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAbrirDetalhe(rota)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenForm(rota)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(rota.id)}
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
              <MapTrifold size={48} className="mx-auto mb-4" weight="duotone" />
              <p className="text-lg font-medium">Nenhuma rota cadastrada</p>
              <p className="text-sm mt-2">
                Crie a primeira rota do transporte escolar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel de detalhe: escolas e alunos vinculados */}
      {detalheRotaId && rotaDetalhe && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>
                  {rotaDetalhe.codigo} — {rotaDetalhe.nome}
                </CardTitle>
                <CardDescription>
                  {rotaDetalhe.itinerario}
                  {capacidade !== undefined && (
                    <>
                      {" · "}Ocupação: {ocupacao}/{capacidade}
                    </>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetalheRotaId("")}
              >
                Fechar
              </Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={abaDetalhe === "escolas" ? "default" : "outline"}
                onClick={() => setAbaDetalhe("escolas")}
              >
                <Buildings className="mr-1 h-4 w-4" />
                Escolas ({rotaDetalhe.escolas?.length ?? 0})
              </Button>
              <Button
                size="sm"
                variant={abaDetalhe === "alunos" ? "default" : "outline"}
                onClick={() => setAbaDetalhe("alunos")}
              >
                <Student className="mr-1 h-4 w-4" />
                Alunos ({ocupacao})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {abaDetalhe === "escolas" ? (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-2 min-w-[240px]">
                    <Label>Vincular escola</Label>
                    <Select
                      value={escolaVincular}
                      onValueChange={setEscolaVincular}
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
                  <Button
                    onClick={handleVincularEscola}
                    disabled={!escolaVincular || vincularEscola.isPending}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Vincular
                  </Button>
                </div>
                {rotaDetalhe.escolas && rotaDetalhe.escolas.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Escola</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rotaDetalhe.escolas.map((vinculo) => (
                        <TableRow key={vinculo.id}>
                          <TableCell>{vinculo.escola.nome}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleDesvincularEscola(vinculo.escola.id)
                              }
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma escola vinculada a esta rota
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-2 min-w-[200px]">
                    <Label>Escola</Label>
                    <Select
                      value={escolaAluno}
                      onValueChange={(v) => {
                        setEscolaAluno(v);
                        setMatriculaVincular("");
                      }}
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
                  <div className="space-y-2 min-w-[240px]">
                    <Label>Aluno (matrícula)</Label>
                    <Select
                      value={matriculaVincular}
                      onValueChange={setMatriculaVincular}
                      disabled={!escolaAluno}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {matriculas.map((matricula) => (
                          <SelectItem key={matricula.id} value={matricula.id}>
                            {matricula.nomeAluno} ({matricula.numeroMatricula})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-[200px]">
                    <Label>Ponto de embarque</Label>
                    <Input
                      value={pontoEmbarque}
                      onChange={(e) => setPontoEmbarque(e.target.value)}
                      placeholder="Ex: Km 12 da vicinal"
                    />
                  </div>
                  <Button
                    onClick={handleVincularAluno}
                    disabled={!matriculaVincular || vincularAluno.isPending}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Vincular
                  </Button>
                </div>
                {rotaDetalhe.alunos && rotaDetalhe.alunos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Ponto de Embarque</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rotaDetalhe.alunos.map((vinculo) => (
                        <TableRow key={vinculo.id}>
                          <TableCell className="font-medium">
                            {vinculo.matricula.nomeAluno}
                          </TableCell>
                          <TableCell>
                            {vinculo.matricula.numeroMatricula}
                          </TableCell>
                          <TableCell>{vinculo.pontoEmbarque || "—"}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleDesvincularAluno(vinculo.matricula.id)
                              }
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum aluno vinculado a esta rota
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de formulário */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => !open && handleCloseForm()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRota ? "Editar Rota" : "Nova Rota"}
            </DialogTitle>
            <DialogDescription>
              Dados da rota, itinerário e vínculo de veículo/motorista
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Rota Comunidade Norte"
                />
              </div>
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="ROTA-01"
                />
              </div>
              <div className="space-y-2">
                <Label>Turno *</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(v) => setFormData({ ...formData, turno: v })}
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
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoRotaLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Itinerário *</Label>
                <Textarea
                  value={formData.itinerario}
                  onChange={(e) =>
                    setFormData({ ...formData, itinerario: e.target.value })
                  }
                  placeholder="Descrição do trajeto (saída, paradas, destino)"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Km diário</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.kmDiario}
                  onChange={(e) =>
                    setFormData({ ...formData, kmDiario: e.target.value })
                  }
                  min={0}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Saída</Label>
                  <Input
                    type="time"
                    value={formData.horarioSaida}
                    onChange={(e) =>
                      setFormData({ ...formData, horarioSaida: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retorno</Label>
                  <Input
                    type="time"
                    value={formData.horarioRetorno}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        horarioRetorno: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Veículo</Label>
                <Select
                  value={formData.veiculoId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, veiculoId: v === "NONE" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem veículo</SelectItem>
                    {veiculos.map((veiculo) => (
                      <SelectItem key={veiculo.id} value={veiculo.id}>
                        {veiculo.placa} — {veiculo.capacidade} lugares
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Motorista</Label>
                <Select
                  value={formData.motoristaId}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      motoristaId: v === "NONE" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem motorista</SelectItem>
                    {motoristas.map((motorista) => (
                      <SelectItem key={motorista.id} value={motorista.id}>
                        {motorista.nome} (CNH {motorista.cnhCategoria})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <Label>Ativa</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createRota.isPending || updateRota.isPending}
              >
                {editingRota ? "Salvar Alterações" : "Criar Rota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
