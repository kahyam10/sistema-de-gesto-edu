"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEscolas, useTurmas, useProfissionais } from "@/hooks/useApi";
import { WarningCircle, CheckCircle, ChalkboardTeacher, MapPin } from "@phosphor-icons/react";
import { API_BASE_URL } from "@/lib/api";

interface GradeHorario {
  id: string;
  turmaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  disciplina: string;
  profissionalId?: string | null;
  salaId?: string | null;
  turma?: {
    nome: string;
    turno: string;
  };
}

interface Conflito {
  tipo: "PROFESSOR" | "SALA" | "TURMA";
  descricao: string;
  horarios: GradeHorario[];
  severidade: "ALTA" | "MEDIA";
}

const DIAS_SEMANA = [
  { value: "SEGUNDA", label: "Segunda-feira" },
  { value: "TERCA", label: "Terça-feira" },
  { value: "QUARTA", label: "Quarta-feira" },
  { value: "QUINTA", label: "Quinta-feira" },
  { value: "SEXTA", label: "Sexta-feira" },
  { value: "SABADO", label: "Sábado" },
] as const;

export function ConflitosHorarioManager() {
  const anoAtual = new Date().getFullYear();
  const [selectedEscolaId, setSelectedEscolaId] = useState<string>("");
  const [gradeHoraria, setGradeHoraria] = useState<GradeHorario[]>([]);
  const [loadingGrade, setLoadingGrade] = useState(false);

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: turmas = [] } = useTurmas(
    selectedEscolaId ? { escolaId: selectedEscolaId } : undefined
  );
  const { data: profissionais = [] } = useProfissionais();

  // Buscar grade horária de todas as turmas da escola
  const fetchGradeEscola = async (escolaId: string) => {
    setLoadingGrade(true);
    try {
      const token = localStorage.getItem("token");
      const turmasDaEscola = turmas.filter((t) => t.escolaId === escolaId);

      const promises = turmasDaEscola.map(async (turma) => {
        const response = await fetch(
          `${API_BASE_URL}/grade-horaria/${turma.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((g: GradeHorario) => ({
          ...g,
          turma: { nome: turma.nome, turno: turma.turno },
        }));
      });

      const results = await Promise.all(promises);
      setGradeHoraria(results.flat());
    } catch (error) {
      console.error("Erro ao buscar grade horária:", error);
      setGradeHoraria([]);
    } finally {
      setLoadingGrade(false);
    }
  };

  // Atualiza grade quando escola é selecionada
  useMemo(() => {
    if (selectedEscolaId && turmas.length > 0) {
      fetchGradeEscola(selectedEscolaId);
    } else {
      setGradeHoraria([]);
    }
  }, [selectedEscolaId, turmas]);

  // Detecta conflitos
  const conflitos = useMemo(() => {
    const conflitosList: Conflito[] = [];

    // Função auxiliar para verificar sobreposição de horários
    const horariosColidem = (h1: GradeHorario, h2: GradeHorario) => {
      if (h1.diaSemana !== h2.diaSemana) return false;
      const inicio1 = h1.horaInicio;
      const fim1 = h1.horaFim;
      const inicio2 = h2.horaInicio;
      const fim2 = h2.horaFim;

      return !(fim1 <= inicio2 || fim2 <= inicio1);
    };

    // 1. Conflitos de professor
    const profsPorHorario = new Map<string, GradeHorario[]>();
    gradeHoraria.forEach((h) => {
      if (h.profissionalId) {
        const key = `${h.profissionalId}-${h.diaSemana}-${h.horaInicio}`;
        if (!profsPorHorario.has(key)) {
          profsPorHorario.set(key, []);
        }
        profsPorHorario.get(key)!.push(h);
      }
    });

    profsPorHorario.forEach((horarios, key) => {
      if (horarios.length > 1) {
        const profId = horarios[0].profissionalId;
        const prof = profissionais.find((p) => p.id === profId);
        conflitosList.push({
          tipo: "PROFESSOR",
          descricao: `Professor(a) ${prof?.nome || "Desconhecido"} em múltiplas turmas ao mesmo tempo`,
          horarios,
          severidade: "ALTA",
        });
      }
    });

    // 2. Conflitos de sala
    const salasPorHorario = new Map<string, GradeHorario[]>();
    gradeHoraria.forEach((h) => {
      if (h.salaId) {
        const key = `${h.salaId}-${h.diaSemana}-${h.horaInicio}`;
        if (!salasPorHorario.has(key)) {
          salasPorHorario.set(key, []);
        }
        salasPorHorario.get(key)!.push(h);
      }
    });

    salasPorHorario.forEach((horarios) => {
      if (horarios.length > 1) {
        conflitosList.push({
          tipo: "SALA",
          descricao: `Sala compartilhada por múltiplas turmas ao mesmo tempo`,
          horarios,
          severidade: "MEDIA",
        });
      }
    });

    // 3. Conflitos de turma (mesma turma em dois horários sobrepostos)
    const turmasPorId = new Map<string, GradeHorario[]>();
    gradeHoraria.forEach((h) => {
      if (!turmasPorId.has(h.turmaId)) {
        turmasPorId.set(h.turmaId, []);
      }
      turmasPorId.get(h.turmaId)!.push(h);
    });

    turmasPorId.forEach((horarios, turmaId) => {
      for (let i = 0; i < horarios.length; i++) {
        for (let j = i + 1; j < horarios.length; j++) {
          if (horariosColidem(horarios[i], horarios[j])) {
            conflitosList.push({
              tipo: "TURMA",
              descricao: `Turma ${horarios[i].turma?.nome || "Desconhecida"} com horários sobrepostos`,
              horarios: [horarios[i], horarios[j]],
              severidade: "ALTA",
            });
          }
        }
      }
    });

    return conflitosList;
  }, [gradeHoraria, profissionais]);

  const getProfissionalNome = (id?: string | null) => {
    if (!id) return "Não atribuído";
    const prof = profissionais.find((p) => p.id === id);
    return prof?.nome || "Desconhecido";
  };

  const getDiaLabel = (value: string) =>
    DIAS_SEMANA.find((d) => d.value === value)?.label || value;

  const getConflitoBadge = (tipo: Conflito["tipo"]) => {
    switch (tipo) {
      case "PROFESSOR":
        return <Badge variant="destructive">Professor</Badge>;
      case "SALA":
        return <Badge className="bg-yellow-600">Sala</Badge>;
      case "TURMA":
        return <Badge variant="destructive">Turma</Badge>;
    }
  };

  const getConflitIcon = (tipo: Conflito["tipo"]) => {
    switch (tipo) {
      case "PROFESSOR":
        return <ChalkboardTeacher size={20} className="text-red-600" weight="fill" />;
      case "SALA":
        return <MapPin size={20} className="text-yellow-600" weight="fill" />;
      case "TURMA":
        return <WarningCircle size={20} className="text-red-600" weight="fill" />;
    }
  };

  if (loadingEscolas) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WarningCircle size={24} />
            Detecção de Conflitos de Horário
          </CardTitle>
          <CardDescription>
            Identifique conflitos de professores, salas e turmas na grade horária
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Escola</Label>
            <Select value={selectedEscolaId} onValueChange={setSelectedEscolaId}>
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
        </CardContent>
      </Card>

      {selectedEscolaId && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total de Aulas
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{gradeHoraria.length}</p>
              </CardContent>
            </Card>

            <Card
              className={
                conflitos.length === 0
                  ? "bg-green-50 dark:bg-green-950 border-green-200"
                  : "bg-red-50 dark:bg-red-950 border-red-200"
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className={`text-sm ${
                      conflitos.length === 0
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    Conflitos Detectados
                  </CardTitle>
                  {conflitos.length === 0 ? (
                    <CheckCircle size={20} className="text-green-600" weight="fill" />
                  ) : (
                    <WarningCircle size={20} className="text-red-600" weight="fill" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-3xl font-bold ${
                    conflitos.length === 0
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {conflitos.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    Turmas Analisadas
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {new Set(gradeHoraria.map((g) => g.turmaId)).size}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de conflitos */}
          <Card>
            <CardHeader>
              <CardTitle>Conflitos Identificados</CardTitle>
              <CardDescription>
                {conflitos.length === 0
                  ? "Nenhum conflito encontrado na grade horária"
                  : `${conflitos.length} conflito(s) necessita(m) de atenção`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGrade ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : conflitos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} className="text-green-600 mb-4" weight="duotone" />
                  <p className="text-lg font-medium text-green-600">
                    Nenhum conflito detectado!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    A grade horária está consistente e sem sobreposições
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflitos.map((conflito, idx) => (
                    <Card key={idx} className="border-red-200 bg-red-50 dark:bg-red-950">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          {getConflitIcon(conflito.tipo)}
                          <CardTitle className="text-sm text-red-900 dark:text-red-100">
                            {conflito.descricao}
                          </CardTitle>
                          {getConflitoBadge(conflito.tipo)}
                          <Badge variant="outline" className="ml-auto">
                            {conflito.severidade === "ALTA" ? "Alta Prioridade" : "Média Prioridade"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Turma</TableHead>
                              <TableHead>Dia da Semana</TableHead>
                              <TableHead>Horário</TableHead>
                              <TableHead>Disciplina</TableHead>
                              <TableHead>Professor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conflito.horarios.map((horario) => (
                              <TableRow key={horario.id}>
                                <TableCell className="font-medium">
                                  {horario.turma?.nome || "Desconhecida"}
                                  <br />
                                  <span className="text-xs text-muted-foreground">
                                    {horario.turma?.turno}
                                  </span>
                                </TableCell>
                                <TableCell>{getDiaLabel(horario.diaSemana)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {horario.horaInicio} - {horario.horaFim}
                                  </Badge>
                                </TableCell>
                                <TableCell>{horario.disciplina}</TableCell>
                                <TableCell>
                                  {getProfissionalNome(horario.profissionalId)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                Sobre a Detecção de Conflitos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-blue-900 dark:text-blue-100">
              <p>
                • <strong>Conflito de Professor:</strong> O mesmo professor está alocado em
                diferentes turmas no mesmo horário
              </p>
              <p>
                • <strong>Conflito de Sala:</strong> A mesma sala está reservada para múltiplas
                turmas simultaneamente
              </p>
              <p>
                • <strong>Conflito de Turma:</strong> A turma possui horários sobrepostos na grade
              </p>
              <p className="mt-4">
                <strong>Dica:</strong> Resolva conflitos de alta prioridade primeiro para garantir
                o bom funcionamento das aulas.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
