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
  Plus,
  Buildings,
  Pencil,
  Trash,
  GraduationCap,
  Phone,
  Envelope,
  MapPin,
  Spinner,
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
  useCreateEscola,
  useUpdateEscola,
  useDeleteEscola,
} from "@/hooks/useApi";
import { Escola as EscolaType } from "@/lib/api";

export function EscolasManager() {
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const createEscola = useCreateEscola();
  const updateEscola = useUpdateEscola();
  const deleteEscola = useDeleteEscola();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<EscolaType | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    endereco: "",
    telefone: "",
    email: "",
    etapasIds: [] as string[],
    ativa: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEscola) {
      await updateEscola.mutateAsync({
        id: editingEscola.id,
        data: {
          nome: formData.nome,
          codigo: formData.codigo,
          endereco: formData.endereco || undefined,
          telefone: formData.telefone || undefined,
          email: formData.email || undefined,
          etapasIds: formData.etapasIds,
          ativo: formData.ativa,
        },
      });
    } else {
      await createEscola.mutateAsync({
        nome: formData.nome,
        codigo: formData.codigo,
        endereco: formData.endereco || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        etapasIds: formData.etapasIds,
        ativo: formData.ativa,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      endereco: "",
      telefone: "",
      email: "",
      etapasIds: [],
      ativa: true,
    });
    setEditingEscola(null);
    setIsFormOpen(false);
  };

  const handleEdit = (escola: EscolaType) => {
    setEditingEscola(escola);
    // Extrair etapas IDs da estrutura do banco
    const etapasIds = escola.etapas?.map((e) => e.etapa.id) || [];
    setFormData({
      nome: escola.nome,
      codigo: escola.codigo,
      endereco: escola.endereco || "",
      telefone: escola.telefone || "",
      email: escola.email || "",
      etapasIds: etapasIds,
      ativa: escola.ativo,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
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

  const getEtapaNome = (etapaId: string) => {
    return etapas?.find((e) => e.id === etapaId)?.nome || "Etapa não encontrada";
  };

  const isLoading = loadingEscolas || loadingEtapas;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Cadastro de Escolas</h3>
          <p className="text-muted-foreground mt-1">
            Gerencie as escolas e suas etapas de ensino
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
          <Plus size={20} weight="bold" />
          Nova Escola
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Buildings className="text-primary" size={24} weight="duotone" />
              {editingEscola ? 'Editar Escola' : 'Nova Escola'}
            </DialogTitle>
            <DialogDescription>
              {editingEscola ? 'Atualize os dados da escola' : 'Cadastre uma nova escola'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Escola Municipal João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ex: EM001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="escola@exemplo.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  required
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Etapas de ensino oferecidas</Label>
              {(!etapas || etapas.length === 0) ? (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma etapa cadastrada. Cadastre etapas primeiro para poder vinculá-las.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-40 border rounded-lg p-4">
                  <div className="space-y-3">
                    {etapas.map((etapa) => (
                      <div key={etapa.id} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`etapa-${etapa.id}`}
                          checked={formData.etapasIds.includes(etapa.id)}
                          onCheckedChange={() => toggleEtapa(etapa.id)}
                        />
                        <Label 
                          htmlFor={`etapa-${etapa.id}`} 
                          className="cursor-pointer flex-1"
                        >
                          <div className="font-medium">{etapa.nome}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {etapa.series?.length || 0} série(s): {etapa.series?.map(s => s.nome).join(', ') || 'Nenhuma'}
                          </div>
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
                <p className="text-sm text-muted-foreground">
                  Escola disponível para matrículas
                </p>
              </div>
              <Switch
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativa: checked }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={createEscola.isPending || updateEscola.isPending}
              >
                {(createEscola.isPending || updateEscola.isPending) && (
                  <Spinner className="animate-spin" size={16} />
                )}
                {editingEscola ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
          <CardDescription>
            {(escolas || []).length} escola(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!escolas || escolas.length === 0) ? (
            <div className="text-center py-12">
              <Buildings className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <p className="text-muted-foreground">
                Nenhuma escola cadastrada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Escola" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {escolas.map((escola) => {
                const escolaEtapasIds = escola.etapas?.map((e) => e.etapa.id) || [];
                return (
                <div 
                  key={escola.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Buildings className="text-primary" size={24} weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{escola.nome}</h4>
                          <Badge variant={escola.ativo ? 'default' : 'secondary'}>
                            {escola.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Código:</span> {escola.codigo}
                          </div>
                          {escola.endereco && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              {escola.endereco}
                            </div>
                          )}
                          {escola.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              {escola.telefone}
                            </div>
                          )}
                          {escola.email && (
                            <div className="flex items-center gap-2">
                              <Envelope size={14} />
                              {escola.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(escola)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(escola.id)}
                        disabled={deleteEscola.isPending}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                  {escolaEtapasIds.length > 0 && (
                    <div className="pl-15 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <GraduationCap size={16} />
                        <span className="font-medium">Etapas oferecidas:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {escolaEtapasIds.map((etapaId) => (
                          <div 
                            key={etapaId}
                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                          >
                            {getEtapaNome(etapaId)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
