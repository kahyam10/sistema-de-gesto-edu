"use client";

import { useState, useMemo } from "react";
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
  Plus,
  Buildings,
  Pencil,
  Trash,
  GraduationCap,
  Spinner,
  MagnifyingGlass,
  Student,
  Users,
  CaretRight,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEscolas,
  useEtapas,
  useTurmas,
  useCreateEscola,
  useUpdateEscola,
  useDeleteEscola,
} from "@/hooks/useApi";
import { Escola as EscolaType } from "@/lib/api";

interface EscolasManagerProps {
  onSelectEscola?: (escola: EscolaType) => void;
}

export function EscolasManager({ onSelectEscola }: EscolasManagerProps) {
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const { data: turmas, isLoading: loadingTurmas } = useTurmas();
  const createEscola = useCreateEscola();
  const updateEscola = useUpdateEscola();
  const deleteEscola = useDeleteEscola();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<EscolaType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    endereco: "",
    telefone: "",
    email: "",
    etapasIds: [] as string[],
    ativa: true,
  });

  const escolasComStats = useMemo(() => {
    if (!escolas || !turmas) return [];
    return escolas.map((escola) => {
      const turmasEscola = turmas.filter((t) => t.escolaId === escola.id);
      const totalTurmas = turmasEscola.length;
      const totalAlunos = turmasEscola.reduce((acc, t) => acc + (t.matriculas?.length || 0), 0);
      const capacidadeTotal = turmasEscola.reduce((acc, t) => acc + t.capacidadeMaxima, 0);
      const vagasDisponiveis = capacidadeTotal - totalAlunos;
      return { ...escola, stats: { totalTurmas, totalAlunos, capacidadeTotal, vagasDisponiveis } };
    });
  }, [escolas, turmas]);

  const escolasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return escolasComStats;
    const termo = searchTerm.toLowerCase();
    return escolasComStats.filter((escola) =>
      escola.nome.toLowerCase().includes(termo) || escola.codigo.toLowerCase().includes(termo)
    );
  }, [escolasComStats, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEscola) {
      await updateEscola.mutateAsync({
        id: editingEscola.id,
        data: { nome: formData.nome, codigo: formData.codigo, endereco: formData.endereco || undefined,
          telefone: formData.telefone || undefined, email: formData.email || undefined,
          etapasIds: formData.etapasIds, ativo: formData.ativa },
      });
    } else {
      await createEscola.mutateAsync({
        nome: formData.nome, codigo: formData.codigo, endereco: formData.endereco || undefined,
        telefone: formData.telefone || undefined, email: formData.email || undefined,
        etapasIds: formData.etapasIds, ativo: formData.ativa,
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: "", codigo: "", endereco: "", telefone: "", email: "", etapasIds: [], ativa: true });
    setEditingEscola(null);
    setIsFormOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, escola: EscolaType) => {
    e.stopPropagation();
    setEditingEscola(escola);
    const etapasIds = escola.etapas?.map((et) => et.etapa.id) || [];
    setFormData({ nome: escola.nome, codigo: escola.codigo, endereco: escola.endereco || "",
      telefone: escola.telefone || "", email: escola.email || "", etapasIds, ativa: escola.ativo });
    setIsFormOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja remover esta escola?")) {
      await deleteEscola.mutateAsync(id);
    }
  };

  const toggleEtapa = (etapaId: string) => {
    setFormData((prev) => ({
      ...prev,
      etapasIds: prev.etapasIds.includes(etapaId) ? prev.etapasIds.filter((id) => id !== etapaId) : [...prev.etapasIds, etapaId],
    }));
  };

  const getEtapaNome = (etapaId: string) => etapas?.find((e) => e.id === etapaId)?.nome || "Etapa não encontrada";

  const isLoading = loadingEscolas || loadingEtapas || loadingTurmas;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-48 w-full" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestão de Escolas</h3>
          <p className="text-muted-foreground mt-1">Selecione uma escola para ver detalhes e gerenciar turmas</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2"><Plus size={20} weight="bold" />Nova Escola</Button>
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input placeholder="Buscar escola por nome ou código..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Buildings className="text-primary" size={24} weight="duotone" />
              {editingEscola ? "Editar Escola" : "Nova Escola"}
            </DialogTitle>
            <DialogDescription>{editingEscola ? "Atualize os dados da escola" : "Cadastre uma nova escola"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input id="nome" required value={formData.nome} onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Escola Municipal João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" required value={formData.codigo} onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))} placeholder="Ex: EM001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input id="telefone" required value={formData.telefone} onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))} placeholder="(00) 0000-0000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} placeholder="escola@exemplo.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input id="endereco" required value={formData.endereco} onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))} placeholder="Rua, número, bairro" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Etapas de ensino oferecidas</Label>
              {!etapas || etapas.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada. Cadastre etapas primeiro para poder vinculá-las.</p>
                </div>
              ) : (
                <ScrollArea className="h-40 border rounded-lg p-4">
                  <div className="space-y-3">
                    {etapas.map((etapa) => (
                      <div key={etapa.id} className="flex items-start space-x-2">
                        <Checkbox id={`etapa-${etapa.id}`} checked={formData.etapasIds.includes(etapa.id)} onCheckedChange={() => toggleEtapa(etapa.id)} />
                        <Label htmlFor={`etapa-${etapa.id}`} className="cursor-pointer flex-1">
                          <div className="font-medium">{etapa.nome}</div>
                          <div className="text-xs text-muted-foreground mt-1">{etapa.series?.length || 0} série(s): {etapa.series?.map((s) => s.nome).join(", ") || "Nenhuma"}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="ativa">Escola Ativa</Label>
                <p className="text-sm text-muted-foreground">Escola disponível para matrículas</p>
              </div>
              <Switch id="ativa" checked={formData.ativa} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativa: checked }))} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="gap-2" disabled={createEscola.isPending || updateEscola.isPending}>
                {(createEscola.isPending || updateEscola.isPending) && <Spinner className="animate-spin" size={16} />}
                {editingEscola ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {escolasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Buildings className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
            {searchTerm ? (
              <><p className="text-muted-foreground">Nenhuma escola encontrada para "{searchTerm}"</p><Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">Limpar busca</Button></>
            ) : (
              <><p className="text-muted-foreground">Nenhuma escola cadastrada ainda</p><p className="text-sm text-muted-foreground mt-1">Clique em "Nova Escola" para começar</p></>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {escolasFiltradas.map((escola) => {
            const escolaEtapasIds = escola.etapas?.map((et) => et.etapa.id) || [];
            return (
              <Card key={escola.id} className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group" onClick={() => onSelectEscola?.(escola)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Buildings className="text-primary" size={24} weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{escola.nome}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{escola.codigo}</span>
                          <Badge variant={escola.ativo ? "default" : "secondary"} className="text-xs">{escola.ativo ? "Ativa" : "Inativa"}</Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(e, escola)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, escola.id)} disabled={deleteEscola.isPending}><Trash size={14} /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><GraduationCap size={14} /></div>
                      <p className="text-lg font-bold">{escola.stats.totalTurmas}</p>
                      <p className="text-xs text-muted-foreground">Turmas</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Student size={14} /></div>
                      <p className="text-lg font-bold">{escola.stats.totalAlunos}</p>
                      <p className="text-xs text-muted-foreground">Alunos</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Users size={14} /></div>
                      <p className="text-lg font-bold">{escola.stats.vagasDisponiveis}</p>
                      <p className="text-xs text-muted-foreground">Vagas</p>
                    </div>
                  </div>
                  {escolaEtapasIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {escolaEtapasIds.slice(0, 3).map((etapaId) => (<Badge key={etapaId} variant="outline" className="text-xs">{getEtapaNome(etapaId)}</Badge>))}
                      {escolaEtapasIds.length > 3 && (<Badge variant="outline" className="text-xs">+{escolaEtapasIds.length - 3}</Badge>)}
                    </div>
                  )}
                  <div className="flex items-center justify-end text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span>Ver detalhes</span>
                    <CaretRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
