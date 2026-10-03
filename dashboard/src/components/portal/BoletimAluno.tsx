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
import { EmptyWidget } from "@/components/ui/empty-state";
import { usePortalBoletimAluno } from "@/hooks/useApi";
import { formatarFrequenciaDisciplina } from "@/lib/medias";

const SITUACAO_BADGE: Record<string, { variant: "success" | "warning" | "danger" | "info"; label: string }> = {
  APROVADO: { variant: "success", label: "Aprovado" },
  RECUPERACAO: { variant: "warning", label: "Recuperação" },
  REPROVADO: { variant: "danger", label: "Reprovado" },
  EM_CURSO: { variant: "info", label: "Em curso" },
};

function SituacaoBadge({ situacao }: { situacao?: string }) {
  const config = (situacao && SITUACAO_BADGE[situacao]) || SITUACAO_BADGE.EM_CURSO;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/** Boletim do aluno (shape Boletim do módulo pedagógico) via portal do responsável. */
export function BoletimAluno({ matriculaId }: { matriculaId: string }) {
  const { data: boletim, isLoading, error } = usePortalBoletimAluno(matriculaId);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Boletim escolar</CardTitle>
            <CardDescription>
              Médias por bimestre e situação em cada disciplina
            </CardDescription>
          </div>
          {boletim?.situacaoGeral && <SituacaoBadge situacao={boletim.situacaoGeral} />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyWidget icon="warning" label={(error as Error).message} />
        ) : !boletim || boletim.disciplinas.length === 0 ? (
          <EmptyWidget
            icon="notebook"
            label="Ainda não há notas lançadas para este aluno."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="text-center">1º Bim</TableHead>
                  <TableHead className="text-center">2º Bim</TableHead>
                  <TableHead className="text-center">3º Bim</TableHead>
                  <TableHead className="text-center">4º Bim</TableHead>
                  <TableHead className="text-center">Média final</TableHead>
                  <TableHead
                    className="text-center"
                    title="Presença nas aulas desta disciplina. A situação segue a frequência geral."
                  >
                    Freq.
                  </TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletim.disciplinas.map((d) => {
                  const mediaDoBim = (bim: number) =>
                    d.bimestres.find((b) => b.bimestre === bim)?.media;
                  return (
                    <TableRow key={d.disciplinaId}>
                      <TableCell className="font-medium">{d.disciplinaNome}</TableCell>
                      {[1, 2, 3, 4].map((bim) => {
                        const media = mediaDoBim(bim);
                        return (
                          <TableCell key={bim} className="text-center font-mono">
                            {media !== null && media !== undefined
                              ? media.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })
                              : "—"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-mono font-semibold">
                        {d.mediaFinal !== null && d.mediaFinal !== undefined
                          ? d.mediaFinal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-[12px] text-ink-muted">
                        {formatarFrequenciaDisciplina(d.frequencia)}
                      </TableCell>
                      <TableCell>
                        <SituacaoBadge situacao={d.situacao} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {boletim?.frequencia && (
          <p className="mt-3 text-[12px] text-ink-muted">
            Frequência geral: {boletim.frequencia.percentualPresenca}% de presença em{" "}
            {boletim.frequencia.totalAulas} aula(s)
            {boletim.frequencia.abaixoDoLimite && (
              <span className="ml-2 font-semibold text-danger">
                Atenção: abaixo do limite mínimo de frequência
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
