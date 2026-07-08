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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Switch } from "@/components/ui/switch";
import {
  useEtapas,
  useEscolas,
  useConfiguracoesAvaliacao,
  useCreateConfiguracaoAvaliacao,
  useUpdateConfiguracaoAvaliacao,
  useDeleteConfiguracaoAvaliacao,
} from "@/hooks/useApi";
import { GearSix, Plus, Pencil, Trash } from "@phosphor-icons/react";
import type { ConfiguracaoAvaliacao } from "@/lib/api";

interface ConfigForm {
  anoLetivo: string;
  sistemaAvaliacao: string;
  numeroPeriodos: string;
  mediaMinima: string;
  percentualFrequenciaMinima: string;
  recuperacaoParalela: boolean;
  recuperacaoFinal: boolean;
  escolaId: string;
  etapaId: string;
}

const emptyForm: ConfigForm = {
  anoLetivo: new Date().getFullYear().toString(),
  sistemaAvaliacao: "NOTA",
  numeroPeriodos: "4",
  mediaMinima: "6.0",
  percentualFrequenciaMinima: "75",
  recuperacaoParalela: false,
  recuperacaoFinal: true,
  escolaId: "",
  etapaId: "",
};

export function ConfiguracaoAvaliacaoManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConfigForm>(emptyForm);

  const { data: etapas = [] } = useEtapas();
  const { data: escolas = [] } = useEscolas();
  const { data: configs = [], isLoading } = useConfiguracoesAvaliacao();
  const createMutation = useCreateConfiguracaoAvaliacao();
  const updateMutation = useUpdateConfiguracaoAvaliacao();
  const deleteMutation = useDeleteConfiguracaoAvaliacao();

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: ConfiguracaoAvaliacao) => {
    setEditingId(c.id);
    setForm({
      anoLetivo: c.anoLetivo.toString(),
      sistemaAvaliacao: c.sistemaAvaliacao,
      numeroPeriodos: c.numeroPeriodos.toString(),
      mediaMinima: c.mediaMinima.toString(),
      percentualFrequenciaMinima: c.percentualFrequenciaMinima.toString(),
      recuperacaoParalela: c.recuperacaoParalela,
      recuperacaoFinal: c.recuperacaoFinal,
      escolaId: c.escolaId || "",
      etapaId: c.etapaId || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      anoLetivo: parseInt(form.anoLetivo),
      sistemaAvaliacao: form.sistemaAvaliacao,
      numeroPeriodos: parseInt(form.numeroPeriodos),
      mediaMinima: parseFloat(form.mediaMinima),
      percentualFrequenciaMinima: parseFloat(form.percentualFrequenciaMinima),
      recuperacaoParalela: form.recuperacaoParalela,
      recuperacaoFinal: form.recuperacaoFinal,
      escolaId: form.escolaId || undefined,
      etapaId: form.etapaId || undefined,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta configuracao?")) {
      deleteMutation.mutate(id);
    }
  };

  const getEscopo = (c: ConfiguracaoAvaliacao) => {
    if (c.escolaId && c.etapaId) return "Escola + Etapa";
    if (c.escolaId) return "Escola";
    if (c.etapaId) return "Etapa";
    return "Global";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GearSix size={20} />
                Configuracao de Avaliacao
              </CardTitle>
              <CardDescription>
                Defina parametros do sistema de avaliacao (media, frequencia, periodos)
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus size={16} className="mr-2" />
              Nova Configuracao
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GearSix size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma configuracao cadastrada. Sera usado o padrao (media 6.0, freq 75%).
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead className="text-center">Periodos</TableHead>
                    <TableHead className="text-center">Media Min.</TableHead>
                    <TableHead className="text-center">Freq. Min.</TableHead>
                    <TableHead className="text-center">Recup.</TableHead>
                    <TableHead className="text-center w-24">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">
                        {c.anoLetivo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getEscopo(c)}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {c.escola?.nome || ""}
                          {c.escola && c.etapa ? " / " : ""}
                          {c.etapa?.nome || ""}
                        </div>
                      </TableCell>
                      <TableCell>{c.sistemaAvaliacao}</TableCell>
                      <TableCell className="text-center">
                        {c.numeroPeriodos}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {c.mediaMinima}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.percentualFrequenciaMinima}%
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1 text-xs">
                          {c.recuperacaoParalela && (
                            <Badge variant="secondary" className="text-xs">
                              Paralela
                            </Badge>
                          )}
                          {c.recuperacaoFinal && (
                            <Badge variant="secondary" className="text-xs">
                              Final
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Configuracao" : "Nova Configuracao"}
            </DialogTitle>
            <DialogDescription>
              Defina os parametros de avaliacao. Configuracoes mais especificas tem prioridade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cfg-ano">Ano Letivo *</Label>
                <Input
                  id="cfg-ano"
                  type="number"
                  value={form.anoLetivo}
                  onChange={(e) =>
                    setForm({ ...form, anoLetivo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sistema</Label>
                <Select
                  value={form.sistemaAvaliacao}
                  onValueChange={(v) =>
                    setForm({ ...form, sistemaAvaliacao: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTA">Nota (0-10)</SelectItem>
                    <SelectItem value="CONCEITO">Conceito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cfg-periodos">Periodos</Label>
                <Input
                  id="cfg-periodos"
                  type="number"
                  min="1"
                  max="6"
                  value={form.numeroPeriodos}
                  onChange={(e) =>
                    setForm({ ...form, numeroPeriodos: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-media">Media Minima</Label>
                <Input
                  id="cfg-media"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={form.mediaMinima}
                  onChange={(e) =>
                    setForm({ ...form, mediaMinima: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-freq">Freq. Minima %</Label>
                <Input
                  id="cfg-freq"
                  type="number"
                  min="0"
                  max="100"
                  value={form.percentualFrequenciaMinima}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      percentualFrequenciaMinima: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Escola (opcional)</Label>
                <Select
                  value={form.escolaId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, escolaId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas as escolas</SelectItem>
                    {escolas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa (opcional)</Label>
                <Select
                  value={form.etapaId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, etapaId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas as etapas</SelectItem>
                    {etapas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="recup-paralela"
                  checked={form.recuperacaoParalela}
                  onCheckedChange={(v) =>
                    setForm({ ...form, recuperacaoParalela: v })
                  }
                />
                <Label htmlFor="recup-paralela">Recuperacao Paralela</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="recup-final"
                  checked={form.recuperacaoFinal}
                  onCheckedChange={(v) =>
                    setForm({ ...form, recuperacaoFinal: v })
                  }
                />
                <Label htmlFor="recup-final">Recuperacao Final</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !form.anoLetivo ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
