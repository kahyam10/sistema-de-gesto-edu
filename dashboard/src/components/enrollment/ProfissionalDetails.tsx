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
  ArrowLeft,
  Pencil,
  Buildings,
  GraduationCap,
  Phone,
  Envelope,
  User,
  Chalkboard,
  BookOpen,
  Spinner,
  Student,
  IdentificationCard,
  Certificate,
  Trash,
} from "@phosphor-icons/react";
import { ProfissionalEducacao, Escola, Turma, FormacaoProfissional } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useProfissionais,
  useUpdateProfissional,
  useEscolas,
  useTurmas,
  useAddFormacao,
  useUpdateFormacao,
  useDeleteFormacao,
  useGradeHorariaByProfissional,
  useCargaHorariaResumo,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface ProfissionalDetailsProps {
  profissionalId: string;
  onBack: () => void;
}

type TipoProfissional = "PROFESSOR" | "AUXILIAR" | "COORDENADOR" | "DIRETOR" | "SECRETARIO";

const tipoLabels: Record<TipoProfissional, string> = {
  PROFESSOR: "Professor(a)",
  AUXILIAR: "Auxiliar",
  COORDENADOR: "Coordenador(a)",
  DIRETOR: "Diretor(a)",
  SECRETARIO: "Secretário(a)",
};

const tipoBadgeColors: Record<TipoProfissional, string> = {
  PROFESSOR: "bg-blue-100 text-blue-800",
  AUXILIAR: "bg-green-100 text-green-800",
  COORDENADOR: "bg-purple-100 text-purple-800",
  DIRETOR: "bg-orange-100 text-orange-800",
  SECRETARIO: "bg-teal-100 text-teal-800",
};

const turnoLabels: Record<string, string> = {
  MATUTINO: "Matutino",
  VESPERTINO: "Vespertino",
  NOTURNO: "Noturno",
  INTEGRAL: "Integral",
};

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function detectConflicts(horarios: { diaSemana: string; horaInicio: string; horaFim: string; id: string }[]) {
  const conflitos = new Set<string>();
  const porDia = horarios.reduce((acc, item) => {
    acc[item.diaSemana] = acc[item.diaSemana] || [];
    acc[item.diaSemana].push(item);
    return acc;
  }, {} as Record<string, typeof horarios>);

  Object.values(porDia).forEach((lista) => {
    const ordenado = [...lista].sort((a, b) => toMinutes(a.horaInicio) - toMinutes(b.horaInicio));
    for (let i = 1; i < ordenado.length; i++) {
      const anterior = ordenado[i - 1];
      const atual = ordenado[i];
      if (toMinutes(atual.horaInicio) < toMinutes(anterior.horaFim)) {
        conflitos.add(anterior.id);
        conflitos.add(atual.id);
      }
    }
  });

  return conflitos;
}

