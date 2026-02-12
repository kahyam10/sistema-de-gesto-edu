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
  Bell,
  Envelope,
  DeviceMobile,
  CheckCircle,
  Spinner,
  Warning,
  Info,
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
  useNotificacoes,
  useCreateNotificacao,
  useDeleteNotificacao,
  useMarcarNotificacaoLida,
  useMarcarTodasNotificacoesLidas,
  useEstatisticasNotificacao,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface Notificacao {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  canais: string;
  lida: boolean;
  enviadaEmail: boolean;
  enviadaSMS: boolean;
  enviadaPush: boolean;
  dataLeitura?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificacaoFormData {
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  canais: string[];
}

const initialFormData: NotificacaoFormData = {
  userId: "",
  titulo: "",
  mensagem: "",
  tipo: "INFORMACAO",
  prioridade: "NORMAL",
  canais: ["APP"],
};

const tipoNotificacaoLabels = {
  INFORMACAO: "Informação",
  ALERTA: "Alerta",
  URGENTE: "Urgente",
  ACADEMICO: "Acadêmico",
  FINANCEIRO: "Financeiro",
  LEMBRETE: "Lembrete",
};

const prioridadeLabels = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const prioridadeColors = {
  BAIXA: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  ALTA: "bg-orange-100 text-orange-800",
  CRITICA: "bg-red-100 text-red-800",
};

const tipoIcons = {
  INFORMACAO: Info,
  ALERTA: Warning,
  URGENTE: Warning,
  ACADEMICO: Bell,
  FINANCEIRO: Bell,
  LEMBRETE: Bell,
};

export function NotificacaoManager() {
  const { data: notificacoes = [], isLoading } = useNotificacoes();
  const { data: estatisticas } = useEstatisticasNotificacao();

  const createNotificacao = useCreateNotificacao();
  const deleteNotificacao = useDeleteNotificacao();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodasLidas = useMarcarTodasNotificacoesLidas();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<NotificacaoFormData>(initialFormData);
  const [filterTipo, setFilterTipo] = useState<string>("ALL");
  const [filterPrioridade, setFilterPrioridade] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredNotificacoes = notificacoes.filter((n) => {
    if (filterTipo !== "ALL" && n.tipo !== filterTipo) return false;
    if (filterPrioridade !== "ALL" && n.prioridade !== filterPrioridade) return false;
    if (filterStatus === "LIDA" && !n.lida) return false;
    if (filterStatus === "NAO_LIDA" && n.lida) return false;
    return true;
  });

  const handleOpenForm = () => {
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.titulo || !formData.mensagem || formData.canais.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createNotificacao.mutateAsync({
        ...formData,
        canais: JSON.stringify(formData.canais),
      });
      handleCloseForm();
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta notificação?")) return;

    try {
      await deleteNotificacao.mutateAsync(id);
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const handleMarcarLida = async (id: string) => {
    try {
      await marcarLida.mutateAsync(id);
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const toggleCanal = (canal: string) => {
    setFormData((prev) => ({
      ...prev,
      canais: prev.canais.includes(canal)
        ? prev.canais.filter((c) => c !== canal)
        : [...prev.canais, canal],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estatisticas.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{estatisticas.naoLidas || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{estatisticas.lidas || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {estatisticas.total > 0
                  ? `${((estatisticas.lidas / estatisticas.total) * 100).toFixed(1)}%`
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
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Gerencie as notificações do sistema</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Marcar todas as notificações como lidas?")) {
                    // Precisaria do userId aqui
                    toast.info("Funcionalidade requer userId");
                  }
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar Todas Lidas
              </Button>
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label>Filtrar por Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="INFORMACAO">Informação</SelectItem>
                  <SelectItem value="ALERTA">Alerta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                  <SelectItem value="ACADEMICO">Acadêmico</SelectItem>
                  <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                  <SelectItem value="LEMBRETE">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filtrar por Prioridade</Label>
              <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
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
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="NAO_LIDA">Não Lidas</SelectItem>
                  <SelectItem value="LIDA">Lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : filteredNotificacoes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação encontrada</p>
              </div>
            ) : (
              filteredNotificacoes.map((notificacao) => {
                const TipoIcon = tipoIcons[notificacao.tipo as keyof typeof tipoIcons] || Bell;

                return (
                  <Card
                    key={notificacao.id}
                    className={!notificacao.lida ? "border-l-4 border-l-blue-500" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 flex-1">
                          <div className="mt-1">
                            <TipoIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${!notificacao.lida ? "text-blue-600" : ""}`}>
                                {notificacao.titulo}
                              </h3>
                              <Badge className={prioridadeColors[notificacao.prioridade as keyof typeof prioridadeColors]}>
                                {prioridadeLabels[notificacao.prioridade as keyof typeof prioridadeLabels]}
                              </Badge>
                              <Badge variant="outline">
                                {tipoNotificacaoLabels[notificacao.tipo as keyof typeof tipoNotificacaoLabels]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notificacao.mensagem}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {new Date(notificacao.createdAt).toLocaleString("pt-BR")}
                              </span>
                              <div className="flex items-center gap-2">
                                {notificacao.enviadaEmail && (
                                  <Envelope className="h-4 w-4 text-green-600" title="Email enviado" />
                                )}
                                {notificacao.enviadaSMS && (
                                  <DeviceMobile className="h-4 w-4 text-green-600" title="SMS enviado" />
                                )}
                                {notificacao.enviadaPush && (
                                  <Bell className="h-4 w-4 text-green-600" title="Push enviado" />
                                )}
                              </div>
                              {notificacao.lida && notificacao.dataLeitura && (
                                <span className="text-green-600">
                                  Lida em {new Date(notificacao.dataLeitura).toLocaleString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarcarLida(notificacao.id)}
                              title="Marcar como lida"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(notificacao.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
            <DialogDescription>
              Preencha os dados da notificação
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">ID do Usuário *</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                placeholder="ID do usuário destinatário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                placeholder="Digite o título da notificação"
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
                rows={4}
                placeholder="Digite a mensagem da notificação"
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
                    <SelectItem value="INFORMACAO">Informação</SelectItem>
                    <SelectItem value="ALERTA">Alerta</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="ACADEMICO">Acadêmico</SelectItem>
                    <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                    <SelectItem value="LEMBRETE">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade *</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, prioridade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="CRITICA">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Canais de Envio *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canal-app"
                    checked={formData.canais.includes("APP")}
                    onChange={() => toggleCanal("APP")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="canal-app" className="font-normal">App</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canal-email"
                    checked={formData.canais.includes("EMAIL")}
                    onChange={() => toggleCanal("EMAIL")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="canal-email" className="font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canal-sms"
                    checked={formData.canais.includes("SMS")}
                    onChange={() => toggleCanal("SMS")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="canal-sms" className="font-normal">SMS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canal-push"
                    checked={formData.canais.includes("PUSH")}
                    onChange={() => toggleCanal("PUSH")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="canal-push" className="font-normal">Push</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createNotificacao.isPending}
              >
                {createNotificacao.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Enviar Notificação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
