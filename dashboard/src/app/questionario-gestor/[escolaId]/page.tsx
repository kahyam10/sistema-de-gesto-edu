"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Save, Download, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  QuestionarioGestorFormData,
  CursoSuperior,
  PosGraduacao,
  initialGestorFormData,
  opcoesSexo,
  opcoesCorRaca,
  opcoesNacionalidade,
  opcoesLocalizacao,
  opcoesLocalizacaoDiferenciada,
  opcoesEscolaridade,
  opcoesEnsinoMedio,
  opcoesNivelSuperior,
  opcoesNivelPosGraduacao,
  opcoesTipoInstituicao,
  opcoesCargo,
  opcoesCriterioAcessoPublica,
  opcoesSituacaoFuncional,
  tiposDeficiencia,
  opcoesCursosEspecificos,
  ufs,
} from "@/lib/types/questionario-gestor";

import { useEscola, useProfissionais, useSaveCensoGestor } from "@/hooks/useApi";

// Componente de Seção Colapsável
function SectionCard({
  title,
  description,
  isOpen,
  onToggle,
  children,
  progress,
}: {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  progress?: number;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="border-l-4 border-l-primary">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {title}
                  {progress !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({progress}% preenchido)
                    </span>
                  )}
                </CardTitle>
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
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-col space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${name}-${option}`} />
            <Label htmlFor={`${name}-${option}`} className="font-normal cursor-pointer">
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
  columns = 1,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  columns?: number;
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
      <Label className="text-sm font-medium">{label}</Label>
      <div className={`grid gap-2 ${columns === 2 ? "grid-cols-1 md:grid-cols-2" : ""}`}>
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`checkbox-${option}`}
              checked={values.includes(option)}
              onCheckedChange={(checked) => handleChange(option, checked as boolean)}
            />
            <Label htmlFor={`checkbox-${option}`} className="font-normal cursor-pointer text-sm">
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuestionarioGestorEscolaPage() {
  const params = useParams();
  const router = useRouter();
  const escolaId = params.escolaId as string;

  const { data: escola, isLoading: loadingEscola } = useEscola(escolaId);
  const { data: profissionais } = useProfissionais();

  const [formData, setFormData] = useState<QuestionarioGestorFormData>(initialGestorFormData);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identificacao: true,
    areaResidencial: false,
    escolaridade: false,
    vinculo: false,
  });
  const saveCenso = useSaveCensoGestor();
  const isSaving = saveCenso.isPending;

  // Buscar dados do diretor
  const diretor = profissionais?.find((p) => p.id === escola?.diretorId);

  // Preencher censo salvo + dados básicos quando diretor carregar
  useEffect(() => {
    if (diretor && escola && !formData.nomeCompleto) {
      let censoSalvo: Partial<QuestionarioGestorFormData> = {};
      if (diretor.dadosCenso) {
        try {
          censoSalvo = JSON.parse(diretor.dadosCenso);
        } catch {
          censoSalvo = {};
        }
      }
      setFormData((prev) => ({
        ...prev,
        ...censoSalvo,
        codigoEscola: escola.codigo || "",
        nomeCompleto: diretor.nome || "",
        cpf: diretor.cpf || "",
        email: diretor.email || "",
      }));
    }
  }, [diretor, escola, formData.nomeCompleto]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = <K extends keyof QuestionarioGestorFormData>(
    field: K,
    value: QuestionarioGestorFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addCursoSuperior = () => {
    if (formData.cursosSuperiores.length < 3) {
      setFormData((prev) => ({
        ...prev,
        cursosSuperiores: [
          ...prev.cursosSuperiores,
          { area: "", nivelGrau: "", curso: "", anoConclusao: "", tipoInstituicao: "", instituicao: "" },
        ],
      }));
    }
  };

  const removeCursoSuperior = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cursosSuperiores: prev.cursosSuperiores.filter((_, i) => i !== index),
    }));
  };

  const updateCursoSuperior = (index: number, field: keyof CursoSuperior, value: string) => {
    setFormData((prev) => ({
      ...prev,
      cursosSuperiores: prev.cursosSuperiores.map((curso, i) =>
        i === index ? { ...curso, [field]: value } : curso
      ),
    }));
  };

  const addPosGraduacao = () => {
    if (formData.posGraduacoes.length < 6) {
      setFormData((prev) => ({
        ...prev,
        posGraduacoes: [...prev.posGraduacoes, { nivel: "", area: "", anoConclusao: "" }],
      }));
    }
  };

  const removePosGraduacao = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      posGraduacoes: prev.posGraduacoes.filter((_, i) => i !== index),
    }));
  };

  const updatePosGraduacao = (index: number, field: keyof PosGraduacao, value: string) => {
    setFormData((prev) => ({
      ...prev,
      posGraduacoes: prev.posGraduacoes.map((pos, i) =>
        i === index ? { ...pos, [field]: value } : pos
      ),
    }));
  };

  const handleSave = async () => {
    if (!diretor) {
      toast.error("Escola sem diretor vinculado — vincule um gestor antes de salvar.");
      return;
    }
    // Toasts de sucesso/erro são exibidos pelo hook useSaveCensoGestor
    try {
      await saveCenso.mutateAsync({ id: diretor.id, dados: { ...formData } });
    } catch {
      // erro já tratado no hook
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `questionario-gestor-${escola?.codigo || escolaId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Questionário exportado com sucesso!");
  };

  // Calcular progresso geral
  const calculateProgress = () => {
    const fields = Object.values(formData);
    const totalFields = fields.length;
    const filledFields = fields.filter((v) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "boolean") return true;
      return v !== "";
    }).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  if (loadingEscola) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!escola) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Escola não encontrada</p>
            <Button className="mt-4" onClick={() => router.push("/questionario-gestor")}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!diretor) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              Esta escola não possui um gestor/diretor atribuído
            </p>
            <Button className="mt-4" onClick={() => router.push("/cadastros/escolas")}>
              Ir para Cadastro de Escolas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/questionario-gestor")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Questionário do Gestor Escolar</h1>
          <p className="text-muted-foreground mt-1">
            Censo Escolar 2025 - {escola.nome}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">Gestor: {diretor.nome}</Badge>
            <Badge variant="outline">Código: {escola.codigo}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do preenchimento</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Seção: Identificação */}
      <SectionCard
        title="1. Identificação"
        description="Dados pessoais do gestor escolar"
        isOpen={openSections.identificacao}
        onToggle={() => toggleSection("identificacao")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="identificacaoUnica">Identificação Única (ID INEP)</Label>
            <Input
              id="identificacaoUnica"
              value={formData.identificacaoUnica}
              onChange={(e) => updateField("identificacaoUnica", e.target.value)}
              placeholder="Número de identificação"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoEscola">Código da Escola (INEP)</Label>
            <Input
              id="codigoEscola"
              value={formData.codigoEscola}
              onChange={(e) => updateField("codigoEscola", e.target.value)}
              placeholder="00000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => updateField("cpf", e.target.value)}
              placeholder="000.000.000-00"
            />
            <p className="text-xs text-muted-foreground">
              Se informado o CPF, as informações serão carregadas da Receita Federal
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome Completo *</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={(e) => updateField("nomeCompleto", e.target.value)}
              placeholder="Nome completo do gestor"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(e) => updateField("dataNascimento", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filiacao1">Filiação 1</Label>
            <Input
              id="filiacao1"
              value={formData.filiacao1}
              onChange={(e) => updateField("filiacao1", e.target.value)}
              placeholder="Nome do pai/mãe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filiacao2">Filiação 2</Label>
            <Input
              id="filiacao2"
              value={formData.filiacao2}
              onChange={(e) => updateField("filiacao2", e.target.value)}
              placeholder="Nome do pai/mãe"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Sexo *"
              name="sexo"
              options={opcoesSexo}
              value={formData.sexo}
              onChange={(v) => updateField("sexo", v)}
              required
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Cor/Raça *"
              name="corRaca"
              options={opcoesCorRaca}
              value={formData.corRaca}
              onChange={(v) => updateField("corRaca", v)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="povoIndigena">Código do Povo Indígena</Label>
            <Input
              id="povoIndigena"
              value={formData.povoIndigena}
              onChange={(e) => updateField("povoIndigena", e.target.value)}
              placeholder="Código (use 999 se não souber)"
            />
            <p className="text-xs text-muted-foreground">
              Código disponível na tabela de Povo Indígena no Caderno de Conceitos
            </p>
          </div>
          <div className="col-span-2">
            <RadioField
              label="Nacionalidade *"
              name="nacionalidade"
              options={opcoesNacionalidade}
              value={formData.nacionalidade}
              onChange={(v) => updateField("nacionalidade", v)}
              required
            />
          </div>
          {formData.nacionalidade === "Estrangeira" && (
            <div className="space-y-2">
              <Label htmlFor="paisNacionalidade">País de Nacionalidade</Label>
              <Input
                id="paisNacionalidade"
                value={formData.paisNacionalidade}
                onChange={(e) => updateField("paisNacionalidade", e.target.value)}
                placeholder="País"
              />
            </div>
          )}
          {formData.nacionalidade === "Brasileira" && (
            <>
              <div className="space-y-2">
                <Label>UF de Nascimento</Label>
                <Select
                  value={formData.ufNascimento}
                  onValueChange={(v) => updateField("ufNascimento", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufs.map((uf) => (
                      <SelectItem key={uf.sigla} value={uf.sigla}>
                        {uf.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipioNascimento">Município de Nascimento</Label>
                <Input
                  id="municipioNascimento"
                  value={formData.municipioNascimento}
                  onChange={(e) => updateField("municipioNascimento", e.target.value)}
                  placeholder="Município"
                />
              </div>
            </>
          )}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="possuiDeficiencia"
                checked={formData.possuiDeficiencia}
                onCheckedChange={(checked) => updateField("possuiDeficiencia", checked as boolean)}
              />
              <Label htmlFor="possuiDeficiencia" className="font-normal cursor-pointer">
                Possui deficiência, transtorno do espectro autista ou altas habilidades/superdotação
              </Label>
            </div>
            {formData.possuiDeficiencia && (
              <CheckboxField
                label="Tipos de Deficiência"
                options={tiposDeficiencia}
                values={formData.tiposDeficiencia}
                onChange={(v) => updateField("tiposDeficiencia", v)}
                columns={2}
              />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Seção: Área Residencial */}
      <SectionCard
        title="2. Área Residencial"
        description="Endereço de residência do gestor"
        isOpen={openSections.areaResidencial}
        onToggle={() => toggleSection("areaResidencial")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paisResidencia">País de Residência</Label>
            <Input
              id="paisResidencia"
              value={formData.paisResidencia}
              onChange={(e) => updateField("paisResidencia", e.target.value)}
              placeholder="Brasil"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={(e) => updateField("cep", e.target.value)}
              placeholder="00000-000"
            />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Select value={formData.uf} onValueChange={(v) => updateField("uf", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a UF" />
              </SelectTrigger>
              <SelectContent>
                {ufs.map((uf) => (
                  <SelectItem key={uf.sigla} value={uf.sigla}>
                    {uf.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Município</Label>
            <Input
              id="municipio"
              value={formData.municipio}
              onChange={(e) => updateField("municipio", e.target.value)}
              placeholder="Município"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Localização/Zona de Residência"
              name="localizacao"
              options={opcoesLocalizacao}
              value={formData.localizacao}
              onChange={(v) => updateField("localizacao", v)}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Localização Diferenciada"
              name="localizacaoDiferenciada"
              options={opcoesLocalizacaoDiferenciada}
              value={formData.localizacaoDiferenciada}
              onChange={(v) => updateField("localizacaoDiferenciada", v)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Seção: Escolaridade */}
      <SectionCard
        title="3. Escolaridade"
        description="Formação acadêmica do gestor"
        isOpen={openSections.escolaridade}
        onToggle={() => toggleSection("escolaridade")}
      >
        <div className="space-y-6">
          <RadioField
            label="Maior nível de escolaridade concluído *"
            name="maiorNivelConcluido"
            options={opcoesEscolaridade}
            value={formData.maiorNivelConcluido}
            onChange={(v) => updateField("maiorNivelConcluido", v)}
            required
          />

          {(formData.maiorNivelConcluido === "Ensino médio" ||
            formData.maiorNivelConcluido === "Educação superior") && (
            <RadioField
              label="Tipo de Ensino Médio"
              name="tipoEnsinoMedio"
              options={opcoesEnsinoMedio}
              value={formData.tipoEnsinoMedio}
              onChange={(v) => updateField("tipoEnsinoMedio", v)}
            />
          )}

          {formData.maiorNivelConcluido === "Educação superior" && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Cursos Superiores (até 3)</Label>
                  {formData.cursosSuperiores.length < 3 && (
                    <Button variant="outline" size="sm" onClick={addCursoSuperior}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Curso
                    </Button>
                  )}
                </div>
                {formData.cursosSuperiores.map((curso, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Curso {index + 1}</h4>
                      {formData.cursosSuperiores.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCursoSuperior(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Área do Curso</Label>
                        <Input
                          value={curso.area}
                          onChange={(e) => updateCursoSuperior(index, "area", e.target.value)}
                          placeholder="Código da área"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Grau/Nível</Label>
                        <Select
                          value={curso.nivelGrau}
                          onValueChange={(v) => updateCursoSuperior(index, "nivelGrau", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcoesNivelSuperior.map((nivel) => (
                              <SelectItem key={nivel} value={nivel}>
                                {nivel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nome do Curso</Label>
                        <Input
                          value={curso.curso}
                          onChange={(e) => updateCursoSuperior(index, "curso", e.target.value)}
                          placeholder="Ex: Pedagogia"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ano de Conclusão</Label>
                        <Input
                          value={curso.anoConclusao}
                          onChange={(e) => updateCursoSuperior(index, "anoConclusao", e.target.value)}
                          placeholder="2020"
                          type="number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Instituição</Label>
                        <Select
                          value={curso.tipoInstituicao}
                          onValueChange={(v) => updateCursoSuperior(index, "tipoInstituicao", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcoesTipoInstituicao.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Instituição</Label>
                        <Input
                          value={curso.instituicao}
                          onChange={(e) => updateCursoSuperior(index, "instituicao", e.target.value)}
                          placeholder="Nome da instituição"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Pós-Graduações (até 6)</Label>
                  {formData.posGraduacoes.length < 6 && (
                    <Button variant="outline" size="sm" onClick={addPosGraduacao}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Pós
                    </Button>
                  )}
                </div>
                {formData.posGraduacoes.map((pos, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Pós-Graduação {index + 1}</h4>
                      {formData.posGraduacoes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosGraduacao(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Nível</Label>
                        <Select
                          value={pos.nivel}
                          onValueChange={(v) => updatePosGraduacao(index, "nivel", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcoesNivelPosGraduacao.map((nivel) => (
                              <SelectItem key={nivel} value={nivel}>
                                {nivel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Área</Label>
                        <Input
                          value={pos.area}
                          onChange={(e) => updatePosGraduacao(index, "area", e.target.value)}
                          placeholder="Área do curso"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ano de Conclusão</Label>
                        <Input
                          value={pos.anoConclusao}
                          onChange={(e) => updatePosGraduacao(index, "anoConclusao", e.target.value)}
                          placeholder="2020"
                          type="number"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          <CheckboxField
            label="Outros cursos específicos (formação continuada com no mínimo 80 horas)"
            options={opcoesCursosEspecificos}
            values={formData.outrosCursosEspecificos}
            onChange={(v) => updateField("outrosCursosEspecificos", v)}
            columns={2}
          />
        </div>
      </SectionCard>

      {/* Seção: Vínculo */}
      <SectionCard
        title="4. Vínculo Profissional"
        description="Dados do vínculo com a escola"
        isOpen={openSections.vinculo}
        onToggle={() => toggleSection("vinculo")}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Cargo *"
              name="cargo"
              options={opcoesCargo}
              value={formData.cargo}
              onChange={(v) => updateField("cargo", v)}
              required
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Critério de Acesso ao Cargo *"
              name="criterioAcesso"
              options={opcoesCriterioAcessoPublica}
              value={formData.criterioAcesso}
              onChange={(v) => updateField("criterioAcesso", v)}
              required
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <RadioField
              label="Situação Funcional *"
              name="situacaoFuncional"
              options={opcoesSituacaoFuncional}
              value={formData.situacaoFuncional}
              onChange={(v) => updateField("situacaoFuncional", v)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
        </div>
      </SectionCard>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={handleExport}>
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
  );
}
