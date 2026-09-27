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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash,
  UsersThree,
  CalendarBlank,
  Buildings,
  Spinner,
  UserPlus,
} from "@phosphor-icons/react";
import {
  useColegiados,
  useColegiado,
  useCreateColegiado,
  useUpdateColegiado,
  useDeleteColegiado,
  useAddMembroColegiado,
  useUpdateMembroColegiado,
  useRemoveMembroColegiado,
} from "@/hooks/useDemocratica";
import { useEscolas } from "@/hooks/useApi";
import {
  type ColegiadoEscolar,
  type MembroColegiado,
  type SegmentoDemocratico,
} from "@/lib/api-democratica";
import { toast } from "sonner";

const segmentoLabels: Record<SegmentoDemocratico, string> = {
  PROFESSOR: "Professor",
  PAI_RESPONSAVEL: "Pai/Responsável",
  ALUNO: "Aluno",
  FUNCIONARIO: "Funcionário",
  COMUNIDADE: "Comunidade",
  DIRECAO: "Direção",
};

const cargoLabels: Record<MembroColegiado["cargo"], string> = {
  PRESIDENTE: "Presidente",
  VICE_PRESIDENTE: "Vice-Presidente",
  SECRETARIO: "Secretário",
  TESOUREIRO: "Tesoureiro",
  TITULAR: "Titular",
  SUPLENTE: "Suplente",
};

interface ColegiadoFormData {
  nome: string;
  escolaId: string;
  dataInicioMandato: string;
  dataFimMandato: string;
}

const initialFormData: ColegiadoFormData = {
  nome: "Colegiado Escolar",
  escolaId: "",
  dataInicioMandato: "",
  dataFimMandato: "",
};

interface MembroFormData {
  nome: string;
  segmento: SegmentoDemocratico;
  cargo: MembroColegiado["cargo"];
}

const initialMembroForm: MembroFormData = {
  nome: "",
  segmento: "PROFESSOR",
  cargo: "TITULAR",
};

