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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash,
  Door,
  Desktop,
  Books,
  Flask,
  GridFour,
  Wheelchair,
  Users,
  Snowflake,
  Fan,
  Television,
  ProjectorScreen,
  Chalkboard,
  Spinner,
  ArrowLeft,
} from "@phosphor-icons/react";
import { Sala, TipoSala, Escola } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useSalasByEscola,
  useSalaEstatisticas,
  useCreateSala,
  useUpdateSala,
  useDeleteSala,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface SalasManagerProps {
  escola: Escola;
  onBack: () => void;
}

const tipoSalaLabels: Record<TipoSala, string> = {
  AULA: "Sala de Aula",
  INFORMATICA: "Informática",
  LEITURA: "Leitura/Biblioteca",
  LABORATORIO: "Laboratório",
  MULTIUSO: "Multiuso",
  AEE: "AEE (Atendimento Especializado)",
};

const tipoSalaIcons: Record<TipoSala, React.ReactNode> = {
  AULA: <Chalkboard className="h-5 w-5" />,
  INFORMATICA: <Desktop className="h-5 w-5" />,
  LEITURA: <Books className="h-5 w-5" />,
  LABORATORIO: <Flask className="h-5 w-5" />,
  MULTIUSO: <GridFour className="h-5 w-5" />,
  AEE: <Wheelchair className="h-5 w-5" />,
};

const tipoSalaBadgeColors: Record<TipoSala, string> = {
  AULA: "bg-blue-100 text-blue-800",
  INFORMATICA: "bg-purple-100 text-purple-800",
  LEITURA: "bg-amber-100 text-amber-800",
  LABORATORIO: "bg-green-100 text-green-800",
  MULTIUSO: "bg-teal-100 text-teal-800",
  AEE: "bg-orange-100 text-orange-800",
};

interface SalaFormData {
  nome: string;
  tipo: TipoSala;
  capacidade: number;
  andar: number;
  metragem: number | null;
  possuiArCondicionado: boolean;
  possuiVentilador: boolean;
  possuiTV: boolean;
  possuiProjetor: boolean;
  possuiQuadro: boolean;
  acessivel: boolean;
  ativo: boolean;
  observacoes: string;
}

const initialFormData: SalaFormData = {
  nome: "",
  tipo: "AULA",
  capacidade: 30,
  andar: 0,
  metragem: null,
  possuiArCondicionado: false,
  possuiVentilador: true,
  possuiTV: false,
  possuiProjetor: false,
  possuiQuadro: true,
  acessivel: false,
  ativo: true,
  observacoes: "",
};

