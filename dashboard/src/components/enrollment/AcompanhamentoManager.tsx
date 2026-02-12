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
import { Textarea } from "@/components/ui/textarea";
import {
  useAcompanhamentos,
  useCreateAcompanhamento,
  useEstatisticasAcompanhamento,
  useEscolas,
  useMatriculas,
} from "@/hooks/useApi";
import { ChartLine, Plus, CheckCircle, Clock, XCircle } from "@phosphor-icons/react";

export function AcompanhamentoManager() {
  const [selectedEscola, setSelectedEscola] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    matriculaId: "",
    tipo: "PEDAGOGICO",
    motivo: "",
    objetivos: "",
    estrategias: "",
  });

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: matriculas = [] } = useMatriculas();

  const filters: any = {};
  if (selectedEscola) filters.escolaId = selectedEscola;
  if (selectedTipo) filters.tipo = selectedTipo;
  if (selectedStatus) filters.status = selectedStatus;

  const { data: acompanhamentos = [], isLoading } = useAcompanhamentos(filters);
  const { data: estatisticas } = useEstatisticasAcompanhamento(selectedEscola);
  const createMutation = useCreateAcompanhamento();

  const handleCreate = () => {
    if (!formData.matriculaId || !formData.tipo || !formData.motivo) return;

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
            tipo: "PEDAGOGICO",
            motivo: "",
            objetivos: "",
            estrategias: "",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      EM_ANDAMENTO: { variant: "default", label: "Em Andamento", icon: Clock },
      CONCLUIDO: { variant: "secondary", label: "Concluído", icon: CheckCircle },
      SUSPENSO: { variant: "destructive", label: "Suspenso", icon: XCircle },
    };

    const config = badges[status] || badges.EM_ANDAMENTO;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={14} />
        {config.label}
      </Badge>
    );
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
                <ChartLine size={24} />
                Acompanhamento Individualizado
              </CardTitle>
              <CardDescription>
                Acompanhamento pedagógico personalizado de alunos
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Acompanhamento
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
              <Label>Tipo</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PEDAGOGICO">Pedagógico</SelectItem>
                  <SelectItem value="COMPORTAMENTAL">Comportamental</SelectItem>
                  <SelectItem value="SOCIO_EMOCIONAL">Socioemocional</SelectItem>
                  <SelectItem value="APRENDIZAGEM">Aprendizagem</SelectItem>
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
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{estatisticas.total || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {estatisticas.porStatus?.EM_ANDAMENTO || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {estatisticas.porStatus?.CONCLUIDO || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Acompanhamentos Registrados</CardTitle>
          <CardDescription>
            {acompanhamentos.length} acompanhamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : acompanhamentos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acompanhamentos.map((acomp) => (
                  <TableRow key={acomp.id}>
                    <TableCell className="font-medium">
                      {acomp.matricula?.nomeAluno || "Desconhecido"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {acomp.matricula?.turma?.nome || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{acomp.tipo}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {acomp.motivo}
                    </TableCell>
                    <TableCell>
                      {acomp.profissional?.nome || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(acomp.dataInicio).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{getStatusBadge(acomp.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChartLine
                size={48}
                className="text-muted-foreground mb-4"
                weight="duotone"
              />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum acompanhamento encontrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Acompanhamento</DialogTitle>
            <DialogDescription>
              Inicie um acompanhamento individualizado para o aluno
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
              <Label>Tipo *</Label>
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
                  <SelectItem value="PEDAGOGICO">Pedagógico</SelectItem>
                  <SelectItem value="COMPORTAMENTAL">Comportamental</SelectItem>
                  <SelectItem value="SOCIO_EMOCIONAL">Socioemocional</SelectItem>
                  <SelectItem value="APRENDIZAGEM">Aprendizagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                value={formData.motivo}
                onChange={(e) =>
                  setFormData({ ...formData, motivo: e.target.value })
                }
                placeholder="Descreva o motivo do acompanhamento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Objetivos</Label>
              <Textarea
                value={formData.objetivos}
                onChange={(e) =>
                  setFormData({ ...formData, objetivos: e.target.value })
                }
                placeholder="Quais são os objetivos do acompanhamento?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Estratégias</Label>
              <Textarea
                value={formData.estrategias}
                onChange={(e) =>
                  setFormData({ ...formData, estrategias: e.target.value })
                }
                placeholder="Que estratégias serão utilizadas?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.matriculaId ||
                !formData.motivo ||
                createMutation.isPending
              }
            >
              Criar Acompanhamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
