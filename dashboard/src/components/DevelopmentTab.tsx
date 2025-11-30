"use client";

import { useState, useEffect } from "react";
import { useModules, useUpdateSubModule, useCreateSubModule, useDeleteSubModule } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GraduationCap, Users, BookOpen, Calendar, ListChecks, ArrowLeft,
  Spinner, Wrench, CaretRight, CheckCircle, Circle, Clock, Warning,
  Plus, Pencil, Trash, FloppyDisk, X
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Module, SubModule } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const moduleIcons: Record<string, React.ReactNode> = {
  Matriculas: <GraduationCap size={24} />,
  "Gestao de RH": <Users size={24} />,
  Pedagogico: <BookOpen size={24} />,
  Calendario: <Calendar size={24} />,
  Planejamento: <ListChecks size={24} />,
};

const statusConfig = {
  planning: { label: "Planejamento", color: "bg-slate-100 text-slate-700 border-slate-300", icon: <Circle size={16} weight="duotone" />, badgeVariant: "outline" as const },
  "in-progress": { label: "Em Progresso", color: "bg-blue-100 text-blue-700 border-blue-300", icon: <Clock size={16} weight="duotone" />, badgeVariant: "secondary" as const },
  completed: { label: "Concluido", color: "bg-green-100 text-green-700 border-green-300", icon: <CheckCircle size={16} weight="duotone" />, badgeVariant: "default" as const },
  blocked: { label: "Bloqueado", color: "bg-red-100 text-red-700 border-red-300", icon: <Warning size={16} weight="duotone" />, badgeVariant: "destructive" as const },
};

