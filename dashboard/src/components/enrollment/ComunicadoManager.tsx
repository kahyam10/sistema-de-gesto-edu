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
  Megaphone,
  Calendar,
  Users,
  Spinner,
  Star,
  Paperclip,
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
  useComunicados,
  useCreateComunicado,
  useUpdateComunicado,
  useDeleteComunicado,
  useEstatisticasComunicado,
  useEscolas,
  useTurmas,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface Comunicado {
  id: string;
  escolaId?: string;
  escola?: { nome: string };
  turmaId?: string;
  turma?: { nome: string };
  etapaId?: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  categoria?: string;
  destinatarios: string;
  anexoUrl?: string;
  dataPublicacao: string;
  dataExpiracao?: string;
  ativo: boolean;
  destaque: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ComunicadoFormData {
  escolaId?: string;
  turmaId?: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  categoria?: string;
  destinatarios: string;
  anexoUrl?: string;
  dataExpiracao?: string;
  destaque: boolean;
  ativo: boolean;
}

const initialFormData: ComunicadoFormData = {
  escolaId: "",
  turmaId: "",
  titulo: "",
  mensagem: "",
  tipo: "INFORMATIVO",
  categoria: "",
  destinatarios: "PAIS",
  anexoUrl: "",
  dataExpiracao: "",
  destaque: false,
  ativo: true,
};

const tipoComunicadoLabels = {
  INFORMATIVO: "Informativo",
  URGENTE: "Urgente",
  EVENTO: "Evento",
  AVISO: "Aviso",
  LEMBRETE: "Lembrete",
};

const destinatariosLabels = {
  TODOS: "Todos",
  PAIS: "Pais/Responsáveis",
  PROFESSORES: "Professores",
  GESTAO: "Gestão",
  TURMA: "Turma Específica",
};

const tipoColors = {
  INFORMATIVO: "bg-blue-100 text-blue-800",
  URGENTE: "bg-red-100 text-red-800",
  EVENTO: "bg-purple-100 text-purple-800",
  AVISO: "bg-yellow-100 text-yellow-800",
  LEMBRETE: "bg-green-100 text-green-800",
};

export function ComunicadoManager() {
  const { data: escolas = [] } = useEscolas();
  const { data: comunicados = [], isLoading } = useComunicados();
  const { data: estatisticas } = useEstatisticasComunicado();

  const createComunicado = useCreateComunicado();
  const updateComunicado = useUpdateComunicado();
  const deleteComunicado = useDeleteComunicado();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComunicado, setEditingComunicado] = useState<Comunicado | null>(null);
  const [formData, setFormData] = useState<ComunicadoFormData>(initialFormData);
  const [filterEscola, setFilterEscola] = useState<string>("ALL");
  const [filterTipo, setFilterTipo] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { data: turmas = [] } = useTurmas(
    formData.escolaId ? { escolaId: formData.escolaId } : undefined
  );

  const filteredComunicados = comunicados.filter((c) => {
    if (filterEscola !== "ALL" && c.escolaId !== filterEscola) return false;
    if (filterTipo !== "ALL" && c.tipo !== filterTipo) return false;
    if (filterStatus === "ATIVO" && !c.ativo) return false;
    if (filterStatus === "INATIVO" && c.ativo) return false;
    if (filterStatus === "DESTAQUE" && !c.destaque) return false;
    return true;
  });

  const handleOpenForm = (comunicado?: Comunicado) => {
    if (comunicado) {
      setEditingComunicado(comunicado);
      setFormData({
        escolaId: comunicado.escolaId || "",
        turmaId: comunicado.turmaId || "",
        titulo: comunicado.titulo,
        mensagem: comunicado.mensagem,
        tipo: comunicado.tipo,
        categoria: comunicado.categoria || "",
        destinatarios: comunicado.destinatarios,
        anexoUrl: comunicado.anexoUrl || "",
        dataExpiracao: comunicado.dataExpiracao
          ? comunicado.dataExpiracao.split("T")[0]
          : "",
        destaque: comunicado.destaque,
        ativo: comunicado.ativo,
      });
    } else {
      setEditingComunicado(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingComunicado(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.mensagem || !formData.destinatarios) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        escolaId: formData.escolaId || undefined,
        turmaId: formData.turmaId || undefined,
        categoria: formData.categoria || undefined,
        anexoUrl: formData.anexoUrl || undefined,
        dataExpiracao: formData.dataExpiracao || undefined,
      };

      if (editingComunicado) {
        await updateComunicado.mutateAsync({
          id: editingComunicado.id,
          data: dataToSubmit,
        });
      } else {
        await createComunicado.mutateAsync(dataToSubmit);
      }
      handleCloseForm();
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este comunicado?")) return;

    try {
      await deleteComunicado.mutateAsync(id);
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
              <CardTitle className="text-sm font-medium">Total de Comunicados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.ativos || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Em Destaque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.emDestaque || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {estatisticas.taxaLeituraMedia
                  ? `${estatisticas.taxaLeituraMedia.toFixed(1)}%`
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
              <CardTitle>Comunicados</CardTitle>
              <CardDescription>Gerencie os comunicados gerais</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
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
              <Label>Filtrar por Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="INFORMATIVO">Informativo</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                  <SelectItem value="EVENTO">Evento</SelectItem>
                  <SelectItem value="AVISO">Aviso</SelectItem>
                  <SelectItem value="LEMBRETE">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativos</SelectItem>
                  <SelectItem value="INATIVO">Inativos</SelectItem>
                  <SelectItem value="DESTAQUE">Em Destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Comunicados */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : filteredComunicados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum comunicado encontrado</p>
              </div>
            ) : (
              filteredComunicados.map((comunicado) => (
                <Card key={comunicado.id} className={comunicado.destaque ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{comunicado.titulo}</h3>
                          <Badge className={tipoColors[comunicado.tipo as keyof typeof tipoColors]}>
                            {tipoComunicadoLabels[comunicado.tipo as keyof typeof tipoComunicadoLabels]}
                          </Badge>
                          {comunicado.destaque && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {!comunicado.ativo && <Badge variant="secondary">Inativo</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {comunicado.mensagem}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {destinatariosLabels[comunicado.destinatarios as keyof typeof destinatariosLabels]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(comunicado.dataPublicacao).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {comunicado.anexoUrl && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4" />
                              <span>Anexo</span>
                            </div>
                          )}
                          {comunicado.escola && (
                            <span>{comunicado.escola.nome}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(comunicado)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(comunicado.id)}
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
              {editingComunicado ? "Editar Comunicado" : "Novo Comunicado"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do comunicado
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
                placeholder="Digite o título do comunicado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea
                id="mensagem"
                value={formData.mensagem}
                onChange={(e) =>
                  setFormData({ ...formData, mensagem: e.target.value })
                }
                rows={5}
                placeholder="Digite a mensagem do comunicado"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="INFORMATIVO">Informativo</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="EVENTO">Evento</SelectItem>
                    <SelectItem value="AVISO">Aviso</SelectItem>
                    <SelectItem value="LEMBRETE">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatarios">Destinatários *</Label>
                <Select
                  value={formData.destinatarios}
                  onValueChange={(value) =>
                    setFormData({ ...formData, destinatarios: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="PAIS">Pais/Responsáveis</SelectItem>
                    <SelectItem value="PROFESSORES">Professores</SelectItem>
                    <SelectItem value="GESTAO">Gestão</SelectItem>
                    <SelectItem value="TURMA">Turma Específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="escolaId">Escola</Label>
                <Select
                  value={formData.escolaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, escolaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
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
                <Label htmlFor="turmaId">Turma</Label>
                <Select
                  value={formData.turmaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, turmaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria: e.target.value })
                  }
                  placeholder="Ex: Acadêmico, Administrativo..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataExpiracao">Data de Expiração</Label>
                <Input
                  id="dataExpiracao"
                  type="date"
                  value={formData.dataExpiracao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataExpiracao: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anexoUrl">URL do Anexo</Label>
              <Input
                id="anexoUrl"
                type="url"
                value={formData.anexoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, anexoUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="destaque"
                  checked={formData.destaque}
                  onChange={(e) =>
                    setFormData({ ...formData, destaque: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="destaque">Destacar</Label>
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createComunicado.isPending || updateComunicado.isPending}
              >
                {(createComunicado.isPending || updateComunicado.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingComunicado ? "Atualizar" : "Publicar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
