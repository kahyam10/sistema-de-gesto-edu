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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash,
  CalendarBlank,
  Clock,
  Buildings,
  Spinner,
  FileText,
  XCircle,
  UsersThree,
} from "@phosphor-icons/react";
import {
  useReunioesDemocraticas,
  useCreateReuniaoDemocratica,
  useUpdateReuniaoDemocratica,
  useDeleteReuniaoDemocratica,
  useRegistrarAta,
  useCancelarReuniaoDemocratica,
} from "@/hooks/useDemocratica";
import { useEscolas } from "@/hooks/useApi";
import {
  type ReuniaoDemocratica,
  type SegmentoDemocratico,
} from "@/lib/api-democratica";
import { toast } from "sonner";

const orgaoLabels: Record<ReuniaoDemocratica["orgao"], string> = {
  COLEGIADO: "Colegiado",
  GREMIO: "Grêmio",
  ASSEMBLEIA_GERAL: "Assembleia Geral",
  OUTRO: "Outro",
};

const statusLabels: Record<ReuniaoDemocratica["status"], string> = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

const statusColors: Record<ReuniaoDemocratica["status"], string> = {
  AGENDADA: "bg-blue-100 text-blue-800",
  REALIZADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const segmentoLabels: Record<SegmentoDemocratico, string> = {
  PROFESSOR: "Professor",
  PAI_RESPONSAVEL: "Pai/Responsável",
  ALUNO: "Aluno",
  FUNCIONARIO: "Funcionário",
  COMUNIDADE: "Comunidade",
  DIRECAO: "Direção",
};

interface ReuniaoFormData {
  titulo: string;
  orgao: ReuniaoDemocratica["orgao"];
  data: string;
  horario: string;
  local: string;
  escolaId: string;
}

const initialFormData: ReuniaoFormData = {
  titulo: "",
  orgao: "COLEGIADO",
  data: "",
  horario: "",
  local: "",
  escolaId: "",
};

interface PresencaForm {
  nome: string;
  segmento: SegmentoDemocratico;
  presente: boolean;
}

interface DecisaoForm {
  descricao: string;
}

export function ReuniaoDemocraticaManager() {
  const { data: escolas = [] } = useEscolas();
  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filters: { escolaId?: string; status?: string } = {};
  if (filterEscola !== "ALL") filters.escolaId = filterEscola;
  if (filterStatus !== "ALL") filters.status = filterStatus;

  const { data: reunioes = [], isLoading } = useReunioesDemocraticas(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const createReuniao = useCreateReuniaoDemocratica();
  const updateReuniao = useUpdateReuniaoDemocratica();
  const deleteReuniao = useDeleteReuniaoDemocratica();
  const cancelarReuniao = useCancelarReuniaoDemocratica();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<ReuniaoDemocratica | null>(null);
  const [formData, setFormData] = useState<ReuniaoFormData>(initialFormData);
  const [ataReuniao, setAtaReuniao] = useState<ReuniaoDemocratica | null>(null);

  const handleOpenForm = (reuniao?: ReuniaoDemocratica) => {
    if (reuniao) {
      setEditingReuniao(reuniao);
      setFormData({
        titulo: reuniao.titulo,
        orgao: reuniao.orgao,
        data: reuniao.data.split("T")[0],
        horario: reuniao.horario,
        local: reuniao.local || "",
        escolaId: reuniao.escolaId,
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

    if (!formData.titulo || !formData.escolaId || !formData.data || !formData.horario) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const payload = {
        titulo: formData.titulo,
        orgao: formData.orgao,
        data: formData.data,
        horario: formData.horario,
        local: formData.local || undefined,
        escolaId: formData.escolaId,
      };

      if (editingReuniao) {
        await updateReuniao.mutateAsync({ id: editingReuniao.id, data: payload });
      } else {
        await createReuniao.mutateAsync(payload);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta reunião?")) return;

    try {
      await deleteReuniao.mutateAsync(id);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleCancelar = async (id: string) => {
    if (
      !window.confirm(
        "Cancelar esta reunião? Reuniões canceladas não podem mais ser alteradas."
      )
    )
      return;

    try {
      await cancelarReuniao.mutateAsync(id);
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
              <CardTitle>Reuniões e Assembleias</CardTitle>
              <CardDescription>
                Reuniões do colegiado, do grêmio e assembleias gerais com ata e
                presenças
              </CardDescription>
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

          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : reunioes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UsersThree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma reunião encontrada</p>
              </div>
            ) : (
              reunioes.map((reuniao) => (
                <Card key={reuniao.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">{reuniao.titulo}</h3>
                          <Badge className={statusColors[reuniao.status]}>
                            {statusLabels[reuniao.status]}
                          </Badge>
                          <Badge variant="outline">
                            {orgaoLabels[reuniao.orgao]}
                          </Badge>
                          {(reuniao._count?.presencas ?? 0) > 0 && (
                            <Badge variant="secondary">
                              {reuniao._count?.presencas} presença(s)
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Buildings className="h-4 w-4 text-muted-foreground" />
                            <span>{reuniao.escola?.nome}</span>
                            {reuniao.local && (
                              <span className="text-muted-foreground">
                                • {reuniao.local}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarBlank className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(reuniao.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{reuniao.horario}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {reuniao.status !== "CANCELADA" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setAtaReuniao(reuniao)}
                              title="Registrar ata"
                            >
                              <FileText className="h-4 w-4" />
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
                              onClick={() => handleCancelar(reuniao.id)}
                              title="Cancelar reunião"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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

      {/* Dialog de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReuniao ? "Editar Reunião" : "Nova Reunião"}
            </DialogTitle>
            <DialogDescription>
              Agende uma reunião ou assembleia da gestão democrática
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
                placeholder="Ex: Assembleia Geral de Pais"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Escola *</Label>
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
                <Label>Órgão *</Label>
                <Select
                  value={formData.orgao}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      orgao: value as ReuniaoDemocratica["orgao"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orgaoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  value={formData.local}
                  onChange={(e) =>
                    setFormData({ ...formData, local: e.target.value })
                  }
                  placeholder="Ex: Auditório"
                />
              </div>
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
                {editingReuniao ? "Atualizar" : "Agendar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de ata */}
      {ataReuniao && (
        <RegistrarAtaDialog
          reuniao={ataReuniao}
          onClose={() => setAtaReuniao(null)}
        />
      )}
    </div>
  );
}

interface RegistrarAtaDialogProps {
  reuniao: ReuniaoDemocratica;
  onClose: () => void;
}

function RegistrarAtaDialog({ reuniao, onClose }: RegistrarAtaDialogProps) {
  const registrarAta = useRegistrarAta();

  const [ata, setAta] = useState(reuniao.ata || "");
  const [decisoes, setDecisoes] = useState<DecisaoForm[]>(
    reuniao.decisoes?.map((d) => ({ descricao: d.descricao })) ?? []
  );
  const [presencas, setPresencas] = useState<PresencaForm[]>(
    reuniao.presencas?.map((p) => ({
      nome: p.nome,
      segmento: p.segmento ?? "COMUNIDADE",
      presente: p.presente,
    })) ?? []
  );

  const handleSubmit = async () => {
    if (!ata || ata.trim().length < 10) {
      toast.error("A ata deve ter no mínimo 10 caracteres");
      return;
    }

    try {
      await registrarAta.mutateAsync({
        id: reuniao.id,
        data: {
          ata,
          decisoes: decisoes
            .filter((d) => d.descricao.trim())
            .map((d) => ({ descricao: d.descricao })),
          presencas: presencas
            .filter((p) => p.nome.trim())
            .map((p) => ({
              nome: p.nome,
              segmento: p.segmento,
              presente: p.presente,
            })),
        },
      });
      onClose();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Ata — {reuniao.titulo}</DialogTitle>
          <DialogDescription>
            {new Date(reuniao.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })} às{" "}
            {reuniao.horario}. Ao salvar, a reunião é marcada como REALIZADA e
            as presenças enviadas substituem as anteriores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ata">Ata *</Label>
            <Textarea
              id="ata"
              rows={6}
              value={ata}
              onChange={(e) => setAta(e.target.value)}
              placeholder="Registre o que foi discutido e deliberado..."
            />
          </div>

          {/* Decisões */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Decisões</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDecisoes([...decisoes, { descricao: "" }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar decisão
              </Button>
            </div>
            {decisoes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma decisão registrada
              </p>
            )}
            {decisoes.map((decisao, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={decisao.descricao}
                  onChange={(e) => {
                    const novas = [...decisoes];
                    novas[index] = { descricao: e.target.value };
                    setDecisoes(novas);
                  }}
                  placeholder="Descrição da decisão"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDecisoes(decisoes.filter((_, i) => i !== index))
                  }
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Presenças */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Presenças</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPresencas([
                    ...presencas,
                    { nome: "", segmento: "COMUNIDADE", presente: true },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar presença
              </Button>
            </div>
            {presencas.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma presença registrada
              </p>
            )}
            {presencas.map((presenca, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  className="flex-1"
                  value={presenca.nome}
                  onChange={(e) => {
                    const novas = [...presencas];
                    novas[index] = { ...presenca, nome: e.target.value };
                    setPresencas(novas);
                  }}
                  placeholder="Nome do participante"
                />
                <Select
                  value={presenca.segmento}
                  onValueChange={(value) => {
                    const novas = [...presencas];
                    novas[index] = {
                      ...presenca,
                      segmento: value as SegmentoDemocratico,
                    };
                    setPresencas(novas);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(segmentoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={presenca.presente}
                    onChange={(e) => {
                      const novas = [...presencas];
                      novas[index] = { ...presenca, presente: e.target.checked };
                      setPresencas(novas);
                    }}
                    className="h-4 w-4"
                  />
                  Presente
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setPresencas(presencas.filter((_, i) => i !== index))
                  }
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={registrarAta.isPending}>
              {registrarAta.isPending && (
                <Spinner className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar Ata
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
