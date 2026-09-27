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
  Flag,
  Buildings,
  Spinner,
  Medal,
  ListChecks,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  useGremios,
  useGremio,
  useCreateGremio,
  useUpdateGremio,
  useDeleteGremio,
  useAddChapaGremio,
  useDeleteChapaGremio,
  useApurarEleicao,
  useAddAtividadeGremio,
  useUpdateAtividadeGremio,
  useDeleteAtividadeGremio,
} from "@/hooks/useDemocratica";
import { useEscolas } from "@/hooks/useApi";
import {
  type GremioEstudantil,
  type AtividadeGremio,
} from "@/lib/api-democratica";
import { toast } from "sonner";

const statusGremioLabels: Record<GremioEstudantil["status"], string> = {
  EM_ELEICAO: "Em Eleição",
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

const statusGremioColors: Record<GremioEstudantil["status"], string> = {
  EM_ELEICAO: "bg-yellow-100 text-yellow-800",
  ATIVO: "bg-green-100 text-green-800",
  INATIVO: "bg-gray-100 text-gray-800",
};

const tipoAtividadeLabels: Record<AtividadeGremio["tipo"], string> = {
  PROJETO: "Projeto",
  EVENTO: "Evento",
  CAMPANHA: "Campanha",
  REUNIAO: "Reunião",
  OUTRA: "Outra",
};

const statusAtividadeLabels: Record<AtividadeGremio["status"], string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

interface GremioFormData {
  nome: string;
  escolaId: string;
  anoLetivo: string;
  status: GremioEstudantil["status"];
  dataFundacao: string;
}

const initialFormData: GremioFormData = {
  nome: "",
  escolaId: "",
  anoLetivo: new Date().getFullYear().toString(),
  status: "EM_ELEICAO",
  dataFundacao: "",
};

export function GremioManager() {
  const { data: escolas = [] } = useEscolas();
  const [filterEscola, setFilterEscola] = useState<string>("ALL");

  const { data: gremios = [], isLoading } = useGremios(
    filterEscola !== "ALL" ? { escolaId: filterEscola } : undefined
  );

  const createGremio = useCreateGremio();
  const updateGremio = useUpdateGremio();
  const deleteGremio = useDeleteGremio();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGremio, setEditingGremio] = useState<GremioEstudantil | null>(null);
  const [formData, setFormData] = useState<GremioFormData>(initialFormData);
  const [selectedGremio, setSelectedGremio] = useState<GremioEstudantil | null>(null);

  const handleOpenForm = (gremio?: GremioEstudantil) => {
    if (gremio) {
      setEditingGremio(gremio);
      setFormData({
        nome: gremio.nome,
        escolaId: gremio.escolaId,
        anoLetivo: gremio.anoLetivo.toString(),
        status: gremio.status,
        dataFundacao: gremio.dataFundacao ? gremio.dataFundacao.split("T")[0] : "",
      });
    } else {
      setEditingGremio(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGremio(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.escolaId || !formData.anoLetivo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingGremio) {
        await updateGremio.mutateAsync({
          id: editingGremio.id,
          data: {
            nome: formData.nome,
            anoLetivo: parseInt(formData.anoLetivo),
            status: formData.status,
            dataFundacao: formData.dataFundacao || undefined,
          },
        });
      } else {
        await createGremio.mutateAsync({
          nome: formData.nome,
          escolaId: formData.escolaId,
          anoLetivo: parseInt(formData.anoLetivo),
          status: formData.status,
          dataFundacao: formData.dataFundacao || undefined,
        });
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este grêmio?")) return;

    try {
      await deleteGremio.mutateAsync(id);
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
              <CardTitle>Grêmio Estudantil</CardTitle>
              <CardDescription>
                Grêmios por escola/ano letivo, chapas concorrentes e atividades
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grêmio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 max-w-sm">
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
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : gremios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum grêmio cadastrado</p>
              </div>
            ) : (
              gremios.map((gremio) => (
                <Card key={gremio.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{gremio.nome}</h3>
                          <Badge className={statusGremioColors[gremio.status]}>
                            {statusGremioLabels[gremio.status]}
                          </Badge>
                          <Badge variant="outline">{gremio.anoLetivo}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Buildings className="h-4 w-4 text-muted-foreground" />
                            <span>{gremio.escola?.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ListChecks className="h-4 w-4" />
                            <span>
                              {gremio._count?.chapas ?? 0} chapa(s) •{" "}
                              {gremio._count?.atividades ?? 0} atividade(s)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedGremio(gremio)}
                          title="Chapas, eleição e atividades"
                        >
                          <Medal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(gremio)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(gremio.id)}
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

      {/* Dialog de formulário do grêmio */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGremio ? "Editar Grêmio" : "Novo Grêmio"}
            </DialogTitle>
            <DialogDescription>
              Um grêmio por escola por ano letivo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Grêmio Estudantil Paulo Freire"
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
                  disabled={!!editingGremio}
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
                <Label htmlFor="anoLetivo">Ano Letivo *</Label>
                <Input
                  id="anoLetivo"
                  type="number"
                  min={2020}
                  max={2100}
                  value={formData.anoLetivo}
                  onChange={(e) =>
                    setFormData({ ...formData, anoLetivo: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as GremioEstudantil["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusGremioLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFundacao">Data de Fundação</Label>
                <Input
                  id="dataFundacao"
                  type="date"
                  value={formData.dataFundacao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataFundacao: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createGremio.isPending || updateGremio.isPending}
              >
                {(createGremio.isPending || updateGremio.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingGremio ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhe: chapas + eleição + atividades */}
      {selectedGremio && (
        <GremioDetalheDialog
          gremio={selectedGremio}
          onClose={() => setSelectedGremio(null)}
        />
      )}
    </div>
  );
}

interface GremioDetalheDialogProps {
  gremio: GremioEstudantil;
  onClose: () => void;
}

function GremioDetalheDialog({ gremio, onClose }: GremioDetalheDialogProps) {
  const { data: detalhe, isLoading } = useGremio(gremio.id);
  const addChapa = useAddChapaGremio();
  const deleteChapa = useDeleteChapaGremio();
  const apurarEleicao = useApurarEleicao();
  const addAtividade = useAddAtividadeGremio();
  const updateAtividade = useUpdateAtividadeGremio();
  const deleteAtividade = useDeleteAtividadeGremio();

  const chapas = detalhe?.chapas ?? [];
  const atividades = detalhe?.atividades ?? [];
  const temChapaEleita = chapas.some((c) => c.eleita);

  // Form de chapa
  const [chapaNome, setChapaNome] = useState("");
  const [chapaNumero, setChapaNumero] = useState("");

  // Dialog de apuração
  const [isApuracaoOpen, setIsApuracaoOpen] = useState(false);
  const [votos, setVotos] = useState<Record<string, string>>({});

  // Form de atividade
  const [atividadeTitulo, setAtividadeTitulo] = useState("");
  const [atividadeTipo, setAtividadeTipo] =
    useState<AtividadeGremio["tipo"]>("PROJETO");
  const [atividadeDescricao, setAtividadeDescricao] = useState("");
  const [atividadeDataInicio, setAtividadeDataInicio] = useState("");

  const handleAddChapa = async () => {
    if (!chapaNome || !chapaNumero) {
      toast.error("Informe nome e número da chapa");
      return;
    }

    try {
      await addChapa.mutateAsync({
        gremioId: gremio.id,
        data: { nome: chapaNome, numero: parseInt(chapaNumero) },
      });
      setChapaNome("");
      setChapaNumero("");
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDeleteChapa = async (chapaId: string) => {
    if (!window.confirm("Remover esta chapa?")) return;

    try {
      await deleteChapa.mutateAsync({ chapaId, gremioId: gremio.id });
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleOpenApuracao = () => {
    const iniciais: Record<string, string> = {};
    chapas.forEach((c) => {
      iniciais[c.id] = c.votosRecebidos?.toString() ?? "";
    });
    setVotos(iniciais);
    setIsApuracaoOpen(true);
  };

  const handleApurar = async () => {
    const resultados = chapas.map((c) => ({
      chapaId: c.id,
      votosRecebidos: parseInt(votos[c.id] || "0"),
    }));

    if (resultados.some((r) => isNaN(r.votosRecebidos) || r.votosRecebidos < 0)) {
      toast.error("Informe a quantidade de votos de cada chapa");
      return;
    }

    try {
      await apurarEleicao.mutateAsync({ id: gremio.id, resultados });
      setIsApuracaoOpen(false);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleAddAtividade = async () => {
    if (!atividadeTitulo || !atividadeDataInicio) {
      toast.error("Informe título e data de início da atividade");
      return;
    }

    try {
      await addAtividade.mutateAsync({
        gremioId: gremio.id,
        data: {
          titulo: atividadeTitulo,
          tipo: atividadeTipo,
          descricao: atividadeDescricao || undefined,
          dataInicio: atividadeDataInicio,
        },
      });
      setAtividadeTitulo("");
      setAtividadeDescricao("");
      setAtividadeDataInicio("");
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleConcluirAtividade = async (atividade: AtividadeGremio) => {
    try {
      await updateAtividade.mutateAsync({
        atividadeId: atividade.id,
        gremioId: gremio.id,
        data: { status: "CONCLUIDA" },
      });
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDeleteAtividade = async (atividadeId: string) => {
    if (!window.confirm("Remover esta atividade?")) return;

    try {
      await deleteAtividade.mutateAsync({ atividadeId, gremioId: gremio.id });
    } catch {
      // Erro já tratado pelo hook
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {gremio.nome} ({gremio.anoLetivo})
          </DialogTitle>
          <DialogDescription>{gremio.escola?.nome}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-6">
            {/* Chapas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Chapas ({chapas.length})
                  </CardTitle>
                  {chapas.length > 0 && !temChapaEleita && (
                    <Button size="sm" onClick={handleOpenApuracao}>
                      <Medal className="h-4 w-4 mr-2" />
                      Apurar Eleição
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {chapas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma chapa cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {chapas.map((chapa) => (
                      <div
                        key={chapa.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Nº {chapa.numero}</Badge>
                          <span className="font-medium">{chapa.nome}</span>
                          {chapa.eleita && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Eleita
                            </Badge>
                          )}
                          {chapa.votosRecebidos != null && (
                            <span className="text-sm text-muted-foreground">
                              {chapa.votosRecebidos} voto(s)
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteChapa(chapa.id)}
                          aria-label="Excluir"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Nome da chapa</Label>
                    <Input
                      value={chapaNome}
                      onChange={(e) => setChapaNome(e.target.value)}
                      placeholder="Ex: Chapa Juventude Ativa"
                    />
                  </div>
                  <div className="w-28 space-y-2">
                    <Label>Número</Label>
                    <Input
                      type="number"
                      min={1}
                      value={chapaNumero}
                      onChange={(e) => setChapaNumero(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddChapa} disabled={addChapa.isPending}>
                    {addChapa.isPending ? (
                      <Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Atividades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Atividades ({atividades.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {atividades.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma atividade registrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {atividades.map((atividade) => (
                      <div
                        key={atividade.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="font-medium">{atividade.titulo}</p>
                          <div className="flex gap-2 mt-1 items-center text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {tipoAtividadeLabels[atividade.tipo]}
                            </Badge>
                            <Badge variant="secondary">
                              {statusAtividadeLabels[atividade.status]}
                            </Badge>
                            <span>
                              {new Date(atividade.dataInicio).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {atividade.status !== "CONCLUIDA" &&
                            atividade.status !== "CANCELADA" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Marcar como concluída"
                                onClick={() => handleConcluirAtividade(atividade)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAtividade(atividade.id)}
                            aria-label="Excluir"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={atividadeTitulo}
                        onChange={(e) => setAtividadeTitulo(e.target.value)}
                        placeholder="Ex: Campanha do Agasalho"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={atividadeTipo}
                        onValueChange={(value) =>
                          setAtividadeTipo(value as AtividadeGremio["tipo"])
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(tipoAtividadeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Data de início</Label>
                      <Input
                        type="date"
                        value={atividadeDataInicio}
                        onChange={(e) => setAtividadeDataInicio(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        rows={1}
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddAtividade}
                    disabled={addAtividade.isPending}
                    className="w-full"
                  >
                    {addAtividade.isPending && (
                      <Spinner className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Adicionar Atividade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog de apuração */}
        <Dialog open={isApuracaoOpen} onOpenChange={setIsApuracaoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apurar Eleição</DialogTitle>
              <DialogDescription>
                Informe os votos recebidos por cada chapa. A mais votada será
                marcada como eleita e o grêmio ficará ativo. Esta operação não
                pode ser repetida.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {chapas.map((chapa) => (
                <div key={chapa.id} className="flex items-center gap-3">
                  <Badge variant="outline" className="shrink-0">
                    Nº {chapa.numero}
                  </Badge>
                  <span className="flex-1 text-sm">{chapa.nome}</span>
                  <Input
                    type="number"
                    min={0}
                    className="w-28"
                    value={votos[chapa.id] ?? ""}
                    onChange={(e) =>
                      setVotos({ ...votos, [chapa.id]: e.target.value })
                    }
                    placeholder="Votos"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsApuracaoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApurar} disabled={apurarEleicao.isPending}>
                {apurarEleicao.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirmar Apuração
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
