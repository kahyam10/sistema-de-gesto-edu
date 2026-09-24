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
  Trash,
  Student,
  Buildings,
  Spinner,
  ChalkboardTeacher,
} from "@phosphor-icons/react";
import {
  useLideresTurma,
  useCreateLiderTurma,
  useDeleteLiderTurma,
} from "@/hooks/useDemocratica";
import { useEscolas, useTurmas, useMatriculas } from "@/hooks/useApi";
import { type LiderTurma } from "@/lib/api-democratica";
import { toast } from "sonner";

const tipoLabels: Record<LiderTurma["tipo"], string> = {
  LIDER: "Líder",
  VICE_LIDER: "Vice-Líder",
};

const tipoColors: Record<LiderTurma["tipo"], string> = {
  LIDER: "bg-blue-100 text-blue-800",
  VICE_LIDER: "bg-purple-100 text-purple-800",
};

const formaEscolhaLabels: Record<LiderTurma["formaEscolha"], string> = {
  ELEICAO: "Eleição",
  INDICACAO: "Indicação",
  VOLUNTARIO: "Voluntário",
};

interface LiderFormData {
  escolaId: string;
  turmaId: string;
  matriculaId: string;
  anoLetivo: string;
  tipo: LiderTurma["tipo"];
  formaEscolha: LiderTurma["formaEscolha"];
  dataEscolha: string;
}

const initialFormData: LiderFormData = {
  escolaId: "",
  turmaId: "",
  matriculaId: "",
  anoLetivo: new Date().getFullYear().toString(),
  tipo: "LIDER",
  formaEscolha: "ELEICAO",
  dataEscolha: "",
};

export function LiderTurmaManager() {
  const { data: escolas = [] } = useEscolas();
  const [filterEscola, setFilterEscola] = useState<string>("ALL");

  const { data: lideres = [], isLoading } = useLideresTurma(
    filterEscola !== "ALL" ? { escolaId: filterEscola } : undefined
  );

  const createLider = useCreateLiderTurma();
  const deleteLider = useDeleteLiderTurma();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<LiderFormData>(initialFormData);

  // Selects encadeados: Escola → Turma → Matrícula da turma
  const { data: turmas = [] } = useTurmas(
    formData.escolaId ? { escolaId: formData.escolaId } : undefined
  );
  const { data: matriculas = [] } = useMatriculas(
    formData.turmaId ? { turmaId: formData.turmaId } : undefined
  );

  const handleOpenForm = () => {
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.turmaId || !formData.matriculaId || !formData.anoLetivo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createLider.mutateAsync({
        turmaId: formData.turmaId,
        matriculaId: formData.matriculaId,
        anoLetivo: parseInt(formData.anoLetivo),
        tipo: formData.tipo,
        formaEscolha: formData.formaEscolha,
        dataEscolha: formData.dataEscolha || undefined,
      });
      handleCloseForm();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este líder de turma?"))
      return;

    try {
      await deleteLider.mutateAsync(id);
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
              <CardTitle>Líderes de Turma</CardTitle>
              <CardDescription>
                Um líder e um vice-líder por turma por ano letivo
              </CardDescription>
            </div>
            <Button onClick={handleOpenForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Líder
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
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : lideres.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Student className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum líder de turma registrado</p>
              </div>
            ) : (
              lideres.map((lider) => (
                <Card key={lider.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {lider.matricula?.nomeAluno}
                          </h3>
                          <Badge className={tipoColors[lider.tipo]}>
                            {tipoLabels[lider.tipo]}
                          </Badge>
                          <Badge variant="outline">{lider.anoLetivo}</Badge>
                          {!lider.ativo && (
                            <Badge className="bg-gray-100 text-gray-800">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <ChalkboardTeacher className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Turma {lider.turma?.nome} • {lider.turma?.turno}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Buildings className="h-4 w-4" />
                            <span>
                              Matrícula {lider.matricula?.numeroMatricula} •{" "}
                              {formaEscolhaLabels[lider.formaEscolha]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lider.id)}
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

      {/* Dialog de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Líder de Turma</DialogTitle>
            <DialogDescription>
              Selecione a escola, a turma e o aluno (a matrícula deve pertencer
              à turma)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Escola *</Label>
              <Select
                value={formData.escolaId}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    escolaId: value,
                    turmaId: "",
                    matriculaId: "",
                  })
                }
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
                <Label>Turma *</Label>
                <Select
                  value={formData.turmaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, turmaId: value, matriculaId: "" })
                  }
                  disabled={!formData.escolaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} — {turma.turno}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select
                  value={formData.matriculaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, matriculaId: value })
                  }
                  disabled={!formData.turmaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {matriculas.map((matricula) => (
                      <SelectItem key={matricula.id} value={matricula.id}>
                        {matricula.nomeAluno}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value as LiderTurma["tipo"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIDER">Líder</SelectItem>
                    <SelectItem value="VICE_LIDER">Vice-Líder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anoLetivo">Ano Letivo *</Label>
                <Input
                  id="anoLetivo"
                  type="number"
                  min={2020}
                  max={2100}
                  value={formData.anoLetivo}
                  onChange={(e) =>
                    setFormData({ ...formData, anoLetivo: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Escolha</Label>
                <Select
                  value={formData.formaEscolha}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      formaEscolha: value as LiderTurma["formaEscolha"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(formaEscolhaLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEscolha">Data da Escolha</Label>
                <Input
                  id="dataEscolha"
                  type="date"
                  value={formData.dataEscolha}
                  onChange={(e) =>
                    setFormData({ ...formData, dataEscolha: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLider.isPending}>
                {createLider.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
