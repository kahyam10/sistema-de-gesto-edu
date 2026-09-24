"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState, EmptyWidget } from "@/components/ui/empty-state";
import { usePortalResumoEscola } from "@/hooks/useApi";

/** Portal da Coordenação — acompanhamento pedagógico da escola. */
export function PortalCoordenacao() {
  const { data, isLoading, error } = usePortalResumoEscola("coordenacao");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="warning"
        title="Não foi possível carregar o acompanhamento pedagógico"
        description={(error as Error).message}
      />
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-ink-muted">
        {data.escola.nome} · Ano letivo {data.anoLetivo}
      </p>

      {/* KPIs pedagógicos */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Acompanhamentos em andamento"
          value={data.totais.acompanhamentosEmAndamento}
          icon="clipboard"
          color="#1351B4"
        />
        <KpiCard
          label="Busca ativa aberta"
          value={data.totais.buscasAtivasAbertas}
          icon="search"
          color={data.totais.buscasAtivasAbertas > 0 ? "#C8391F" : "#0F8A5F"}
        />
        <KpiCard
          label="Turmas abaixo de 75%"
          value={data.frequencia.turmasAbaixoDe75}
          icon="warning"
          color={data.frequencia.turmasAbaixoDe75 > 0 ? "#C8391F" : "#0F8A5F"}
        />
        <KpiCard
          label="Frequência da escola"
          value={
            data.frequencia.percentualPresenca !== null
              ? `${data.frequencia.percentualPresenca}%`
              : "—"
          }
          icon="check"
          color={
            data.frequencia.percentualPresenca !== null &&
            data.frequencia.percentualPresenca < 75
              ? "#C8391F"
              : "#0F8A5F"
          }
        />
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href="/programas">Busca ativa</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/comunicacao">Plantões pedagógicos</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/pedagogico">Módulo pedagógico</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* Frequência por turma */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Frequência por turma</CardTitle>
              <CardDescription>
                Turmas com percentual abaixo de 75% exigem intervenção pedagógica
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.turmas.length === 0 ? (
                <EmptyWidget icon="book" label="Nenhuma turma ativa neste ano letivo." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Alunos</TableHead>
                      <TableHead className="text-right">Frequência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.turmas.map((t) => (
                      <TableRow key={t.turmaId}>
                        <TableCell className="font-medium">{t.nome}</TableCell>
                        <TableCell>{t.serie}</TableCell>
                        <TableCell>{t.turno}</TableCell>
                        <TableCell className="text-right font-mono">
                          {t.totalAlunosAtivos}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.percentualFrequencia === null ? (
                            <span className="text-ink-soft">—</span>
                          ) : (
                            <Badge
                              variant={t.percentualFrequencia < 75 ? "danger" : "success"}
                            >
                              {t.percentualFrequencia}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Programas especiais */}
        <Card>
          <CardHeader>
            <CardTitle>Programas especiais</CardTitle>
            <CardDescription>Casos em acompanhamento na escola</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
              <span>Busca ativa em aberto</span>
              <Badge variant={data.totais.buscasAtivasAbertas > 0 ? "danger" : "success"}>
                {data.totais.buscasAtivasAbertas}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
              <span>Acompanhamentos individualizados</span>
              <Badge variant={data.totais.acompanhamentosEmAndamento > 0 ? "info" : "success"}>
                {data.totais.acompanhamentosEmAndamento}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
              <span>Alunos sem turma</span>
              <Badge variant={data.totais.matriculasSemTurma > 0 ? "warning" : "success"}>
                {data.totais.matriculasSemTurma}
              </Badge>
            </div>
            <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
              <Link href="/programas">Abrir programas especiais</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
