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
  usePreviaEducacenso,
  useDownloadEducacenso,
} from "@/hooks/useExportacoes";

const ITENS_POR_PAGINA = 50;

const ENTIDADE_LABELS: Record<string, string> = {
  ESCOLA: "Escola",
  TURMA: "Turma",
  PESSOA: "Pessoa",
  VINCULO_GESTOR: "Vínculo gestor",
  VINCULO_DOCENTE: "Vínculo docente",
  VINCULO_ALUNO: "Vínculo aluno",
};

export function ExportacaoEducacenso() {
  const { data: anosLetivos, isLoading: loadingAnos } = useAnosLetivos();
  const { data: escolas } = useEscolas();

  const [anoLetivoId, setAnoLetivoId] = useState("");
  const [escolaId, setEscolaId] = useState("all");
  const [gerou, setGerou] = useState(false);
  const [pagina, setPagina] = useState(1);

  // Default: ano letivo ativo
  const anoEfetivo =
    anoLetivoId || anosLetivos?.find((a) => a.ativo)?.id || "";
  const escolaEfetiva = escolaId === "all" ? undefined : escolaId;

  const previa = usePreviaEducacenso(
    { anoLetivoId: anoEfetivo, escolaId: escolaEfetiva },
    gerou
  );
  const download = useDownloadEducacenso();

  const pendencias = useMemo(() => previa.data?.pendencias ?? [], [previa.data]);
  const totalPaginas = Math.max(
    1,
    Math.ceil(pendencias.length / ITENS_POR_PAGINA)
  );
  const pendenciasVisiveis = useMemo(
    () =>
      pendencias.slice(
        (pagina - 1) * ITENS_POR_PAGINA,
        pagina * ITENS_POR_PAGINA
      ),
    [pendencias, pagina]
  );

  const aoMudarFiltro = () => {
    setGerou(false);
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Icon name="warning" size={16} />
        <AlertDescription>
          Layout simplificado do arquivo de migração — valide no sistema
          oficial do Educacenso antes de submeter. Use o relatório de
          pendências para completar os campos faltantes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Educacenso (INEP)</CardTitle>
          <CardDescription>
            Arquivo TXT de migração (registros 00/20/30/40/50/60/99) em
            ISO-8859-1, com relatório de pendências por linha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="educacenso-ano">Ano letivo</Label>
              <Select
                value={anoEfetivo}
                onValueChange={(v) => {
                  setAnoLetivoId(v);
                  aoMudarFiltro();
                }}
                disabled={loadingAnos}
              >
                <SelectTrigger id="educacenso-ano">
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
              <Label htmlFor="educacenso-escola">Escola</Label>
              <Select
                value={escolaId}
                onValueChange={(v) => {
                  setEscolaId(v);
                  aoMudarFiltro();
                }}
              >
                <SelectTrigger id="educacenso-escola">
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
                Verificar pendências
              </Button>
              <Button
                disabled={!anoEfetivo || download.isPending}
                onClick={() =>
                  download.mutate({
                    anoLetivoId: anoEfetivo,
                    escolaId: escolaEfetiva,
                  })
                }
              >
                <Icon name="download" size={16} className="mr-2" />
                {download.isPending ? "Gerando..." : "Baixar TXT"}
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
                  label="Linhas do arquivo"
                  value={previa.data.resumo.totalLinhas}
                  icon="file"
                />
                <KpiCard
                  label="Pendências"
                  value={previa.data.resumo.totalPendencias}
                  icon="clipboard"
                />
                <KpiCard
                  label="Erros"
                  value={previa.data.resumo.pendenciasPorNivel.ERRO}
                  icon="warning"
                  color="#B3261E"
                />
                <KpiCard
                  label="Avisos"
                  value={previa.data.resumo.pendenciasPorNivel.AVISO}
                  icon="info"
                  color="#8C6D1F"
                />
              </div>

              {pendencias.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma pendência encontrada — arquivo pronto para validação
                  no sistema oficial.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Registro</TableHead>
                          <TableHead>Entidade</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Campo</TableHead>
                          <TableHead>Nível</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead className="text-right">Linha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendenciasVisiveis.map((p, i) => (
                          <TableRow key={`${p.linha}-${p.campo}-${i}`}>
                            <TableCell className="font-mono">
                              {p.registro}
                            </TableCell>
                            <TableCell>
                              {ENTIDADE_LABELS[p.entidade] ?? p.entidade}
                            </TableCell>
                            <TableCell>{p.entidadeNome}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {p.campo}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  p.nivel === "ERRO"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {p.nivel}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md text-sm">
                              {p.motivo}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {p.linha}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {pendencias.length} pendências — página {pagina} de{" "}
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
