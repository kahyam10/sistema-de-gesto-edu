"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  IdCard,
  Eye,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfissionais,
  useCreateProfissional,
  useUpdateProfissional,
  useDeleteProfissional,
  useEscolas,
} from "@/hooks/useApi";
import type { ProfissionalEducacao } from "@/lib/api";
import { ProfissionalDetails } from "./ProfissionalDetails";

type TipoProfissional = "PROFESSOR" | "AUXILIAR" | "COORDENADOR" | "DIRETOR";

interface ProfissionalForm {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  tipo: TipoProfissional;
  formacao: string;
  especialidade: string;
  matricula: string;
  ativo: boolean;
  escolasIds: string[];
}

const initialForm: ProfissionalForm = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  tipo: "PROFESSOR",
  formacao: "",
  especialidade: "",
  matricula: "",
  ativo: true,
  escolasIds: [],
};

const tipoLabels: Record<TipoProfissional, string> = {
  PROFESSOR: "Professor",
  AUXILIAR: "Auxiliar",
  COORDENADOR: "Coordenador",
  DIRETOR: "Diretor",
};

const tipoBadgeColors: Record<TipoProfissional, string> = {
  PROFESSOR: "bg-blue-100 text-blue-800",
  AUXILIAR: "bg-green-100 text-green-800",
  COORDENADOR: "bg-purple-100 text-purple-800",
  DIRETOR: "bg-orange-100 text-orange-800",
};

