"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Save, Download, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

export default function QuestionarioEscolaPage() {
  const [formData, setFormData] = useState<QuestionarioEscolaFormData>(initialFormData);
  const [expandedSections, setExpandedSections] = useState({
    vinculacao: true,
    funcionamento: false,
    estrutura: false,
    equipamentos: false,
    recursos: false,
    organizacao: false,
  });

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
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `censo-escolar-${formData.codigoEscola || "dados"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    console.log("Dados do formulário:", formData);
    // TODO: Integrar com API
  };

  // Calcular progresso geral
  const calcularProgresso = () => {
    const camposObrigatorios = [
      formData.codigoEscola,
      formData.nomeEscola,
      formData.dependenciaAdministrativa,
      formData.localizacao,
      formData.situacaoFuncionamento,
      formData.cep,
      formData.uf,
      formData.municipio,
      formData.endereco,
    ];
    const preenchidos = camposObrigatorios.filter((c) => c && c.length > 0).length;
    return Math.round((preenchidos / camposObrigatorios.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
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
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Progresso:</span>
            <Progress value={calcularProgresso()} className="flex-1 max-w-md" />
            <span className="text-sm text-muted-foreground">{calcularProgresso()}%</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Código da Escola */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação da Escola</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoEscola">
                    Código da Escola <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="codigoEscola"
                    value={formData.codigoEscola}
                    onChange={(e) => handleInputChange("codigoEscola", e.target.value)}
                    placeholder="Código INEP"
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
            </CardContent>
          </Card>

          {/* VINCULAÇÃO INSTITUCIONAL E CONVÊNIO */}
          <SectionCard
            title="Vinculação Institucional e Convênio"
            description="Informações sobre dependência administrativa e convênios"
            isOpen={expandedSections.vinculacao}
            onToggle={() => toggleSection("vinculacao")}
          >
            <div className="space-y-6">
              {/* Dependência Administrativa */}
              <RadioField
                label="1 – Dependência administrativa"
                name="dependenciaAdministrativa"
                options={["Federal", "Estadual", "Municipal", "Privada"]}
                value={formData.dependenciaAdministrativa}
                onChange={(value) => handleInputChange("dependenciaAdministrativa", value as any)}
                required
              />

              {/* Órgão de Vinculação (apenas para públicas) */}
              {formData.dependenciaAdministrativa &&
                formData.dependenciaAdministrativa !== "Privada" && (
                  <div className="space-y-2">
                    <Label>1a – Órgão a que a escola pública está vinculada</Label>
                    <Select
                      value={formData.orgaoVinculacao}
                      onValueChange={(value) => handleInputChange("orgaoVinculacao", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educacao">
                          Secretaria de Educação/Ministério da Educação
                        </SelectItem>
                        <SelectItem value="saude">
                          Secretaria da Saúde/Ministério da Saúde
                        </SelectItem>
                        <SelectItem value="seguranca">
                          Secretaria de Segurança Pública/Forças Armadas/Militar
                        </SelectItem>
                        <SelectItem value="outro">Outro órgão da administração pública</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {/* Órgão Regional */}
              <div className="space-y-2">
                <Label htmlFor="orgaoRegional">1b – Órgão regional de ensino</Label>
                <Input
                  id="orgaoRegional"
                  value={formData.orgaoRegional}
                  onChange={(e) => handleInputChange("orgaoRegional", e.target.value)}
                  placeholder="Informar código e/ou nome do órgão regional"
                />
              </div>

              {/* Regulamentação */}
              <RadioField
                label="2 – Regulamentação/autorização no conselho ou órgão de educação"
                name="regulamentacao"
                options={["Sim", "Em tramitação", "Não"]}
                value={formData.regulamentacao}
                onChange={(value) => handleInputChange("regulamentacao", value as any)}
              />

              {/* Esfera Administrativa */}
              {formData.regulamentacao === "Sim" && (
                <CheckboxField
                  label="2a – Esfera administrativa do conselho responsável"
                  options={["Federal", "Estadual", "Municipal"]}
                  values={formData.esferaRegulamentacao}
                  onChange={(values) => handleInputChange("esferaRegulamentacao", values)}
                />
              )}

              {/* Localização */}
              <RadioField
                label="3 – Localização/Zona da escola"
                name="localizacao"
                options={["Urbana", "Rural"]}
                value={formData.localizacao}
                onChange={(value) => handleInputChange("localizacao", value as any)}
                required
              />

              {/* Parceria ou Convênio */}
              <RadioField
                label="5 – A escola possui parceria ou convênio com a Administração Pública"
                name="parceriaConvenio"
                options={["Sim", "Não"]}
                value={formData.parceriaConvenio}
                onChange={(value) => handleInputChange("parceriaConvenio", value as any)}
              />

              {formData.parceriaConvenio === "Sim" && (
                <>
                  <div className="space-y-2">
                    <Label>5a – Poder público responsável pela parceria</Label>
                    <Select
                      value={formData.poderPublicoParceria}
                      onValueChange={(value) => handleInputChange("poderPublicoParceria", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Estadual">Secretaria Estadual</SelectItem>
                        <SelectItem value="Municipal">Secretaria Municipal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <CheckboxField
                    label="5b – Forma(s) de contratação (Estadual)"
                    options={[
                      "Termo de colaboração (Lei nº 13.019/2014)",
                      "Acordo de cooperação (Lei nº 13.019/2014)",
                      "Termo de fomento (Lei nº 13.019/2014)",
                      "Termo de cooperação técnica e financeira",
                      "Contrato de prestação de serviço",
                      "Contrato de consórcio público/Convênio de cooperação",
                    ]}
                    values={formData.formaContratacaoEstadual}
                    onChange={(values) => handleInputChange("formaContratacaoEstadual", values)}
                  />

                  <CheckboxField
                    label="5c – Forma(s) de contratação (Municipal)"
                    options={[
                      "Termo de colaboração (Lei nº 13.019/2014)",
                      "Acordo de cooperação (Lei nº 13.019/2014)",
                      "Termo de fomento (Lei nº 13.019/2014)",
                      "Termo de cooperação técnica e financeira",
                      "Contrato de prestação de serviço",
                      "Contrato de consórcio público/Convênio de cooperação",
                    ]}
                    values={formData.formaContratacaoMunicipal}
                    onChange={(values) => handleInputChange("formaContratacaoMunicipal", values)}
                  />
                </>
              )}
            </div>
          </SectionCard>

          {/* FUNCIONAMENTO E IDENTIFICAÇÃO */}
          <SectionCard
            title="Funcionamento e Identificação"
            description="Situação de funcionamento, endereço e contatos"
            isOpen={expandedSections.funcionamento}
            onToggle={() => toggleSection("funcionamento")}
          >
            <div className="space-y-6">
              {/* Situação de Funcionamento */}
              <RadioField
                label="6 – Situação de funcionamento"
                name="situacaoFuncionamento"
                options={["Em atividade", "Paralisada", "Extinta"]}
                value={formData.situacaoFuncionamento}
                onChange={(value) => handleInputChange("situacaoFuncionamento", value as any)}
                required
              />

              {/* Ano Letivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicioAnoLetivo">7a – Ano letivo - Início</Label>
                  <Input
                    id="inicioAnoLetivo"
                    type="date"
                    value={formData.inicioAnoLetivo}
                    onChange={(e) => handleInputChange("inicioAnoLetivo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terminoAnoLetivo">7b – Ano letivo - Término (previsão)</Label>
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
                    9 – CEP <span className="text-destructive">*</span>
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
                    10 – UF <span className="text-destructive">*</span>
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
                    11 – Município <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="municipio"
                    value={formData.municipio}
                    onChange={(e) => handleInputChange("municipio", e.target.value)}
                  />
                </div>
              </div>

              {/* Região e Distrito */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regiaoAdministrativa">11a – Região Administrativa</Label>
                  <Input
                    id="regiaoAdministrativa"
                    value={formData.regiaoAdministrativa}
                    onChange={(e) => handleInputChange("regiaoAdministrativa", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distrito">11b – Distrito</Label>
                  <Input
                    id="distrito"
                    value={formData.distrito}
                    onChange={(e) => handleInputChange("distrito", e.target.value)}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="endereco">
                    12 – Endereço <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">13 – Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">14 – Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange("complemento", e.target.value)}
                  />
                </div>
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label htmlFor="bairro">15 – Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                />
              </div>

              {/* Telefones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ddd">16 – DDD</Label>
                  <Input
                    id="ddd"
                    value={formData.ddd}
                    onChange={(e) => handleInputChange("ddd", e.target.value)}
                    placeholder="00"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">17 – Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outroTelefone">18 – Outro telefone</Label>
                  <Input
                    id="outroTelefone"
                    value={formData.outroTelefone}
                    onChange={(e) => handleInputChange("outroTelefone", e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">19 – E-mail da escola</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              {/* Localização Diferenciada */}
              <RadioField
                label="20 – Localização diferenciada da escola"
                name="localizacaoDiferenciada"
                options={[
                  "Não está em área de localização diferenciada",
                  "Área de assentamento",
                  "Terra indígena",
                  "Comunidade quilombola",
                  "Área onde se localizam povos e comunidades tradicionais",
                ]}
                value={formData.localizacaoDiferenciada}
                onChange={(value) => handleInputChange("localizacaoDiferenciada", value)}
              />

              {/* Escola Privada */}
              {formData.dependenciaAdministrativa === "Privada" && (
                <>
                  <RadioField
                    label="23 – Categoria da escola privada"
                    name="categoriaEscolaPrivada"
                    options={["Particular", "Comunitária", "Confessional", "Filantrópica"]}
                    value={formData.categoriaEscolaPrivada}
                    onChange={(value) => handleInputChange("categoriaEscolaPrivada", value)}
                  />

                  <CheckboxField
                    label="24 – Mantenedora da escola privada"
                    options={[
                      "Empresa ou grupo empresarial do setor privado ou pessoa física",
                      "Sindicatos de trabalhadores ou patronais, associações, cooperativas",
                      "Instituição sem fins lucrativos",
                      "Organização não governamental (ONG)",
                      "Sistema S (Sesi, Senai, Sesc, outros)",
                      "Organização da sociedade civil de interesse público (Oscip)",
                    ]}
                    values={formData.mantenedoraPrivada}
                    onChange={(values) => handleInputChange("mantenedoraPrivada", values)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpjMantenedora">25 – CNPJ da mantenedora</Label>
                      <Input
                        id="cnpjMantenedora"
                        value={formData.cnpjMantenedora}
                        onChange={(e) => handleInputChange("cnpjMantenedora", e.target.value)}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpjEscola">26 – CNPJ da escola</Label>
                      <Input
                        id="cnpjEscola"
                        value={formData.cnpjEscola}
                        onChange={(e) => handleInputChange("cnpjEscola", e.target.value)}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* ESTRUTURA FÍSICA */}
          <SectionCard
            title="Estrutura Física"
            description="Infraestrutura, dependências e recursos de acessibilidade"
            isOpen={expandedSections.estrutura}
            onToggle={() => toggleSection("estrutura")}
          >
            <div className="space-y-6">
              {/* Local de Funcionamento */}
              <RadioField
                label="27 – Local de funcionamento da escola"
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
                label="28 – Forma de ocupação do prédio escolar"
                name="formaOcupacao"
                options={["Próprio", "Alugado", "Cedido"]}
                value={formData.formaOcupacao}
                onChange={(value) => handleInputChange("formaOcupacao", value)}
              />

              {/* Compartilha Prédio */}
              <RadioField
                label="29 – A escola compartilha o seu prédio com outra instituição"
                name="compartilhaPredio"
                options={["Sim", "Não"]}
                value={formData.compartilhaPredio}
                onChange={(value) => handleInputChange("compartilhaPredio", value as any)}
              />

              {formData.compartilhaPredio === "Sim" && (
                <div className="space-y-2">
                  <Label htmlFor="codigoEscolaCompartilhada">
                    29a – Código da escola com a qual compartilha
                  </Label>
                  <Input
                    id="codigoEscolaCompartilhada"
                    value={formData.codigoEscolaCompartilhada}
                    onChange={(e) =>
                      handleInputChange("codigoEscolaCompartilhada", e.target.value)
                    }
                  />
                </div>
              )}

              {/* Água Potável */}
              <RadioField
                label="30 – Fornece água potável para o consumo humano"
                name="aguaPotavel"
                options={["Sim", "Não"]}
                value={formData.aguaPotavel}
                onChange={(value) => handleInputChange("aguaPotavel", value as any)}
              />

              {/* Abastecimento de Água */}
              <CheckboxField
                label="31 – Abastecimento de água"
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
                label="32 – Fonte de energia elétrica"
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
                label="33 – Esgotamento sanitário"
                options={[
                  "Rede pública",
                  "Fossa séptica",
                  "Fossa rudimentar/comum",
                  "Não há esgotamento sanitário",
                ]}
                values={formData.esgotamento}
                onChange={(values) => handleInputChange("esgotamento", values)}
              />

              {/* Destinação do Lixo */}
              <CheckboxField
                label="34 – Destinação do lixo"
                options={[
                  "Serviço de coleta",
                  "Queima",
                  "Enterra",
                  "Descarta em outra área",
                  "Leva a uma destinação final licenciada",
                ]}
                values={formData.destinacaoLixo}
                onChange={(values) => handleInputChange("destinacaoLixo", values)}
              />

              {/* Tratamento do Lixo */}
              <CheckboxField
                label="35 – Tratamento do lixo/resíduos"
                options={[
                  "Separação do lixo/resíduos",
                  "Reaproveitamento/reutilização",
                  "Reciclagem",
                  "Não faz tratamento",
                ]}
                values={formData.tratamentoLixo}
                onChange={(values) => handleInputChange("tratamentoLixo", values)}
              />

              {/* Dependências Físicas */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">36 – Dependências físicas existentes</Label>
                
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
                label="37 – Recursos de acessibilidade nas vias de circulação"
                options={opcoesRecursosAcessibilidade}
                values={formData.recursosAcessibilidade}
                onChange={(values) => handleInputChange("recursosAcessibilidade", values)}
                columns={2}
              />

              {/* Salas de Aula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salasAulaDentro">38 – Salas de aula dentro do prédio</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salasClimatizadas">39 – Salas climatizadas</Label>
                  <Input
                    id="salasClimatizadas"
                    type="number"
                    min="0"
                    value={formData.salasClimatizadas}
                    onChange={(e) => handleInputChange("salasClimatizadas", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salasAcessibilidade">Salas com acessibilidade</Label>
                  <Input
                    id="salasAcessibilidade"
                    type="number"
                    min="0"
                    value={formData.salasAcessibilidade}
                    onChange={(e) => handleInputChange("salasAcessibilidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salasCantinoLeitura">40 – Salas com Cantinho da Leitura</Label>
                  <Input
                    id="salasCantinoLeitura"
                    type="number"
                    min="0"
                    value={formData.salasCantinoLeitura}
                    onChange={(e) => handleInputChange("salasCantinoLeitura", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* EQUIPAMENTOS E RECURSOS TECNOLÓGICOS */}
          <SectionCard
            title="Equipamentos e Recursos Tecnológicos"
            description="Equipamentos administrativos, de ensino e acesso à internet"
            isOpen={expandedSections.equipamentos}
            onToggle={() => toggleSection("equipamentos")}
          >
            <div className="space-y-6">
              {/* Equipamentos Administrativos */}
              <CheckboxField
                label="41 – Equipamentos para uso técnico e administrativo"
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
                label="42 – Equipamentos para ensino-aprendizagem"
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
                <Label className="text-sm font-medium">
                  43 – Quantidade de computadores em uso pelos alunos
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="computadoresDesktop" className="text-xs">
                      Computadores de mesa
                    </Label>
                    <Input
                      id="computadoresDesktop"
                      type="number"
                      min="0"
                      value={formData.computadoresDesktop}
                      onChange={(e) => handleInputChange("computadoresDesktop", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="computadoresPortateis" className="text-xs">
                      Computadores portáteis
                    </Label>
                    <Input
                      id="computadoresPortateis"
                      type="number"
                      min="0"
                      value={formData.computadoresPortateis}
                      onChange={(e) => handleInputChange("computadoresPortateis", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tablets" className="text-xs">
                      Tablets
                    </Label>
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

              {/* Rede Local */}
              <CheckboxField
                label="44 – Rede local de interligação de computadores"
                options={["A cabo", "Wireless", "Não há rede local interligando computadores"]}
                values={formData.redeLocal}
                onChange={(values) => handleInputChange("redeLocal", values)}
              />

              {/* Acesso à Internet */}
              <CheckboxField
                label="45 – Acesso à internet"
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
                label="47 – Internet banda larga"
                name="internetBandaLarga"
                options={["Sim", "Não"]}
                value={formData.internetBandaLarga}
                onChange={(value) => handleInputChange("internetBandaLarga", value as any)}
              />
            </div>
          </SectionCard>

          {/* RECURSOS HUMANOS */}
          <SectionCard
            title="Recursos Humanos"
            description="Total de profissionais que atuam na escola"
            isOpen={expandedSections.recursos}
            onToggle={() => toggleSection("recursos")}
          >
            <div className="space-y-4">
              <p className="text-sm font-medium">
                48 – Total de profissionais que atuam nas seguintes funções
              </p>
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
            title="Organização Escolar"
            description="Alimentação, gestão e participação"
            isOpen={expandedSections.organizacao}
            onToggle={() => toggleSection("organizacao")}
          >
            <div className="space-y-6">
              {/* Alimentação Escolar */}
              <RadioField
                label="49 – Alimentação escolar para os alunos"
                name="alimentacaoEscolar"
                options={["Oferece", "Não oferece"]}
                value={formData.alimentacaoEscolar}
                onChange={(value) => handleInputChange("alimentacaoEscolar", value as any)}
              />

              {/* Escola Indígena */}
              <RadioField
                label="50 – Escola indígena"
                name="escolaIndigena"
                options={["Sim", "Não"]}
                value={formData.escolaIndigena}
                onChange={(value) => handleInputChange("escolaIndigena", value as any)}
              />

              {formData.escolaIndigena === "Sim" && (
                <>
                  <CheckboxField
                    label="50a – Língua em que o ensino é ministrado"
                    options={["Língua Portuguesa", "Língua Indígena"]}
                    values={formData.linguaEnsino}
                    onChange={(values) => handleInputChange("linguaEnsino", values)}
                  />

                  {formData.linguaEnsino.includes("Língua Indígena") && (
                    <div className="space-y-2">
                      <Label>Código de Língua Indígena (até 3)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((index) => (
                          <Input
                            key={index}
                            value={formData.codigoLinguaIndigena[index] || ""}
                            onChange={(e) => {
                              const newCodigos = [...formData.codigoLinguaIndigena];
                              newCodigos[index] = e.target.value;
                              handleInputChange("codigoLinguaIndigena", newCodigos);
                            }}
                            placeholder={`Código ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Educação Ambiental */}
              <RadioField
                label="52 – A escola desenvolve ações de educação ambiental"
                name="educacaoAmbiental"
                options={["Sim", "Não"]}
                value={formData.educacaoAmbiental}
                onChange={(value) => handleInputChange("educacaoAmbiental", value as any)}
              />

              {formData.educacaoAmbiental === "Sim" && (
                <CheckboxField
                  label="52a – Forma(s) como a educação ambiental é desenvolvida"
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
                label="53 – O projeto político pedagógico foi atualizado nos últimos 12 meses"
                name="pppAtualizado"
                options={["Sim", "Não", "A escola não possui PPP"]}
                value={formData.pppAtualizado}
                onChange={(value) => handleInputChange("pppAtualizado", value)}
              />

              {/* Órgãos Colegiados */}
              <CheckboxField
                label="54 – Órgãos colegiados em funcionamento"
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

              {/* Compartilha Espaços */}
              <RadioField
                label="55 – A escola compartilha espaços para integração escola-comunidade"
                name="compartilhaEspacos"
                options={["Sim", "Não"]}
                value={formData.compartilhaEspacos}
                onChange={(value) => handleInputChange("compartilhaEspacos", value as any)}
              />

              {/* Usa Espaços do Entorno */}
              <RadioField
                label="56 – A escola usa espaços do entorno para atividades regulares"
                name="usaEspacosEntorno"
                options={["Sim", "Não"]}
                value={formData.usaEspacosEntorno}
                onChange={(value) => handleInputChange("usaEspacosEntorno", value as any)}
              />

              {/* Site/Blog/Redes */}
              <RadioField
                label="57 – A escola possui site, blog ou página em redes sociais"
                name="siteBlogRedes"
                options={["Sim", "Não"]}
                value={formData.siteBlogRedes}
                onChange={(value) => handleInputChange("siteBlogRedes", value as any)}
              />

              {/* Exame de Seleção */}
              <RadioField
                label="58 – A escola faz exame de seleção para ingresso"
                name="exameSelecao"
                options={["Sim", "Não"]}
                value={formData.exameSelecao}
                onChange={(value) => handleInputChange("exameSelecao", value as any)}
              />

              {/* Reserva de Vagas */}
              {formData.exameSelecao === "Sim" && (
                <CheckboxField
                  label="59 – Reserva de vagas por sistema de cotas"
                  options={[
                    "Sem reservas de vagas (ampla concorrência)",
                    "Autodeclarado preto, pardo ou indígena (PPI)",
                    "Oriundo de escola pública",
                    "Pessoa com deficiência (PCD)",
                    "Condição de renda",
                    "Outros grupos",
                  ]}
                  values={formData.reservaVagas}
                  onChange={(values) => handleInputChange("reservaVagas", values)}
                />
              )}
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
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Formulário
          </Button>
        </div>
      </footer>
    </div>
  );
}
