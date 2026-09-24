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
import { usePortalProfessorResumo } from "@/hooks/useApi";

/** Portal do Professor — turmas, aulas do dia e pendências de frequência. */
export function PortalProfessor() {
  const { data, isLoading, error } = usePortalProfessorResumo();

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
        title="Não foi possível carregar o portal do professor"
        description={(error as Error).message}
      />
    );
  }

  if (!data) return null;

  const totalAlunos = data.turmas.reduce((acc, t) => acc + t.totalAlunosAtivos, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Minhas turmas" value={data.turmas.length} icon="book" color="#1351B4" />
        <KpiCard label="Alunos ativos" value={totalAlunos} icon="graduation" color="#3B86A8" />
        <KpiCard label="Aulas hoje" value={data.aulasHoje.length} icon="clock" color="#0F8A5F" />
        <KpiCard
          label="Frequências pendentes"
          value={data.frequenciasPendentesHoje.length}
          icon="warning"
          color={data.frequenciasPendentesHoje.length > 0 ? "#C8391F" : "#0F8A5F"}
        />
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href="/pedagogico">Lançar frequência</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/pedagogico">Lançar notas</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/comunicacao">Ver comunicados</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Aulas de hoje */}
        <Card>
          <CardHeader>
            <CardTitle>Aulas de hoje</CardTitle>
            <CardDescription>Sua grade horária para o dia de hoje</CardDescription>
          </CardHeader>
          <CardContent>
            {data.aulasHoje.length === 0 ? (
              <EmptyWidget icon="calendar" label="Nenhuma aula na sua grade para hoje." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Disciplina</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aulasHoje.map((aula, i) => (
                    <TableRow key={`${aula.turmaId}-${aula.horaInicio}-${i}`}>
                      <TableCell className="font-mono text-[12px]">
                        {aula.horaInicio} – {aula.horaFim}
                      </TableCell>
                      <TableCell className="font-medium">{aula.turmaNome}</TableCell>
                      <TableCell>{aula.disciplina}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pendências de frequência */}
        <Card>
          <CardHeader>
            <CardTitle>Pendências de frequência</CardTitle>
            <CardDescription>Turmas com aula hoje sem chamada registrada</CardDescription>
          </CardHeader>
          <CardContent>
            {data.frequenciasPendentesHoje.length === 0 ? (
              <EmptyWidget icon="check" label="Nenhuma pendência — chamadas de hoje em dia." />
            ) : (
              <div className="space-y-2">
                {data.frequenciasPendentesHoje.map((p) => (
                  <div
                    key={p.turmaId}
                    className="flex items-center justify-between rounded-md border border-hairline px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Pendente</Badge>
                      <span className="text-[13px] font-medium">{p.turmaNome}</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/pedagogico">Lançar frequência</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Minhas turmas */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas turmas</CardTitle>
          <CardDescription>
            {data.turmas.length} turma(s) vinculada(s) a {data.profissional.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.turmas.length === 0 ? (
            <EmptyWidget icon="book" label="Nenhuma turma vinculada a você." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead className="text-right">Alunos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.turmas.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell>{t.serie.nome}</TableCell>
                    <TableCell>{t.turno}</TableCell>
                    <TableCell>{t.escola.nome}</TableCell>
                    <TableCell>{t.disciplina || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.tipoVinculo === "PROFESSOR" ? "default" : "secondary"}>
                        {t.tipoVinculo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{t.totalAlunosAtivos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
