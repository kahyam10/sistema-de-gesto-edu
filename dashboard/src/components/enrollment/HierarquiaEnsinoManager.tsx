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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  useTiposEducacao,
  useCreateTipoEducacao,
  useUpdateTipoEducacao,
  useDeleteTipoEducacao,
  useEtapas,
  useCreateEtapa,
  useUpdateEtapa,
  useDeleteEtapa,
  useNiveisEnsino,
  useCreateNivelEnsino,
  useUpdateNivelEnsino,
  useDeleteNivelEnsino,
  useSeries,
  useCreateSerie,
  useUpdateSerie,
  useDeleteSerie,
} from "@/hooks/useApi";
import { TipoEducacao, EtapaEnsino, NivelEnsino, Serie } from "@/lib/api";

type ModalType = "tipo" | "etapa" | "nivel" | "serie" | null;
type ModalAction = "create" | "edit" | null;

interface ModalContext {
  tipoId?: string;
  etapaId?: string;
  nivelId?: string;
  item?: TipoEducacao | EtapaEnsino | NivelEnsino | Serie;
}

export function HierarquiaEnsinoManager() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [modalContext, setModalContext] = useState<ModalContext>({});
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ordem: 1,
  });

  // Queries
  const { data: tiposEducacao, isLoading: loadingTipos } = useTiposEducacao();
  const { data: etapas } = useEtapas();
  const { data: niveis } = useNiveisEnsino();
  const { data: series } = useSeries();

  // Mutations
  const createTipo = useCreateTipoEducacao();
  const updateTipo = useUpdateTipoEducacao();
  const deleteTipo = useDeleteTipoEducacao();

  const createEtapa = useCreateEtapa();
  const updateEtapa = useUpdateEtapa();
  const deleteEtapa = useDeleteEtapa();

  const createNivel = useCreateNivelEnsino();
  const updateNivel = useUpdateNivelEnsino();
  const deleteNivel = useDeleteNivelEnsino();

  const createSerie = useCreateSerie();
  const updateSerie = useUpdateSerie();
  const deleteSerie = useDeleteSerie();

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openModal = (
    type: ModalType,
    action: ModalAction,
    context: ModalContext = {}
  ) => {
    setModalType(type);
    setModalAction(action);
    setModalContext(context);

    if (action === "edit" && context.item) {
      setFormData({
        nome: context.item.nome,
        descricao: (context.item as any).descricao || "",
        ordem: context.item.ordem,
      });
    } else {
      setFormData({ nome: "", descricao: "", ordem: 1 });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalAction(null);
    setModalContext({});
    setFormData({ nome: "", descricao: "", ordem: 1 });
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) return;

    try {
      if (modalAction === "create") {
        switch (modalType) {
          case "tipo":
            await createTipo.mutateAsync({
              nome: formData.nome,
              descricao: formData.descricao || undefined,
              ordem: formData.ordem,
            });
            break;
          case "etapa":
            if (!modalContext.tipoId) return;
            await createEtapa.mutateAsync({
              nome: formData.nome,
              descricao: formData.descricao || undefined,
              ordem: formData.ordem,
              tipoEducacaoId: modalContext.tipoId,
            });
            break;
          case "nivel":
            if (!modalContext.etapaId) return;
            await createNivel.mutateAsync({
              nome: formData.nome,
              descricao: formData.descricao || undefined,
              ordem: formData.ordem,
              etapaId: modalContext.etapaId,
            });
            break;
          case "serie":
            if (!modalContext.nivelId) return;
            await createSerie.mutateAsync({
              nome: formData.nome,
              ordem: formData.ordem,
              nivelId: modalContext.nivelId,
            });
            break;
        }
      } else if (modalAction === "edit" && modalContext.item) {
        switch (modalType) {
          case "tipo":
            await updateTipo.mutateAsync({
              id: modalContext.item.id,
              data: {
                nome: formData.nome,
                descricao: formData.descricao || undefined,
                ordem: formData.ordem,
              },
            });
            break;
          case "etapa":
            await updateEtapa.mutateAsync({
              id: modalContext.item.id,
              data: {
                nome: formData.nome,
                descricao: formData.descricao || undefined,
                ordem: formData.ordem,
              },
            });
            break;
          case "nivel":
            await updateNivel.mutateAsync({
              id: modalContext.item.id,
              data: {
                nome: formData.nome,
                descricao: formData.descricao || undefined,
                ordem: formData.ordem,
              },
            });
            break;
          case "serie":
            await updateSerie.mutateAsync({
              id: modalContext.item.id,
              data: {
                nome: formData.nome,
                ordem: formData.ordem,
              },
            });
            break;
        }
      }
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async (
    type: ModalType,
    id: string,
    nome: string
  ) => {
    if (!confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      switch (type) {
        case "tipo":
          await deleteTipo.mutateAsync(id);
          break;
        case "etapa":
          await deleteEtapa.mutateAsync(id);
          break;
        case "nivel":
          await deleteNivel.mutateAsync(id);
          break;
        case "serie":
          await deleteSerie.mutateAsync(id);
          break;
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const getModalTitle = () => {
    const action = modalAction === "create" ? "Novo" : "Editar";
    switch (modalType) {
      case "tipo":
        return `${action} Tipo de Educação`;
      case "etapa":
        return `${action === "Novo" ? "Nova" : action} Etapa de Ensino`;
      case "nivel":
        return `${action} Nível de Ensino`;
      case "serie":
        return `${action === "Novo" ? "Nova" : action} Série`;
      default:
        return "";
    }
  };

  if (loadingTipos) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Organiza os dados em uma estrutura hierárquica
  const hierarquia = tiposEducacao?.map((tipo) => ({
    ...tipo,
    etapas: etapas
      ?.filter((e) => e.tipoEducacaoId === tipo.id)
      .map((etapa) => ({
        ...etapa,
        niveis: niveis
          ?.filter((n) => n.etapaId === etapa.id)
          .map((nivel) => ({
            ...nivel,
            series: series?.filter((s) => s.nivelId === nivel.id) || [],
          })) || [],
      })) || [],
  })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Hierarquia de Ensino
            </CardTitle>
            <CardDescription>
              Gerencie a estrutura: Tipo de Educação → Etapa → Nível → Série
            </CardDescription>
          </div>
          <Button onClick={() => openModal("tipo", "create")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hierarquia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum tipo de educação cadastrado</p>
            <p className="text-sm">Comece criando um tipo de educação.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hierarquia.map((tipo) => (
              <div key={tipo.id} className="border rounded-lg">
                {/* Nível 1: Tipo de Educação */}
                <Collapsible
                  open={expandedItems.has(tipo.id)}
                  onOpenChange={() => toggleExpand(tipo.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        {expandedItems.has(tipo.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{tipo.nome}</span>
                        <Badge variant="outline" className="ml-2">
                          {tipo.etapas.length} etapa(s)
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("etapa", "create", { tipoId: tipo.id });
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("tipo", "edit", { item: tipo });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete("tipo", tipo.id, tipo.nome);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-6 pb-2">
                      {tipo.etapas.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2 pl-4">
                          Nenhuma etapa cadastrada
                        </p>
                      ) : (
                        tipo.etapas.map((etapa) => (
                          <div key={etapa.id} className="border-l-2 border-muted ml-2">
                            {/* Nível 2: Etapa de Ensino */}
                            <Collapsible
                              open={expandedItems.has(etapa.id)}
                              onOpenChange={() => toggleExpand(etapa.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-2 pl-4 hover:bg-muted/30 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    {expandedItems.has(etapa.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{etapa.nome}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {etapa.niveis.length} nível(is)
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal("nivel", "create", { etapaId: etapa.id });
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal("etapa", "edit", { item: etapa });
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete("etapa", etapa.id, etapa.nome);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="pl-6">
                                  {etapa.niveis.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2 pl-4">
                                      Nenhum nível cadastrado
                                    </p>
                                  ) : (
                                    etapa.niveis.map((nivel) => (
                                      <div key={nivel.id} className="border-l-2 border-muted ml-2">
                                        {/* Nível 3: Nível de Ensino */}
                                        <Collapsible
                                          open={expandedItems.has(nivel.id)}
                                          onOpenChange={() => toggleExpand(nivel.id)}
                                        >
                                          <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between p-2 pl-4 hover:bg-muted/20 cursor-pointer">
                                              <div className="flex items-center gap-2">
                                                {expandedItems.has(nivel.id) ? (
                                                  <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3" />
                                                )}
                                                <Layers className="h-4 w-4 text-green-600" />
                                                <span>{nivel.nome}</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {nivel.series.length} série(s)
                                                </Badge>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal("serie", "create", { nivelId: nivel.id });
                                                  }}
                                                >
                                                  <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal("nivel", "edit", { item: nivel });
                                                  }}
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6 text-destructive"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete("nivel", nivel.id, nivel.nome);
                                                  }}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent>
                                            <div className="pl-8 py-1">
                                              {nivel.series.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-1">
                                                  Nenhuma série cadastrada
                                                </p>
                                              ) : (
                                                <div className="space-y-1">
                                                  {nivel.series.map((serie) => (
                                                    <div
                                                      key={serie.id}
                                                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/20"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-orange-500" />
                                                        <span className="text-sm">{serie.nome}</span>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                        <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-5 w-5"
                                                          onClick={() =>
                                                            openModal("serie", "edit", { item: serie })
                                                          }
                                                        >
                                                          <Pencil className="h-2.5 w-2.5" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-5 w-5 text-destructive"
                                                          onClick={() =>
                                                            handleDelete("serie", serie.id, serie.nome)
                                                          }
                                                        >
                                                          <Trash2 className="h-2.5 w-2.5" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </CollapsibleContent>
                                        </Collapsible>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de Criação/Edição */}
      <Dialog open={modalType !== null} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
            <DialogDescription>
              {modalAction === "create"
                ? "Preencha os dados para criar um novo item."
                : "Edite os dados do item selecionado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Digite o nome..."
              />
            </div>
            {modalType !== "serie" && (
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Digite uma descrição (opcional)..."
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                min={1}
                value={formData.ordem}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ordem: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.nome.trim() ||
                createTipo.isPending ||
                updateTipo.isPending ||
                createEtapa.isPending ||
                updateEtapa.isPending ||
                createNivel.isPending ||
                updateNivel.isPending ||
                createSerie.isPending ||
                updateSerie.isPending
              }
            >
              {modalAction === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
