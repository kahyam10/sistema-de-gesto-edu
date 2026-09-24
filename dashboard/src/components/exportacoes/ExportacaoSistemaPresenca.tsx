"use client";

import { useMemo, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { Icon } from "@/components/ui/icons";
import { PaginationControls } from "@/components/ui/pagination";
import { useAnosLetivos, useEscolas } from "@/hooks/useApi";
import {
  usePreviaSistemaPresenca,
  useDownloadSistemaPresenca,
} from "@/hooks/useExportacoes";

const ITENS_POR_PAGINA = 50;

const MESES = [
  { valor: "1", label: "Janeiro" },
  { valor: "2", label: "Fevereiro" },
  { valor: "3", label: "Março" },
  { valor: "4", label: "Abril" },
  { valor: "5", label: "Maio" },
  { valor: "6", label: "Junho" },
  { valor: "7", label: "Julho" },
  { valor: "8", label: "Agosto" },
  { valor: "9", label: "Setembro" },
  { valor: "10", label: "Outubro" },
  { valor: "11", label: "Novembro" },
  { valor: "12", label: "Dezembro" },
];

export function ExportacaoSistemaPresenca() {
  const { data: anosLetivos, isLoading: loadingAnos } = useAnosLetivos();
  const { data: escolas } = useEscolas();

  const [anoLetivoId, setAnoLetivoId] = useState("");
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [escolaId, setEscolaId] = useState("all");
  const [gerou, setGerou] = useState(false);
  const [pagina, setPagina] = useState(1);

  // Default: ano letivo ativo
  const anoEfetivo =
    anoLetivoId || anosLetivos?.find((a) => a.ativo)?.id || "";
  const escolaEfetiva = escolaId === "all" ? undefined : escolaId;
  const mesNumero = Number(mes);

  const previa = usePreviaSistemaPresenca(
    { anoLetivoId: anoEfetivo, mes: mesNumero, escolaId: escolaEfetiva },
    gerou
  );
  const download = useDownloadSistemaPresenca();

  const linhas = previa.data?.linhas ?? [];
  const totalPaginas = Math.max(1, Math.ceil(linhas.length / ITENS_POR_PAGINA));
  const linhasVisiveis = useMemo(
    () =>
      linhas.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA),
    [linhas, pagina]
  );

  const aoMudarFiltro = () => {
    setGerou(false);
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Icon name="info" size={16} />
        <AlertDescription>
          Limiares oficiais do acompanhamento da condicionalidade de educação
          (Lei 14.601/2023): 60% para 4–5 anos (pré-escola) e 75% para 6–17
          anos. Faltas justificadas não contam como presença e saem em coluna
          própria para lançamento do motivo no Sistema Presença.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Sistema Presença (Bolsa Família)</CardTitle>
          <CardDescription>
            CSV mensal de alunos com frequência abaixo do limiar da faixa
            etária (UTF-8 com BOM, separado por ponto e vírgula).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="presenca-ano">Ano letivo</Label>
              <Select
                value={anoEfetivo}
                onValueChange={(v) => {
                  setAnoLetivoId(v);
                  aoMudarFiltro();
                }}
                disabled={loadingAnos}
              >
                <SelectTrigger id="presenca-ano">
                  <SelectValue placeholder="Selecione o ano letivo" />
                </SelectTrigger>
                <SelectContent>
                  {(anosLetivos ?? []).map((ano) => (
                    <SelectItem key={ano.id} value={ano.id}>
                      {ano.ano}
                      {ano.ativo ? " (ativo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="presenca-mes">Mês</Label>
              <Select
                value={mes}
                onValueChange={(v) => {
                  setMes(v);
                  aoMudarFiltro();
                }}
              >
                <SelectTrigger id="presenca-mes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.valor} value={m.valor}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="presenca-escola">Escola</Label>
              <Select
                value={escolaId}
                onValueChange={(v) => {
                  setEscolaId(v);
                  aoMudarFiltro();
                }}
              >
                <SelectTrigger id="presenca-escola">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas (rede)</SelectItem>
                  {(escolas ?? [])
                    .filter((e) => e.ativo)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                disabled={!anoEfetivo}
                onClick={() => {
                  setPagina(1);
                  setGerou(true);
                }}
              >
                <Icon name="search" size={16} className="mr-2" />
                Gerar prévia
              </Button>
              <Button
                disabled={!anoEfetivo || download.isPending}
                onClick={() =>
                  download.mutate({
                    anoLetivoId: anoEfetivo,
                    mes: mesNumero,
                    escolaId: escolaEfetiva,
                  })
                }
              >
                <Icon name="download" size={16} className="mr-2" />
                {download.isPending ? "Gerando..." : "Baixar CSV"}
              </Button>
            </div>
          </div>

          {gerou && previa.isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {gerou && previa.data && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                  label="Avaliados"
                  value={previa.data.resumo.totalAvaliados}
                  icon="users"
                />
                <KpiCard
                  label="Baixa frequência"
                  value={previa.data.resumo.totalBaixaFrequencia}
                  icon="warning"
                  color="#B3261E"
                />
                <KpiCard
                  label="Sem registro no mês"
                  value={previa.data.resumo.alunosSemRegistro}
                  icon="clock"
                />
                <KpiCard
                  label="Fora da faixa etária"
                  value={previa.data.resumo.alunosForaFaixaEtaria}
                  icon="filter"
                />
              </div>

              {linhas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno abaixo do limiar de frequência no mês
                  selecionado.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Escola</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>NIS</TableHead>
                          <TableHead>Nascimento</TableHead>
                          <TableHead>Série / Turma</TableHead>
                          <TableHead className="text-right">Limiar</TableHead>
                          <TableHead className="text-right">Aulas</TableHead>
                          <TableHead className="text-right">
                            Presenças
                          </TableHead>
                          <TableHead className="text-right">Faltas</TableHead>
                          <TableHead className="text-right">Justif.</TableHead>
                          <TableHead className="text-right">
                            Frequência
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linhasVisiveis.map((l, i) => (
                          <TableRow key={`${l.nomeAluno}-${l.turma}-${i}`}>
                            <TableCell>{l.nomeEscola}</TableCell>
                            <TableCell>{l.nomeAluno}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {l.nisAluno || "—"}
                            </TableCell>
                            <TableCell>{l.dataNascimento}</TableCell>
                            <TableCell>
                              {l.serie}
                              {l.turma ? ` / ${l.turma}` : ""}
                            </TableCell>
                            <TableCell className="text-right">
                              {l.limiarFrequencia}%
                            </TableCell>
                            <TableCell className="text-right">
                              {l.totalAulas}
                            </TableCell>
                            <TableCell className="text-right">
                              {l.presencas}
                            </TableCell>
                            <TableCell className="text-right">
                              {l.faltas}
                            </TableCell>
                            <TableCell className="text-right">
                              {l.faltasJustificadas}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="destructive">
                                {l.percentualFrequencia}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {linhas.length} alunos — página {pagina} de{" "}
                        {totalPaginas}
                      </span>
                      <PaginationControls
                        currentPage={pagina}
                        totalPages={totalPaginas}
                        onPageChange={setPagina}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