export function SalasManager({ escola, onBack }: SalasManagerProps) {
  const { data: salas = [], isLoading } = useSalasByEscola(escola.id);
  const { data: estatisticas } = useSalaEstatisticas(escola.id);

  const createSala = useCreateSala();
  const updateSala = useUpdateSala();
  const deleteSala = useDeleteSala();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [formData, setFormData] = useState<SalaFormData>(initialFormData);
  const [filterTipo, setFilterTipo] = useState<TipoSala | "ALL">("ALL");

  const filteredSalas = filterTipo === "ALL" 
    ? salas 
    : salas.filter((s) => s.tipo === filterTipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Nome da sala é obrigatório");
      return;
    }

    try {
      if (editingSala) {
        await updateSala.mutateAsync({
          id: editingSala.id,
          escolaId: escola.id,
          data: {
            nome: formData.nome,
            tipo: formData.tipo,
            capacidade: formData.capacidade,
            andar: formData.andar,
            metragem: formData.metragem,
            possuiArCondicionado: formData.possuiArCondicionado,
            possuiVentilador: formData.possuiVentilador,
            possuiTV: formData.possuiTV,
            possuiProjetor: formData.possuiProjetor,
            possuiQuadro: formData.possuiQuadro,
            acessivel: formData.acessivel,
            ativo: formData.ativo,
            observacoes: formData.observacoes || null,
          },
        });
      } else {
        await createSala.mutateAsync({
          escolaId: escola.id,
          data: {
            nome: formData.nome,
            tipo: formData.tipo,
            capacidade: formData.capacidade,
            andar: formData.andar,
            metragem: formData.metragem,
            possuiArCondicionado: formData.possuiArCondicionado,
            possuiVentilador: formData.possuiVentilador,
            possuiTV: formData.possuiTV,
            possuiProjetor: formData.possuiProjetor,
            possuiQuadro: formData.possuiQuadro,
            acessivel: formData.acessivel,
            ativo: formData.ativo,
            observacoes: formData.observacoes || null,
          },
        });
      }
      resetForm();
    } catch {
      // O erro já é tratado pelo hook
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingSala(null);
    setIsFormOpen(false);
  };

  const handleEdit = (sala: Sala) => {
    setEditingSala(sala);
    setFormData({
      nome: sala.nome,
      tipo: sala.tipo,
      capacidade: sala.capacidade,
      andar: sala.andar,
      metragem: sala.metragem ?? null,
      possuiArCondicionado: sala.possuiArCondicionado,
      possuiVentilador: sala.possuiVentilador,
      possuiTV: sala.possuiTV,
      possuiProjetor: sala.possuiProjetor,
      possuiQuadro: sala.possuiQuadro,
      acessivel: sala.acessivel,
      ativo: sala.ativo,
      observacoes: sala.observacoes ?? "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (sala: Sala) => {
    if (confirm(`Deseja realmente excluir a sala "${sala.nome}"?`)) {
      await deleteSala.mutateAsync({ id: sala.id, escolaId: escola.id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Door className="h-6 w-6" />
            Salas - {escola.nome}
          </h2>
          <p className="text-muted-foreground">
            Gerencie as salas e espaços físicos da escola
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sala
        </Button>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{estatisticas.totalSalas}</p>
                <p className="text-xs text-muted-foreground">Total de Salas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estatisticas.salasAula}</p>
                <p className="text-xs text-muted-foreground">Salas de Aula</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{estatisticas.salasInformatica}</p>
                <p className="text-xs text-muted-foreground">Informática</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticas.laboratorios}</p>
                <p className="text-xs text-muted-foreground">Laboratórios</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{estatisticas.salasLeitura}</p>
                <p className="text-xs text-muted-foreground">Leitura</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{estatisticas.capacidadeTotal}</p>
                <p className="text-xs text-muted-foreground">Capacidade Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{estatisticas.salasComArCondicionado}</p>
                <p className="text-xs text-muted-foreground">Com A/C</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Label>Filtrar por tipo:</Label>
        <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as TipoSala | "ALL")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="AULA">Sala de Aula</SelectItem>
            <SelectItem value="INFORMATICA">Informática</SelectItem>
            <SelectItem value="LEITURA">Leitura/Biblioteca</SelectItem>
            <SelectItem value="LABORATORIO">Laboratório</SelectItem>
            <SelectItem value="MULTIUSO">Multiuso</SelectItem>
            <SelectItem value="AEE">AEE</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredSalas.length} sala(s) encontrada(s)
        </span>
      </div>

      {/* Lista de Salas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSalas.map((sala) => (
          <Card key={sala.id} className={!sala.ativo ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${tipoSalaBadgeColors[sala.tipo]}`}>
                    {tipoSalaIcons[sala.tipo]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{sala.nome}</CardTitle>
                    <CardDescription>{tipoSalaLabels[sala.tipo]}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(sala)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(sala)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Capacidade e Andar */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Capacidade: <strong>{sala.capacidade}</strong></span>
                  </div>
                  <span className="text-muted-foreground">
                    {sala.andar === 0 ? "Térreo" : `${sala.andar}º Andar`}
                  </span>
                </div>

                {/* Metragem */}
                {sala.metragem && (
                  <p className="text-sm text-muted-foreground">
                    Área: {sala.metragem} m²
                  </p>
                )}

                {/* Recursos */}
                <div className="flex flex-wrap gap-1.5">
                  {sala.possuiArCondicionado && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Snowflake className="h-3 w-3" />
                      A/C
                    </Badge>
                  )}
                  {sala.possuiVentilador && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Fan className="h-3 w-3" />
                      Ventilador
                    </Badge>
                  )}
                  {sala.possuiTV && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Television className="h-3 w-3" />
                      TV
                    </Badge>
                  )}
                  {sala.possuiProjetor && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <ProjectorScreen className="h-3 w-3" />
                      Projetor
                    </Badge>
                  )}
                  {sala.possuiQuadro && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Chalkboard className="h-3 w-3" />
                      Quadro
                    </Badge>
                  )}
                  {sala.acessivel && (
                    <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-800">
                      <Wheelchair className="h-3 w-3" />
                      Acessível
                    </Badge>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={sala.ativo ? "default" : "secondary"}>
                    {sala.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                  {sala.observacoes && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={sala.observacoes}>
                      {sala.observacoes}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSalas.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Door className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sala cadastrada</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeira sala
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSala ? "Editar Sala" : "Nova Sala"}
            </DialogTitle>
            <DialogDescription>
              {editingSala
                ? "Atualize as informações da sala"
                : "Preencha os dados para cadastrar uma nova sala"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Dados Básicos
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Sala *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Sala 01, Lab. Informática"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoSala })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AULA">Sala de Aula</SelectItem>
                      <SelectItem value="INFORMATICA">Informática</SelectItem>
                      <SelectItem value="LEITURA">Leitura/Biblioteca</SelectItem>
                      <SelectItem value="LABORATORIO">Laboratório</SelectItem>
                      <SelectItem value="MULTIUSO">Multiuso</SelectItem>
                      <SelectItem value="AEE">AEE (Atendimento Especializado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacidade">Capacidade de Alunos</Label>
                  <Input
                    id="capacidade"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacidade}
                    onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="andar">Andar</Label>
                  <Select
                    value={formData.andar.toString()}
                    onValueChange={(v) => setFormData({ ...formData, andar: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Térreo</SelectItem>
                      <SelectItem value="1">1º Andar</SelectItem>
                      <SelectItem value="2">2º Andar</SelectItem>
                      <SelectItem value="3">3º Andar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metragem">Metragem (m²)</Label>
                  <Input
                    id="metragem"
                    type="number"
                    min="1"
                    step="0.1"
                    value={formData.metragem ?? ""}
                    onChange={(e) => setFormData({ ...formData, metragem: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            {/* Recursos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Recursos Disponíveis
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg border min-w-0">
                  <Switch
                    id="arCondicionado"
                    checked={formData.possuiArCondicionado}
                    onCheckedChange={(checked) => setFormData({ ...formData, possuiArCondicionado: checked })}
                  />
                  <Label htmlFor="arCondicionado" className="flex items-center gap-2 cursor-pointer text-sm truncate">
                    <Snowflake className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">Ar Condicionado</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border min-w-0">
                  <Switch
                    id="ventilador"
                    checked={formData.possuiVentilador}
                    onCheckedChange={(checked) => setFormData({ ...formData, possuiVentilador: checked })}
                  />
                  <Label htmlFor="ventilador" className="flex items-center gap-2 cursor-pointer text-sm truncate">
                    <Fan className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">Ventilador</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border min-w-0">
                  <Switch
                    id="tv"
                    checked={formData.possuiTV}
                    onCheckedChange={(checked) => setFormData({ ...formData, possuiTV: checked })}
                  />
                  <Label htmlFor="tv" className="flex items-center gap-2 cursor-pointer text-sm truncate">
                    <Television className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">TV</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border min-w-0">
                  <Switch
                    id="projetor"
                    checked={formData.possuiProjetor}
                    onCheckedChange={(checked) => setFormData({ ...formData, possuiProjetor: checked })}
                  />
                  <Label htmlFor="projetor" className="flex items-center gap-2 cursor-pointer text-sm truncate">
                    <ProjectorScreen className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="truncate">Projetor</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border min-w-0">
                  <Switch
                    id="quadro"
                    checked={formData.possuiQuadro}
                    onCheckedChange={(checked) => setFormData({ ...formData, possuiQuadro: checked })}
                  />
                  <Label htmlFor="quadro" className="flex items-center gap-2 cursor-pointer text-sm truncate">
                    <Chalkboard className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="truncate">Quadro</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border min-w-0">
                  <Switch
                    id="acessivel"
                    checked={formData.acessivel}
                    onCheckedChange={(checked) => setFormData({ ...formData, acessivel: checked })}
                  />
                  <Label htmlFor="acessivel" className="flex items-center gap-2 cursor-pointer text-sm truncate">
                    <Wheelchair className="h-4 w-4 text-teal-500 flex-shrink-0" />
                    <span className="truncate">Acessível</span>
                  </Label>
                </div>
              </div>
            </div>

            {/* Observações e Status */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Informações Adicionais
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre a sala (opcional)"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Sala Ativa
                </Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createSala.isPending || updateSala.isPending}
              >
                {(createSala.isPending || updateSala.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingSala ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
