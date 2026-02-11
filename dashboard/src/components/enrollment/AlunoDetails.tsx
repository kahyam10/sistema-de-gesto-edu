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
  ArrowLeft,
  Pencil,
  Buildings,
  GraduationCap,
  Phone,
  Envelope,
  User,
  Chalkboard,
  Spinner,
  Student,
  IdentificationCard,
  CalendarBlank,
  MapPin,
  Wheelchair,
  Users,
  Clock,
  UploadSimple,
  Eye,
  FirstAid,
  Warning,
  ShieldCheck,
  FileText,
  Printer,
} from "@phosphor-icons/react";
import { pdf } from '@react-pdf/renderer';
import { FichaMatriculaPDF } from '@/components/pdf/FichaMatriculaPDF';
import { DeclaracaoMatriculaPDF } from '@/components/pdf/DeclaracaoMatriculaPDF';
import { HistoricoMatriculas } from '@/components/enrollment/HistoricoMatriculas';
import { Matricula, API_BASE_URL, DocumentoMatricula } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMatriculas,
  useUpdateMatricula,
  useEscolas,
  useEtapas,
  useTurmas,
  useConfirmarMatricula,
  useTransferirMatricula,
  useDocumentosMatricula,
  useUploadDocumento,
} from "@/hooks/useApi";
import { toast } from "sonner";

interface AlunoDetailsProps {
  matriculaId: string;
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  ATIVA: "Ativa",
  CANCELADA: "Cancelada",
  TRANSFERIDA: "Transferida",
  CONCLUIDA: "Concluída",
  AGUARDANDO_VAGA: "Aguardando vaga",
};

const statusColors: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
  TRANSFERIDA: "bg-amber-100 text-amber-800",
  CONCLUIDA: "bg-blue-100 text-blue-800",
  AGUARDANDO_VAGA: "bg-slate-100 text-slate-800",
};

const parseDocumentos = (value?: string) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as string[];
  }
};

