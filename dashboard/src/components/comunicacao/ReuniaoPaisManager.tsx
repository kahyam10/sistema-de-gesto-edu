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
  UserList,
  FileText,
  CheckCircle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useReunioesPais,
  useCreateReuniaoPais,
  useUpdateReuniaoPais,
  useDeleteReuniaoPais,
  usePresencasReuniao,
  useRegistrarPresencaReuniao,
  useDeletePresencaReuniao,
  useEstatisticasReuniaoPais,
  useEscolas,
  useTurmas,
  useTurma,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface ReuniaoPais {
  id: string;
  escolaId: string;
  escola?: { nome: string };
  turmaId?: string;
  turma?: { nome: string };
  titulo: string;
  data: string;
  horario: string;
  tipo: string;
  pauta?: string;
  ata?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ReuniaoFormData {
  escolaId: string;
  turmaId?: string;
  titulo: string;
  data: string;
  horario: string;
  tipo: string;
  pauta?: string;
  ata?: string;
}

const initialFormData: ReuniaoFormData = {
  escolaId: "",
  turmaId: "",
  titulo: "",
  data: "",
  horario: "",
  tipo: "ORDINARIA",
  pauta: "",
  ata: "",
};

const tipoReuniaoLabels = {
  ORDINARIA: "Ordinária",
  EXTRAORDINARIA: "Extraordinária",
  ENTREGA_BOLETINS: "Entrega de Boletins",
  COLETIVA: "Coletiva",
};

const statusLabels = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

const statusColors = {
  AGENDADA: "bg-blue-100 text-blue-800",
  REALIZADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export function ReuniaoPaisManager() {
  const { data: escolas = [] } = useEscolas();
  const { data: reunioes = [], isLoading } = useReunioesPais();
  const { data: estatisticas } = useEstatisticasReuniaoPais();

  const createReuniao = useCreateReuniaoPais();
  const updateReuniao = useUpdateReuniaoPais();
  const deleteReuniao = useDeleteReuniaoPais();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<ReuniaoPais | null>(null);
  const [formData, setFormData] = useState<ReuniaoFormData>(initialFormData);
  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedReuniao, setSelectedReuniao] = useState<ReuniaoPais | null>(null);

  const { data: turmas = [] } = useTurmas(
    formData.escolaId ? { escolaId: formData.escolaId } : undefined
  );

  const filteredReunioes = reunioes.filter((r) => {
    if (filterEscola !== "ALL" && r.escolaId !== filterEscola) return false;
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    return true;
  });

  const handleOpenForm = (reuniao?: ReuniaoPais) => {
    if (reuniao) {
      setEditingReuniao(reuniao);
      setFormData({
        escolaId: reuniao.escolaId,
        turmaId: reuniao.turmaId || "",
        titulo: reuniao.titulo,
        data: reuniao.data.split("T")[0],
        horario: reuniao.horario,
        tipo: reuniao.tipo,
        pauta: reuniao.pauta || "",
        ata: reuniao.ata || "",
      });
    } else {
      setEditingReuniao(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReuniao(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.escolaId || !formData.titulo || !formData.data || !formData.horario) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        turmaId: formData.turmaId || undefined,
        pauta: formData.pauta || undefined,
        ata: formData.ata || undefined,
        status: "AGENDADA",
      };

      if (editingReuniao) {
        await updateReuniao.mutateAsync({
          id: editingReuniao.id,
          data: dataToSubmit,
        });
      } else {
        await createReuniao.mutateAsync(dataToSubmit);
      }
      handleCloseForm();
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reunião?")) return;

    try {
      await deleteReuniao.mutateAsync(id);
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
              <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.porStatus?.AGENDADA || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.porStatus?.REALIZADA || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {estatisticas.taxaPresencaMedia
                  ? `${estatisticas.taxaPresencaMedia.toFixed(1)}%`
                  : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reuniões de Pais</CardTitle>
              <CardDescription>Gerencie as reuniões de pais e responsáveis</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reunião
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
              <Label>Filtrar por Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="AGENDADA">Agendada</SelectItem>
                  <SelectItem value="REALIZADA">Realizada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Reuniões */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : filteredReunioes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma reunião encontrada</p>
              </div>
            ) : (
              filteredReunioes.map((reuniao) => (
                <Card key={reuniao.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{reuniao.titulo}</h3>
                          <Badge className={statusColors[reuniao.status as keyof typeof statusColors]}>
                            {statusLabels[reuniao.status as keyof typeof statusLabels]}
                          </Badge>
                          <Badge variant="outline">
                            {tipoReuniaoLabels[reuniao.tipo as keyof typeof tipoReuniaoLabels]}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{reuniao.escola?.nome}</span>
                            {reuniao.turma && <span className="text-muted-foreground">• {reuniao.turma.nome}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(reuniao.data).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{reuniao.horario}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedReuniao(reuniao)}
                          title="Gerenciar presenças"
                        >
                          <UserList className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(reuniao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reuniao.id)}
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
              {editingReuniao ? "Editar Reunião" : "Nova Reunião"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da reunião de pais
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Ex: Reunião do 1º Bimestre"
                required
              />
            </div>

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
                    <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                    <SelectItem value="EXTRAORDINARIA">Extraordinária</SelectItem>
                    <SelectItem value="ENTREGA_BOLETINS">Entrega de Boletins</SelectItem>
                    <SelectItem value="COLETIVA">Coletiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="turmaId">Turma (opcional)</Label>
              <Select
                value={formData.turmaId}
                onValueChange={(value) =>
                  setFormData({ ...formData, turmaId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma (opcional)" />
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="horario">Horário *</Label>
                <Input
                  id="horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e) =>
                    setFormData({ ...formData, horario: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pauta">Pauta</Label>
              <Textarea
                id="pauta"
                value={formData.pauta}
                onChange={(e) =>
                  setFormData({ ...formData, pauta: e.target.value })
                }
                rows={3}
                placeholder="Descreva os assuntos que serão tratados..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ata">Ata</Label>
              <Textarea
                id="ata"
                value={formData.ata}
                onChange={(e) =>
                  setFormData({ ...formData, ata: e.target.value })
                }
                rows={3}
                placeholder="Registre o que foi discutido e decidido..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createReuniao.isPending || updateReuniao.isPending}
              >
                {(createReuniao.isPending || updateReuniao.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingReuniao ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Presenças */}
      {selectedReuniao && (
        <PresencasDialog
          reuniao={selectedReuniao}
          onClose={() => setSelectedReuniao(null)}
        />
      )}
    </div>
  );
}

interface PresencasDialogProps {
  reuniao: ReuniaoPais;
  onClose: () => void;
}

function PresencasDialog({ reuniao, onClose }: PresencasDialogProps) {
  const { data: presencas = [], isLoading } = usePresencasReuniao(reuniao.id);
  const { data: turma } = useTurma(reuniao.turmaId || "");
  const registrarPresenca = useRegistrarPresencaReuniao();
  const deletePresenca = useDeletePresencaReuniao();

  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [matriculaId, setMatriculaId] = useState("");
  const [presente, setPresente] = useState(true);
  const [observacoes, setObservacoes] = useState("");

  const handleRegistrarPresenca = async () => {
    if (!matriculaId || !nomeResponsavel) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await registrarPresenca.mutateAsync({
        reuniaoId: reuniao.id,
        matriculaId,
        nomeResponsavel,
        presente,
        observacoes: observacoes || undefined,
      });
      setMatriculaId("");
      setNomeResponsavel("");
      setPresente(true);
      setObservacoes("");
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Presenças - {reuniao.titulo}</DialogTitle>
          <DialogDescription>
            {new Date(reuniao.data).toLocaleDateString("pt-BR")} às {reuniao.horario}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar Presença</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {turma && turma.matriculas && turma.matriculas.length > 0 && (
                <div className="space-y-2">
                  <Label>Aluno</Label>
                  <Select value={matriculaId} onValueChange={setMatriculaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {turma.matriculas.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nomeAluno}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nome do Responsável *</Label>
                <Input
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Nome completo do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="presente"
                  checked={presente}
                  onChange={(e) => setPresente(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="presente">Presente</Label>
              </div>

              <Button
                onClick={handleRegistrarPresenca}
                disabled={registrarPresenca.isPending}
                className="w-full"
              >
                {registrarPresenca.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Registrar Presença
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Presenças */}
          <div className="space-y-2">
            <h3 className="font-semibold">Presenças Registradas ({presencas.length})</h3>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : presencas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma presença registrada ainda
              </p>
            ) : (
              <div className="space-y-2">
                {presencas.map((p: any) => (
                  <Card key={p.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {p.presente ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{p.nomeResponsavel}</p>
                          {p.observacoes && (
                            <p className="text-sm text-muted-foreground">{p.observacoes}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deletePresenca.mutateAsync({ id: p.id, reuniaoId: reuniao.id })
                        }
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
