"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState, EmptyWidget } from "@/components/ui/empty-state";
import { usePortalResumoSemec } from "@/hooks/useApi";
import type { PortalEscolaSemec } from "@/lib/api";

type ColunaOrdenavel =
  | "nome"
  | "turmas"
  | "matriculasAtivas"
  | "matriculasSemTurma"
  | "percentualFrequencia"
  | "buscasAtivasAbertas";

/** Portal da SEMEC — consolidado municipal da rede, por escola. */
export function PortalSemec() {
  const anoAtual = new Date().getFullYear();
  const [anoLetivo, setAnoLetivo] = useState(anoAtual);
  const [ordenacao, setOrdenacao] = useState<{ coluna: ColunaOrdenavel; asc: boolean }>({
    coluna: "nome",
    asc: true,
  });

  const { data, isLoading, error } = usePortalResumoSemec(anoLetivo);

  const escolasOrdenadas = useMemo(() => {
    if (!data) return [];
    const { coluna, asc } = ordenacao;
    return [...data.escolas].sort((a, b) => {
      const va = a[coluna];
      const vb = b[coluna];
      let cmp: number;
      if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb, "pt-BR");
      } else {
        // null (sem frequência) sempre ao final
        const na = va === null ? -Infinity : (va as number);
        const nb = vb === null ? -Infinity : (vb as number);
        cmp = na - nb;
      }
      return asc ? cmp : -cmp;
    });
  }, [data, ordenacao]);

  const ordenarPor = (coluna: ColunaOrdenavel) =>
    setOrdenacao((o) =>
      o.coluna === coluna ? { coluna, asc: !o.asc } : { coluna, asc: coluna === "nome" }
    );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="warning"
        title="Não foi possível carregar o consolidado municipal"
        description={(error as Error).message}
      />
    );
  }

  if (!data) return null;

  const setaOrdenacao = (coluna: ColunaOrdenavel) =>
    ordenacao.coluna === coluna ? (ordenacao.asc ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-6">
      {/* Filtro de ano letivo */}
      <div className="max-w-[180px] space-y-2">
        <Label>Ano letivo</Label>
        <Select
          value={String(anoLetivo)}
          onValueChange={(v) => setAnoLetivo(Number(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[anoAtual - 1, anoAtual, anoAtual + 1].map((ano) => (
              <SelectItem key={ano} value={String(ano)}>
                {ano}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs municipais */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Escolas ativas" value={data.totais.escolas} icon="building" color="#1351B4" />
        <KpiCard
          label="Matrículas ativas"
          value={data.totais.matriculasAtivas.toLocaleString("pt-BR")}
          icon="graduation"
          color="#3B86A8"
        />
        <KpiCard
          label="Frequência da rede"
          value={
            data.totais.percentualFrequencia !== null
              ? `${data.totais.percentualFrequencia}%`
              : "—"
          }
          icon="check"
          color={
            data.totais.percentualFrequencia !== null &&
            data.totais.percentualFrequencia < 75
              ? "#C8391F"
              : "#0F8A5F"
          }
        />
        <KpiCard
          label="Busca ativa aberta"
          value={data.totais.buscasAtivasAbertas}
          icon="search"
          color={data.totais.buscasAtivasAbertas > 0 ? "#C8391F" : "#0F8A5F"}
        />
      </div>

      {/* Tabela por escola */}
      <Card>
        <CardHeader>
          <CardTitle>Rede por escola</CardTitle>
          <CardDescription>
            {data.totais.turmas} turma(s) e {data.totais.matriculasSemTurma} aluno(s) sem
            turma na rede — clique nos títulos para ordenar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {escolasOrdenadas.length === 0 ? (
            <EmptyWidget icon="building" label="Nenhuma escola ativa cadastrada." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => ordenarPor("nome")}
                    >
                      Escola{setaOrdenacao("nome")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => ordenarPor("turmas")}
                    >
                      Turmas{setaOrdenacao("turmas")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => ordenarPor("matriculasAtivas")}
                    >
                      Matrículas{setaOrdenacao("matriculasAtivas")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => ordenarPor("matriculasSemTurma")}
                    >
                      Sem turma{setaOrdenacao("matriculasSemTurma")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => ordenarPor("percentualFrequencia")}
                    >
                      Frequência{setaOrdenacao("percentualFrequencia")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => ordenarPor("buscasAtivasAbertas")}
                    >
                      Busca ativa{setaOrdenacao("buscasAtivasAbertas")}
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escolasOrdenadas.map((e: PortalEscolaSemec) => (
                    <TableRow key={e.escolaId}>
                      <TableCell className="font-medium">
                        {e.nome}
                        <span className="ml-2 font-mono text-[11px] text-ink-muted">
                          {e.codigo}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{e.turmas}</TableCell>
                      <TableCell className="text-right font-mono">
                        {e.matriculasAtivas}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {e.matriculasSemTurma}
                      </TableCell>
                      <TableCell className="text-right">
                        {e.percentualFrequencia === null ? (
                          <span className="text-ink-soft">—</span>
                        ) : (
                          <Badge
                            variant={e.percentualFrequencia < 75 ? "danger" : "success"}
                          >
                            {e.percentualFrequencia}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {e.buscasAtivasAbertas > 0 ? (
                          <Badge variant="danger">{e.buscasAtivasAbertas}</Badge>
                        ) : (
                          <span className="font-mono text-ink-muted">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/cadastros/escolas">Ver escola</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
