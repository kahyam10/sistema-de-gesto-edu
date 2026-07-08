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
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  Buildings,
  GraduationCap,
  User,
  Phone,
  Spinner,
  Pencil,
  Trash,
  Eye,
  MagnifyingGlass,
  Funnel,
  X,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEscolas,
  useEtapas,
  useSeries,
  useMatriculas,
  useCreateMatricula,
  useUpdateMatricula,
  useDeleteMatricula,
} from "@/hooks/useApi";
import { Matricula } from "@/lib/api";
import { AlunoDetails } from "./AlunoDetails";

export function MatriculasManager() {
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: etapas, isLoading: loadingEtapas } = useEtapas();
  const { data: series, isLoading: loadingSeries } = useSeries();
  const { data: matriculas, isLoading: loadingMatriculas } = useMatriculas();

  const createMatricula = useCreateMatricula();
  const updateMatricula = useUpdateMatricula();
  const deleteMatricula = useDeleteMatricula();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(null);
  const [viewingAlunoId, setViewingAlunoId] = useState<string | null>(null);
  
  // Estados de pesquisa e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroSexo, setFiltroSexo] = useState<"all" | "M" | "F">("all");
  const [filtroIdadeMin, setFiltroIdadeMin] = useState("");
  const [filtroIdadeMax, setFiltroIdadeMax] = useState("");
  const [filtroEtapaId, setFiltroEtapaId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [formData, setFormData] = useState({
    escolaId: "",
    etapaId: "",
    nomeAluno: "",
    dataNascimento: "",
    cpfAluno: "",
    sexo: "M" as "M" | "F",
    nomeResponsavel: "",
    cpfResponsavel: "",
    telefoneResponsavel: "",
    emailResponsavel: "",
    endereco: "",
    possuiDeficiencia: false,
    tipoDeficiencia: "",
  });

  const escolasAtivas = (escolas || []).filter((e) => e.ativo);

  // Encontrar as etapas disponíveis para a escola selecionada
  const escolaSelecionada = escolasAtivas.find(
    (e) => e.id === formData.escolaId
  );
  const etapasIds = escolaSelecionada?.etapas?.map((e) => e.etapa.id) || [];
  const etapasDisponiveis = (etapas || []).filter((e) =>
    etapasIds.includes(e.id)
  );

  const isLoading = loadingEscolas || loadingEtapas || loadingSeries || loadingMatriculas;

  // Função para calcular idade a partir da data de nascimento
  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  // Filtrar matrículas com base nos critérios
  const matriculasFiltradas = (matriculas || []).filter((matricula) => {
    // Pesquisa por texto (nome do aluno, nome do responsável, CPF)
    const termoBusca = searchTerm.toLowerCase().trim();
    if (termoBusca) {
      const nomeAlunoMatch = matricula.nomeAluno.toLowerCase().includes(termoBusca);
      const nomeResponsavelMatch = matricula.nomeResponsavel.toLowerCase().includes(termoBusca);
      const cpfAlunoMatch = matricula.cpfAluno?.replace(/\D/g, "").includes(termoBusca.replace(/\D/g, "")) || false;
      const cpfResponsavelMatch = matricula.cpfResponsavel?.replace(/\D/g, "").includes(termoBusca.replace(/\D/g, "")) || false;
      const rgMatch = matricula.rgAluno?.replace(/\D/g, "").includes(termoBusca.replace(/\D/g, "")) || false;
      const matriculaNumeroMatch = matricula.numeroMatricula.toLowerCase().includes(termoBusca);
      
      if (!nomeAlunoMatch && !nomeResponsavelMatch && !cpfAlunoMatch && !cpfResponsavelMatch && !rgMatch && !matriculaNumeroMatch) {
        return false;
      }
    }

    // Filtro por sexo
    if (filtroSexo !== "all" && matricula.sexo !== filtroSexo) {
      return false;
    }

    // Filtro por idade
    const idade = calcularIdade(matricula.dataNascimento);
    if (filtroIdadeMin && idade < parseInt(filtroIdadeMin)) {
      return false;
    }
    if (filtroIdadeMax && idade > parseInt(filtroIdadeMax)) {
      return false;
    }

    // Filtro por etapa (série/ano)
    if (filtroEtapaId !== "all" && matricula.etapaId !== filtroEtapaId) {
      return false;
    }

    return true;
  });

  // Limpar todos os filtros
  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroSexo("all");
    setFiltroIdadeMin("");
    setFiltroIdadeMax("");
    setFiltroEtapaId("all");
  };

  const temFiltrosAtivos = searchTerm || filtroSexo !== "all" || filtroIdadeMin || filtroIdadeMax || filtroEtapaId !== "all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.escolaId || !formData.etapaId) {
      return;
    }

    const data = {
      anoLetivo: new Date().getFullYear(),
      nomeAluno: formData.nomeAluno,
      dataNascimento: formData.dataNascimento,
      cpfAluno: formData.cpfAluno || undefined,
      sexo: formData.sexo,
      nomeResponsavel: formData.nomeResponsavel,
      cpfResponsavel: formData.cpfResponsavel || undefined,
      telefoneResponsavel: formData.telefoneResponsavel || undefined,
      emailResponsavel: formData.emailResponsavel || undefined,
      endereco: formData.endereco || undefined,
      possuiDeficiencia: formData.possuiDeficiencia,
      tipoDeficiencia: formData.possuiDeficiencia ? formData.tipoDeficiencia : undefined,
      escolaId: formData.escolaId,
      etapaId: formData.etapaId,
    };

    if (editingMatricula) {
      await updateMatricula.mutateAsync({
        id: editingMatricula.id,
        data,
      });
    } else {
      await createMatricula.mutateAsync(data);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      escolaId: "",
      etapaId: "",
      nomeAluno: "",
      dataNascimento: "",
      cpfAluno: "",
      sexo: "M",
      nomeResponsavel: "",
      cpfResponsavel: "",
      telefoneResponsavel: "",
      emailResponsavel: "",
      endereco: "",
      possuiDeficiencia: false,
      tipoDeficiencia: "",
    });
    setEditingMatricula(null);
    setIsFormOpen(false);
  };

  const handleEdit = (matricula: Matricula) => {
    setEditingMatricula(matricula);
    setFormData({
      escolaId: matricula.escolaId,
      etapaId: matricula.etapaId,
      nomeAluno: matricula.nomeAluno,
      dataNascimento: matricula.dataNascimento.split("T")[0],
      cpfAluno: matricula.cpfAluno || "",
      sexo: matricula.sexo,
      nomeResponsavel: matricula.nomeResponsavel,
      cpfResponsavel: matricula.cpfResponsavel || "",
      telefoneResponsavel: matricula.telefoneResponsavel || "",
      emailResponsavel: matricula.emailResponsavel || "",
      endereco: matricula.endereco || "",
      possuiDeficiencia: matricula.possuiDeficiencia,
      tipoDeficiencia: matricula.tipoDeficiencia || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta matrícula?")) {
      await deleteMatricula.mutateAsync(id);
    }
  };

  const handleEscolaChange = (escolaId: string) => {
    setFormData((prev) => ({
      ...prev,
      escolaId,
      etapaId: "",
    }));
  };

  const getEscolaNome = (escolaId: string) => {
    return escolas?.find((e) => e.id === escolaId)?.nome || "N/A";
  };

  const getEtapaNome = (etapaId: string) => {
    return etapas?.find((e) => e.id === etapaId)?.nome || "N/A";
  };

  // Se está visualizando detalhes de um aluno
  if (viewingAlunoId) {
    return (
      <AlunoDetails
        matriculaId={viewingAlunoId}
        onBack={() => setViewingAlunoId(null)}
      />
    );
  }

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
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="gap-2"
          disabled={escolasAtivas.length === 0}
        >
          <UserPlus size={14} weight="bold" />
          Nova Matrícula
        </Button>
      </div>

      {escolasAtivas.length === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Nenhuma escola ativa cadastrada. Cadastre escolas, etapas e
              séries antes de realizar matrículas.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="text-primary" size={24} weight="duotone" />
              {editingMatricula ? "Editar Matrícula" : "Formulário de Matrícula"}
            </DialogTitle>
            <DialogDescription>
              {editingMatricula
                ? "Atualize os dados da matrícula"
                : "Preencha os dados do aluno para realizar a matrícula"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <form
              id="enrollment-form"
              onSubmit={handleSubmit}
              className="space-y-6 pr-4"
            >
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Buildings size={16} />
                  Informações Escolares
                </h4>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="escolaId">Escola *</Label>
                    <Select
                      value={formData.escolaId}
                      onValueChange={handleEscolaChange}
                      required
                      disabled={!!editingMatricula}
                    >
                      <SelectTrigger id="escolaId">
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {escolasAtivas.map((escola) => (
                          <SelectItem key={escola.id} value={escola.id}>
                            {escola.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="etapaId">Etapa de Ensino *</Label>
                    <Select
                      value={formData.etapaId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, etapaId: value }))
                      }
                      disabled={!formData.escolaId || etapasDisponiveis.length === 0 || !!editingMatricula}
                      required
                    >
                      <SelectTrigger id="etapaId">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {etapasDisponiveis.map((etapa) => (
                          <SelectItem key={etapa.id} value={etapa.id}>
                            {etapa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Dados do Aluno
                </h4>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nomeAluno">Nome Completo *</Label>
                    <Input
                      id="nomeAluno"
                      required
                      value={formData.nomeAluno}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nomeAluno: e.target.value,
                        }))
                      }
                      placeholder="Nome completo do aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo *</Label>
                    <Select
                      value={formData.sexo}
                      onValueChange={(value: "M" | "F") =>
                        setFormData((prev) => ({ ...prev, sexo: value }))
                      }
                      required
                    >
                      <SelectTrigger id="sexo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      required
                      value={formData.dataNascimento}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dataNascimento: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfAluno">CPF do Aluno</Label>
                    <Input
                      id="cpfAluno"
                      value={formData.cpfAluno}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cpfAluno: e.target.value,
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Dados do Responsável
                </h4>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nomeResponsavel">Nome do Responsável *</Label>
                    <Input
                      id="nomeResponsavel"
                      required
                      value={formData.nomeResponsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nomeResponsavel: e.target.value,
                        }))
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfResponsavel">CPF do Responsável</Label>
                    <Input
                      id="cpfResponsavel"
                      value={formData.cpfResponsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cpfResponsavel: e.target.value,
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefoneResponsavel">Telefone</Label>
                    <Input
                      id="telefoneResponsavel"
                      value={formData.telefoneResponsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          telefoneResponsavel: e.target.value,
                        }))
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailResponsavel">E-mail</Label>
                    <Input
                      id="emailResponsavel"
                      type="email"
                      value={formData.emailResponsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emailResponsavel: e.target.value,
                        }))
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Endereço
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endereco: e.target.value,
                      }))
                    }
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Necessidades Especiais
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="possuiDeficiencia"
                      checked={formData.possuiDeficiencia}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          possuiDeficiencia: checked as boolean,
                        }))
                      }
                    />
                    <Label
                      htmlFor="possuiDeficiencia"
                      className="cursor-pointer"
                    >
                      Aluno possui necessidades especiais (PCD)
                    </Label>
                  </div>
                  {formData.possuiDeficiencia && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="tipoDeficiencia">
                        Tipo de Deficiência
                      </Label>
                      <Input
                        id="tipoDeficiencia"
                        value={formData.tipoDeficiencia}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipoDeficiencia: e.target.value,
                          }))
                        }
                        placeholder="Descreva a deficiência do aluno"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 bg-background">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="enrollment-form"
              className="gap-2"
              disabled={createMatricula.isPending || updateMatricula.isPending}
            >
              {(createMatricula.isPending || updateMatricula.isPending) && (
                <Spinner className="animate-spin" size={16} />
              )}
              <UserPlus size={18} weight="bold" />
              {editingMatricula ? "Atualizar" : "Realizar Matrícula"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Matrículas Realizadas</CardTitle>
              <CardDescription>
                {temFiltrosAtivos 
                  ? `${matriculasFiltradas.length} de ${(matriculas || []).length} matrícula(s)`
                  : `${(matriculas || []).length} matrícula(s) no sistema`
                }
              </CardDescription>
            </div>
          </div>
          
          {/* Barra de Pesquisa e Filtros */}
          <div className="space-y-4 pt-4">
            {/* Pesquisa */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                />
                <Input
                  placeholder="Pesquisar por nome do aluno, responsável, CPF, RG ou nº matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                title="Mostrar filtros"
              >
                <Funnel size={18} />
              </Button>
              {temFiltrosAtivos && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={limparFiltros}
                  title="Limpar filtros"
                >
                  <X size={18} />
                </Button>
              )}
            </div>
            
            {/* Filtros Avançados */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Sexo</Label>
                  <Select
                    value={filtroSexo}
                    onValueChange={(value) => setFiltroSexo(value as "all" | "M" | "F")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Idade mínima</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={filtroIdadeMin}
                    onChange={(e) => setFiltroIdadeMin(e.target.value)}
                    min={0}
                    max={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Idade máxima</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 18"
                    value={filtroIdadeMax}
                    onChange={(e) => setFiltroIdadeMax(e.target.value)}
                    min={0}
                    max={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Etapa de Ensino</Label>
                  <Select
                    value={filtroEtapaId}
                    onValueChange={setFiltroEtapaId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(etapas || []).map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id}>
                          {etapa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!matriculas || matriculas.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus
                className="mx-auto mb-4 text-muted-foreground"
                size={48}
                weight="duotone"
              />
              <p className="text-muted-foreground">
                Nenhuma matrícula realizada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Matrícula" para começar
              </p>
            </div>
          ) : matriculasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlass
                className="mx-auto mb-4 text-muted-foreground"
                size={48}
                weight="duotone"
              />
              <p className="text-muted-foreground">
                Nenhuma matrícula encontrada com os filtros aplicados
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os critérios de busca
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
                className="mt-4"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {matriculasFiltradas.map((matricula) => (
                <div
                  key={matricula.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserPlus
                          className="text-primary"
                          size={24}
                          weight="duotone"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            {matricula.nomeAluno}
                          </h4>
                          <Badge
                            variant={
                              matricula.status === "ATIVA"
                                ? "default"
                                : matricula.status === "CANCELADA"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {matricula.status === "ATIVA"
                              ? "Ativa"
                              : matricula.status === "CANCELADA"
                              ? "Cancelada"
                              : matricula.status === "TRANSFERIDA"
                              ? "Transferida"
                              : "Concluída"}
                          </Badge>
                          {matricula.possuiDeficiencia && (
                            <Badge variant="outline">PCD</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Matrícula:</span>{" "}
                            {matricula.numeroMatricula}
                          </div>
                          <div className="flex items-center gap-2">
                            <Buildings size={14} />
                            {getEscolaNome(matricula.escolaId)}
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap size={14} />
                            {getEtapaNome(matricula.etapaId)}
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            Responsável: {matricula.nomeResponsavel}
                          </div>
                          {matricula.telefoneResponsavel && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              {matricula.telefoneResponsavel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewingAlunoId(matricula.id)}
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(matricula)}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(matricula.id)}
                        disabled={deleteMatricula.isPending}
                        title="Excluir"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
