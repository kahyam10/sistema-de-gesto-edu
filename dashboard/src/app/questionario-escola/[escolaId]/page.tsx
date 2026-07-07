"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Save, Download, Building2, ArrowLeft, Loader2 } from "lucide-react";

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
  QuestionarioEscolaFormData,
  initialFormData,
  opcoesDependenciasFisicas,
  opcoesRecursosAcessibilidade,
  opcoesProfissionais,
  ufs,
} from "@/lib/types/questionario-escola";

import { useEscola, useSaveCensoEscola } from "@/hooks/useApi";

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
      <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}`}>
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

export default function QuestionarioEscolaIdPage() {
  const params = useParams();
  const router = useRouter();
  const escolaId = params.escolaId as string;
  
  const { data: escola, isLoading, error } = useEscola(escolaId);
  const saveCenso = useSaveCensoEscola();

  const [formData, setFormData] = useState<QuestionarioEscolaFormData>(initialFormData);
  const isSaving = saveCenso.isPending;
  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    vinculacao: false,
    funcionamento: false,
    estrutura: false,
    equipamentos: false,
    recursos: false,
    organizacao: false,
  });

  // Preencher dados da escola quando carregada (censo salvo + dados cadastrais)
  useEffect(() => {
    if (escola) {
      let censoSalvo: Partial<QuestionarioEscolaFormData> = {};
      if (escola.dadosCenso) {
        try {
          censoSalvo = JSON.parse(escola.dadosCenso);
        } catch {
          censoSalvo = {};
        }
      }
      setFormData((prev) => ({
        ...prev,
        ...censoSalvo,
        nomeEscola: escola.nome || "",
        codigoEscola: escola.codigo || "",
        endereco: escola.endereco || "",
        telefone: escola.telefone || "",
        email: escola.email || "",
        dependenciaAdministrativa: "Municipal",
        uf: "BA",
        municipio: "Ibirapitanga",
      }));
    }
  }, [escola]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = <K extends keyof QuestionarioEscolaFormData>(
    field: K,
    value: QuestionarioEscolaFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfissionalChange = (profissional: string, quantidade: string) => {
    setFormData((prev) => ({
      ...prev,
      profissionais: {
        ...prev.profissionais,
        [profissional]: quantidade,
      },
    }));
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify({ escolaId, ...formData }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `censo-escola-${escola?.codigo || escolaId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    // Toasts de sucesso/erro são exibidos pelo hook useSaveCensoEscola
    try {
      await saveCenso.mutateAsync({ id: escolaId, dados: { ...formData } });
    } catch {
      // erro já tratado no hook
    }
  };

  // Calcular progresso geral
  const calcularProgresso = () => {
    const camposObrigatorios = [
      formData.nomeEscola,
      formData.codigoEscola,
      formData.uf,
      formData.municipio,
      formData.situacaoFuncionamento,
      formData.dependenciaAdministrativa,
      formData.localizacao,
      formData.cep,
      formData.endereco,
    ];
    const preenchidos = camposObrigatorios.filter((c) => c && c.length > 0).length;
    return Math.round((preenchidos / camposObrigatorios.length) * 100);
  };

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

  if (error || !escola) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-4 text-muted-foreground h-12 w-12" />
            <h2 className="text-xl font-semibold mb-2">Escola não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível encontrar a escola com o ID informado.
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
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Censo Escolar 2025</h1>
                <p className="text-xs text-muted-foreground">Questionário de Escola</p>
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

      {/* Info da Escola */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{escola.nome}</h2>
                <Badge variant={escola.ativo ? "default" : "secondary"}>
                  {escola.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Código: {escola.codigo} • {escola.endereco || "Endereço não informado"}
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
          {/* IDENTIFICAÇÃO */}
          <SectionCard
            title="1. Identificação da Escola"
            description="Código e nome da escola"
            isOpen={expandedSections.identificacao}
            onToggle={() => toggleSection("identificacao")}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoEscola">
                    Código da Escola <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="codigoEscola"
                    value={formData.codigoEscola}
                    onChange={(e) => handleInputChange("codigoEscola", e.target.value)}
                    placeholder="Código INEP (8 dígitos)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeEscola">
                    Nome da Escola <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nomeEscola"
                    value={formData.nomeEscola}
                    onChange={(e) => handleInputChange("nomeEscola", e.target.value)}
                    placeholder="Nome completo da escola"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* VINCULAÇÃO INSTITUCIONAL */}
          <SectionCard
            title="2. Vinculação Institucional"
            description="Dados de dependência administrativa e convênios"
            isOpen={expandedSections.vinculacao}
            onToggle={() => toggleSection("vinculacao")}
          >
            <div className="space-y-6">
              {/* Dependência Administrativa */}
              <RadioField
                label="Dependência administrativa"
                name="dependenciaAdministrativa"
                options={["Federal", "Estadual", "Municipal", "Privada"]}
                value={formData.dependenciaAdministrativa}
                onChange={(value) => handleInputChange("dependenciaAdministrativa", value as "Federal" | "Estadual" | "Municipal" | "Privada")}
                required
              />

              {/* Órgão de Vinculação */}
              {formData.dependenciaAdministrativa !== "Privada" && formData.dependenciaAdministrativa && (
                <div className="space-y-2">
                  <Label>Órgão a que a escola pública está vinculada</Label>
                  <Select
                    value={formData.orgaoVinculacao}
                    onValueChange={(value) => handleInputChange("orgaoVinculacao", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educacao">Secretaria de Educação/Ministério da Educação</SelectItem>
                      <SelectItem value="saude">Secretaria da Saúde/Ministério da Saúde</SelectItem>
                      <SelectItem value="seguranca">Secretaria de Segurança Pública/Forças Armadas/Militar</SelectItem>
                      <SelectItem value="outro">Outro órgão da administração pública</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Órgão Regional */}
              <div className="space-y-2">
                <Label htmlFor="orgaoRegional">Órgão regional de ensino</Label>
                <Input
                  id="orgaoRegional"
                  value={formData.orgaoRegional}
                  onChange={(e) => handleInputChange("orgaoRegional", e.target.value)}
                  placeholder="Código e/ou nome do órgão regional"
                />
              </div>

              {/* Regulamentação */}
              <RadioField
                label="Regulamentação/autorização no conselho ou órgão de educação"
                name="regulamentacao"
                options={["Sim", "Em tramitação", "Não"]}
                value={formData.regulamentacao}
                onChange={(value) => handleInputChange("regulamentacao", value as "Sim" | "Em tramitação" | "Não")}
              />

              {/* Esfera Administrativa */}
              {formData.regulamentacao === "Sim" && (
                <CheckboxField
                  label="Esfera administrativa do conselho responsável"
                  options={["Federal", "Estadual", "Municipal"]}
                  values={formData.esferaRegulamentacao}
                  onChange={(values) => handleInputChange("esferaRegulamentacao", values)}
                />
              )}

              {/* Localização */}
              <RadioField
                label="Localização/Zona da escola"
                name="localizacao"
                options={["Urbana", "Rural"]}
                value={formData.localizacao}
                onChange={(value) => handleInputChange("localizacao", value as "Urbana" | "Rural")}
                required
              />

              {/* Parceria ou Convênio */}
              <RadioField
                label="A escola possui parceria ou convênio com a Administração Pública"
                name="parceriaConvenio"
                options={["Sim", "Não"]}
                value={formData.parceriaConvenio}
                onChange={(value) => handleInputChange("parceriaConvenio", value as "Sim" | "Não")}
              />
            </div>
          </SectionCard>

          {/* FUNCIONAMENTO E IDENTIFICAÇÃO */}
          <SectionCard
            title="3. Funcionamento e Endereço"
            description="Situação de funcionamento, endereço e contatos"
            isOpen={expandedSections.funcionamento}
            onToggle={() => toggleSection("funcionamento")}
          >
            <div className="space-y-6">
              {/* Situação de Funcionamento */}
              <RadioField
                label="Situação de funcionamento"
                name="situacaoFuncionamento"
                options={["Em atividade", "Paralisada", "Extinta"]}
                value={formData.situacaoFuncionamento}
                onChange={(value) => handleInputChange("situacaoFuncionamento", value as "Em atividade" | "Paralisada" | "Extinta")}
                required
              />

              {/* Ano Letivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicioAnoLetivo">Início do ano letivo</Label>
                  <Input
                    id="inicioAnoLetivo"
                    type="date"
                    value={formData.inicioAnoLetivo}
                    onChange={(e) => handleInputChange("inicioAnoLetivo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terminoAnoLetivo">Término do ano letivo (previsão)</Label>
                  <Input
                    id="terminoAnoLetivo"
                    type="date"
                    value={formData.terminoAnoLetivo}
                    onChange={(e) => handleInputChange("terminoAnoLetivo", e.target.value)}
                  />
                </div>
              </div>

              {/* CEP, UF, Município */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">
                    CEP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    UF <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => handleInputChange("uf", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ufs.map((uf) => (
                        <SelectItem key={uf.sigla} value={uf.sigla}>
                          {uf.sigla} - {uf.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipio">
                    Município <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="municipio"
                    value={formData.municipio}
                    onChange={(e) => handleInputChange("municipio", e.target.value)}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="endereco">
                    Endereço <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange("complemento", e.target.value)}
                  />
                </div>
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                />
              </div>

              {/* Telefones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ddd">DDD</Label>
                  <Input
                    id="ddd"
                    value={formData.ddd}
                    onChange={(e) => handleInputChange("ddd", e.target.value)}
                    placeholder="00"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outroTelefone">Outro telefone</Label>
                  <Input
                    id="outroTelefone"
                    value={formData.outroTelefone}
                    onChange={(e) => handleInputChange("outroTelefone", e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail da escola</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          {/* ESTRUTURA FÍSICA */}
          <SectionCard
            title="4. Estrutura Física"
            description="Infraestrutura, dependências e recursos de acessibilidade"
            isOpen={expandedSections.estrutura}
            onToggle={() => toggleSection("estrutura")}
          >
            <div className="space-y-6">
              {/* Local de Funcionamento */}
              <RadioField
                label="Local de funcionamento da escola"
                name="localFuncionamento"
                options={[
                  "Prédio escolar",
                  "Galpão/rancho/paiol/barracão",
                  "Sala(s) em outra escola",
                  "Unidade de atendimento socioeducativo",
                  "Unidade prisional",
                  "Outros",
                ]}
                value={formData.localFuncionamento}
                onChange={(value) => handleInputChange("localFuncionamento", value)}
              />

              {/* Forma de Ocupação */}
              <RadioField
                label="Forma de ocupação do prédio escolar"
                name="formaOcupacao"
                options={["Próprio", "Alugado", "Cedido"]}
                value={formData.formaOcupacao}
                onChange={(value) => handleInputChange("formaOcupacao", value)}
              />

              {/* Compartilha Prédio */}
              <RadioField
                label="A escola compartilha o seu prédio com outra instituição"
                name="compartilhaPredio"
                options={["Sim", "Não"]}
                value={formData.compartilhaPredio}
                onChange={(value) => handleInputChange("compartilhaPredio", value as "Sim" | "Não")}
              />

              {/* Água Potável */}
              <RadioField
                label="Fornece água potável para o consumo humano"
                name="aguaPotavel"
                options={["Sim", "Não"]}
                value={formData.aguaPotavel}
                onChange={(value) => handleInputChange("aguaPotavel", value as "Sim" | "Não")}
              />

              {/* Abastecimento de Água */}
              <CheckboxField
                label="Abastecimento de água"
                options={[
                  "Rede pública",
                  "Poço artesiano",
                  "Cacimba/cisterna/poço",
                  "Fonte/rio/igarapé/riacho/córrego",
                  "Carro-pipa",
                  "Não há abastecimento de água",
                ]}
                values={formData.abastecimentoAgua}
                onChange={(values) => handleInputChange("abastecimentoAgua", values)}
              />

              {/* Fonte de Energia */}
              <CheckboxField
                label="Fonte de energia elétrica"
                options={[
                  "Rede pública",
                  "Gerador movido a combustível fóssil",
                  "Fontes de energia renováveis ou alternativas",
                  "Não há energia elétrica",
                ]}
                values={formData.fonteEnergia}
                onChange={(values) => handleInputChange("fonteEnergia", values)}
              />

              {/* Esgotamento Sanitário */}
              <CheckboxField
                label="Esgotamento sanitário"
                options={[
                  "Rede pública",
                  "Fossa séptica",
                  "Fossa rudimentar/comum",
                  "Não há esgotamento sanitário",
                ]}
                values={formData.esgotamento}
                onChange={(values) => handleInputChange("esgotamento", values)}
              />

              {/* Dependências Físicas */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Dependências físicas existentes</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">I. Administração</p>
                    <CheckboxField
                      label=""
                      options={opcoesDependenciasFisicas.administracao}
                      values={formData.dependenciasFisicas}
                      onChange={(values) => handleInputChange("dependenciasFisicas", values)}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">II. Alimentação</p>
                    <CheckboxField
                      label=""
                      options={opcoesDependenciasFisicas.alimentacao}
                      values={formData.dependenciasFisicas}
                      onChange={(values) => handleInputChange("dependenciasFisicas", values)}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">III. Banheiros</p>
                    <CheckboxField
                      label=""
                      options={opcoesDependenciasFisicas.banheiros}
                      values={formData.dependenciasFisicas}
                      onChange={(values) => handleInputChange("dependenciasFisicas", values)}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">IV. Aprendizagem</p>
                    <CheckboxField
                      label=""
                      options={opcoesDependenciasFisicas.aprendizagem}
                      values={formData.dependenciasFisicas}
                      onChange={(values) => handleInputChange("dependenciasFisicas", values)}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">V. Esportes e Recreação</p>
                    <CheckboxField
                      label=""
                      options={opcoesDependenciasFisicas.esportesRecreacao}
                      values={formData.dependenciasFisicas}
                      onChange={(values) => handleInputChange("dependenciasFisicas", values)}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">VI. Meio Ambiente</p>
                    <CheckboxField
                      label=""
                      options={opcoesDependenciasFisicas.meioAmbiente}
                      values={formData.dependenciasFisicas}
                      onChange={(values) => handleInputChange("dependenciasFisicas", values)}
                    />
                  </div>
                </div>
              </div>

              {/* Recursos de Acessibilidade */}
              <CheckboxField
                label="Recursos de acessibilidade nas vias de circulação"
                options={opcoesRecursosAcessibilidade}
                values={formData.recursosAcessibilidade}
                onChange={(values) => handleInputChange("recursosAcessibilidade", values)}
                columns={2}
              />

              {/* Salas de Aula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salasAulaDentro">Salas de aula dentro do prédio</Label>
                  <Input
                    id="salasAulaDentro"
                    type="number"
                    min="0"
                    value={formData.salasAulaDentro}
                    onChange={(e) => handleInputChange("salasAulaDentro", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salasAulaFora">Salas de aula fora do prédio</Label>
                  <Input
                    id="salasAulaFora"
                    type="number"
                    min="0"
                    value={formData.salasAulaFora}
                    onChange={(e) => handleInputChange("salasAulaFora", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* EQUIPAMENTOS E RECURSOS TECNOLÓGICOS */}
          <SectionCard
            title="5. Equipamentos e Recursos Tecnológicos"
            description="Equipamentos administrativos, de ensino e acesso à internet"
            isOpen={expandedSections.equipamentos}
            onToggle={() => toggleSection("equipamentos")}
          >
            <div className="space-y-6">
              {/* Equipamentos Administrativos */}
              <CheckboxField
                label="Equipamentos para uso técnico e administrativo"
                options={[
                  "Computadores",
                  "Impressora",
                  "Scanner",
                  "Copiadora",
                  "Impressora multifuncional",
                  "Antena parabólica",
                  "Nenhum dos equipamentos listados",
                ]}
                values={formData.equipamentosAdministrativos}
                onChange={(values) => handleInputChange("equipamentosAdministrativos", values)}
                columns={2}
              />

              {/* Equipamentos de Ensino */}
              <CheckboxField
                label="Equipamentos para ensino-aprendizagem"
                options={[
                  "Aparelho de televisão",
                  "Aparelho de som",
                  "Aparelho de DVD/Blu-ray",
                  "Projetor multimídia (Data show)",
                  "Lousa digital",
                ]}
                values={formData.equipamentosEnsinoAprendizagem}
                onChange={(values) => handleInputChange("equipamentosEnsinoAprendizagem", values)}
              />

              {/* Computadores */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quantidade de computadores em uso pelos alunos</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="computadoresDesktop" className="text-xs">Computadores de mesa</Label>
                    <Input
                      id="computadoresDesktop"
                      type="number"
                      min="0"
                      value={formData.computadoresDesktop}
                      onChange={(e) => handleInputChange("computadoresDesktop", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="computadoresPortateis" className="text-xs">Computadores portáteis</Label>
                    <Input
                      id="computadoresPortateis"
                      type="number"
                      min="0"
                      value={formData.computadoresPortateis}
                      onChange={(e) => handleInputChange("computadoresPortateis", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tablets" className="text-xs">Tablets</Label>
                    <Input
                      id="tablets"
                      type="number"
                      min="0"
                      value={formData.tablets}
                      onChange={(e) => handleInputChange("tablets", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Acesso à Internet */}
              <CheckboxField
                label="Acesso à internet"
                options={[
                  "Para uso dos alunos",
                  "Para uso administrativo",
                  "Para uso no processo de ensino-aprendizagem",
                  "Para uso da comunidade",
                  "Não possui acesso à internet",
                ]}
                values={formData.acessoInternet}
                onChange={(values) => handleInputChange("acessoInternet", values)}
              />

              {/* Internet Banda Larga */}
              <RadioField
                label="Internet banda larga"
                name="internetBandaLarga"
                options={["Sim", "Não"]}
                value={formData.internetBandaLarga}
                onChange={(value) => handleInputChange("internetBandaLarga", value as "Sim" | "Não")}
              />
            </div>
          </SectionCard>

          {/* RECURSOS HUMANOS */}
          <SectionCard
            title="6. Recursos Humanos"
            description="Total de profissionais que atuam na escola"
            isOpen={expandedSections.recursos}
            onToggle={() => toggleSection("recursos")}
          >
            <div className="space-y-4">
              <p className="text-sm font-medium">Total de profissionais que atuam nas seguintes funções</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opcoesProfissionais.map((profissional) => (
                  <div key={profissional} className="flex items-center gap-3">
                    <Label className="flex-1 text-sm">{profissional}</Label>
                    <Input
                      type="number"
                      min="0"
                      className="w-20"
                      value={formData.profissionais[profissional] || ""}
                      onChange={(e) => handleProfissionalChange(profissional, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* ORGANIZAÇÃO ESCOLAR */}
          <SectionCard
            title="7. Organização Escolar"
            description="Alimentação, gestão e participação"
            isOpen={expandedSections.organizacao}
            onToggle={() => toggleSection("organizacao")}
          >
            <div className="space-y-6">
              {/* Alimentação Escolar */}
              <RadioField
                label="Alimentação escolar para os alunos"
                name="alimentacaoEscolar"
                options={["Oferece", "Não oferece"]}
                value={formData.alimentacaoEscolar}
                onChange={(value) => handleInputChange("alimentacaoEscolar", value as "Oferece" | "Não oferece")}
              />

              {/* Escola Indígena */}
              <RadioField
                label="Escola indígena"
                name="escolaIndigena"
                options={["Sim", "Não"]}
                value={formData.escolaIndigena}
                onChange={(value) => handleInputChange("escolaIndigena", value as "Sim" | "Não")}
              />

              {/* Educação Ambiental */}
              <RadioField
                label="A escola desenvolve ações de educação ambiental"
                name="educacaoAmbiental"
                options={["Sim", "Não"]}
                value={formData.educacaoAmbiental}
                onChange={(value) => handleInputChange("educacaoAmbiental", value as "Sim" | "Não")}
              />

              {formData.educacaoAmbiental === "Sim" && (
                <CheckboxField
                  label="Forma(s) como a educação ambiental é desenvolvida"
                  options={[
                    "Como conteúdo dos componentes/campos de experiências",
                    "Como um componente curricular especial",
                    "Em eventos",
                    "Em projetos transversais ou interdisciplinares",
                    "Como um eixo estruturante do currículo",
                  ]}
                  values={formData.formasEducacaoAmbiental}
                  onChange={(values) => handleInputChange("formasEducacaoAmbiental", values)}
                />
              )}

              {/* PPP Atualizado */}
              <RadioField
                label="O projeto político pedagógico foi atualizado nos últimos 12 meses"
                name="pppAtualizado"
                options={["Sim", "Não", "A escola não possui PPP"]}
                value={formData.pppAtualizado}
                onChange={(value) => handleInputChange("pppAtualizado", value)}
              />

              {/* Órgãos Colegiados */}
              <CheckboxField
                label="Órgãos colegiados em funcionamento"
                options={[
                  "Grêmio estudantil",
                  "Conselho escolar",
                  "Associação de pais e mestres",
                  "Associação de pais",
                  "Outros",
                  "Não há órgãos colegiados",
                ]}
                values={formData.orgaosColegiados}
                onChange={(values) => handleInputChange("orgaosColegiados", values)}
              />

              {/* Site/Blog/Redes */}
              <RadioField
                label="A escola possui site, blog ou página em redes sociais"
                name="siteBlogRedes"
                options={["Sim", "Não"]}
                value={formData.siteBlogRedes}
                onChange={(value) => handleInputChange("siteBlogRedes", value as "Sim" | "Não")}
              />

              {/* Exame de Seleção */}
              <RadioField
                label="A escola faz exame de seleção para ingresso"
                name="exameSelecao"
                options={["Sim", "Não"]}
                value={formData.exameSelecao}
                onChange={(value) => handleInputChange("exameSelecao", value as "Sim" | "Não")}
              />
            </div>
          </SectionCard>
        </div>
      </main>

      {/* Footer com Ações */}
      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-end gap-3">
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
            Salvar Formulário
          </Button>
        </div>
      </footer>
    </div>
  );
}
