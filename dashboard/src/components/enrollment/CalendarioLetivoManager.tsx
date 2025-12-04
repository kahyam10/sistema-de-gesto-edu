"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInputBR } from "@/components/ui/date-input-br";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarBlank,
  CalendarCheck,
  CaretLeft,
  CaretRight,
  Plus,
  Pencil,
  Trash,
  Calendar,
  Sun,
  Star,
  Flag,
  GraduationCap,
  Users,
  BookOpen,
  Chalkboard,
  Spinner,
  CheckCircle,
  Warning,
  Info,
  Play,
  Stop,
} from "@phosphor-icons/react";
import {
  useAnosLetivos,
  useCreateAnoLetivo,
  useUpdateAnoLetivo,
  useDeleteAnoLetivo,
  useEventosByMes,
  useCreateEvento,
  useUpdateEvento,
  useDeleteEvento,
  useEstatisticasCalendario,
  useEscolas,
} from "@/hooks/useApi";
import type { AnoLetivo, EventoCalendario } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de evento especiais (obrigatórios - definem estrutura do ano letivo)
const tiposEventoObrigatorios = [
  { value: "INICIO_ANO_LETIVO", label: "Início do Ano Letivo", cor: "#10B981", icon: Play, reduzDia: false },
  { value: "FIM_ANO_LETIVO", label: "Fim do Ano Letivo", cor: "#EF4444", icon: Stop, reduzDia: false },
  { value: "INICIO_AULAS_REGULARES", label: "Início das Aulas Regulares", cor: "#3B82F6", icon: Play, reduzDia: false },
  { value: "FIM_AULAS_REGULARES", label: "Fim das Aulas Regulares", cor: "#8B5CF6", icon: Stop, reduzDia: false },
];

// Tipos de evento normais
const tiposEventoNormais = [
  // Feriados (subtipos)
  { value: "FERIADO_INTERNACIONAL", label: "Feriado Internacional", cor: "#9333EA", icon: Flag, reduzDia: true },
  { value: "FERIADO_NACIONAL", label: "Feriado Nacional", cor: "#DC2626", icon: Flag, reduzDia: true },
  { value: "FERIADO_ESTADUAL", label: "Feriado Estadual", cor: "#2563EB", icon: Flag, reduzDia: true },
  { value: "FERIADO_MUNICIPAL", label: "Feriado Municipal", cor: "#059669", icon: Flag, reduzDia: true },
  // Outros eventos
  { value: "RECESSO", label: "Recesso", cor: "#F97316", icon: Sun, reduzDia: true },
  { value: "SABADO_LETIVO", label: "Sábado Letivo", cor: "#22C55E", icon: CalendarCheck, reduzDia: false },
  { value: "EVENTO", label: "Evento", cor: "#3B82F6", icon: Star, reduzDia: false },
  { value: "AC", label: "Atividade Complementar (AC)", cor: "#8B5CF6", icon: Users, reduzDia: false },
  { value: "AVALIACAO", label: "Avaliação/Prova", cor: "#EC4899", icon: BookOpen, reduzDia: false },
  { value: "REUNIAO", label: "Reunião", cor: "#06B6D4", icon: Users, reduzDia: false },
  { value: "CONSELHO_CLASSE", label: "Conselho de Classe", cor: "#14B8A6", icon: Chalkboard, reduzDia: false },
  { value: "PLANEJAMENTO", label: "Planejamento", cor: "#F59E0B", icon: Calendar, reduzDia: false },
  { value: "FORMACAO", label: "Formação", cor: "#6366F1", icon: GraduationCap, reduzDia: false },
  { value: "OUTRO", label: "Outro", cor: "#6B7280", icon: CalendarBlank, reduzDia: false },
];

const todosOsTipos = [...tiposEventoObrigatorios, ...tiposEventoNormais];
const tipoEventoMap = Object.fromEntries(todosOsTipos.map((t) => [t.value, t]));