export function AlunoDetails({ matriculaId, onBack }: AlunoDetailsProps) {
  const { data: matriculas, isLoading: loadingMatriculas } = useMatriculas();
  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: etapas = [] } = useEtapas();
  const { data: turmas = [] } = useTurmas();
  const updateMatricula = useUpdateMatricula();
  const confirmarMatricula = useConfirmarMatricula();
  const transferirMatricula = useTransferirMatricula();
  const { data: documentos } = useDocumentosMatricula(matriculaId);
  const uploadDocumento = useUploadDocumento();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEnturmarOpen, setIsEnturmarOpen] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [escolaDestino, setEscolaDestino] = useState("");
  const [turmaDestino, setTurmaDestino] = useState("");
  const [formData, setFormData] = useState({
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
    // Saude
    tipoSanguineo: "",
    alergias: "",
    medicamentos: "",
    condicoesSaude: "",
    planoSaude: "",
    numeroCartaoSUS: "",
    // Emergencia
    contatoEmergenciaNome: "",
    contatoEmergenciaTelefone: "",
    contatoEmergenciaParentesco: "",
    // Autorizacoes
    autorizacaoImagem: false,
    autorizacaoSaida: false,
  });

  // Buscar matrícula atual pelo ID
  const matricula = matriculas?.find((m) => m.id === matriculaId);

  // Escola e etapa
  const escola = escolas.find((e) => e.id === matricula?.escolaId);
  const etapa = etapas.find((e) => e.id === matricula?.etapaId);
  
  // Turma vinculada
  const turmaVinculada = turmas.find((t) => 
    t.matriculas?.some((m) => m.id === matriculaId)
  );

  const turmasDisponiveis = turmas.filter((turma) => {
    if (!matricula) return false;
    return (
      turma.escolaId === matricula.escolaId &&
      turma.anoLetivo === matricula.anoLetivo &&
      turma.ativo !== false
    );
  });

  const turmasDestinoDisponiveis = turmas.filter((turma) => {
    if (!matricula || !escolaDestino) return false;
    return (
      turma.escolaId === escolaDestino &&
      turma.anoLetivo === matricula.anoLetivo &&
      turma.ativo !== false
    );
  });

  // Calcular idade
  const calcularIdade = (dataNascimento: string): number => {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  // Formatar data
  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  // Abrir modal de edição
  const openEdit = () => {
    if (matricula) {
      setFormData({
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
        tipoSanguineo: matricula.tipoSanguineo || "",
        alergias: matricula.alergias || "",
        medicamentos: matricula.medicamentos || "",
        condicoesSaude: matricula.condicoesSaude || "",
        planoSaude: matricula.planoSaude || "",
        numeroCartaoSUS: matricula.numeroCartaoSUS || "",
        contatoEmergenciaNome: matricula.contatoEmergenciaNome || "",
        contatoEmergenciaTelefone: matricula.contatoEmergenciaTelefone || "",
        contatoEmergenciaParentesco: matricula.contatoEmergenciaParentesco || "",
        autorizacaoImagem: matricula.autorizacaoImagem || false,
        autorizacaoSaida: matricula.autorizacaoSaida || false,
      });
      setIsEditOpen(true);
    }
  };

  // Submeter edição
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula) return;
    
    try {
      await updateMatricula.mutateAsync({
        id: matriculaId,
        data: {
          anoLetivo: matricula.anoLetivo,
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
          tipoSanguineo: formData.tipoSanguineo || undefined,
          alergias: formData.alergias || undefined,
          medicamentos: formData.medicamentos || undefined,
          condicoesSaude: formData.condicoesSaude || undefined,
          planoSaude: formData.planoSaude || undefined,
          numeroCartaoSUS: formData.numeroCartaoSUS || undefined,
          contatoEmergenciaNome: formData.contatoEmergenciaNome || undefined,
          contatoEmergenciaTelefone: formData.contatoEmergenciaTelefone || undefined,
          contatoEmergenciaParentesco: formData.contatoEmergenciaParentesco || undefined,
          autorizacaoImagem: formData.autorizacaoImagem,
          autorizacaoSaida: formData.autorizacaoSaida,
          escolaId: matricula.escolaId,
          etapaId: matricula.etapaId,
        },
      });
      setIsEditOpen(false);
      toast.success("Aluno atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar aluno");
    }
  };

  const isLoading = loadingMatriculas || loadingEscolas;

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

  if (!matricula) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Aluno não encontrado</h2>
            <p className="text-muted-foreground">
              O aluno solicitado não foi encontrado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const idade = calcularIdade(matricula.dataNascimento);
  const documentosEntregues = parseDocumentos(matricula.documentosEntregues);
  const podeEnturmar =
    matricula.status === "AGUARDANDO_VAGA" || !turmaVinculada;

  // Funções para download de PDF
  const handleDownloadFicha = async () => {
    try {
      const blob = await pdf(
        <FichaMatriculaPDF
          matricula={matricula}
          escolaNome={escola?.nome}
          etapaNome={etapa?.nome}
          serieName={turmaVinculada?.serie?.nome}
          turmaNome={turmaVinculada?.nome}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ficha-matricula-${matricula.numeroMatricula}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Ficha de matrícula gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar ficha de matrícula');
    }
  };

  const handleDownloadDeclaracao = async () => {
    try {
      const blob = await pdf(
        <DeclaracaoMatriculaPDF
          matricula={matricula}
          escolaNome={escola?.nome}
          etapaNome={etapa?.nome}
          serieName={turmaVinculada?.serie?.nome}
          turmaNome={turmaVinculada?.nome}
          turnoNome={turmaVinculada?.turno}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `declaracao-matricula-${matricula.numeroMatricula}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Declaração de matrícula gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar declaração');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão voltar - estilo igual ao EscolaDetails */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Student className="h-6 w-6" />
            {matricula.nomeAluno}
          </h2>
          <p className="text-muted-foreground">
            Matrícula: {matricula.numeroMatricula}
            {` • ${idade} anos`}
            {matricula.sexo === "M" ? " • Masculino" : " • Feminino"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {podeEnturmar && (
            <Button variant="outline" onClick={() => setIsEnturmarOpen(true)}>
              <Chalkboard className="h-4 w-4 mr-2" />
              Enturmar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadFicha}>
            <FileText className="h-4 w-4 mr-2" />
            Ficha
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadDeclaracao}>
            <Printer className="h-4 w-4 mr-2" />
            Declaração
          </Button>
          <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
            <Buildings className="h-4 w-4 mr-2" />
            Transferir
          </Button>
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Badge className={statusColors[matricula.status] || "bg-gray-100 text-gray-800"}>
            {statusLabels[matricula.status] || matricula.status}
          </Badge>
          {matricula.possuiDeficiencia && (
            <Badge variant="outline" className="gap-1">
              <Wheelchair className="h-3 w-3" />
              PCD
            </Badge>
          )}
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Buildings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{escola?.nome || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Escola</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{etapa?.nome || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Etapa de Ensino</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Chalkboard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {turmaVinculada?.nome || "Não enturmado"}
                </p>
                <p className="text-xs text-muted-foreground">Turma</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <CalendarBlank className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matricula.anoLetivo}</p>
                <p className="text-xs text-muted-foreground">Ano Letivo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarBlank className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Nascimento:</span>
              <span>{formatarData(matricula.dataNascimento)}</span>
            </div>
            {matricula.cpfAluno && (
              <div className="flex items-center gap-2 text-sm">
                <IdentificationCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">CPF:</span>
                <span>{matricula.cpfAluno}</span>
              </div>
            )}
            {matricula.endereco && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Endereço:</span>
                <span className="truncate">{matricula.endereco}</span>
              </div>
            )}
          </div>
          {matricula.possuiDeficiencia && matricula.tipoDeficiencia && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Wheelchair className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Necessidade Especial:</span>
                <span>{matricula.tipoDeficiencia}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dados do Responsável
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Nome:</span>
              <span>{matricula.nomeResponsavel}</span>
            </div>
            {matricula.cpfResponsavel && (
              <div className="flex items-center gap-2 text-sm">
                <IdentificationCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">CPF:</span>
                <span>{matricula.cpfResponsavel}</span>
              </div>
            )}
            {matricula.telefoneResponsavel && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Telefone:</span>
                <span>{matricula.telefoneResponsavel}</span>
              </div>
            )}
            {matricula.emailResponsavel && (
              <div className="flex items-center gap-2 text-sm">
                <Envelope className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{matricula.emailResponsavel}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dados de Saude */}
      {(matricula.tipoSanguineo || matricula.alergias || matricula.medicamentos || matricula.condicoesSaude || matricula.planoSaude || matricula.numeroCartaoSUS) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FirstAid className="h-5 w-5" />
              Dados de Saude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {matricula.tipoSanguineo && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Tipo Sanguineo: </span>
                  <Badge variant="outline">{matricula.tipoSanguineo}</Badge>
                </div>
              )}
              {matricula.planoSaude && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Plano de Saude: </span>
                  <span>{matricula.planoSaude}</span>
                </div>
              )}
              {matricula.numeroCartaoSUS && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Cartao SUS: </span>
                  <span>{matricula.numeroCartaoSUS}</span>
                </div>
              )}
            </div>
            {(matricula.alergias || matricula.medicamentos || matricula.condicoesSaude) && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {matricula.alergias && (
                  <div className="text-sm">
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Warning className="h-3 w-3 text-red-500" /> Alergias
                    </span>
                    <p className="pl-4">{matricula.alergias}</p>
                  </div>
                )}
                {matricula.medicamentos && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Medicamentos de uso continuo: </span>
                    <span>{matricula.medicamentos}</span>
                  </div>
                )}
                {matricula.condicoesSaude && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Condicoes de saude: </span>
                    <span>{matricula.condicoesSaude}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contato de Emergencia */}
      {matricula.contatoEmergenciaNome && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Nome:</span>
                <span>{matricula.contatoEmergenciaNome}</span>
              </div>
              {matricula.contatoEmergenciaTelefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Telefone:</span>
                  <span>{matricula.contatoEmergenciaTelefone}</span>
                </div>
              )}
              {matricula.contatoEmergenciaParentesco && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Parentesco:</span>
                  <span>{matricula.contatoEmergenciaParentesco}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autorizacoes */}
      {(matricula.autorizacaoImagem || matricula.autorizacaoSaida) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Autorizacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant={matricula.autorizacaoImagem ? "default" : "outline"}>
                {matricula.autorizacaoImagem ? "Imagem autorizada" : "Imagem nao autorizada"}
              </Badge>
              <Badge variant={matricula.autorizacaoSaida ? "default" : "outline"}>
                {matricula.autorizacaoSaida ? "Saida autorizada" : "Saida nao autorizada"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos e observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IdentificationCard className="h-5 w-5" />
            Documentação e Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Documentos entregues</p>
              {documentosEntregues.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum documento informado.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {documentosEntregues.map((doc) => (
                    <Badge key={doc} variant="outline">
                      {doc}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {matricula.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{matricula.observacoes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentos Digitalizados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UploadSimple className="h-5 w-5" />
            Documentos Digitalizados
          </CardTitle>
          <CardDescription>
            Envie os documentos do aluno (JPG, PNG, PDF - max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "foto", label: "Foto 3x4", accept: "image/*" },
              { key: "rg", label: "RG", accept: "image/*,application/pdf" },
              { key: "cpf", label: "CPF", accept: "image/*,application/pdf" },
              { key: "comprovante", label: "Comprovante de Residencia", accept: "image/*,application/pdf" },
              { key: "certidao", label: "Certidao de Nascimento", accept: "image/*,application/pdf" },
              { key: "historico", label: "Historico Escolar", accept: "image/*,application/pdf" },
            ].map(({ key, label, accept }) => {
              const docPath = documentos?.[key as keyof DocumentoMatricula] as string | null;
              return (
                <div key={key} className="p-4 border rounded-lg space-y-2">
                  <p className="text-sm font-medium">{label}</p>
                  {docPath ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Enviado
                      </Badge>
                      <a
                        href={`${API_BASE_URL}${docPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Visualizar
                      </a>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept={accept}
                        id={`doc-${key}`}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Arquivo muito grande. Maximo: 5MB");
                            return;
                          }
                          await uploadDocumento.mutateAsync({
                            matriculaId,
                            file,
                            tipo: key,
                          });
                          e.target.value = "";
                        }}
                        disabled={uploadDocumento.isPending}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`doc-${key}`)?.click()}
                        disabled={uploadDocumento.isPending}
                      >
                        {uploadDocumento.isPending ? (
                          <Spinner className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UploadSimple className="h-4 w-4 mr-2" />
                        )}
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações da turma */}
      {turmaVinculada && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Chalkboard className="h-5 w-5" />
              Turma Vinculada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Chalkboard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{turmaVinculada.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {turmaVinculada.turno === "MATUTINO" && "Matutino"}
                    {turmaVinculada.turno === "VESPERTINO" && "Vespertino"}
                    {turmaVinculada.turno === "NOTURNO" && "Noturno"}
                    {turmaVinculada.turno === "INTEGRAL" && "Integral"}
                    {` • ${turmaVinculada.matriculas?.length || 0} alunos`}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {turmaVinculada.anoLetivo}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Matrículas */}
      <HistoricoMatriculas
        nomeAluno={matricula.nomeAluno}
        cpfAluno={(matricula as any).cpf}
        currentMatriculaId={matricula.id}
      />

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Dados do Aluno</DialogTitle>
            <DialogDescription>
              Atualize as informações do aluno
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <form id="aluno-form" onSubmit={handleSubmit} className="space-y-6 pr-4">
              {/* Dados do Aluno */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Dados do Aluno
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeAluno">Nome Completo *</Label>
                    <Input
                      id="nomeAluno"
                      value={formData.nomeAluno}
                      onChange={(e) => setFormData({ ...formData, nomeAluno: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo *</Label>
                    <Select
                      value={formData.sexo}
                      onValueChange={(value: "M" | "F") => setFormData({ ...formData, sexo: value })}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfAluno">CPF do Aluno</Label>
                    <Input
                      id="cpfAluno"
                      value={formData.cpfAluno}
                      onChange={(e) => setFormData({ ...formData, cpfAluno: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users size={16} />
                  Dados do Responsável
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeResponsavel">Nome do Responsável *</Label>
                    <Input
                      id="nomeResponsavel"
                      value={formData.nomeResponsavel}
                      onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfResponsavel">CPF do Responsável</Label>
                    <Input
                      id="cpfResponsavel"
                      value={formData.cpfResponsavel}
                      onChange={(e) => setFormData({ ...formData, cpfResponsavel: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefoneResponsavel">Telefone</Label>
                    <Input
                      id="telefoneResponsavel"
                      value={formData.telefoneResponsavel}
                      onChange={(e) => setFormData({ ...formData, telefoneResponsavel: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailResponsavel">E-mail</Label>
                    <Input
                      id="emailResponsavel"
                      type="email"
                      value={formData.emailResponsavel}
                      onChange={(e) => setFormData({ ...formData, emailResponsavel: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MapPin size={16} />
                  Endereço
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>

              {/* Necessidades Especiais */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Wheelchair size={16} />
                  Necessidades Especiais
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="possuiDeficiencia"
                      checked={formData.possuiDeficiencia}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, possuiDeficiencia: checked as boolean })
                      }
                    />
                    <Label htmlFor="possuiDeficiencia" className="cursor-pointer">
                      Aluno possui necessidades especiais (PCD)
                    </Label>
                  </div>
                  {formData.possuiDeficiencia && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="tipoDeficiencia">Tipo de Deficiencia</Label>
                      <Input
                        id="tipoDeficiencia"
                        value={formData.tipoDeficiencia}
                        onChange={(e) => setFormData({ ...formData, tipoDeficiencia: e.target.value })}
                        placeholder="Descreva a deficiencia do aluno"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dados de Saude */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <FirstAid size={16} />
                  Dados de Saude
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoSanguineo">Tipo Sanguineo</Label>
                    <Select
                      value={formData.tipoSanguineo}
                      onValueChange={(value) => setFormData({ ...formData, tipoSanguineo: value })}
                    >
                      <SelectTrigger id="tipoSanguineo">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planoSaude">Plano de Saude</Label>
                    <Input
                      id="planoSaude"
                      value={formData.planoSaude}
                      onChange={(e) => setFormData({ ...formData, planoSaude: e.target.value })}
                      placeholder="Nome do plano"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroCartaoSUS">Cartao SUS</Label>
                    <Input
                      id="numeroCartaoSUS"
                      value={formData.numeroCartaoSUS}
                      onChange={(e) => setFormData({ ...formData, numeroCartaoSUS: e.target.value })}
                      placeholder="Numero do cartao"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alergias">Alergias</Label>
                    <Input
                      id="alergias"
                      value={formData.alergias}
                      onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                      placeholder="Descreva alergias (alimentos, medicamentos, etc.)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicamentos">Medicamentos de uso continuo</Label>
                    <Input
                      id="medicamentos"
                      value={formData.medicamentos}
                      onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                      placeholder="Liste os medicamentos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condicoesSaude">Condicoes de saude</Label>
                    <Input
                      id="condicoesSaude"
                      value={formData.condicoesSaude}
                      onChange={(e) => setFormData({ ...formData, condicoesSaude: e.target.value })}
                      placeholder="Asma, diabetes, epilepsia, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Contato de Emergencia */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Phone size={16} />
                  Contato de Emergencia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contatoEmergenciaNome">Nome</Label>
                    <Input
                      id="contatoEmergenciaNome"
                      value={formData.contatoEmergenciaNome}
                      onChange={(e) => setFormData({ ...formData, contatoEmergenciaNome: e.target.value })}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contatoEmergenciaTelefone">Telefone</Label>
                    <Input
                      id="contatoEmergenciaTelefone"
                      value={formData.contatoEmergenciaTelefone}
                      onChange={(e) => setFormData({ ...formData, contatoEmergenciaTelefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contatoEmergenciaParentesco">Parentesco</Label>
                    <Input
                      id="contatoEmergenciaParentesco"
                      value={formData.contatoEmergenciaParentesco}
                      onChange={(e) => setFormData({ ...formData, contatoEmergenciaParentesco: e.target.value })}
                      placeholder="Ex: Avo, Tio, Vizinho"
                    />
                  </div>
                </div>
              </div>

              {/* Autorizacoes */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Autorizacoes
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autorizacaoImagem"
                      checked={formData.autorizacaoImagem}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, autorizacaoImagem: checked as boolean })
                      }
                    />
                    <Label htmlFor="autorizacaoImagem" className="cursor-pointer">
                      Autorizo o uso de imagem do aluno em atividades escolares
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autorizacaoSaida"
                      checked={formData.autorizacaoSaida}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, autorizacaoSaida: checked as boolean })
                      }
                    />
                    <Label htmlFor="autorizacaoSaida" className="cursor-pointer">
                      Autorizo a saida do aluno desacompanhado
                    </Label>
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 bg-background">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="aluno-form" disabled={updateMatricula.isPending}>
              {updateMatricula.isPending && (
                <Spinner className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Enturmação */}
      <Dialog open={isEnturmarOpen} onOpenChange={setIsEnturmarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enturmar aluno</DialogTitle>
            <DialogDescription>
              Selecione uma turma disponível para confirmar a matrícula.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select
                value={turmaSelecionada}
                onValueChange={(value) => setTurmaSelecionada(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmasDisponiveis.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} • {turma.turno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEnturmarOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!turmaSelecionada) return;
                  await confirmarMatricula.mutateAsync({
                    id: matricula.id,
                    turmaId: turmaSelecionada,
                  });
                  setIsEnturmarOpen(false);
                  setTurmaSelecionada("");
                }}
                disabled={confirmarMatricula.isPending || !turmaSelecionada}
              >
                {confirmarMatricula.isPending ? "Confirmando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Transferência */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transferir matrícula</DialogTitle>
            <DialogDescription>
              Selecione a escola e a turma de destino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Escola de destino</Label>
              <Select
                value={escolaDestino}
                onValueChange={(value) => {
                  setEscolaDestino(value);
                  setTurmaDestino("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {escolas
                    .filter((item) => item.ativo)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turma de destino (opcional)</Label>
              <Select
                value={turmaDestino}
                onValueChange={(value) => setTurmaDestino(value)}
                disabled={!escolaDestino}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmasDestinoDisponiveis.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} • {turma.turno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!matricula || !escolaDestino) return;
                  await transferirMatricula.mutateAsync({
                    id: matricula.id,
                    escolaId: escolaDestino,
                    turmaId: turmaDestino || undefined,
                  });
                  setIsTransferOpen(false);
                  setEscolaDestino("");
                  setTurmaDestino("");
                }}
                disabled={transferirMatricula.isPending || !escolaDestino}
              >
                {transferirMatricula.isPending
                  ? "Transferindo..."
                  : "Transferir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