// Subcomponente: Lista de Escolas Vinculadas
function EscolasVinculadasView({ 
  profissional, 
  onBack 
}: { 
  profissional: ProfissionalEducacao; 
  onBack: () => void;
}) {
  const escolasVinculadas = profissional?.escolas?.map((e) => e.escola) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Buildings className="h-6 w-6" />
            Escolas Vinculadas
          </h2>
          <p className="text-muted-foreground">
            Escolas onde {profissional.nome} atua
          </p>
        </div>
        <Badge variant="secondary">{escolasVinculadas.length} escola(s)</Badge>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="pt-6">
          {escolasVinculadas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Buildings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma escola vinculada</p>
              <p className="text-sm mt-1">
                Vincule escolas através do botão Editar no perfil do profissional
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {escolasVinculadas.map((escola) => (
                <div
                  key={escola.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Buildings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{escola.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Código: {escola.codigo}
                        {escola.endereco && ` • ${escola.endereco}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={escola.ativo ? "default" : "secondary"}>
                    {escola.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Subcomponente: Lista de Turmas Vinculadas
function TurmasVinculadasView({ 
  profissional, 
  allTurmas,
  onBack 
}: { 
  profissional: ProfissionalEducacao;
  allTurmas: Turma[];
  onBack: () => void;
}) {
  const turmasVinculadas = profissional?.turmas || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Chalkboard className="h-6 w-6" />
            Turmas Vinculadas
          </h2>
          <p className="text-muted-foreground">
            Turmas onde {profissional.nome} atua
          </p>
        </div>
        <Badge variant="secondary">{turmasVinculadas.length} turma(s)</Badge>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="pt-6">
          {turmasVinculadas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Chalkboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma turma vinculada</p>
              <p className="text-sm mt-1">
                Vincule turmas através do gerenciador de turmas
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {turmasVinculadas.map((tv, index) => {
                const turma = tv.turma;
                if (!turma) return null;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Chalkboard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{turma.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {turnoLabels[turma.turno] || turma.turno}
                          {tv.disciplina && ` • ${tv.disciplina}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {tv.tipo === "PROFESSOR" ? "Professor" : "Auxiliar"}
                      </Badge>
                      <Badge variant="secondary">
                        {turma.matriculas?.length || 0} alunos
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Tipos de formação
const tiposFormacao = [
  { value: "GRADUACAO", label: "Graduação" },
  { value: "POS_GRADUACAO", label: "Pós-Graduação" },
  { value: "MESTRADO", label: "Mestrado" },
  { value: "DOUTORADO", label: "Doutorado" },
  { value: "CURSO_TECNICO", label: "Curso Técnico" },
  { value: "CURSO_LIVRE", label: "Curso Livre" },
];

const tipoFormacaoLabel: Record<string, string> = {
  GRADUACAO: "Graduação",
  POS_GRADUACAO: "Pós-Graduação",
  MESTRADO: "Mestrado",
  DOUTORADO: "Doutorado",
  CURSO_TECNICO: "Curso Técnico",
  CURSO_LIVRE: "Curso Livre",
};

const tipoFormacaoColor: Record<string, string> = {
  GRADUACAO: "bg-blue-100 text-blue-800",
  POS_GRADUACAO: "bg-purple-100 text-purple-800",
  MESTRADO: "bg-green-100 text-green-800",
  DOUTORADO: "bg-orange-100 text-orange-800",
  CURSO_TECNICO: "bg-teal-100 text-teal-800",
  CURSO_LIVRE: "bg-gray-100 text-gray-800",
};

// Subcomponente: Formação
function FormacaoView({ 
  profissional, 
  onBack 
}: { 
  profissional: ProfissionalEducacao; 
  onBack: () => void;
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFormacao, setSelectedFormacao] = useState<FormacaoProfissional | null>(null);
  const [formData, setFormData] = useState({
    tipo: "GRADUACAO",
    nome: "",
    instituicao: "",
    anoConclusao: new Date().getFullYear(),
    cargaHoraria: 0,
    emAndamento: false,
  });

  const addFormacao = useAddFormacao();
  const updateFormacao = useUpdateFormacao();
  const deleteFormacao = useDeleteFormacao();

  const formacoes = profissional.formacoes || [];

  const resetForm = () => {
    setFormData({
      tipo: "GRADUACAO",
      nome: "",
      instituicao: "",
      anoConclusao: new Date().getFullYear(),
      cargaHoraria: 0,
      emAndamento: false,
    });
  };

  const openEditDialog = (formacao: FormacaoProfissional) => {
    setSelectedFormacao(formacao);
    setFormData({
      tipo: formacao.tipo,
      nome: formacao.nome,
      instituicao: formacao.instituicao || "",
      anoConclusao: formacao.anoConclusao || new Date().getFullYear(),
      cargaHoraria: formacao.cargaHoraria || 0,
      emAndamento: formacao.emAndamento,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (formacao: FormacaoProfissional) => {
    setSelectedFormacao(formacao);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addFormacao.mutateAsync({
        profissionalId: profissional.id,
        data: {
          tipo: formData.tipo,
          nome: formData.nome,
          instituicao: formData.instituicao || undefined,
          anoConclusao: formData.emAndamento ? undefined : formData.anoConclusao,
          cargaHoraria: formData.cargaHoraria || undefined,
          emAndamento: formData.emAndamento,
        },
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormacao) return;
    try {
      await updateFormacao.mutateAsync({
        profissionalId: profissional.id,
        formacaoId: selectedFormacao.id,
        data: {
          tipo: formData.tipo,
          nome: formData.nome,
          instituicao: formData.instituicao || undefined,
          anoConclusao: formData.emAndamento ? undefined : formData.anoConclusao,
          cargaHoraria: formData.cargaHoraria || undefined,
          emAndamento: formData.emAndamento,
        },
      });
      setIsEditDialogOpen(false);
      setSelectedFormacao(null);
      resetForm();
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!selectedFormacao) return;
    try {
      await deleteFormacao.mutateAsync({
        profissionalId: profissional.id,
        formacaoId: selectedFormacao.id,
      });
      setIsDeleteDialogOpen(false);
      setSelectedFormacao(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  // Ordenar formações por tipo (ordem de importância)
  const ordemTipo: Record<string, number> = {
    DOUTORADO: 1,
    MESTRADO: 2,
    POS_GRADUACAO: 3,
    GRADUACAO: 4,
    CURSO_TECNICO: 5,
    CURSO_LIVRE: 6,
  };

  const formacoesSorted = [...formacoes].sort(
    (a, b) => (ordemTipo[a.tipo] || 99) - (ordemTipo[b.tipo] || 99)
  );

  const FormDialog = ({ 
    open, 
    onOpenChange, 
    title, 
    onSubmit, 
    isLoading 
  }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    title: string; 
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Preencha os dados da formação acadêmica ou curso
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Formação *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposFormacao.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Curso *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Licenciatura em Pedagogia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instituicao">Instituição</Label>
            <Input
              id="instituicao"
              value={formData.instituicao}
              onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
              placeholder="Ex: UFBA, UESC, UNEB"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anoConclusao">Ano de Conclusão</Label>
              <Input
                id="anoConclusao"
                type="number"
                value={formData.anoConclusao || ""}
                onChange={(e) => setFormData({ ...formData, anoConclusao: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 2020"
                disabled={formData.emAndamento}
                min={1950}
                max={new Date().getFullYear() + 10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargaHoraria">Carga Horária (h)</Label>
              <Input
                id="cargaHoraria"
                type="number"
                value={formData.cargaHoraria || ""}
                onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 3200"
                min={0}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="emAndamento"
              checked={formData.emAndamento}
              onCheckedChange={(checked) => setFormData({ ...formData, emAndamento: checked })}
            />
            <Label htmlFor="emAndamento">Em andamento</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.nome}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Certificate className="h-6 w-6" />
            Formação Acadêmica
          </h2>
          <p className="text-muted-foreground">
            Cursos e formações de {profissional.nome}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <GraduationCap className="h-4 w-4 mr-2" />
          Adicionar Formação
        </Button>
      </div>

      {/* Lista de Formações */}
      <Card>
        <CardContent className="pt-6">
          {formacoesSorted.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma formação cadastrada</p>
              <p className="text-sm mt-1">
                Adicione formações acadêmicas e cursos clicando no botão acima
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {formacoesSorted.map((formacao) => (
                <div
                  key={formacao.id}
                  className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{formacao.nome}</p>
                        <Badge className={tipoFormacaoColor[formacao.tipo] || "bg-gray-100"}>
                          {tipoFormacaoLabel[formacao.tipo] || formacao.tipo}
                        </Badge>
                        {formacao.emAndamento && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Em andamento
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formacao.instituicao && <span>{formacao.instituicao}</span>}
                        {formacao.instituicao && formacao.anoConclusao && " • "}
                        {formacao.anoConclusao && <span>Concluído em {formacao.anoConclusao}</span>}
                        {formacao.cargaHoraria && formacao.cargaHoraria > 0 && (
                          <span> • {formacao.cargaHoraria}h</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(formacao)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(formacao)}
                      className="text-destructive hover:text-destructive"
                      title="Remover"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legado: Formação antiga (campo texto) */}
      {(profissional.formacao || profissional.especialidade) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informações Adicionais (Legado)
            </CardTitle>
            <CardDescription>
              Campos de texto antigos - serão migrados para o novo formato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profissional.formacao && (
              <div>
                <p className="text-sm font-medium mb-1">Formação:</p>
                <p className="text-muted-foreground">{profissional.formacao}</p>
              </div>
            )}
            {profissional.especialidade && (
              <div>
                <p className="text-sm font-medium mb-1">Especialidade:</p>
                <p className="text-muted-foreground">{profissional.especialidade}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo Adicionar */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Adicionar Formação"
        onSubmit={handleAdd}
        isLoading={addFormacao.isPending}
      />

      {/* Diálogo Editar */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Editar Formação"
        onSubmit={handleEdit}
        isLoading={updateFormacao.isPending}
      />

      {/* Diálogo Confirmar Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Formação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta formação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{selectedFormacao?.nome}</p>
            <p className="text-sm text-muted-foreground">
              {tipoFormacaoLabel[selectedFormacao?.tipo || ""] || selectedFormacao?.tipo}
              {selectedFormacao?.instituicao && ` • ${selectedFormacao.instituicao}`}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteFormacao.isPending}
            >
              {deleteFormacao.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProfissionalDetails({ profissionalId, onBack }: ProfissionalDetailsProps) {
  const { data: profissionais, isLoading: loadingProfissionais } = useProfissionais();
  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: allTurmas = [] } = useTurmas();
  const { data: horarios = [] } = useGradeHorariaByProfissional(profissionalId);
  const { data: cargaResumo = [] } = useCargaHorariaResumo(profissionalId);
  const updateProfissional = useUpdateProfissional();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [buscaEscola, setBuscaEscola] = useState("");
  const [currentView, setCurrentView] = useState<"main" | "escolas" | "turmas" | "formacao" | "horarios">("main");
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    tipo: "PROFESSOR" as TipoProfissional,
    formacao: "",
    especialidade: "",
    matricula: "",
    ativo: true,
    escolasIds: [] as string[],
  });

  // Buscar profissional atual pelo ID
  const profissional = profissionais?.find((p) => p.id === profissionalId);

  // Escolas vinculadas
  const escolasVinculadas = profissional?.escolas?.map((e) => e.escola) || [];
  const escolasIds = escolasVinculadas.map((e) => e.id);

  // Turmas vinculadas
  const turmasVinculadas = profissional?.turmas || [];

  // Escolas filtradas pela busca
  const escolasFiltradas = escolas.filter(
    (e) =>
      e.ativo &&
      (buscaEscola === "" ||
        e.nome.toLowerCase().includes(buscaEscola.toLowerCase()) ||
        e.codigo.toLowerCase().includes(buscaEscola.toLowerCase()))
  );

  // Estatísticas
  const totalEscolas = escolasVinculadas.length;
  const totalTurmas = turmasVinculadas.length;
  const totalAlunos = turmasVinculadas.reduce((acc, tv) => {
    const turma = allTurmas.find((t) => t.id === tv.turma?.id);
    return acc + (turma?.matriculas?.length || 0);
  }, 0);
  const cargaAtual = cargaResumo[0];

  // Abrir modal de edição
  const openEdit = () => {
    if (profissional) {
      setFormData({
        nome: profissional.nome,
        cpf: profissional.cpf,
        email: profissional.email || "",
        telefone: profissional.telefone || "",
        tipo: profissional.tipo as TipoProfissional,
        formacao: profissional.formacao || "",
        especialidade: profissional.especialidade || "",
        matricula: profissional.matricula || "",
        ativo: profissional.ativo,
        escolasIds: escolasIds,
      });
      setIsEditOpen(true);
    }
  };

  // Submeter edição
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfissional.mutateAsync({
        id: profissionalId,
        data: {
          nome: formData.nome,
          cpf: formData.cpf,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          tipo: formData.tipo,
          formacao: formData.formacao || undefined,
          especialidade: formData.especialidade || undefined,
          matricula: formData.matricula || undefined,
          ativo: formData.ativo,
          escolasIds: formData.escolasIds.length > 0 ? formData.escolasIds : undefined,
        },
      });
      setIsEditOpen(false);
      toast.success("Profissional atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar profissional");
    }
  };

  // Toggle escola na lista
  const toggleEscola = (escolaId: string) => {
    setFormData((prev) => ({
      ...prev,
      escolasIds: prev.escolasIds.includes(escolaId)
        ? prev.escolasIds.filter((id) => id !== escolaId)
        : [...prev.escolasIds, escolaId],
    }));
  };

  const isLoading = loadingProfissionais || loadingEscolas;

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
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profissional) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Profissional não encontrado</h2>
            <p className="text-muted-foreground">
              O profissional solicitado não foi encontrado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar sub-views
  if (currentView === "escolas") {
    return (
      <EscolasVinculadasView
        profissional={profissional}
        onBack={() => setCurrentView("main")}
      />
    );
  }

  if (currentView === "turmas") {
    return (
      <TurmasVinculadasView
        profissional={profissional}
        allTurmas={allTurmas}
        onBack={() => setCurrentView("main")}
      />
    );
  }

  if (currentView === "formacao") {
    return (
      <FormacaoView
        profissional={profissional}
        onBack={() => setCurrentView("main")}
      />
    );
  }

  if (currentView === "horarios") {
    const conflitos = detectConflicts(horarios);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Horários do Profissional
            </h2>
            <p className="text-muted-foreground">
              Grade de aulas vinculadas ao professor
            </p>
          </div>
          <Badge variant="secondary">{horarios.length} horário(s)</Badge>
        </div>

        <Card>
          <CardContent className="pt-6">
            {horarios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum horário cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {horarios.map((horario) => (
                  <div
                    key={horario.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {horario.diaSemana} • {horario.horaInicio} - {horario.horaFim}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {horario.disciplina}
                        {horario.turma?.nome ? ` • ${horario.turma.nome}` : ""}
                      </p>
                      {horario.turma?.escola?.nome && (
                        <p className="text-xs text-muted-foreground">
                          {horario.turma.escola.nome}
                        </p>
                      )}
                    </div>
                    {conflitos.has(horario.id) && (
                      <Badge variant="destructive">Conflito</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão voltar - estilo igual ao EscolaDetails */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            {profissional.nome}
          </h2>
          <p className="text-muted-foreground">
            {tipoLabels[profissional.tipo as TipoProfissional]}
            {profissional.matricula && ` • Matrícula: ${profissional.matricula}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentView("escolas")}>
            <Buildings className="h-4 w-4 mr-2" />
            Escolas
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("turmas")}>
            <Chalkboard className="h-4 w-4 mr-2" />
            Turmas
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("horarios")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Horários
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("formacao")}>
            <Certificate className="h-4 w-4 mr-2" />
            Formação
          </Button>
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Badge variant={profissional.ativo ? "default" : "secondary"}>
            {profissional.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Buildings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEscolas}</p>
                <p className="text-sm text-muted-foreground">Escolas Vinculadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cargaAtual ? Math.round(cargaAtual.totalMinutos / 60) : 0}h
                </p>
                <p className="text-sm text-muted-foreground">Carga Horária</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Chalkboard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTurmas}</p>
                <p className="text-sm text-muted-foreground">Turmas Vinculadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Student className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAlunos}</p>
                <p className="text-sm text-muted-foreground">Alunos Atendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do profissional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <IdentificationCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">CPF:</span>
              <span>{profissional.cpf}</span>
            </div>
            {profissional.email && (
              <div className="flex items-center gap-2 text-sm">
                <Envelope className="h-4 w-4 text-muted-foreground" />
                <span>{profissional.email}</span>
              </div>
            )}
            {profissional.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profissional.telefone}</span>
              </div>
            )}
          </div>
          {(profissional.formacao || profissional.especialidade) && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profissional.formacao && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Formação:</p>
                    <p className="text-sm">{profissional.formacao}</p>
                  </div>
                )}
                {profissional.especialidade && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Especialidade:</p>
                    <p className="text-sm">{profissional.especialidade}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de escolas vinculadas (preview) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Buildings className="h-5 w-5" />
              Escolas Vinculadas
            </CardTitle>
            <CardDescription>Escolas onde o profissional atua</CardDescription>
          </div>
          {totalEscolas > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentView("escolas")}>
              Ver todas
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {escolasVinculadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma escola vinculada
            </p>
          ) : (
            <div className="space-y-2">
              {escolasVinculadas.slice(0, 3).map((escola) => (
                <div
                  key={escola.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Buildings className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">{escola.nome}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {escola.codigo}
                  </Badge>
                </div>
              ))}
              {escolasVinculadas.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{escolasVinculadas.length - 3} escola(s)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de turmas vinculadas (preview) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Chalkboard className="h-5 w-5" />
              Turmas Vinculadas
            </CardTitle>
            <CardDescription>Turmas onde o profissional atua</CardDescription>
          </div>
          {totalTurmas > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentView("turmas")}>
              Ver todas
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {turmasVinculadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma turma vinculada
            </p>
          ) : (
            <div className="space-y-2">
              {turmasVinculadas.slice(0, 3).map((tv, index) => {
                const turma = tv.turma;
                if (!turma) return null;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Chalkboard className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{turma.nome}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tv.tipo === "PROFESSOR" ? "Professor" : "Auxiliar"}
                    </Badge>
                  </div>
                );
              })}
              {turmasVinculadas.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{turmasVinculadas.length - 3} turma(s)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
            <DialogDescription>
              Atualize as informações do profissional
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Dados Pessoais
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoProfissional })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROFESSOR">Professor</SelectItem>
                      <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                      <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                      <SelectItem value="DIRETOR">Diretor</SelectItem>
                      <SelectItem value="SECRETARIO">Secretário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Formação */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Formação
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formacao">Formação Acadêmica</Label>
                  <Input
                    id="formacao"
                    value={formData.formacao}
                    onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                    placeholder="Ex: Licenciatura em Pedagogia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Input
                    id="especialidade"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Educação Infantil"
                  />
                </div>
              </div>
            </div>

            {/* Escolas Vinculadas */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Escolas Vinculadas
              </h4>
              <div className="space-y-3">
                <Input
                  placeholder="Buscar escola pelo nome ou código..."
                  value={buscaEscola}
                  onChange={(e) => setBuscaEscola(e.target.value)}
                />
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {escolasFiltradas.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      Nenhuma escola encontrada
                    </p>
                  ) : (
                    escolasFiltradas.map((escola) => (
                      <div
                        key={escola.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 border-b last:border-b-0 cursor-pointer"
                        onClick={() => toggleEscola(escola.id)}
                      >
                        <Checkbox
                          checked={formData.escolasIds.includes(escola.id)}
                          onCheckedChange={() => toggleEscola(escola.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{escola.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            Código: {escola.codigo}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {formData.escolasIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formData.escolasIds.length} escola(s) selecionada(s)
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Profissional Ativo
              </Label>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateProfissional.isPending}>
                {updateProfissional.isPending && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