// Meses
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Dias da semana
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Função para formatar data no padrão brasileiro (dd/mm/aaaa)
const formatarDataBR = (data: string | Date | null | undefined): string => {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Função para formatar data curta (dd/mm)
const formatarDataCurtaBR = (data: string | Date | null | undefined): string => {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

interface CalendarioLetivoManagerProps {
  escolaId?: string;
}

export function CalendarioLetivoManager({ escolaId }: CalendarioLetivoManagerProps) {
  const { data: anosLetivos, isLoading: loadingAnos } = useAnosLetivos();
  const { data: escolas = [] } = useEscolas();
  
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState<AnoLetivo | null>(null);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  
  // Ref para o calendário (usado para scroll)
  const calendarioRef = useRef<HTMLDivElement>(null);
  
  // Dialogs
  const [isAnoLetivoDialogOpen, setIsAnoLetivoDialogOpen] = useState(false);
  const [isEventoDialogOpen, setIsEventoDialogOpen] = useState(false);
  const [isDeleteAnoDialogOpen, setIsDeleteAnoDialogOpen] = useState(false);
  const [isDeleteEventoDialogOpen, setIsDeleteEventoDialogOpen] = useState(false);
  const [editingAnoLetivo, setEditingAnoLetivo] = useState<AnoLetivo | null>(null);
  const [editingEvento, setEditingEvento] = useState<EventoCalendario | null>(null);
  const [eventoToDelete, setEventoToDelete] = useState<EventoCalendario | null>(null);
  
  // Mutations
  const createAnoLetivo = useCreateAnoLetivo();
  const updateAnoLetivo = useUpdateAnoLetivo();
  const deleteAnoLetivo = useDeleteAnoLetivo();
  const createEvento = useCreateEvento();
  const updateEvento = useUpdateEvento();
  const deleteEvento = useDeleteEvento();

  // Buscar eventos do mês
  const { data: eventosMes = [], isLoading: loadingEventos } = useEventosByMes(
    anoLetivoSelecionado?.id || "",
    anoAtual,
    mesAtual + 1,
    escolaId
  );

  // Estatísticas
  const { data: estatisticas, refetch: refetchEstatisticas } = useEstatisticasCalendario(
    anoLetivoSelecionado?.id || "",
    escolaId
  );

  // Selecionar ano letivo ativo por padrão
  useEffect(() => {
    if (anosLetivos && anosLetivos.length > 0 && !anoLetivoSelecionado) {
      const ativo = anosLetivos.find((a) => a.ativo) || anosLetivos[0];
      setAnoLetivoSelecionado(ativo);
      setAnoAtual(ativo.ano);
    }
  }, [anosLetivos, anoLetivoSelecionado]);

  // Atualizar ano letivo selecionado quando a lista muda
  useEffect(() => {
    if (anosLetivos && anoLetivoSelecionado) {
      const atualizado = anosLetivos.find(a => a.id === anoLetivoSelecionado.id);
      if (atualizado) {
        setAnoLetivoSelecionado(atualizado);
      }
    }
  }, [anosLetivos]);

  // Form Ano Letivo (agora só precisa do ano)
  const [anoLetivoForm, setAnoLetivoForm] = useState({
    ano: new Date().getFullYear(),
    ativo: false,
  });

  // Form Evento
  const [eventoForm, setEventoForm] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    horaInicio: "",
    horaFim: "",
    tipo: "EVENTO",
    escopo: "REDE",
    recorrente: false,
    tipoRecorrencia: "",
    diaRecorrencia: "",
    cor: "#3B82F6",
    reduzDiaLetivo: false,
    escolaId: "",
  });

  // Status do ano letivo
  const status = anoLetivoSelecionado?.status;
  const podeAdicionarEventos = status?.podeAdicionarEventos || false;
  const proximoEventoObrigatorio = status?.proximoEventoObrigatorio;

  // Tipos de evento disponíveis baseado no status
  const tiposDisponiveis = useMemo(() => {
    if (!status) return [];
    
    // Eventos obrigatórios na sequência
    if (proximoEventoObrigatorio === "INICIO_ANO_LETIVO") {
      return [tiposEventoObrigatorios[0]]; // Só Início do Ano Letivo
    }
    if (proximoEventoObrigatorio === "FIM_ANO_LETIVO") {
      return [tiposEventoObrigatorios[1]]; // Só Fim do Ano Letivo
    }
    if (proximoEventoObrigatorio === "INICIO_AULAS_REGULARES") {
      return [tiposEventoObrigatorios[2], ...tiposEventoNormais]; // Início das Aulas + eventos normais
    }
    if (proximoEventoObrigatorio === "FIM_AULAS_REGULARES") {
      return [tiposEventoObrigatorios[3], ...tiposEventoNormais]; // Fim das Aulas + eventos normais
    }
    if (podeAdicionarEventos) {
      return tiposEventoNormais; // Todos os eventos normais
    }
    return [];
  }, [status, proximoEventoObrigatorio, podeAdicionarEventos]);

  // Resetar forms
  const resetAnoLetivoForm = () => {
    setAnoLetivoForm({
      ano: new Date().getFullYear(),
      ativo: false,
    });
    setEditingAnoLetivo(null);
  };

  const resetEventoForm = () => {
    const tipoDefault = tiposDisponiveis.length > 0 ? tiposDisponiveis[0].value : "EVENTO";
    const corDefault = tipoEventoMap[tipoDefault]?.cor || "#3B82F6";
    const reduzDefault = tipoEventoMap[tipoDefault]?.reduzDia || false;
    
    setEventoForm({
      titulo: tipoEventoMap[tipoDefault]?.label || "",
      descricao: "",
      dataInicio: dataSelecionada ? dataSelecionada.toISOString().split("T")[0] : "",
      dataFim: "",
      horaInicio: "",
      horaFim: "",
      tipo: tipoDefault,
      escopo: escolaId ? "ESCOLA" : "REDE",
      recorrente: false,
      tipoRecorrencia: "",
      diaRecorrencia: "",
      cor: corDefault,
      reduzDiaLetivo: reduzDefault,
      escolaId: escolaId || "",
    });
    setEditingEvento(null);
  };

  // Handlers Ano Letivo
  const handleOpenAnoLetivoDialog = (anoLetivo?: AnoLetivo) => {
    if (anoLetivo) {
      setEditingAnoLetivo(anoLetivo);
      setAnoLetivoForm({
        ano: anoLetivo.ano,
        ativo: anoLetivo.ativo,
      });
    } else {
      resetAnoLetivoForm();
    }
    setIsAnoLetivoDialogOpen(true);
  };

  const handleSaveAnoLetivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnoLetivo) {
        await updateAnoLetivo.mutateAsync({
          id: editingAnoLetivo.id,
          data: anoLetivoForm,
        });
      } else {
        const novoAno = await createAnoLetivo.mutateAsync(anoLetivoForm);
        setAnoLetivoSelecionado(novoAno);
        setAnoAtual(novoAno.ano);
      }
      setIsAnoLetivoDialogOpen(false);
      resetAnoLetivoForm();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteAnoLetivo = async () => {
    if (!editingAnoLetivo) return;
    try {
      await deleteAnoLetivo.mutateAsync(editingAnoLetivo.id);
      setIsDeleteAnoDialogOpen(false);
      setIsAnoLetivoDialogOpen(false);
      if (anoLetivoSelecionado?.id === editingAnoLetivo.id) {
        setAnoLetivoSelecionado(null);
      }
      resetAnoLetivoForm();
    } catch {
      // Error handled by mutation
    }
  };

  // Handlers Evento
  const handleOpenEventoDialog = (eventoOuData?: EventoCalendario | Date) => {
    if (eventoOuData instanceof Date) {
      // Clicou em uma data para criar novo evento
      setDataSelecionada(eventoOuData);
      const tipoDefault = tiposDisponiveis.length > 0 ? tiposDisponiveis[0].value : "EVENTO";
      const corDefault = tipoEventoMap[tipoDefault]?.cor || "#3B82F6";
      const reduzDefault = tipoEventoMap[tipoDefault]?.reduzDia || false;
      
      setEventoForm({
        titulo: tipoEventoMap[tipoDefault]?.label || "",
        descricao: "",
        dataInicio: eventoOuData.toISOString().split("T")[0],
        dataFim: "",
        horaInicio: "",
        horaFim: "",
        tipo: tipoDefault,
        escopo: escolaId ? "ESCOLA" : "REDE",
        recorrente: false,
        tipoRecorrencia: "",
        diaRecorrencia: "",
        cor: corDefault,
        reduzDiaLetivo: reduzDefault,
        escolaId: escolaId || "",
      });
      setEditingEvento(null);
    } else if (eventoOuData) {
      // Editando evento existente
      const evento = eventoOuData;
      setEditingEvento(evento);
      setEventoForm({
        titulo: evento.titulo,
        descricao: evento.descricao || "",
        dataInicio: evento.dataInicio.split("T")[0],
        dataFim: evento.dataFim?.split("T")[0] || "",
        horaInicio: evento.horaInicio || "",
        horaFim: evento.horaFim || "",
        tipo: evento.tipo,
        escopo: evento.escopo,
        recorrente: evento.recorrente,
        tipoRecorrencia: evento.tipoRecorrencia || "",
        diaRecorrencia: evento.diaRecorrencia || "",
        cor: evento.cor,
        reduzDiaLetivo: evento.reduzDiaLetivo,
        escolaId: evento.escolaId || "",
      });
    } else {
      // Sem argumento - usa data selecionada atual ou vazia
      resetEventoForm();
    }
    setIsEventoDialogOpen(true);
  };

  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anoLetivoSelecionado) return;
    
    try {
      const data = {
        ...eventoForm,
        anoLetivoId: anoLetivoSelecionado.id,
        // Se temos escolaId da prop, usamos ele (calendário da escola)
        // Caso contrário, usamos o do formulário (pode ser vazio para eventos globais)
        escolaId: escolaId || eventoForm.escolaId || undefined,
        dataFim: eventoForm.dataFim || undefined,
        horaInicio: eventoForm.horaInicio || undefined,
        horaFim: eventoForm.horaFim || undefined,
        tipoRecorrencia: eventoForm.tipoRecorrencia || undefined,
        diaRecorrencia: eventoForm.diaRecorrencia || undefined,
        descricao: eventoForm.descricao || undefined,
      };

      if (editingEvento) {
        await updateEvento.mutateAsync({
          id: editingEvento.id,
          data,
          anoLetivoId: anoLetivoSelecionado.id,
        });
      } else {
        await createEvento.mutateAsync(data);
      }
      setIsEventoDialogOpen(false);
      resetEventoForm();
      refetchEstatisticas();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteEvento = async () => {
    if (!eventoToDelete || !anoLetivoSelecionado) return;
    try {
      await deleteEvento.mutateAsync({ 
        id: eventoToDelete.id, 
        anoLetivoId: anoLetivoSelecionado.id 
      });
      setIsDeleteEventoDialogOpen(false);
      setEventoToDelete(null);
      refetchEstatisticas();
    } catch {
      // Error handled by mutation
    }
  };

  // Navegação do calendário - limitada ao ano letivo selecionado
  const handleMesAnterior = useCallback(() => {
    // Só permite voltar se não estiver em janeiro
    if (mesAtual > 0) {
      setMesAtual(mesAtual - 1);
    }
  }, [mesAtual]);

  const handleProximoMes = useCallback(() => {
    // Só permite avançar se não estiver em dezembro
    if (mesAtual < 11) {
      setMesAtual(mesAtual + 1);
    }
  }, [mesAtual]);

  // Verificar se pode navegar (para desabilitar botões)
  const podeVoltarMes = mesAtual > 0;
  const podeAvancarMes = mesAtual < 11;

  // Effect para adicionar wheel listener com passive: false
  useEffect(() => {
    const calendarioElement = calendarioRef.current;
    if (!calendarioElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.deltaY > 0) {
        handleProximoMes();
      } else if (e.deltaY < 0) {
        handleMesAnterior();
      }
    };

    calendarioElement.addEventListener("wheel", handleWheel, { passive: false });
    
    return () => {
      calendarioElement.removeEventListener("wheel", handleWheel);
    };
  }, [handleProximoMes, handleMesAnterior]);

  // Gerar dias do calendário
  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const primeiroDiaSemana = primeiroDia.getDay();
    
    const dias: (Date | null)[] = [];
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < primeiroDiaSemana; i++) {
      dias.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= diasNoMes; i++) {
      dias.push(new Date(anoAtual, mesAtual, i));
    }
    
    return dias;
  }, [anoAtual, mesAtual]);

  // Verificar se uma data tem eventos
  const getEventosData = (data: Date) => {
    return eventosMes.filter((evento) => {
      const dataEvento = new Date(evento.dataInicio);
      const dataFimEvento = evento.dataFim ? new Date(evento.dataFim) : dataEvento;
      return data >= new Date(dataEvento.setHours(0,0,0,0)) && 
             data <= new Date(dataFimEvento.setHours(23,59,59,999));
    });
  };

  // Verificar se data está dentro do período do ano letivo
  const isDataDentroPeriodo = (data: Date) => {
    if (!status?.dataInicio || !status?.dataFim) return true;
    const inicio = new Date(status.dataInicio);
    const fim = new Date(status.dataFim);
    return data >= inicio && data <= fim;
  };

  // Atualizar tipo de evento ao mudar
  const handleTipoChange = (tipo: string) => {
    const tipoInfo = tipoEventoMap[tipo];
    setEventoForm({
      ...eventoForm,
      tipo,
      titulo: tipoInfo?.label || eventoForm.titulo,
      cor: tipoInfo?.cor || eventoForm.cor,
      reduzDiaLetivo: tipoInfo?.reduzDia || false,
    });
  };

  if (loadingAnos) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com seleção de ano */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold">
            {escolaId ? "Calendário da Escola" : "Calendário Letivo"}
          </h3>
          <p className="text-muted-foreground">
            {escolaId 
              ? "Eventos específicos desta escola" 
              : "Gerencie o calendário escolar, feriados e eventos globais"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={anoLetivoSelecionado?.id || ""}
            onValueChange={(id) => {
              const ano = anosLetivos?.find((a) => a.id === id);
              if (ano) {
                setAnoLetivoSelecionado(ano);
                setAnoAtual(ano.ano);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {anosLetivos?.map((ano) => (
                <SelectItem key={ano.id} value={ano.id}>
                  {ano.ano} {ano.ativo && "(Ativo)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Botão de criar ano letivo só aparece no calendário global */}
          {!escolaId && (
            <Button onClick={() => handleOpenAnoLetivoDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ano
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de status do ano letivo */}
      {anoLetivoSelecionado && proximoEventoObrigatorio && (
        <Alert variant={
          proximoEventoObrigatorio === "INICIO_ANO_LETIVO" || 
          proximoEventoObrigatorio === "INICIO_AULAS_REGULARES" 
            ? "default" 
            : "destructive"
        }>
          <Info className="h-4 w-4" />
          <AlertTitle>
            Defina: {tipoEventoMap[proximoEventoObrigatorio]?.label}
          </AlertTitle>
          <AlertDescription>
            {proximoEventoObrigatorio === "INICIO_ANO_LETIVO" 
              ? "Para começar a configurar o calendário, você precisa primeiro definir a data de Início do Ano Letivo." 
              : proximoEventoObrigatorio === "FIM_ANO_LETIVO"
              ? "Agora defina a data de Fim do Ano Letivo para liberar o cadastro de outros eventos."
              : proximoEventoObrigatorio === "INICIO_AULAS_REGULARES"
              ? "Defina a data de Início das Aulas Regulares para contabilizar os dias letivos."
              : "Defina a data de Fim das Aulas Regulares para finalizar a configuração do período letivo."}
          </AlertDescription>
        </Alert>
      )}

      {!proximoEventoObrigatorio && podeAdicionarEventos && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Calendário Configurado</AlertTitle>
          <AlertDescription>
            Ano Letivo: {formatarDataBR(status?.dataInicioAnoLetivo)} 
            {" até "} 
            {formatarDataBR(status?.dataFimAnoLetivo)}
            {status?.dataInicioAulas && status?.dataFimAulas && (
              <>
                {" • "}
                Aulas: {formatarDataBR(status.dataInicioAulas)} 
                {" até "} 
                {formatarDataBR(status.dataFimAulas)}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div ref={calendarioRef} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleMesAnterior}
                  disabled={!podeVoltarMes}
                  className={!podeVoltarMes ? "opacity-30 cursor-not-allowed" : ""}
                >
                  <CaretLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg">
                  {meses[mesAtual]} {anoAtual}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleProximoMes}
                  disabled={!podeAvancarMes}
                  className={!podeAvancarMes ? "opacity-30 cursor-not-allowed" : ""}
                >
                <CaretRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map((dia) => (
                <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {dia}
                </div>
              ))}
            </div>
            
            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {diasDoMes.map((dia, index) => {
                if (!dia) {
                  return <div key={`empty-${index}`} className="h-20" />;
                }
                
                const eventosNoDia = getEventosData(dia);
                const isDomingo = dia.getDay() === 0;
                const isSabado = dia.getDay() === 6;
                const isHoje = dia.toDateString() === new Date().toDateString();
                const isSelecionado = dataSelecionada?.toDateString() === dia.toDateString();
                const dentroPeriodo = isDataDentroPeriodo(dia);
                
                return (
                  <div
                    key={dia.toISOString()}
                    onClick={() => {
                      setDataSelecionada(dia);
                      if (tiposDisponiveis.length > 0 && dentroPeriodo) {
                        handleOpenEventoDialog(dia);
                      }
                    }}
                    className={cn(
                      "h-20 p-1 border rounded-md cursor-pointer transition-colors overflow-hidden",
                      isDomingo && "bg-red-50 dark:bg-red-950/20",
                      isSabado && "bg-orange-50 dark:bg-orange-950/20",
                      isHoje && "ring-2 ring-primary",
                      isSelecionado && "bg-primary/10",
                      !dentroPeriodo && podeAdicionarEventos && "opacity-50",
                      "hover:bg-muted/50"
                    )}
                  >
                    <div className="text-sm font-medium mb-1">
                      {dia.getDate()}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {eventosNoDia.slice(0, 2).map((evento) => {
                        const tipoInfo = tipoEventoMap[evento.tipo];
                        return (
                          <div
                            key={evento.id}
                            className="text-xs truncate px-1 rounded"
                            style={{ 
                              backgroundColor: `${evento.cor}20`,
                              color: evento.cor,
                              borderLeft: `2px solid ${evento.cor}`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEventoDialog(evento);
                            }}
                          >
                            {tipoInfo?.label || evento.titulo}
                          </div>
                        );
                      })}
                      {eventosNoDia.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{eventosNoDia.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Painel lateral */}
        <div className="space-y-6">
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indicadores</CardTitle>
              <CardDescription>
                {estatisticas?.status?.podeContabilizarDiasLetivos
                  ? "Resumo do período letivo" 
                  : "Defina início e fim das aulas para ver os indicadores"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {estatisticas?.status?.podeContabilizarDiasLetivos ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {estatisticas.diasLetivos ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Dias Letivos</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {estatisticas.feriados ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Feriados</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {estatisticas.sabadosLetivos ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Sábados Letivos</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {estatisticas.eventos ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total de Eventos</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aguardando definição do período</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tiposDisponiveis.length > 0 ? (
                <Button 
                  className="w-full" 
                  onClick={() => handleOpenEventoDialog()}
                  variant={proximoEventoObrigatorio ? "default" : "outline"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {proximoEventoObrigatorio 
                    ? `Definir ${tipoEventoMap[proximoEventoObrigatorio]?.label}`
                    : "Adicionar Evento"}
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Evento
                </Button>
              )}
              
              {anoLetivoSelecionado && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOpenAnoLetivoDialog(anoLetivoSelecionado)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Ano Letivo
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lista de eventos do mês */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEventos ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : eventosMes.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {eventosMes.map((evento) => {
                    const tipoInfo = tipoEventoMap[evento.tipo];
                    const Icon = tipoInfo?.icon || CalendarBlank;
                    return (
                      <div
                        key={evento.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                        onClick={() => handleOpenEventoDialog(evento)}
                      >
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${evento.cor}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: evento.cor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{evento.titulo}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatarDataBR(evento.dataInicio)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventoToDelete(evento);
                            setIsDeleteEventoDialogOpen(true);
                          }}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum evento neste mês
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Ano Letivo */}
      <Dialog open={isAnoLetivoDialogOpen} onOpenChange={setIsAnoLetivoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnoLetivo ? "Editar Ano Letivo" : "Novo Ano Letivo"}
            </DialogTitle>
            <DialogDescription>
              {editingAnoLetivo 
                ? "Atualize as informações do ano letivo"
                : "Crie um novo ano letivo. Depois você definirá as datas de início e fim como eventos."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveAnoLetivo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={anoLetivoForm.ano}
                onChange={(e) => setAnoLetivoForm({ ...anoLetivoForm, ano: parseInt(e.target.value) })}
                required
                min={2000}
                max={2100}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Definir como ano ativo</Label>
              <Switch
                id="ativo"
                checked={anoLetivoForm.ativo}
                onCheckedChange={(checked) => setAnoLetivoForm({ ...anoLetivoForm, ativo: checked })}
              />
            </div>

            <DialogFooter className="gap-2">
              {editingAnoLetivo && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteAnoDialogOpen(true)}
                >
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsAnoLetivoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAnoLetivo.isPending || updateAnoLetivo.isPending}>
                {(createAnoLetivo.isPending || updateAnoLetivo.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingAnoLetivo ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Evento */}
      <Dialog open={isEventoDialogOpen} onOpenChange={setIsEventoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvento ? "Editar Evento" : 
                proximoEventoObrigatorio 
                  ? `Definir ${tipoEventoMap[proximoEventoObrigatorio]?.label}`
                  : "Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              {editingEvento 
                ? "Atualize as informações do evento"
                : proximoEventoObrigatorio === "INICIO_ANO_LETIVO"
                  ? "Defina a data de início do ano letivo. Esta data marca o início do período para cadastro de eventos."
                  : proximoEventoObrigatorio === "FIM_ANO_LETIVO"
                    ? "Defina a data de fim do ano letivo. Deve ser posterior à data de início."
                    : proximoEventoObrigatorio === "INICIO_AULAS_REGULARES"
                      ? "Defina a data de início das aulas regulares. Esta data marca o início do período letivo para contabilização."
                      : proximoEventoObrigatorio === "FIM_AULAS_REGULARES"
                        ? "Defina a data de fim das aulas regulares. Os dias letivos serão contabilizados entre as datas de aulas."
                        : "Adicione um novo evento ao calendário"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveEvento} className="space-y-4">
            {/* Tipo de evento */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evento</Label>
              <Select
                value={eventoForm.tipo}
                onValueChange={handleTipoChange}
                disabled={!!proximoEventoObrigatorio && !editingEvento}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDisponiveis.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tipo.cor }}
                        />
                        {tipo.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={eventoForm.titulo}
                onChange={(e) => setEventoForm({ ...eventoForm, titulo: e.target.value })}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={eventoForm.descricao}
                onChange={(e) => setEventoForm({ ...eventoForm, descricao: e.target.value })}
                rows={2}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data{eventoForm.tipo !== "SABADO_LETIVO" && eventoForm.tipo !== "RECESSO" && !eventoForm.dataFim && ""}</Label>
                <DateInputBR
                  id="dataInicio"
                  value={eventoForm.dataInicio}
                  onChange={(value) => setEventoForm({ ...eventoForm, dataInicio: value })}
                  required
                />
              </div>
              {!["INICIO_ANO_LETIVO", "FIM_ANO_LETIVO"].includes(eventoForm.tipo) && (
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim (opcional)</Label>
                  <DateInputBR
                    id="dataFim"
                    value={eventoForm.dataFim}
                    onChange={(value) => setEventoForm({ ...eventoForm, dataFim: value })}
                    min={eventoForm.dataInicio}
                  />
                </div>
              )}
            </div>

            {/* Escopo (apenas para eventos normais) */}
            {!["INICIO_ANO_LETIVO", "FIM_ANO_LETIVO"].includes(eventoForm.tipo) && !escolaId && (
              <div className="space-y-2">
                <Label htmlFor="escopo">Escopo</Label>
                <Select
                  value={eventoForm.escopo}
                  onValueChange={(value) => setEventoForm({ ...eventoForm, escopo: value, escolaId: value === "REDE" ? "" : eventoForm.escolaId })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REDE">Toda a Rede</SelectItem>
                    <SelectItem value="ESCOLA">Escola Específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Escola (se escopo for ESCOLA) */}
            {eventoForm.escopo === "ESCOLA" && !escolaId && (
              <div className="space-y-2">
                <Label htmlFor="escola">Escola</Label>
                <Select
                  value={eventoForm.escolaId}
                  onValueChange={(value) => setEventoForm({ ...eventoForm, escolaId: value })}
                >
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
            )}

            {/* Reduz dia letivo (apenas para tipos normais) */}
            {!["INICIO_ANO_LETIVO", "FIM_ANO_LETIVO", "SABADO_LETIVO"].includes(eventoForm.tipo) && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reduzDiaLetivo">Reduz dia letivo</Label>
                  <p className="text-xs text-muted-foreground">Marque se este evento remove um dia do calendário letivo</p>
                </div>
                <Switch
                  id="reduzDiaLetivo"
                  checked={eventoForm.reduzDiaLetivo}
                  onCheckedChange={(checked) => setEventoForm({ ...eventoForm, reduzDiaLetivo: checked })}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEventoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEvento.isPending || updateEvento.isPending}>
                {(createEvento.isPending || updateEvento.isPending) && (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingEvento ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Excluir Ano Letivo */}
      <AlertDialog open={isDeleteAnoDialogOpen} onOpenChange={setIsDeleteAnoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ano Letivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ano letivo {editingAnoLetivo?.ano}? 
              Esta ação irá excluir todos os eventos associados e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnoLetivo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAnoLetivo.isPending && <Spinner className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Excluir Evento */}
      <AlertDialog open={isDeleteEventoDialogOpen} onOpenChange={setIsDeleteEventoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{eventoToDelete?.titulo}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvento}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvento.isPending && <Spinner className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