export function ColegiadoManager() {
  const { data: escolas = [] } = useEscolas();
  const [filterEscola, setFilterEscola] = useState<string>("ALL");

  const { data: colegiados = [], isLoading } = useColegiados(
    filterEscola !== "ALL" ? { escolaId: filterEscola } : undefined
  );

  const createColegiado = useCreateColegiado();
  const updateColegiado = useUpdateColegiado();
  const deleteColegiado = useDeleteColegiado();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColegiado, setEditingColegiado] =
    useState<ColegiadoEscolar | null>(null);
  const [formData, setFormData] = useState<ColegiadoFormData>(initialFormData);
  const [selectedColegiado, setSelectedColegiado] =
    useState<ColegiadoEscolar | null>(null);

  const handleOpenForm = (colegiado?: ColegiadoEscolar) => {
    if (colegiado) {
      setEditingColegiado(colegiado);
      setFormData({
        nome: colegiado.nome,
        escolaId: colegiado.escolaId,
        dataInicioMandato: colegiado.dataInicioMandato.split("T")[0],
        dataFimMandato: colegiado.dataFimMandato.split("T")[0],
      });
    } else {
      setEditingColegiado(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingColegiado(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.escolaId || !formData.dataInicioMandato || !formData.dataFimMandato) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingColegiado) {
        await updateColegiado.mutateAsync({
          id: editingColegiado.id,
          data: {
            nome: formData.nome,
            dataInicioMandato: formData.dataInicioMandato,
            dataFimMandato: formData.dataFimMandato,
          },
        });
      } else {
        await createColegiado.mutateAsync(formData);
      }
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este colegiado?")) return;

    try {
      await deleteColegiado.mutateAsync(id);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Colegiado Escolar</CardTitle>
              <CardDescription>
                Órgão colegiado de cada escola: mandato e composição por segmento
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Colegiado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 max-w-sm">
              <Label>Filtrar por Escola</Label>
              <Select value={filterEscola} onValueChange={setFilterEscola}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Escolas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : colegiados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UsersThree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum colegiado cadastrado</p>
              </div>
            ) : (
              colegiados.map((colegiado) => (
                <Card key={colegiado.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{colegiado.nome}</h3>
                          <Badge
                            className={
                              colegiado.ativo
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {colegiado.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">
                            {colegiado._count?.membros ?? 0} membro(s)
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Buildings className="h-4 w-4 text-muted-foreground" />
                            <span>{colegiado.escola?.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarBlank className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Mandato:{" "}
                              {new Date(colegiado.dataInicioMandato).toLocaleDateString("pt-BR", { timeZone: "UTC" })}{" "}
                              a{" "}
                              {new Date(colegiado.dataFimMandato).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedColegiado(colegiado)}
                          title="Gerenciar membros"
                        >
                          <UsersThree className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(colegiado)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(colegiado.id)}
                          aria-label="Excluir"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de formulário do colegiado */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingColegiado ? "Editar Colegiado" : "Novo Colegiado"}
            </DialogTitle>
            <DialogDescription>
              Defina a escola e o período de mandato do colegiado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Colegiado Escolar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Escola *</Label>
              <Select
                value={formData.escolaId}
                onValueChange={(value) => setFormData({ ...formData, escolaId: value })}
                disabled={!!editingColegiado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicioMandato">Início do Mandato *</Label>
                <Input
                  id="dataInicioMandato"
                  type="date"
                  value={formData.dataInicioMandato}
                  onChange={(e) =>
                    setFormData({ ...formData, dataInicioMandato: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFimMandato">Fim do Mandato *</Label>
                <Input
                  id="dataFimMandato"
                  type="date"
                  value={formData.dataFimMandato}
                  onChange={(e) =>
                    setFormData({ ...formData, dataFimMandato: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createColegiado.isPending || updateColegiado.isPending}
              >
                {(createColegiado.isPending || updateColegiado.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingColegiado ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de membros */}
      {selectedColegiado && (
        <MembrosDialog
          colegiado={selectedColegiado}
          onClose={() => setSelectedColegiado(null)}
        />
      )}
    </div>
  );
}

interface MembrosDialogProps {
  colegiado: ColegiadoEscolar;
  onClose: () => void;
}

function MembrosDialog({ colegiado, onClose }: MembrosDialogProps) {
  const { data: detalhe, isLoading } = useColegiado(colegiado.id);
  const addMembro = useAddMembroColegiado();
  const updateMembro = useUpdateMembroColegiado();
  const removeMembro = useRemoveMembroColegiado();

  const [membroForm, setMembroForm] = useState<MembroFormData>(initialMembroForm);
  const [editingMembro, setEditingMembro] = useState<MembroColegiado | null>(null);

  const membros = detalhe?.membros ?? [];

  const handleEditMembro = (membro: MembroColegiado) => {
    setEditingMembro(membro);
    setMembroForm({
      nome: membro.nome,
      segmento: membro.segmento,
      cargo: membro.cargo,
    });
  };

  const handleSubmitMembro = async () => {
    if (!membroForm.nome) {
      toast.error("Informe o nome do membro");
      return;
    }

    try {
      if (editingMembro) {
        await updateMembro.mutateAsync({
          membroId: editingMembro.id,
          colegiadoId: colegiado.id,
          data: membroForm,
        });
      } else {
        await addMembro.mutateAsync({
          colegiadoId: colegiado.id,
          data: membroForm,
        });
      }
      setMembroForm(initialMembroForm);
      setEditingMembro(null);
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleRemoveMembro = async (membroId: string) => {
    if (!window.confirm("Remover este membro do colegiado?")) return;

    try {
      await removeMembro.mutateAsync({ membroId, colegiadoId: colegiado.id });
    } catch {
      // Erro já tratado pelo hook
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membros — {colegiado.nome}</DialogTitle>
          <DialogDescription>{colegiado.escola?.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editingMembro ? "Editar Membro" : "Adicionar Membro"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={membroForm.nome}
                  onChange={(e) =>
                    setMembroForm({ ...membroForm, nome: e.target.value })
                  }
                  placeholder="Nome completo do membro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segmento *</Label>
                  <Select
                    value={membroForm.segmento}
                    onValueChange={(value) =>
                      setMembroForm({
                        ...membroForm,
                        segmento: value as SegmentoDemocratico,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(segmentoLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Select
                    value={membroForm.cargo}
                    onValueChange={(value) =>
                      setMembroForm({
                        ...membroForm,
                        cargo: value as MembroColegiado["cargo"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(cargoLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitMembro}
                  disabled={addMembro.isPending || updateMembro.isPending}
                  className="flex-1"
                >
                  {(addMembro.isPending || updateMembro.isPending) && (
                    <Spinner className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <UserPlus className="h-4 w-4 mr-2" />
                  {editingMembro ? "Atualizar Membro" : "Adicionar Membro"}
                </Button>
                {editingMembro && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingMembro(null);
                      setMembroForm(initialMembroForm);
                    }}
                  >
                    Cancelar edição
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold">Composição ({membros.length})</h3>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : membros.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum membro cadastrado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {membros.map((membro) => (
                  <Card key={membro.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{membro.nome}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">
                            {segmentoLabels[membro.segmento]}
                          </Badge>
                          <Badge variant="secondary">
                            {cargoLabels[membro.cargo]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMembro(membro)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMembro(membro.id)}
                          aria-label="Excluir"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