export function DevelopmentTab() {
  const { data: modules = [], isLoading, refetch } = useModules();
  const updateSubModule = useUpdateSubModule();
  const createSubModule = useCreateSubModule();
  const deleteSubModule = useDeleteSubModule();

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [localSubModules, setLocalSubModules] = useState<SubModule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubModule, setEditingSubModule] = useState<SubModule | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", observacao: "" });

  // Atualiza estado local quando modulo selecionado muda
  useEffect(() => {
    if (selectedModule) {
      const updatedModule = modules.find(m => m.id === selectedModule.id);
      if (updatedModule) {
        setLocalSubModules(updatedModule.subModules || []);
        setSelectedModule(updatedModule);
      }
    }
  }, [modules, selectedModule?.id]);

  const handleToggleCompleted = async (subModule: SubModule) => {
    const newStatus = subModule.status === "completed" ? "in-progress" : "completed";
    
    // Atualiza estado local imediatamente (feedback instantaneo)
    setLocalSubModules(prev => 
      prev.map(s => s.id === subModule.id ? { ...s, status: newStatus } : s)
    );
    
    // Persiste no banco
    await updateSubModule.mutateAsync({ id: subModule.id, data: { status: newStatus } });
    refetch();
  };

  const handleUpdateObservacao = async (subModule: SubModule, observacao: string) => {
    setLocalSubModules(prev =>
      prev.map(s => s.id === subModule.id ? { ...s, observacao } : s)
    );
    await updateSubModule.mutateAsync({ id: subModule.id, data: { observacao } });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubModule) {
      await updateSubModule.mutateAsync({
        id: editingSubModule.id,
        data: { name: formData.name, description: formData.description, observacao: formData.observacao }
      });
    } else if (selectedModule) {
      await createSubModule.mutateAsync({
        moduleId: selectedModule.id,
        data: { name: formData.name, description: formData.description, observacao: formData.observacao, ordem: localSubModules.length + 1 }
      });
    }
    refetch();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este recurso?")) {
      setLocalSubModules(prev => prev.filter(s => s.id !== id));
      await deleteSubModule.mutateAsync(id);
      refetch();
    }
  };

  const openEditForm = (subModule: SubModule) => {
    setEditingSubModule(subModule);
    setFormData({ name: subModule.name, description: subModule.description, observacao: subModule.observacao || "" });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", observacao: "" });
    setEditingSubModule(null);
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando modulos...</span>
      </div>
    );
  }

  // Visualizacao detalhada do modulo
  if (selectedModule) {
    const completedCount = localSubModules.filter(s => s.status === "completed").length;
    const totalCount = localSubModules.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2">
            <ArrowLeft size={18} />
            Voltar
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {moduleIcons[selectedModule.name] || <Wrench size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedModule.name}</h2>
                <p className="text-muted-foreground">{selectedModule.description}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Progresso</div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-32 h-2" />
              <span className="font-bold">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recursos do Modulo</h3>
            <p className="text-sm text-muted-foreground">{completedCount} de {totalCount} concluidos</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus size={18} />
            Novo Recurso
          </Button>
        </div>

        <div className="space-y-3">
          {localSubModules.sort((a, b) => a.ordem - b.ordem).map((subModule) => {
            const isCompleted = subModule.status === "completed";
            return (
              <Card key={subModule.id} className={`transition-all ${isCompleted ? "bg-green-50 border-green-200" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleCompleted(subModule)}
                      className="mt-1 h-5 w-5"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {subModule.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{subModule.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={statusConfig[subModule.status].badgeVariant} className="text-xs">
                            {statusConfig[subModule.status].label}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(subModule)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(subModule.id)}>
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Observacao</Label>
                        <Textarea
                          placeholder="Adicione observacoes sobre este recurso..."
                          value={subModule.observacao || ""}
                          onChange={(e) => setLocalSubModules(prev => prev.map(s => s.id === subModule.id ? { ...s, observacao: e.target.value } : s))}
                          onBlur={(e) => handleUpdateObservacao(subModule, e.target.value)}
                          className="mt-1 min-h-[60px] text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {localSubModules.length === 0 && (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhum recurso cadastrado</p>
                <p className="text-sm mt-1">Clique em "Novo Recurso" para adicionar</p>
              </div>
            </Card>
          )}
        </div>

        {/* Dialog de formulario */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubModule ? "Editar Recurso" : "Novo Recurso"}</DialogTitle>
              <DialogDescription>
                {editingSubModule ? "Atualize as informacoes do recurso" : "Adicione um novo recurso ao modulo"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Cadastro de Alunos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descricao *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o que este recurso deve fazer"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao">Observacao</Label>
                <Textarea
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Observacoes adicionais sobre o desenvolvimento"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createSubModule.isPending || updateSubModule.isPending}>
                  {(createSubModule.isPending || updateSubModule.isPending) && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSubModule ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Lista de modulos
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ambiente de Desenvolvimento</h2>
        <p className="text-muted-foreground">Selecione um modulo para gerenciar seus recursos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const icon = moduleIcons[module.name] || <Wrench size={24} />;
          const config = statusConfig[module.status];
          const completedCount = module.subModules?.filter(s => s.status === "completed").length || 0;
          const totalCount = module.subModules?.length || 0;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <Card
              key={module.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
              onClick={() => { setSelectedModule(module); setLocalSubModules(module.subModules || []); }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">{icon}</div>
                  <Badge variant={config.badgeVariant}>{config.label}</Badge>
                </div>
                <CardTitle className="text-lg mt-4 flex items-center justify-between">
                  {module.name}
                  <CaretRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
                <CardDescription className="line-clamp-2">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Recursos</span>
                    <span className="font-medium">{completedCount}/{totalCount} concluidos</span>
                  </div>
                  {module.subModules && module.subModules.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {module.subModules.slice(0, 6).map((sub) => (
                        <div
                          key={sub.id}
                          className={`w-2 h-2 rounded-full ${sub.status === "completed" ? "bg-green-500" : sub.status === "in-progress" ? "bg-blue-500" : sub.status === "blocked" ? "bg-red-500" : "bg-slate-300"}`}
                          title={`${sub.name}: ${statusConfig[sub.status].label}`}
                        />
                      ))}
                      {module.subModules.length > 6 && <span className="text-xs text-muted-foreground">+{module.subModules.length - 6}</span>}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-4 gap-2">
                  <Wrench size={14} />
                  Gerenciar Recursos
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum modulo cadastrado</h3>
            <p className="text-muted-foreground">Acesse a aba Modulos para criar os modulos do sistema.</p>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">Como usar</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>1.</strong> Clique em um modulo para ver seus recursos</p>
          <p><strong>2.</strong> Adicione novos recursos clicando em "Novo Recurso"</p>
          <p><strong>3.</strong> Marque o checkbox para concluir um recurso</p>
          <p><strong>4.</strong> Use o campo de observacao para anotacoes sobre o desenvolvimento</p>
        </div>
      </Card>
    </div>
  );
}
