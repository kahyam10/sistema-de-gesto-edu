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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyWidget } from "@/components/ui/empty-state";
import { useMatriculasEstatisticas, useMatriculasSemTurma } from "@/hooks/useApi";
import { AcessosResponsavelManager } from "./AcessosResponsavelManager";

/** Portal da Secretaria — estatísticas de matrícula, enturmação pendente e acessos. */
export function PortalSecretaria() {
  const anoLetivo = new Date().getFullYear();
  const { data: estatisticas, isLoading: loadingEstatisticas } =
    useMatriculasEstatisticas(anoLetivo);
  const { data: semTurma = [], isLoading: loadingSemTurma } = useMatriculasSemTurma();

  return (
    <div className="space-y-6">
      {/* KPIs de matrícula */}
      {loadingEstatisticas ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={`Matrículas ${anoLetivo}`}
            value={estatisticas?.total ?? 0}
            icon="graduation"
            color="#1351B4"
          />
          <KpiCard
            label="Ativas"
            value={estatisticas?.ativas ?? 0}
            icon="check"
            color="#0F8A5F"
          />
          <KpiCard
            label="Alunos PCD"
            value={estatisticas?.pcd ?? 0}
            unit={estatisticas ? `${estatisticas.percentualPCD}%` : undefined}
            icon="users"
            color="#3B86A8"
          />
          <KpiCard
            label="Sem turma"
            value={estatisticas?.semTurma ?? 0}
            icon="userPlus"
            color={(estatisticas?.semTurma ?? 0) > 0 ? "#D97706" : "#0F8A5F"}
          />
        </div>
      )}

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href="/cadastros/matriculas">Nova matrícula</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/cadastros/matriculas">Ficha / Declaração PDF</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/cadastros/matriculas">Transferências</Link>
        </Button>
      </div>

      {/* Aguardando enturmação */}
      <Card>
        <CardHeader>
          <CardTitle>Aguardando enturmação</CardTitle>
          <CardDescription>
            {semTurma.length} matrícula(s) ativa(s) sem turma definida
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSemTurma ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : semTurma.length === 0 ? (
            <EmptyWidget icon="check" label="Todos os alunos ativos estão enturmados." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Etapa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semTurma.slice(0, 10).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nomeAluno}</TableCell>
                    <TableCell className="font-mono text-[12px]">
                      {m.numeroMatricula}
                    </TableCell>
                    <TableCell>{m.escola?.nome ?? "—"}</TableCell>
                    <TableCell>{m.etapa?.nome ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {semTurma.length > 10 && (
            <p className="mt-2 text-[12px] text-ink-muted">
              Mostrando 10 de {semTurma.length}.{" "}
              <Link href="/cadastros/matriculas" className="underline hover:text-ink">
                Ver todas
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Acessos de responsáveis (Módulo 3) */}
      <AcessosResponsavelManager />
    </div>
  );
}