export function ProfissionaisManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfissionalForm>(initialForm);
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [viewingProfissionalId, setViewingProfissionalId] = useState<string | null>(null);
  const [buscaEscola, setBuscaEscola] = useState("");

  // API Hooks
  const { data: profissionais = [], isLoading } = useProfissionais();
  const { data: escolas = [] } = useEscolas();
  const createMutation = useCreateProfissional();
  const updateMutation = useUpdateProfissional();
  const deleteMutation = useDeleteProfissional();

  // Escolas filtradas pela busca
  const escolasFiltradas = escolas.filter(
    (e) =>
      e.ativo &&
      (buscaEscola === "" ||
        e.nome.toLowerCase().includes(buscaEscola.toLowerCase()) ||
        e.codigo.toLowerCase().includes(buscaEscola.toLowerCase()))
  );

  const profissionaisFiltrados = filtroTipo === "all"
    ? profissionais
    : profissionais.filter((p) => p.tipo === filtroTipo);

  const handleViewDetails = (profissional: ProfissionalEducacao) => {
    setViewingProfissionalId(profissional.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!form.cpf.trim()) {
      toast.error("CPF é obrigatório");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            nome: form.nome,
            cpf: form.cpf,
            email: form.email || undefined,
            telefone: form.telefone || undefined,
            tipo: form.tipo,
            formacao: form.formacao || undefined,
            especialidade: form.especialidade || undefined,
            matricula: form.matricula || undefined,
            ativo: form.ativo,
            escolasIds: form.escolasIds.length > 0 ? form.escolasIds : undefined,
          },
        });
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          nome: form.nome,
          cpf: form.cpf,
          email: form.email || undefined,
          telefone: form.telefone || undefined,
          tipo: form.tipo,
          formacao: form.formacao || undefined,
          especialidade: form.especialidade || undefined,
          matricula: form.matricula || undefined,
          ativo: form.ativo,
          escolasIds: form.escolasIds.length > 0 ? form.escolasIds : undefined,
        });
        toast.success("Profissional cadastrado com sucesso!");
      }

      resetForm();
    } catch {
      toast.error("Erro ao salvar profissional");
    }
  };

  const handleEdit = (profissional: ProfissionalEducacao) => {
    setForm({
      nome: profissional.nome,
      cpf: profissional.cpf,
      email: profissional.email || "",
      telefone: profissional.telefone || "",
      tipo: profissional.tipo,
      formacao: profissional.formacao || "",
      especialidade: profissional.especialidade || "",
      matricula: profissional.matricula || "",
      ativo: profissional.ativo,
      escolasIds: profissional.escolas?.map((e) => e.escola.id) || [],
    });
    setEditingId(profissional.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional?")) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Profissional excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir profissional");
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setDialogOpen(false);
    setBuscaEscola("");
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleEscolaToggle = (escolaId: string) => {
    setForm((prev) => ({
      ...prev,
      escolasIds: prev.escolasIds.includes(escolaId)
        ? prev.escolasIds.filter((id) => id !== escolaId)
        : [...prev.escolasIds, escolaId],
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Se está visualizando detalhes de um profissional
  if (viewingProfissionalId) {
    return (
      <ProfissionalDetails
        profissionalId={viewingProfissionalId}
        onBack={() => setViewingProfissionalId(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profissionais da Educação
            </CardTitle>
            <CardDescription>
              Gerencie os profissionais (professores, coordenadores, diretores)
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Profissional" : "Novo Profissional"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do profissional da educação
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      placeholder="Nome do profissional"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={form.cpf}
                      onChange={(e) =>
                        setForm({ ...form, cpf: formatCpf(e.target.value) })
                      }
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefone"
                        className="pl-10"
                        value={form.telefone}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            telefone: formatPhone(e.target.value),
                          })
                        }
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select
                      value={form.tipo}
                      onValueChange={(value: TipoProfissional) =>
                        setForm({ ...form, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROFESSOR">Professor</SelectItem>
                        <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                        <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                        <SelectItem value="DIRETOR">Diretor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={form.matricula}
                      onChange={(e) =>
                        setForm({ ...form, matricula: e.target.value })
                      }
                      placeholder="Número da matrícula"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="formacao">Formação</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="formacao"
                        className="pl-10"
                        value={form.formacao}
                        onChange={(e) =>
                          setForm({ ...form, formacao: e.target.value })
                        }
                        placeholder="Ex: Pedagogia, Matemática"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input
                      id="especialidade"
                      value={form.especialidade}
                      onChange={(e) =>
                        setForm({ ...form, especialidade: e.target.value })
                      }
                      placeholder="Ex: Educação Especial"
                    />
                  </div>
                </div>

                {escolas.length > 0 && (
                  <div className="space-y-2">
                    <Label>Escolas Vinculadas</Label>
                    <div className="space-y-2">
                      {/* Campo de busca */}
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar escola pelo nome ou código..."
                          value={buscaEscola}
                          onChange={(e) => setBuscaEscola(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Escolas selecionadas */}
                      {form.escolasIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-md">
                          {form.escolasIds.map((escolaId) => {
                            const escola = escolas.find((e) => e.id === escolaId);
                            return escola ? (
                              <span
                                key={escolaId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                              >
                                {escola.nome}
                                <button
                                  type="button"
                                  onClick={() => handleEscolaToggle(escolaId)}
                                  className="hover:bg-primary/20 rounded-full p-0.5"
                                >
                                  <span className="sr-only">Remover</span>
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      {/* Lista de escolas para selecionar */}
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {escolasFiltradas.length > 0 ? (
                          escolasFiltradas.map((escola) => (
                            <label
                              key={escola.id}
                              className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-muted/50 border-b last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={form.escolasIds.includes(escola.id)}
                                onChange={() => handleEscolaToggle(escola.id)}
                                className="rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <span className="font-medium">{escola.nome}</span>
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({escola.codigo})
                                </span>
                              </div>
                            </label>
                          ))
                        ) : (
                          <p className="p-3 text-center text-sm text-muted-foreground">
                            {buscaEscola
                              ? "Nenhuma escola encontrada"
                              : "Nenhuma escola disponível"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={form.ativo}
                    onChange={(e) =>
                      setForm({ ...form, ativo: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Profissional ativo
                  </Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingId
                      ? "Atualizar"
                      : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="w-48">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="PROFESSOR">Professores</SelectItem>
                <SelectItem value="AUXILIAR">Auxiliares</SelectItem>
                <SelectItem value="COORDENADOR">Coordenadores</SelectItem>
                <SelectItem value="DIRETOR">Diretores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            {profissionaisFiltrados.length} profissional(is) encontrado(s)
          </span>
        </div>

        {profissionaisFiltrados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum profissional cadastrado</p>
            <p className="text-sm">
              Clique em &quot;Novo Profissional&quot; para começar
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Formação</TableHead>
                <TableHead>Escolas Vinculadas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profissionaisFiltrados.map((profissional) => (
                <TableRow 
                  key={profissional.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(profissional)}
                >
                  <TableCell className="font-medium">
                    {profissional.nome}
                    {profissional.matricula && (
                      <span className="block text-xs text-muted-foreground">
                        Mat: {profissional.matricula}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{profissional.cpf}</TableCell>
                  <TableCell>
                    <Badge className={tipoBadgeColors[profissional.tipo]}>
                      {tipoLabels[profissional.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {profissional.formacao || "-"}
                      {profissional.especialidade && (
                        <span className="block text-xs text-muted-foreground">
                          {profissional.especialidade}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {profissional.escolas && profissional.escolas.length > 0 ? (
                        profissional.escolas.length <= 2 ? (
                          profissional.escolas.map((e) => (
                            <Badge key={e.escola.id} variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {e.escola.nome}
                            </Badge>
                          ))
                        ) : (
                          <>
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {profissional.escolas[0].escola.nome}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              +{profissional.escolas.length - 1} escola(s)
                            </Badge>
                          </>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma escola</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={profissional.ativo ? "default" : "secondary"}
                    >
                      {profissional.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(profissional)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(profissional.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
