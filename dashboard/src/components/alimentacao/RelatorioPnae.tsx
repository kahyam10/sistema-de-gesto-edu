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
import { Printer, ChartBar } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { DateInputBR } from "@/components/ui/date-input-br";
import { KpiCard } from "@/components/ui/kpi-card";
import { useEscolas } from "@/hooks/useApi";
import { useRelatorioPnae } from "@/hooks/useAlimentacao";

const tipoRefeicaoLabels: Record<string, string> = {
  CAFE_MANHA: "Café da Manhã",
  LANCHE_MANHA: "Lanche da Manhã",
  ALMOCO: "Almoço",
  LANCHE_TARDE: "Lanche da Tarde",
  JANTAR: "Jantar",
  CEIA: "Ceia",
};

const TIPOS_ORDENADOS = [
  "CAFE_MANHA",
  "LANCHE_MANHA",
  "ALMOCO",
  "LANCHE_TARDE",
  "JANTAR",
  "CEIA",
];

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function RelatorioPnae() {
  const { data: escolas = [] } = useEscolas();

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [escolaId, setEscolaId] = useState<string>("ALL");

  const { data: relatorio, isLoading, isFetching } = useRelatorioPnae({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    escolaId: escolaId !== "ALL" ? escolaId : undefined,
  });

  const periodoSelecionado = !!dataInicio && !!dataFim;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório PNAE</CardTitle>
              <CardDescription>
                Consolidado de refeições servidas e custo de insumos para
                prestação de contas FNDE/PNAE
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={!relatorio}
            >
              <Printer className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label>Data Início *</Label>
              <DateInputBR value={dataInicio} onChange={setDataInicio} />
            </div>
            <div className="flex-1">
              <Label>Data Fim *</Label>
              <DateInputBR value={dataFim} onChange={setDataFim} />
            </div>
            <div className="flex-1">
              <Label>Escola</Label>
              <Select value={escolaId} onValueChange={setEscolaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toda a rede</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!periodoSelecionado ? (
            <div className="text-center py-12 text-muted-foreground">
              <ChartBar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Informe o período para gerar o relatório</p>
            </div>
          ) : isLoading || isFetching ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !relatorio || relatorio.escolas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ChartBar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma refeição registrada no período</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs consolidados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Total de refeições"
                  value={relatorio.consolidado.totalRefeicoes.toLocaleString(
                    "pt-BR"
                  )}
                  icon="chart"
                />
                <KpiCard
                  label="Custo de insumos"
                  value={formatarMoeda(relatorio.consolidado.custoTotalInsumos)}
                  icon="creditCard"
                />
                <KpiCard
                  label="Custo médio por refeição"
                  value={formatarMoeda(
                    relatorio.consolidado.custoMedioPorRefeicao
                  )}
                  icon="activity"
                />
              </div>

              {/* Tabela por escola */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Escola</TableHead>
                      {TIPOS_ORDENADOS.map((tipo) => (
                        <TableHead key={tipo} className="text-right">
                          {tipoRefeicaoLabels[tipo]}
                        </TableHead>
                      ))}
                      <TableHead className="text-right font-semibold">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.escolas.map((escola) => (
                      <TableRow key={escola.escolaId}>
                        <TableCell className="font-medium">
                          {escola.nomeEscola}
                        </TableCell>
                        {TIPOS_ORDENADOS.map((tipo) => (
                          <TableCell key={tipo} className="text-right">
                            {(
                              escola.totalPorTipoRefeicao[tipo] ?? 0
                            ).toLocaleString("pt-BR")}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">
                          {escola.totalRefeicoes.toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold">
                        Total da rede
                      </TableCell>
                      {TIPOS_ORDENADOS.map((tipo) => (
                        <TableCell
                          key={tipo}
                          className="text-right font-semibold"
                        >
                          {relatorio.escolas
                            .reduce(
                              (soma, escola) =>
                                soma + (escola.totalPorTipoRefeicao[tipo] ?? 0),
                              0
                            )
                            .toLocaleString("pt-BR")}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">
                        {relatorio.consolidado.totalRefeicoes.toLocaleString(
                          "pt-BR"
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
