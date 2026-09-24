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

/** Portal do Diretor — indicadores da própria escola. */
export function PortalDiretor() {
  const { data, isLoading, error } = usePortalResumoEscola("diretor");

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
        title="Não foi possível carregar os indicadores da escola"
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

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Matrículas ativas"
          value={data.totais.matriculasAtivas}
          icon="graduation"
          color="#1351B4"
        />
        <KpiCard
          label="Sem turma"
          value={data.totais.matriculasSemTurma}
          icon="userPlus"
          color={data.totais.matriculasSemTurma > 0 ? "#D97706" : "#0F8A5F"}
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
        <KpiCard
          label="Busca ativa aberta"
          value={data.totais.buscasAtivasAbertas}
          icon="search"
          color={data.totais.buscasAtivasAbertas > 0 ? "#C8391F" : "#0F8A5F"}
        />
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href={`/questionario-escola/${data.escola.id}`}>Censo da escola</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/cadastros/escolas">Gerir salas</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/programas">Busca ativa</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* Turmas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Turmas</CardTitle>
              <CardDescription>
                {data.totais.turmas} turma(s) ativa(s) — frequência destacada abaixo de 75%
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

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Pontos de atenção da escola</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.frequencia.turmasAbaixoDe75 === 0 &&
            data.totais.matriculasSemTurma === 0 &&
            data.totais.buscasAtivasAbertas === 0 ? (
              <EmptyWidget icon="check" label="Nenhuma pendência — escola em dia." />
            ) : (
              <>
                {data.frequencia.turmasAbaixoDe75 > 0 && (
                  <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
                    <span>Turmas com frequência abaixo de 75%</span>
                    <Badge variant="danger">{data.frequencia.turmasAbaixoDe75}</Badge>
                  </div>
                )}
                {data.totais.matriculasSemTurma > 0 && (
                  <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
                    <span>Alunos aguardando enturmação</span>
                    <Badge variant="warning">{data.totais.matriculasSemTurma}</Badge>
                  </div>
                )}
                {data.totais.buscasAtivasAbertas > 0 && (
                  <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
                    <span>Casos de busca ativa em aberto</span>
                    <Badge variant="danger">{data.totais.buscasAtivasAbertas}</Badge>
                  </div>
                )}
                {data.totais.acompanhamentosEmAndamento > 0 && (
                  <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-[13px]">
                    <span>Acompanhamentos em andamento</span>
                    <Badge variant="info">{data.totais.acompanhamentosEmAndamento}</Badge>
                  </div>
                )}
              </>
            )}
            <div className="pt-1 text-[12px] text-ink-muted">
              Profissionais vinculados: {data.totais.profissionais}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
