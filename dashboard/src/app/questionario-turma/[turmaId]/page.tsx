"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Save, Download, Users, ArrowLeft, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  QuestionarioTurmaFormData,
  DiasSemana,
  initialTurmaFormData,
  opcoesTipoMediacao,
  opcoesLocalFuncionamentoDiferenciado,
  opcoesTipoTurma,
  opcoesEtapaEnsino,
  opcoesEducacaoInfantil,
  opcoesEnsinoFundamental,
  opcoesEnsinoMedio,
  opcoesNormalMagisterio,
  opcoesEJA,
  opcoesCursoTecnico,
  opcoesOrganizacaoCurricular,
  opcoesAreasItinerario,
  opcoesTipoItinerarioTecnico,
  opcoesFormasOrganizacao,
  diasSemanaConfig,
  componentesCurricularesOpcoes,
} from "@/lib/types/questionario-turma";

import { useTurma, useEscola, useSaveCensoTurma } from "@/hooks/useApi";

// Componente de Seção Colapsável
function SectionCard({
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="border-l-4 border-l-primary">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                  <CardDescription className="mt-1">{description}</CardDescription>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Componente de Campo Radio
function RadioField({
  label,
  name,
  options,
  value,
  onChange,
  required,
  columns,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className={columns === 3 ? "grid grid-cols-2 md:grid-cols-3 gap-2" : "flex flex-col space-y-2"}
      >
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${name}-${option}`} />
            <Label htmlFor={`${name}-${option}`} className="font-normal cursor-pointer text-sm">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

// Componente de Campo Checkbox Multiple
function CheckboxField({
  label,
  options,
  values,
  onChange,
  description,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  description?: string;
}) {
  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...values, option]);
    } else {
      onChange(values.filter((v) => v !== option));
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={option}
              checked={values.includes(option)}
              onCheckedChange={(checked) => handleChange(option, checked as boolean)}
            />
            <Label htmlFor={option} className="font-normal cursor-pointer text-sm">
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuestionarioTurmaIdPage() {
  const params = useParams();
  const router = useRouter();
  const turmaId = params.turmaId as string;
  
  const { data: turma, isLoading: loadingTurma, error: errorTurma } = useTurma(turmaId);
  const { data: escola, isLoading: loadingEscola } = useEscola(turma?.escolaId || "");
  const saveCenso = useSaveCensoTurma();

  const [formData, setFormData] = useState<QuestionarioTurmaFormData>(initialTurmaFormData);
  const isSaving = saveCenso.isPending;
  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    horarios: false,
    etapas: false,
    organizacao: false,
    componentes: false,
  });

  // Preencher dados da turma quando carregada
  useEffect(() => {
    if (turma && escola) {
      // Mapear turno para horário padrão
      const turnoHorarios: Record<string, { inicio: string; fim: string }> = {
        MATUTINO: { inicio: "07:00", fim: "11:30" },
        VESPERTINO: { inicio: "13:00", fim: "17:30" },
        NOTURNO: { inicio: "19:00", fim: "22:00" },
        INTEGRAL: { inicio: "07:00", fim: "17:30" },
      };
      
      const horario = turnoHorarios[turma.turno] || { inicio: "", fim: "" };
      
      // Dias ativos baseado no turno (segunda a sexta por padrão)
      const diasAtivos: DiasSemana = {
        domingo: { ativo: false, horaInicial: "", horaFinal: "" },
        segunda: { ativo: true, horaInicial: horario.inicio, horaFinal: horario.fim },
        terca: { ativo: true, horaInicial: horario.inicio, horaFinal: horario.fim },
        quarta: { ativo: true, horaInicial: horario.inicio, horaFinal: horario.fim },
        quinta: { ativo: true, horaInicial: horario.inicio, horaFinal: horario.fim },
        sexta: { ativo: true, horaInicial: horario.inicio, horaFinal: horario.fim },
        sabado: { ativo: false, horaInicial: "", horaFinal: "" },
      };

      let censoSalvo: Partial<QuestionarioTurmaFormData> = {};
      if (turma.dadosCenso) {
        try {
          censoSalvo = JSON.parse(turma.dadosCenso);
        } catch {
          censoSalvo = {};
        }
      }

      setFormData((prev) => ({
        ...prev,
        tipoMediacaoPedagogica: "Presencial",
        diasSemana: diasAtivos,
        horarioUnificado: "Sim",
        tipoTurma: "Curricular (etapa de ensino)",
        ...censoSalvo,
        codigoEscola: escola.codigo || "",
        nomeEscola: escola.nome || "",
        nomeTurma: turma.nome || "",
      }));
    }
  }, [turma, escola]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = <K extends keyof QuestionarioTurmaFormData>(
    field: K,
    value: QuestionarioTurmaFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDiaSemanaChange = (
    dia: keyof DiasSemana,
    campo: 'ativo' | 'horaInicial' | 'horaFinal',
    valor: boolean | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      diasSemana: {
        ...prev.diasSemana,
        [dia]: {
          ...prev.diasSemana[dia],
          [campo]: valor,
        },
      },
    }));
  };

  const handleComponenteChange = (codigo: string, checked: boolean) => {
    if (checked) {
      handleInputChange("componentesCurriculares", [...formData.componentesCurriculares, codigo]);
    } else {
      handleInputChange(
        "componentesCurriculares",
        formData.componentesCurriculares.filter((c) => c !== codigo)
      );
    }
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify({ turmaId, ...formData }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `censo-turma-${turma?.nome || turmaId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    // Toasts de sucesso/erro são exibidos pelo hook useSaveCensoTurma
    try {
      await saveCenso.mutateAsync({ id: turmaId, dados: { ...formData } });
    } catch {
      // erro já tratado no hook
    }
  };

  // Calcular progresso geral
  const calcularProgresso = () => {
    const camposObrigatorios = [
      formData.codigoEscola,
      formData.nomeEscola,
      formData.nomeTurma,
      formData.tipoMediacaoPedagogica,
      formData.tipoTurma,
    ];
    const preenchidos = camposObrigatorios.filter((c) => c && c.length > 0).length;
    return Math.round((preenchidos / camposObrigatorios.length) * 100);
  };

  // Verifica se deve mostrar etapas de ensino
  const mostrarEtapasEnsino =
    formData.tipoTurma === "Curricular (etapa de ensino)" ||
    formData.tipoTurma === "Curricular (etapa de ensino) com Atividade complementar";

  // Verifica se deve mostrar organização curricular (Ensino Médio)
  const mostrarOrganizacaoCurricular =
    formData.etapaEnsino === "ensino-medio" || formData.etapaEnsino === "ensino-medio-normal";

  const isLoading = loadingTurma || loadingEscola;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (errorTurma || !turma) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 text-muted-foreground h-12 w-12" />
            <h2 className="text-xl font-semibold mb-2">Turma não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar a turma com o ID informado.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Censo Escolar 2025</h1>
                <p className="text-xs text-muted-foreground">Questionário de Turma</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </header>

      {/* Info da Turma */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{turma.nome}</h2>
                <Badge variant="outline">{turma.turno}</Badge>
                <Badge variant={turma.ativo ? "default" : "secondary"}>
                  {turma.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {escola?.nome || "Escola"} • {turma.serie?.nome || "Série"} • Capacidade: {turma.capacidadeMaxima} alunos
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Progresso do questionário</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={calcularProgresso()} className="w-32" />
                <span className="text-sm text-muted-foreground">{calcularProgresso()}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* IDENTIFICAÇÃO DA TURMA */}
          <SectionCard
            title="Identificação da Turma"
            description="Dados básicos e características da turma"
            isOpen={expandedSections.identificacao}
            onToggle={() => toggleSection("identificacao")}
          >
            <div className="space-y-6">
              {/* Info da Escola (somente leitura) */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium">Dados da escola (preenchidos automaticamente)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Código</p>
                    <p className="font-medium">{formData.codigoEscola}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nome da escola</p>
                    <p className="font-medium">{formData.nomeEscola}</p>
                  </div>
                </div>
              </div>

              {/* Nome da Turma */}
              <div className="space-y-2">
                <Label htmlFor="nomeTurma">
                  Nome da turma <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeTurma"
                  value={formData.nomeTurma}
                  onChange={(e) => handleInputChange("nomeTurma", e.target.value)}
                  placeholder="Ex: 5º Ano A, 9º Ano B, etc."
                />
              </div>

              {/* Tipo de Mediação */}
              <RadioField
                label="Tipo de mediação didático-pedagógica"
                name="tipoMediacaoPedagogica"
                options={opcoesTipoMediacao}
                value={formData.tipoMediacaoPedagogica}
                onChange={(value) => handleInputChange("tipoMediacaoPedagogica", value)}
                required
              />

              {/* Turma de Educação Especial */}
              <RadioField
                label="Turma de Educação Especial (classe especial)"
                name="turmaEducacaoEspecial"
                options={["Sim", "Não"]}
                value={formData.turmaEducacaoEspecial}
                onChange={(value) => handleInputChange("turmaEducacaoEspecial", value as 'Sim' | 'Não')}
              />

              {/* Turma Bilíngue de Surdos */}
              <RadioField
                label="Turma de Educação Bilíngue de Surdos (classe bilíngue de surdos)"
                name="turmaBilingueSurdos"
                options={["Sim", "Não"]}
                value={formData.turmaBilingueSurdos}
                onChange={(value) => handleInputChange("turmaBilingueSurdos", value as 'Sim' | 'Não')}
              />

              {/* Turma de Alternância */}
              <RadioField
                label="Turma de Formação por Alternância (tempo-escola e tempo-comunidade)"
                name="turmaFormacaoAlternancia"
                options={["Sim", "Não"]}
                value={formData.turmaFormacaoAlternancia}
                onChange={(value) => handleInputChange("turmaFormacaoAlternancia", value as 'Sim' | 'Não')}
              />

              {/* Local de Funcionamento Diferenciado */}
              <RadioField
                label="Local de funcionamento diferenciado da turma"
                name="localFuncionamentoDiferenciado"
                options={opcoesLocalFuncionamentoDiferenciado}
                value={formData.localFuncionamentoDiferenciado}
                onChange={(value) => handleInputChange("localFuncionamentoDiferenciado", value)}
              />
            </div>
          </SectionCard>

          {/* HORÁRIOS */}
          <SectionCard
            title="Dias da Semana e Horários de Funcionamento"
            description="Configuração dos dias e horários de funcionamento da turma"
            isOpen={expandedSections.horarios}
            onToggle={() => toggleSection("horarios")}
          >
            <div className="space-y-6">
              {/* Horário Unificado */}
              <RadioField
                label="Turma funciona no mesmo horário para todos os dias"
                name="horarioUnificado"
                options={["Sim", "Não"]}
                value={formData.horarioUnificado}
                onChange={(value) => handleInputChange("horarioUnificado", value as 'Sim' | 'Não')}
              />

              {/* Dias da Semana */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Horários por dia da semana</Label>
                </div>

                {diasSemanaConfig.map((dia) => (
                  <Card key={dia.key} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          id={`dia-${dia.key}`}
                          checked={formData.diasSemana[dia.key].ativo}
                          onCheckedChange={(checked) =>
                            handleDiaSemanaChange(dia.key, "ativo", checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`dia-${dia.key}`}
                          className="font-semibold cursor-pointer"
                        >
                          {dia.label}
                        </Label>
                      </div>

                      {formData.diasSemana[dia.key].ativo && (
                        <div className="grid grid-cols-2 gap-4 ml-7">
                          <div className="space-y-2">
                            <Label className="text-xs">Hora inicial</Label>
                            <Input
                              type="time"
                              value={formData.diasSemana[dia.key].horaInicial}
                              onChange={(e) =>
                                handleDiaSemanaChange(dia.key, "horaInicial", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Hora final</Label>
                            <Input
                              type="time"
                              value={formData.diasSemana[dia.key].horaFinal}
                              onChange={(e) =>
                                handleDiaSemanaChange(dia.key, "horaFinal", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* TIPO DE TURMA E ETAPAS */}
          <SectionCard
            title="Tipo de Turma e Etapas de Ensino"
            description="Configuração do tipo da turma e etapa de ensino"
            isOpen={expandedSections.etapas}
            onToggle={() => toggleSection("etapas")}
          >
            <div className="space-y-6">
              {/* Tipo de Turma */}
              <RadioField
                label="Tipo de turma"
                name="tipoTurma"
                options={opcoesTipoTurma}
                value={formData.tipoTurma}
                onChange={(value) => handleInputChange("tipoTurma", value)}
                required
              />

              {/* Etapa de Ensino */}
              {mostrarEtapasEnsino && (
                <div className="space-y-2">
                  <Label>
                    Etapa de ensino <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.etapaEnsino}
                    onValueChange={(value) => handleInputChange("etapaEnsino", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a etapa de ensino..." />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesEtapaEnsino.map((etapa) => (
                        <SelectItem key={etapa.value} value={etapa.value}>
                          {etapa.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Educação Infantil */}
              {formData.etapaEnsino === "educacao-infantil" && (
                <RadioField
                  label="Educação infantil"
                  name="subEtapaEducacaoInfantil"
                  options={opcoesEducacaoInfantil}
                  value={formData.subEtapaEducacaoInfantil}
                  onChange={(value) => handleInputChange("subEtapaEducacaoInfantil", value)}
                />
              )}

              {/* Ensino Fundamental */}
              {formData.etapaEnsino === "ensino-fundamental" && (
                <RadioField
                  label="Ensino fundamental (9 anos)"
                  name="anoSerieEnsFundamental"
                  options={opcoesEnsinoFundamental}
                  value={formData.anoSerieEnsFundamental}
                  onChange={(value) => handleInputChange("anoSerieEnsFundamental", value)}
                  columns={3}
                />
              )}

              {/* Ensino Médio */}
              {formData.etapaEnsino === "ensino-medio" && (
                <RadioField
                  label="Ensino médio"
                  name="anoSerieEnsMedio"
                  options={opcoesEnsinoMedio}
                  value={formData.anoSerieEnsMedio}
                  onChange={(value) => handleInputChange("anoSerieEnsMedio", value)}
                />
              )}

              {/* Ensino Médio Normal/Magistério */}
              {formData.etapaEnsino === "ensino-medio-normal" && (
                <RadioField
                  label="Ensino médio – Normal/Magistério"
                  name="anoSerieNormalMagisterio"
                  options={opcoesNormalMagisterio}
                  value={formData.anoSerieNormalMagisterio}
                  onChange={(value) => handleInputChange("anoSerieNormalMagisterio", value)}
                />
              )}

              {/* EJA */}
              {formData.etapaEnsino === "eja" && (
                <RadioField
                  label="Educação de jovens e adultos (EJA)"
                  name="etapaEJA"
                  options={opcoesEJA}
                  value={formData.etapaEJA}
                  onChange={(value) => handleInputChange("etapaEJA", value)}
                />
              )}

              {/* Curso Técnico */}
              {formData.etapaEnsino === "curso-tecnico" && (
                <>
                  <RadioField
                    label="Curso Técnico e FIC"
                    name="tipoItinerarioTecnico"
                    options={opcoesCursoTecnico}
                    value={formData.tipoItinerarioTecnico}
                    onChange={(value) => handleInputChange("tipoItinerarioTecnico", value)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigoCurso">Código do curso</Label>
                      <Input
                        id="codigoCurso"
                        value={formData.codigoCurso}
                        onChange={(e) => handleInputChange("codigoCurso", e.target.value)}
                        placeholder="Código"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeCurso">Nome do curso</Label>
                      <Input
                        id="nomeCurso"
                        value={formData.nomeCurso}
                        onChange={(e) => handleInputChange("nomeCurso", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Atividade Complementar */}
              {formData.tipoTurma === "Atividade complementar" && (
                <div className="space-y-2">
                  <Label htmlFor="tipoAtividadeComplementar">Tipo de atividade complementar</Label>
                  <Input
                    id="tipoAtividadeComplementar"
                    value={formData.tipoAtividadeComplementar}
                    onChange={(e) => handleInputChange("tipoAtividadeComplementar", e.target.value)}
                    placeholder="Código da atividade complementar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ver código no Caderno de Conceitos e Orientações do Censo Escolar
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ORGANIZAÇÃO CURRICULAR */}
          <SectionCard
            title="Organização Curricular"
            description="Configuração da organização curricular e formas de organização"
            isOpen={expandedSections.organizacao}
            onToggle={() => toggleSection("organizacao")}
          >
            <div className="space-y-6">
              {/* Organização Curricular - Ensino Médio */}
              {mostrarOrganizacaoCurricular && (
                <>
                  <CheckboxField
                    label="Organização curricular da turma"
                    description="Obrigatório para turmas de Ensino Médio e Ensino Médio Normal/Magistério"
                    options={opcoesOrganizacaoCurricular}
                    values={formData.organizacaoCurricular}
                    onChange={(values) => handleInputChange("organizacaoCurricular", values)}
                  />

                  {/* Áreas do Itinerário Formativo */}
                  {formData.organizacaoCurricular.includes(
                    "Itinerário formativo de aprofundamento (IFA)"
                  ) && (
                    <CheckboxField
                      label="Área(s) do itinerário formativo de aprofundamento"
                      options={opcoesAreasItinerario}
                      values={formData.areasItinerarioFormativo}
                      onChange={(values) => handleInputChange("areasItinerarioFormativo", values)}
                    />
                  )}

                  {/* Tipo de Itinerário Técnico */}
                  {formData.organizacaoCurricular.includes(
                    "Itinerário de formação técnica e profissional (IFTP)"
                  ) && (
                    <>
                      <RadioField
                        label="Tipo do curso do itinerário de formação técnica e profissional"
                        name="tipoItinerarioTecnico"
                        options={opcoesTipoItinerarioTecnico}
                        value={formData.tipoItinerarioTecnico}
                        onChange={(value) => handleInputChange("tipoItinerarioTecnico", value)}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="codigoCursoOrg">Código do curso</Label>
                          <Input
                            id="codigoCursoOrg"
                            value={formData.codigoCurso}
                            onChange={(e) => handleInputChange("codigoCurso", e.target.value)}
                            placeholder="Código"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nomeCursoOrg">Nome do curso</Label>
                          <Input
                            id="nomeCursoOrg"
                            value={formData.nomeCurso}
                            onChange={(e) => handleInputChange("nomeCurso", e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Formas de Organização */}
              <CheckboxField
                label="Formas de organização da turma"
                options={opcoesFormasOrganizacao}
                values={formData.formasOrganizacao}
                onChange={(values) => handleInputChange("formasOrganizacao", values)}
              />
            </div>
          </SectionCard>

          {/* COMPONENTES CURRICULARES */}
          <SectionCard
            title="Componentes Curriculares"
            description="Áreas do conhecimento e componentes curriculares da turma"
            isOpen={expandedSections.componentes}
            onToggle={() => toggleSection("componentes")}
          >
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Áreas do conhecimento/componentes curriculares
                <span className="block text-xs mt-1">
                  (Obrigatório para turmas com Etapa de ensino, exceto educação infantil e turmas
                  exclusivas de Itinerário formativo)
                </span>
              </p>

              {componentesCurricularesOpcoes.map((area) => (
                <Card key={area.categoria} className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-primary">{area.categoria}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {area.opcoes.map((opcao) => (
                        <div key={opcao.codigo} className="flex items-center space-x-2">
                          <Checkbox
                            id={`componente-${opcao.codigo}`}
                            checked={formData.componentesCurriculares.includes(opcao.codigo)}
                            onCheckedChange={(checked) =>
                              handleComponenteChange(opcao.codigo, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`componente-${opcao.codigo}`}
                            className="font-normal cursor-pointer text-sm"
                          >
                            <span className="text-muted-foreground">{opcao.codigo}.</span>{" "}
                            {opcao.descricao}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionCard>
        </div>
      </main>

      {/* Footer com Ações */}
      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Turma: <strong>{turma.nome}</strong> • {escola?.nome || ""}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Questionário
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
