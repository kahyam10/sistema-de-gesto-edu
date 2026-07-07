"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Buildings, Pencil, Trash, GraduationCap, Spinner,
  MagnifyingGlass, Student, Users, CaretRight, Door, ClipboardText, UserCircle,
} from "@phosphor-icons/react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEscolas, useEtapas, useTurmas, useCreateEscola, useUpdateEscola, useDeleteEscola, useProfissionais,
} from "@/hooks/useApi";
import { Escola as EscolaType } from "@/lib/api";

interface EscolasManagerProps {
  onSelectEscola?: (escola: EscolaType) => void;
}

export function EscolasManager({ onSelectEscola }: EscolasManagerProps) {
  const router = useRouter();
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const { data: turmas, isLoading: loadingTurmas } = useTurmas();
  const { data: profissionais, isLoading: loadingProfissionais } = useProfissionais({ ativo: true });
  const createEscola = useCreateEscola();
  const updateEscola = useUpdateEscola();
  const deleteEscola = useDeleteEscola();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<EscolaType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome: "", codigo: "", endereco: "", telefone: "", email: "",
    quantidadeSalas: 0, etapasIds: [] as string[], ativa: true,
    diretorId: "" as string,
  });

  // Filtrar profissionais que podem ser diretores (PROFESSOR, DIRETOR, COORDENADOR)
  const diretoresDisponiveis = useMemo(() => {
    if (!profissionais) return [];
    return profissionais.filter((p) => 
      ["PROFESSOR", "DIRETOR", "COORDENADOR"].includes(p.tipo) && p.ativo
    );
  }, [profissionais]);

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
    const data = {
      nome: formData.nome, codigo: formData.codigo,
      endereco: formData.endereco || undefined,
      telefone: formData.telefone || undefined,
      email: formData.email || undefined,
      quantidadeSalas: formData.quantidadeSalas,
      etapasIds: formData.etapasIds, ativo: formData.ativa,
      diretorId: formData.diretorId || null,
    };
    if (editingEscola) {
      await updateEscola.mutateAsync({ id: editingEscola.id, data });
    } else {
      await createEscola.mutateAsync(data);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: "", codigo: "", endereco: "", telefone: "", email: "", quantidadeSalas: 0, etapasIds: [], ativa: true, diretorId: "" });
    setEditingEscola(null);
    setIsFormOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, escola: EscolaType) => {
    e.stopPropagation();
    setEditingEscola(escola);
    const etapasIds = escola.etapas?.map((et) => et.etapa.id) || [];
    setFormData({
      nome: escola.nome, codigo: escola.codigo, endereco: escola.endereco || "",
      telefone: escola.telefone || "", email: escola.email || "",
      quantidadeSalas: escola.quantidadeSalas || 0, etapasIds, ativa: escola.ativo,
      diretorId: escola.diretorId || "",
    });
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
      etapasIds: prev.etapasIds.includes(etapaId)
        ? prev.etapasIds.filter((id) => id !== etapaId)
        : [...prev.etapasIds, etapaId],
    }));
  };

  const getEtapaNome = (etapaId: string) => etapas?.find((e) => e.id === etapaId)?.nome || "Etapa";

  const getDiretorNome = (diretorId: string | undefined) => {
    if (!diretorId || !profissionais) return null;
    return profissionais.find((p) => p.id === diretorId)?.nome || null;
  };

  const isLoading = loadingEscolas || loadingEtapas || loadingTurmas || loadingProfissionais;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-3">{[1, 2, 3].map((i) => (<Skeleton key={i} className="h-24 w-full" />))}</div>
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
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
          <Plus size={20} weight="bold" />Nova Escola
        </Button>
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input placeholder="Buscar escola por nome ou código..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Input id="nome" required value={formData.nome} onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex: Escola Municipal João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" required value={formData.codigo} onChange={(e) => setFormData((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ex: EM001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadeSalas">Quantidade de Salas *</Label>
                <Input id="quantidadeSalas" type="number" min={0} required value={formData.quantidadeSalas} onChange={(e) => setFormData((p) => ({ ...p, quantidadeSalas: parseInt(e.target.value) || 0 }))} placeholder="Ex: 10" />
                <p className="text-xs text-muted-foreground">Define o limite de turmas por turno</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input id="telefone" required value={formData.telefone} onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))} placeholder="(00) 0000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="escola@exemplo.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input id="endereco" required value={formData.endereco} onChange={(e) => setFormData((p) => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, bairro" />
              </div>
            </div>
            
            {/* Gestor Escolar (Diretor) */}
            <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
              <Label htmlFor="diretorId" className="flex items-center gap-2">
                <UserCircle size={18} weight="duotone" className="text-primary" />
                Gestor Escolar (Diretor)
              </Label>
              <Select 
                value={formData.diretorId || "sem_diretor"} 
                onValueChange={(value) => setFormData((p) => ({ ...p, diretorId: value === "sem_diretor" ? "" : value }))}
              >
                <SelectTrigger id="diretorId">
                  <SelectValue placeholder="Selecione o gestor escolar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_diretor">Sem diretor definido</SelectItem>
                  {diretoresDisponiveis.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      <div className="flex items-center gap-2">
                        <span>{prof.nome}</span>
                        <Badge variant="outline" className="text-xs">{prof.tipo}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione um profissional cadastrado como Professor, Coordenador ou Diretor
              </p>
            </div>

            <div className="space-y-2">
              <Label>Etapas de ensino oferecidas</Label>
              {!etapas || etapas.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada.</p>
                </div>
              ) : (
                <ScrollArea className="h-40 border rounded-lg p-4">
                  <div className="space-y-3">
                    {etapas.map((etapa) => (
                      <div key={etapa.id} className="flex items-start space-x-2">
                        <Checkbox id={`etapa-${etapa.id}`} checked={formData.etapasIds.includes(etapa.id)} onCheckedChange={() => toggleEtapa(etapa.id)} />
                        <Label htmlFor={`etapa-${etapa.id}`} className="cursor-pointer flex-1">
                          <div className="font-medium">{etapa.nome}</div>
                          <div className="text-xs text-muted-foreground mt-1">{etapa.niveis?.length || 0} nível(is)</div>
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
              <Switch id="ativa" checked={formData.ativa} onCheckedChange={(c) => setFormData((p) => ({ ...p, ativa: c }))} />
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
        <div className="space-y-3">
          {escolasFiltradas.map((escola) => {
            const escolaEtapasIds = escola.etapas?.map((et) => et.etapa.id) || [];
            return (
              <Card key={escola.id} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group" onClick={() => onSelectEscola?.(escola)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Buildings className="text-primary" size={28} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg truncate">{escola.nome}</h4>
                        <Badge variant={escola.ativo ? "default" : "secondary"} className="text-xs flex-shrink-0">{escola.ativo ? "Ativa" : "Inativa"}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>Código: {escola.codigo}</span>
                        {escola.quantidadeSalas > 0 && (<span className="flex items-center gap-1"><Door size={14} />{escola.quantidadeSalas} salas</span>)}
                        {escola.diretor && (
                          <span className="flex items-center gap-1">
                            <UserCircle size={14} weight="duotone" />
                            Gestor: {escola.diretor.nome}
                          </span>
                        )}
                      </div>
                      {escolaEtapasIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {escolaEtapasIds.slice(0, 4).map((etapaId) => (<Badge key={etapaId} variant="outline" className="text-xs">{getEtapaNome(etapaId)}</Badge>))}
                          {escolaEtapasIds.length > 4 && (<Badge variant="outline" className="text-xs">+{escolaEtapasIds.length - 4}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-center">
                      <div className="px-3">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><GraduationCap size={16} /></div>
                        <p className="text-xl font-bold">{escola.stats.totalTurmas}</p>
                        <p className="text-xs text-muted-foreground">Turmas</p>
                      </div>
                      <div className="px-3 border-l">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Student size={16} /></div>
                        <p className="text-xl font-bold">{escola.stats.totalAlunos}</p>
                        <p className="text-xs text-muted-foreground">Alunos</p>
                      </div>
                      <div className="px-3 border-l">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Users size={16} /></div>
                        <p className="text-xl font-bold">{escola.stats.vagasDisponiveis}</p>
                        <p className="text-xs text-muted-foreground">Vagas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-primary hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/questionario-escola/${escola.id}`);
                              }}
                            >
                              <ClipboardText size={16} weight="duotone" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Questionário Censo Escolar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => handleEdit(e, escola)}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, escola.id)} disabled={deleteEscola.isPending}><Trash size={16} /></Button>
                      <CaretRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
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
