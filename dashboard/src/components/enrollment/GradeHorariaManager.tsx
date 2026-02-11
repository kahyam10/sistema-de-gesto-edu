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
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Plus,
  Trash,
  Spinner,
  CalendarBlank,
  ChalkboardTeacher,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEscolas,
  useTurmas,
  useProfissionais,
  useGradeHoraria,
  useCreateGradeHorario,
  useDeleteGradeHorario,
  useDisciplinas,
} from "@/hooks/useApi";
import type { GradeHorario } from "@/lib/api";

const DIAS_SEMANA = [
  { value: "SEGUNDA", label: "Segunda-feira" },
  { value: "TERCA", label: "Terca-feira" },
  { value: "QUARTA", label: "Quarta-feira" },
  { value: "QUINTA", label: "Quinta-feira" },
  { value: "SEXTA", label: "Sexta-feira" },
  { value: "SABADO", label: "Sabado" },
] as const;

const HORARIOS_PADRAO = [
  { inicio: "07:30", fim: "08:20" },
  { inicio: "08:20", fim: "09:10" },
  { inicio: "09:10", fim: "09:30", intervalo: true },
  { inicio: "09:30", fim: "10:20" },
  { inicio: "10:20", fim: "11:10" },
  { inicio: "11:10", fim: "12:00" },
  { inicio: "13:00", fim: "13:50" },
  { inicio: "13:50", fim: "14:40" },
  { inicio: "14:40", fim: "15:00", intervalo: true },
  { inicio: "15:00", fim: "15:50" },
  { inicio: "15:50", fim: "16:40" },
  { inicio: "16:40", fim: "17:30" },
];

export function GradeHorariaManager() {
  const [selectedEscolaId, setSelectedEscolaId] = useState<string>("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formDia, setFormDia] = useState<string>("");
  const [formHoraInicio, setFormHoraInicio] = useState("");
  const [formHoraFim, setFormHoraFim] = useState("");
  const [formDisciplina, setFormDisciplina] = useState("");
  const [formProfissionalId, setFormProfissionalId] = useState("");

  // Queries
  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: turmas = [] } = useTurmas(
    selectedEscolaId ? { escolaId: selectedEscolaId } : undefined
  );
  const { data: profissionais = [] } = useProfissionais();
  const { data: gradeHoraria = [], isLoading: loadingGrade } =
    useGradeHoraria(selectedTurmaId);
  const { data: disciplinas = [] } = useDisciplinas();

  // Mutations
  const createGrade = useCreateGradeHorario();
  const deleteGrade = useDeleteGradeHorario();

  // Organizar grade por dia da semana
  const gradeByDia = useMemo(() => {
    const map: Record<string, GradeHorario[]> = {};
    for (const dia of DIAS_SEMANA) {
      map[dia.value] = gradeHoraria
        .filter((g) => g.diaSemana === dia.value)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    return map;
  }, [gradeHoraria]);

  const handleSubmit = async () => {
    if (!formDia || !formHoraInicio || !formHoraFim || !formDisciplina) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    try {
      await createGrade.mutateAsync({
        turmaId: selectedTurmaId,
        diaSemana: formDia as GradeHorario["diaSemana"],
        horaInicio: formHoraInicio,
        horaFim: formHoraFim,
        disciplina: formDisciplina,
        profissionalId: formProfissionalId || undefined,
      });
      setShowAddDialog(false);
      resetForm();
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGrade.mutateAsync({ id, turmaId: selectedTurmaId });
      setDeleteConfirmId(null);
    } catch {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setFormDia("");
    setFormHoraInicio("");
    setFormHoraFim("");
    setFormDisciplina("");
    setFormProfissionalId("");
  };

  const getDiaLabel = (value: string) =>
    DIAS_SEMANA.find((d) => d.value === value)?.label || value;

  const getProfissionalNome = (id?: string | null) => {
    if (!id) return "Nao atribuido";
    const prof = profissionais.find((p) => p.id === id);
    return prof?.nome || "Desconhecido";
  };

  if (loadingEscolas) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selecao de escola e turma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Grade Horaria
          </CardTitle>
          <CardDescription>
            Selecione a escola e a turma para gerenciar a grade horaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select
                value={selectedEscolaId}
                onValueChange={(v) => {
                  setSelectedEscolaId(v);
                  setSelectedTurmaId("");
                }}
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

            <div className="space-y-2">
              <Label>Turma</Label>
              <Select
                value={selectedTurmaId}
                onValueChange={setSelectedTurmaId}
                disabled={!selectedEscolaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.turno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Horaria */}
      {selectedTurmaId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarBlank className="h-5 w-5" />
                Horarios da Turma
              </CardTitle>
              <CardDescription>
                {gradeHoraria.length} aulas cadastradas na grade
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Horario
            </Button>
          </CardHeader>
          <CardContent>
            {loadingGrade ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : gradeHoraria.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum horario cadastrado para esta turma</p>
                <p className="text-sm mt-1">
                  Clique em &quot;Adicionar Horario&quot; para comecar
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {DIAS_SEMANA.map((dia) => {
                  const aulas = gradeByDia[dia.value] || [];
                  if (aulas.length === 0) return null;

                  return (
                    <div key={dia.value}>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <CalendarBlank className="h-4 w-4" />
                        {dia.label}
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">
                              Horario
                            </TableHead>
                            <TableHead>Disciplina</TableHead>
                            <TableHead>Professor</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aulas.map((aula) => (
                            <TableRow key={aula.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {aula.horaInicio} - {aula.horaFim}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {aula.disciplina}
                              </TableCell>
                              <TableCell className="flex items-center gap-1">
                                <ChalkboardTeacher className="h-4 w-4 text-muted-foreground" />
                                {getProfissionalNome(aula.profissionalId)}
                              </TableCell>
                              <TableCell>
                                {deleteConfirmId === aula.id ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDelete(aula.id)}
                                      disabled={deleteGrade.isPending}
                                    >
                                      {deleteGrade.isPending ? (
                                        <Spinner className="h-3 w-3 animate-spin" />
                                      ) : (
                                        "Sim"
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Nao
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteConfirmId(aula.id)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Adicionar Horario */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Horario</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo horario na grade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dia da Semana *</Label>
              <Select value={formDia} onValueChange={setFormDia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Inicio *</Label>
                <Select
                  value={formHoraInicio}
                  onValueChange={(v) => {
                    setFormHoraInicio(v);
                    const horario = HORARIOS_PADRAO.find(
                      (h) => h.inicio === v && !h.intervalo
                    );
                    if (horario) setFormHoraFim(horario.fim);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Inicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {HORARIOS_PADRAO.filter((h) => !h.intervalo).map((h) => (
                      <SelectItem key={h.inicio} value={h.inicio}>
                        {h.inicio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hora Fim *</Label>
                <Input
                  type="time"
                  value={formHoraFim}
                  onChange={(e) => setFormHoraFim(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Disciplina *</Label>
              {disciplinas.length > 0 ? (
                <Select
                  value={formDisciplina}
                  onValueChange={setFormDisciplina}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.map((d) => (
                      <SelectItem key={d.id} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Nome da disciplina"
                  value={formDisciplina}
                  onChange={(e) => setFormDisciplina(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Professor</Label>
              <Select
                value={formProfissionalId}
                onValueChange={setFormProfissionalId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais
                    .filter((p) => p.tipo === "PROFESSOR")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createGrade.isPending}
              >
                {createGrade.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
