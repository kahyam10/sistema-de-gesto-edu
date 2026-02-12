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
  useProfissionais,
  usePontos,
  useRelatorioMensal,
} from "@/hooks/useApi";
import { Clock, Download, CalendarBlank } from "@phosphor-icons/react";

export function PontoDigitalManager() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [selectedProfissional, setSelectedProfissional] = useState<string>("");
  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);

  const { data: profissionais = [], isLoading: loadingProfissionais } =
    useProfissionais();

  const { data: relatorio, isLoading: loadingRelatorio } = useRelatorioMensal(
    selectedProfissional,
    mes,
    ano
  );

  const getTipoRegistroBadge = (tipo: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      NORMAL: { variant: "default", label: "Normal" },
      ATESTADO: { variant: "secondary", label: "Atestado" },
      FALTA: { variant: "destructive", label: "Falta" },
      FALTA_JUSTIFICADA: { variant: "outline", label: "Falta Justificada" },
      FERIAS: { variant: "secondary", label: "Férias" },
      LICENCA: { variant: "secondary", label: "Licença" },
    };

    const config = badges[tipo] || badges.NORMAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loadingProfissionais) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} />
            Folha de Ponto Digital
          </CardTitle>
          <CardDescription>
            Controle de entrada e saída dos profissionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select
                value={selectedProfissional}
                onValueChange={setSelectedProfissional}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1, 1).toLocaleDateString("pt-BR", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i).map(
                    (a) => (
                      <SelectItem key={a} value={a.toString()}>
                        {a}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProfissional && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Total de Horas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {relatorio?.totalHoras.toFixed(1) || 0}h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Dias Trabalhados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {relatorio?.diasTrabalhados || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Faltas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {relatorio?.faltas || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Atrasos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">
                  {relatorio?.atrasos || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Registros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registros de Ponto</CardTitle>
                  <CardDescription>
                    Histórico de entrada e saída do período selecionado
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRelatorio ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : relatorio && relatorio.pontos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Entrada 2</TableHead>
                      <TableHead>Saída 2</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.pontos.map((ponto) => (
                      <TableRow key={ponto.id}>
                        <TableCell className="font-medium">
                          {new Date(ponto.data).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {ponto.entrada || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {ponto.saida || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {ponto.entrada2 || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {ponto.saida2 || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ponto.horasTrabalhadas?.toFixed(1) || 0}h
                          </Badge>
                        </TableCell>
                        <TableCell>{getTipoRegistroBadge(ponto.tipoRegistro)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarBlank size={48} className="text-muted-foreground mb-4" weight="duotone" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum registro encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Não há registros de ponto para este período
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
