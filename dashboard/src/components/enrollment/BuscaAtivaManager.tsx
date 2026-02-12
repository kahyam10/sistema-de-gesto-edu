"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useBuscasAtivas,
  useCreateBuscaAtiva,
  useEstatisticasBuscaAtiva,
  useEscolas,
  useMatriculas,
} from "@/hooks/useApi";
import {
  MagnifyingGlass,
  Plus,
  Eye,
  Warning,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";

export function BuscaAtivaManager() {
  const [selectedEscola, setSelectedEscola] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    matriculaId: "",
    motivo: "INFREQUENCIA",
    descricao: "",
    prioridade: "MEDIA",
  });

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: matriculas = [] } = useMatriculas();

  const filters: any = {};
  if (selectedEscola) filters.escolaId = selectedEscola;
  if (selectedStatus) filters.status = selectedStatus;
  if (selectedPrioridade) filters.prioridade = selectedPrioridade;

  const { data: buscasAtivas = [], isLoading } = useBuscasAtivas(filters);
  const { data: estatisticas } = useEstatisticasBuscaAtiva(selectedEscola);
  const createMutation = useCreateBuscaAtiva();

  const handleCreate = () => {
    if (!formData.matriculaId || !formData.motivo) return;

    createMutation.mutate(
      {
        ...formData,
        escolaId: selectedEscola || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFormData({
            matriculaId: "",
            motivo: "INFREQUENCIA",
            descricao: "",
            prioridade: "MEDIA",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      ATIVA: { variant: "destructive", label: "Ativa", icon: Warning },
      EM_ACOMPANHAMENTO: {
        variant: "secondary",
        label: "Em Acompanhamento",
        icon: Clock,
      },
      RESOLVIDA: {
        variant: "default",
        label: "Resolvida",
        icon: CheckCircle,
      },
      ENCAMINHADA: { variant: "outline", label: "Encaminhada", icon: Eye },
    };

    const config = badges[status] || badges.ATIVA;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={14} />
        {config.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      BAIXA: { variant: "outline", label: "Baixa" },
      MEDIA: { variant: "secondary", label: "Média" },
      ALTA: { variant: "default", label: "Alta" },
      URGENTE: { variant: "destructive", label: "Urgente" },
    };

    const config = badges[prioridade] || badges.MEDIA;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loadingEscolas) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MagnifyingGlass size={24} />
                Busca Ativa Escolar
              </CardTitle>
              <CardDescription>
                Identificação e acompanhamento de alunos faltosos/evadidos
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Busca Ativa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Escola (Opcional)</Label>
              <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="EM_ACOMPANHAMENTO">Em Acompanhamento</SelectItem>
                  <SelectItem value="RESOLVIDA">Resolvida</SelectItem>
                  <SelectItem value="ENCAMINHADA">Encaminhada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={selectedPrioridade}
                onValueChange={setSelectedPrioridade}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Total de Casos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{estatisticas.total || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Casos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {estatisticas.porStatus?.ATIVA || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Em Acompanhamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">
                {estatisticas.porStatus?.EM_ACOMPANHAMENTO || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Resolvidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {estatisticas.porStatus?.RESOLVIDA || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Casos Registrados</CardTitle>
          <CardDescription>
            {buscasAtivas.length} caso(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : buscasAtivas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visitas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buscasAtivas.map((busca) => (
                  <TableRow key={busca.id}>
                    <TableCell className="font-medium">
                      {busca.matricula?.nomeAluno || "Desconhecido"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {busca.matricula?.turma?.nome || "-"} -{" "}
                        {busca.matricula?.turma?.serie?.nome || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{busca.motivo}</TableCell>
                    <TableCell>
                      {busca.escola?.nome || busca.matricula?.escola?.nome || "-"}
                    </TableCell>
                    <TableCell>{getPrioridadeBadge(busca.prioridade)}</TableCell>
                    <TableCell>{getStatusBadge(busca.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {busca._count?.visitas || 0} visita(s)
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MagnifyingGlass
                size={48}
                className="text-muted-foreground mb-4"
                weight="duotone"
              />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum caso encontrado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Não há casos de busca ativa com os filtros selecionados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Busca Ativa</DialogTitle>
            <DialogDescription>
              Registre um novo caso de busca ativa escolar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Matrícula *</Label>
              <Select
                value={formData.matriculaId}
                onValueChange={(value) =>
                  setFormData({ ...formData, matriculaId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {matriculas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nomeAluno} - {m.numeroMatricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select
                value={formData.motivo}
                onValueChange={(value) =>
                  setFormData({ ...formData, motivo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFREQUENCIA">Infrequência</SelectItem>
                  <SelectItem value="EVASAO">Evasão</SelectItem>
                  <SelectItem value="ABANDONO">Abandono</SelectItem>
                  <SelectItem value="RISCO_SOCIAL">Risco Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
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
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva o caso..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.matriculaId || createMutation.isPending}
            >
              Criar Busca Ativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
