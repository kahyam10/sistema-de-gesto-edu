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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useEtapas,
  useDisciplinas,
  useCreateDisciplina,
  useUpdateDisciplina,
  useDeleteDisciplina,
} from "@/hooks/useApi";
import { Plus, Pencil, Trash, BookOpen } from "@phosphor-icons/react";
import type { Disciplina } from "@/lib/api";

interface DisciplinaForm {
  nome: string;
  codigo: string;
  descricao: string;
  cargaHorariaSemanal: string;
  obrigatoria: boolean;
  ativo: boolean;
  ordem: string;
  etapaId: string;
}

const emptyForm: DisciplinaForm = {
  nome: "",
  codigo: "",
  descricao: "",
  cargaHorariaSemanal: "",
  obrigatoria: true,
  ativo: true,
  ordem: "0",
  etapaId: "",
};

export function DisciplinasManager() {
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DisciplinaForm>(emptyForm);

  const { data: etapas = [], isLoading: loadingEtapas } = useEtapas();
  const { data: disciplinas = [], isLoading: loadingDisciplinas } = useDisciplinas(
    filtroEtapa !== "todas" ? { etapaId: filtroEtapa } : undefined
  );
  const createMutation = useCreateDisciplina();
  const updateMutation = useUpdateDisciplina();
  const deleteMutation = useDeleteDisciplina();

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (d: Disciplina) => {
    setEditingId(d.id);
    setForm({
      nome: d.nome,
      codigo: d.codigo,
      descricao: d.descricao || "",
      cargaHorariaSemanal: d.cargaHorariaSemanal?.toString() || "",
      obrigatoria: d.obrigatoria,
      ativo: d.ativo,
      ordem: d.ordem.toString(),
      etapaId: d.etapaId,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao || undefined,
      cargaHorariaSemanal: form.cargaHorariaSemanal
        ? parseInt(form.cargaHorariaSemanal)
        : undefined,
      obrigatoria: form.obrigatoria,
      ativo: form.ativo,
      ordem: parseInt(form.ordem) || 0,
      etapaId: form.etapaId,
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
    if (confirm("Tem certeza que deseja remover esta disciplina?")) {
      deleteMutation.mutate(id);
    }
  };

  if (loadingEtapas || loadingDisciplinas) {
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
                <BookOpen size={20} />
                Disciplinas
              </CardTitle>
              <CardDescription>
                Gerencie as disciplinas por etapa de ensino
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus size={16} className="mr-2" />
              Nova Disciplina
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="filtro-etapa">Filtrar por Etapa</Label>
            <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
              <SelectTrigger id="filtro-etapa" className="w-64 mt-1">
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as etapas</SelectItem>
                {etapas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {disciplinas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma disciplina cadastrada
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Ordem</TableHead>
                    <TableHead className="w-28">Codigo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-center">CH/Sem</TableHead>
                    <TableHead className="text-center">Obrigatoria</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center w-24">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disciplinas
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm">
                          {d.ordem}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {d.codigo}
                        </TableCell>
                        <TableCell className="font-medium">{d.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {d.etapa?.nome || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {d.cargaHorariaSemanal
                            ? `${d.cargaHorariaSemanal}h`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={d.obrigatoria ? "default" : "secondary"}
                          >
                            {d.obrigatoria ? "Sim" : "Nao"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={d.ativo ? "default" : "destructive"}
                          >
                            {d.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(d)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(d.id)}
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

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Disciplina" : "Nova Disciplina"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Altere os dados da disciplina"
                : "Preencha os dados para cadastrar uma nova disciplina"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Matematica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Codigo *</Label>
                <Input
                  id="codigo"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="MAT"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="etapa">Etapa de Ensino *</Label>
              <Select
                value={form.etapaId}
                onValueChange={(v) => setForm({ ...form, etapaId: v })}
              >
                <SelectTrigger id="etapa">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                placeholder="Descricao da disciplina..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carga">Carga Horaria Semanal</Label>
                <Input
                  id="carga"
                  type="number"
                  min="0"
                  value={form.cargaHorariaSemanal}
                  onChange={(e) =>
                    setForm({ ...form, cargaHorariaSemanal: e.target.value })
                  }
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  min="0"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="obrigatoria"
                  checked={form.obrigatoria}
                  onCheckedChange={(v) => setForm({ ...form, obrigatoria: v })}
                />
                <Label htmlFor="obrigatoria">Obrigatoria</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                />
                <Label htmlFor="ativo">Ativo</Label>
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
                !form.nome ||
                !form.codigo ||
                !form.etapaId ||
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
