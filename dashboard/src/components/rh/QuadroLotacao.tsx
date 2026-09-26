"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuadroLotacao } from "@/hooks/useRh";
import type { LinhaLotacao } from "@/lib/api-rh";
import { SeletorEscola } from "./SeletorEscola";

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${String(n).replace(".", ",")}h`);

/** Barra de uso da jornada: regência + AC sobre a jornada, com a marca do limite de regência. */
function UsoJornada({ l }: { l: LinhaLotacao }) {
  if (!l.jornadaHoras) return <span className="text-xs text-ink-muted">sem jornada</span>;
  const pct = (h: number) => Math.min(100, (h / l.jornadaHoras!) * 100);
  const limite = l.horas.limiteRegencia ? pct(l.horas.limiteRegencia) : null;
  return (
    <div className="w-40" aria-label={`Regência ${fmt(l.horas.regenciaTotal)}, AC ${fmt(l.horas.acTotal)} de ${l.jornadaHoras}h`}>
      <div className="relative h-2 rounded-full bg-surface-muted overflow-hidden">
        <div className="absolute left-0 top-0 h-2 bg-[#1351B4]" style={{ width: `${pct(l.horas.regenciaTotal)}%` }} />
        <div
          className="absolute top-0 h-2 bg-[#0A6142]"
          style={{ left: `${pct(l.horas.regenciaTotal)}%`, width: `${Math.max(0, Math.min(100 - pct(l.horas.regenciaTotal), pct(l.horas.acTotal)))}%` }}
        />
        {limite !== null && <div className="absolute top-[-2px] h-3 w-[2px] bg-ink" style={{ left: `${limite}%` }} />}
      </div>
      <div className="mt-1 text-[11px] text-ink-muted">
        {fmt(l.horas.regenciaTotal)} aula · {fmt(l.horas.acTotal)} AC · de {l.jornadaHoras}h
      </div>
    </div>
  );
}

export function QuadroLotacao() {
  const [escolaId, setEscolaId] = useState("");
  const [soAlertas, setSoAlertas] = useState(false);
  const q = useQuadroLotacao(escolaId || undefined);
  const linhas = (q.data?.profissionais ?? []).filter((l) => !soAlertas || l.alertas.length > 0);
  const limitePct = q.data ? Math.round(q.data.fracaoMaximaRegencia * 1000) / 10 : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <SeletorEscola valor={escolaId} aoMudar={setEscolaId} />
        <label className="flex items-center gap-2 text-sm text-ink-2 pb-2">
          <input type="checkbox" checked={soAlertas} onChange={(e) => setSoAlertas(e.target.checked)} />
          Só quem tem alerta
        </label>
      </div>

      {!escolaId ? (
        <Panel><EmptyState icon="building" title="Escolha uma escola" description="O quadro cruza a jornada de cada profissional com as aulas da grade e as ACs." /></Panel>
      ) : q.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : q.isError ? (
        <Panel><EmptyState icon="warning" title="Não foi possível carregar o quadro" description={(q.error as Error).message} /></Panel>
      ) : q.data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Profissionais" value={q.data.resumo.profissionais} icon="users" />
            <KpiCard label="Com alerta" value={q.data.resumo.comAlerta} icon="warning" color="#B3301A" />
            <KpiCard label="Aulas na escola" value={String(q.data.resumo.regenciaNaEscola).replace(".", ",")} unit="h/semana" icon="clock" />
            <KpiCard label="AC na escola" value={String(q.data.resumo.acNaEscola).replace(".", ",")} unit="h/semana" icon="calendar" color="#0A6142" />
          </div>
          <Panel
            title="Quadro de lotação"
            headerRight={limitePct !== null ? `Limite de regência: ${String(limitePct).replace(".", ",")}% da jornada · horas de relógio` : undefined}
            pad={false}
          >
            {linhas.length === 0 ? (
              <EmptyState icon="check" title={soAlertas ? "Nenhum alerta" : "Ninguém lotado ou com aula nesta escola"} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Lotação aqui</TableHead>
                      <TableHead>Nesta escola</TableHead>
                      <TableHead>Uso da jornada (rede)</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Alertas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((l) => (
                      <TableRow key={l.profissional.id}>
                        <TableCell>
                          <div className="font-medium text-ink">{l.profissional.nome}</div>
                          <div className="text-xs text-ink-muted">
                            {[l.profissional.tipo, l.profissional.regimeContratacao].filter(Boolean).join(" · ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {l.lotacaoNaEscola ? (
                            <>
                              {l.lotacaoNaEscola.funcao ?? "—"}
                              <div className="text-xs text-ink-muted">{fmt(l.lotacaoNaEscola.cargaHoraria)}</div>
                            </>
                          ) : (
                            <span className="text-ink-muted">não lotado</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {fmt(l.horas.regenciaNaEscola)} aula · {fmt(l.horas.acNaEscola)} AC
                          {l.disciplinasNaEscola.length > 0 && (
                            <div className="text-xs text-ink-muted">{l.disciplinasNaEscola.join(", ")}</div>
                          )}
                        </TableCell>
                        <TableCell><UsoJornada l={l} /></TableCell>
                        <TableCell className="text-right font-medium">{fmt(l.horas.saldo)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {l.alertas.length === 0 ? (
                              <Badge variant="success">OK</Badge>
                            ) : (
                              l.alertas.map((a) => (
                                <Badge key={a.codigo} variant={a.codigo === "SEM_LOTACAO" || a.codigo === "SEM_JORNADA" ? "warning" : "danger"} title={a.mensagem}>
                                  {a.mensagem}
                                </Badge>
                              ))
                            )}
                            {l.conflitos.map((c, i) => (
                              <span key={i} className="text-[11px] text-danger-fg">
                                {c.diaSemana}: {c.entre[0]} × {c.entre[1]}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
