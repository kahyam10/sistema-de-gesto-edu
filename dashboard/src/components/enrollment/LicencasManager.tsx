"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useProfissionais,
  useLicencas,
  useAprovarLicenca,
  useCancelarLicenca,
} from "@/hooks/useApi";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Prohibit,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";

export function LicencasManager() {
  const { user } = useAuth();
  const [selectedProfissional, setSelectedProfissional] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLicenca, setSelectedLicenca] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"aprovar" | "rejeitar" | null>(
    null
  );
  const [justificativa, setJustificativa] = useState("");

  const { data: profissionais = [], isLoading: loadingProfissionais } =
    useProfissionais();

  const filters: any = {};
  if (selectedProfissional) filters.profissionalId = selectedProfissional;
  if (selectedStatus) filters.status = selectedStatus;

  const { data: licencas = [], isLoading: loadingLicencas } =
    useLicencas(filters);

  const aprovarMutation = useAprovarLicenca();
  const cancelarMutation = useCancelarLicenca();

  const handleAprovar = () => {
    if (!selectedLicenca || !user) return;

    aprovarMutation.mutate(
      {
        id: selectedLicenca.id,
        data: {
          aprovadaPor: user.id,
          status: "APROVADA",
        },
      },
      {
        onSuccess: () => {
          setSelectedLicenca(null);
          setDialogType(null);
        },
      }
    );
  };

  const handleRejeitar = () => {
    if (!selectedLicenca || !user || !justificativa) return;

    aprovarMutation.mutate(
      {
        id: selectedLicenca.id,
        data: {
          aprovadaPor: user.id,
          status: "REJEITADA",
          justificativaRejeicao: justificativa,
        },
      },
      {
        onSuccess: () => {
          setSelectedLicenca(null);
          setDialogType(null);
          setJustificativa("");
        },
      }
    );
  };

  const handleCancelar = (licenca: any) => {
    if (confirm("Tem certeza que deseja cancelar esta licença?")) {
      cancelarMutation.mutate(licenca.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> =
      {
        PENDENTE: {
          variant: "secondary",
          label: "Pendente",
          icon: Clock,
        },
        APROVADA: {
          variant: "default",
          label: "Aprovada",
          icon: CheckCircle,
        },
        REJEITADA: {
          variant: "destructive",
          label: "Rejeitada",
          icon: XCircle,
        },
        CANCELADA: {
          variant: "outline",
          label: "Cancelada",
          icon: Prohibit,
        },
      };

    const config = badges[status] || badges.PENDENTE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={14} />
        {config.label}
      </Badge>
    );
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      LICENCA_MEDICA: "Licença Médica",
      LICENCA_MATERNIDADE: "Licença Maternidade",
      LICENCA_PATERNIDADE: "Licença Paternidade",
      LICENCA_PREMIO: "Licença Prêmio",
      LICENCA_SEM_VENCIMENTO: "Licença Sem Vencimento",
      FERIAS: "Férias",
    };

    return tipos[tipo] || tipo;
  };

  if (loadingProfissionais) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={24} />
            Gestão de Licenças e Afastamentos
          </CardTitle>
          <CardDescription>
            Solicitações, aprovações e histórico de licenças
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profissional (Opcional)</Label>
              <Select
                value={selectedProfissional}
                onValueChange={setSelectedProfissional}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="APROVADA">Aprovada</SelectItem>
                  <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Total de Licenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{licencas.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {licencas.filter((l) => l.status === "PENDENTE").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {licencas.filter((l) => l.status === "APROVADA").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Total de Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {licencas.reduce((acc, l) => acc + (l.diasCorridos || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Licenças */}
      <Card>
        <CardHeader>
          <CardTitle>Licenças Registradas</CardTitle>
          <CardDescription>
            {licencas.length} licença(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLicencas ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : licencas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licencas.map((licenca) => (
                  <TableRow key={licenca.id}>
                    <TableCell className="font-medium">
                      {licenca.profissional?.nome || "Desconhecido"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {licenca.profissional?.tipo}
                      </span>
                    </TableCell>
                    <TableCell>{getTipoLabel(licenca.tipo)}</TableCell>
                    <TableCell>
                      {new Date(licenca.dataInicio).toLocaleDateString("pt-BR")}
                      {" → "}
                      {new Date(licenca.dataFim).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {licenca.diasCorridos} dias
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(licenca.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {licenca.status === "PENDENTE" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedLicenca(licenca);
                                setDialogType("aprovar");
                              }}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedLicenca(licenca);
                                setDialogType("rejeitar");
                              }}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {licenca.status === "APROVADA" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelar(licenca)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText
                size={48}
                className="text-muted-foreground mb-4"
                weight="duotone"
              />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma licença encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Não há licenças registradas com os filtros selecionados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprovação */}
      <Dialog
        open={dialogType === "aprovar"}
        onOpenChange={() => setDialogType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Licença</DialogTitle>
            <DialogDescription>
              Confirme a aprovação da licença de{" "}
              <strong>{selectedLicenca?.profissional?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p>
              <strong>Tipo:</strong> {getTipoLabel(selectedLicenca?.tipo || "")}
            </p>
            <p>
              <strong>Período:</strong>{" "}
              {selectedLicenca &&
                `${new Date(selectedLicenca.dataInicio).toLocaleDateString("pt-BR")} até ${new Date(selectedLicenca.dataFim).toLocaleDateString("pt-BR")}`}
            </p>
            <p>
              <strong>Dias:</strong> {selectedLicenca?.diasCorridos} dias corridos
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAprovar}>Confirmar Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog
        open={dialogType === "rejeitar"}
        onOpenChange={() => {
          setDialogType(null);
          setJustificativa("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Licença</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da licença de{" "}
              <strong>{selectedLicenca?.profissional?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Justificativa *</Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogType(null);
                setJustificativa("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejeitar}
              disabled={!justificativa.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
