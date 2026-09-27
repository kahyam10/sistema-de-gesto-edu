"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyWidget } from "@/components/ui/empty-state";
import { usePortalFrequenciaAluno } from "@/hooks/useApi";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
  PRESENTE: { variant: "success", label: "Presente" },
  FALTA: { variant: "danger", label: "Falta" },
  JUSTIFICADA: { variant: "warning", label: "Justificada" },
};

/** Frequência do aluno via portal do responsável — estatísticas + últimos registros. */
export function FrequenciaAluno({ matriculaId }: { matriculaId: string }) {
  const { data, isLoading, error } = usePortalFrequenciaAluno(matriculaId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <EmptyWidget icon="warning" label={(error as Error).message} />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const stats = data.estatisticas;
  const ultimosRegistros = data.registros.slice(0, 10);

  return (
    <div className="space-y-4">
      {stats ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Presença"
            value={`${stats.percentualPresenca}%`}
            icon={stats.abaixoDoLimite ? "warning" : "check"}
            color={stats.abaixoDoLimite ? "#C8391F" : "#0F8A5F"}
            delta={stats.abaixoDoLimite ? "Abaixo do limite de 75%" : "Dentro do limite mínimo"}
            deltaPos={stats.abaixoDoLimite ? "down" : "up"}
          />
          <KpiCard label="Aulas registradas" value={stats.totalAulas} icon="calendar" color="#1351B4" />
          <KpiCard label="Presenças" value={stats.presencas} icon="check" color="#0F8A5F" />
          <KpiCard
            label="Faltas"
            value={stats.faltas + stats.faltasJustificadas}
            icon="close"
            color="#D97706"
          />
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyWidget
              icon="info"
              label="Aluno ainda não enturmado — sem registros de frequência."
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Últimos registros de frequência</CardTitle>
          <CardDescription>Os {ultimosRegistros.length} registros mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          {ultimosRegistros.length === 0 ? (
            <EmptyWidget icon="calendar" label="Nenhum registro de frequência ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimosRegistros.map((r) => {
                  const config = STATUS_BADGE[r.status] ?? STATUS_BADGE.PRESENTE;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-[12px]">
                        {new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {r.justificativa || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
