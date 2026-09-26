"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeletorEscola } from "@/components/rh/SeletorEscola";
import { useAprendizagemEscola, useAprendizagemTurma } from "@/hooks/useAprendizagem";
import type { AprendizagemTurma, CodigoMotivo, RegraAvaliacao } from "@/lib/api-aprendizagem";

const num = (n: number | null | undefined, sufixo = "") =>
  n === null || n === undefined ? "—" : `${String(n).replace(".", ",")}${sufixo}`;

const ROTULO_MOTIVO: Record<CodigoMotivo, { rotulo: string; variante: "danger" | "warning" | "info" | "neutral" }> = {
  ABAIXO_DA_MEDIA: { rotulo: "Abaixo da média", variante: "danger" },
  FREQUENCIA_BAIXA: { rotulo: "Frequência baixa", variante: "danger" },
  QUEDA: { rotulo: "Queda", variante: "warning" },
  SEM_NOTA: { rotulo: "Sem nota", variante: "neutral" },
};

function DescricaoRegra({ regra }: { regra: RegraAvaliacao }) {
  return (
    <>
      Média mínima {num(regra.mediaMinima)} · frequência mínima {num(regra.frequenciaMinima, "%")}
      {regra.origem === "PADRAO" ? " (padrão — sem configuração de avaliação cadastrada)" : ""}
    </>
  );
}

/** Nota com cor conforme a média mínima; seta quando caiu em relação ao bimestre anterior. */
function CelulaMedia({ media, anterior, minima }: { media: number | null; anterior: number | null; minima: number }) {
  if (media === null) return <span className="text-ink-muted">—</span>;
  const caiu = anterior !== null && media < anterior;
  return (
    <span className={media < minima ? "font-medium text-danger-fg" : "text-ink"} title={anterior !== null ? `Bimestre anterior: ${num(anterior)}` : undefined}>
      {num(media)}
      {caiu && <span className="ml-1 text-warning-fg" aria-label={`caiu de ${num(anterior)}`}>↓</span>}
    </span>
  );
}

function DetalheTurma({ turmaId, aoVoltar }: { turmaId: string; aoVoltar: () => void }) {
  const [bimestre, setBimestre] = useState<number | undefined>(undefined);
  const [soAtencao, setSoAtencao] = useState(true);
  const q = useAprendizagemTurma(turmaId, bimestre);

  if (q.isLoading) return <Skeleton className="h-64 w-full" />;
  if (q.isError || !q.data) {
    return (
      <Panel>
        <EmptyState icon="warning" title="Não foi possível carregar a turma" description={(q.error as Error | null)?.message} />
      </Panel>
    );
  }
  const d: AprendizagemTurma = q.data;
  const alunos = d.alunos.filter((a) => !soAtencao || a.motivos.length > 0);
  const bimestres = d.bimestresComAvaliacao.length ? d.bimestresComAvaliacao : [d.bimestre];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Button variant="outline" onClick={aoVoltar}>← Todas as turmas</Button>
        <div>
          <div className="text-lg font-semibold text-ink">{d.turma.nome} · {d.turma.serie}</div>
          <div className="text-xs text-ink-muted">{d.turma.escola} · {d.turma.turno} · {d.turma.anoLetivo}</div>
        </div>
        <div className="space-y-1.5 ml-auto">
          <Label htmlFor="bimestre-aprendizagem">Bimestre</Label>
          <Select value={String(d.bimestre)} onValueChange={(v) => setBimestre(Number(v))}>
            <SelectTrigger id="bimestre-aprendizagem" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bimestres.map((b) => (
                <SelectItem key={b} value={String(b)}>{b}º bimestre</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Alunos ativos" value={d.resumo.alunos} icon="users" />
        <KpiCard label="Em atenção" value={d.resumo.emAtencao} icon="warning" color="#B3301A" />
        <KpiCard label="Frequência baixa" value={d.resumo.frequenciaBaixa} icon="calendar" color="#B3301A" />
        <KpiCard label="Média geral" value={num(d.resumo.mediaGeral)} icon="chart" color="#0A6142" />
      </div>

      <Panel title="Por disciplina" headerRight={<DescricaoRegra regra={d.regra} />} pad={false}>
        {d.disciplinas.length === 0 ? (
          <EmptyState icon="book" title="Nenhuma disciplina ativa para a etapa da turma" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="text-right">Avaliações</TableHead>
                  <TableHead className="text-right">Média da turma</TableHead>
                  <TableHead className="text-right">Alunos com nota</TableHead>
                  <TableHead className="text-right">Abaixo da média</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.disciplinas.map((x) => (
                  <TableRow key={x.disciplinaId}>
                    <TableCell className="font-medium text-ink">{x.nome}</TableCell>
                    <TableCell className="text-right">{x.avaliacoes}</TableCell>
                    <TableCell className="text-right">
                      <CelulaMedia media={x.mediaTurma} anterior={null} minima={d.regra.mediaMinima} />
                    </TableCell>
                    <TableCell className="text-right">{x.alunosComNota}</TableCell>
                    <TableCell className="text-right">
                      {x.abaixoDaMedia > 0 ? <Badge variant="danger">{x.abaixoDaMedia}</Badge> : "0"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Panel
        title="Alunos"
        headerRight={
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={soAtencao} onChange={(e) => setSoAtencao(e.target.checked)} />
            Só quem tem motivo de atenção
          </label>
        }
        pad={false}
      >
        {alunos.length === 0 ? (
          <EmptyState icon="check" title={soAtencao ? "Nenhum aluno em atenção neste bimestre" : "Nenhum aluno ativo"} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-right">Frequência</TableHead>
                  {d.disciplinas.map((x) => (
                    <TableHead key={x.disciplinaId} className="text-right whitespace-nowrap">{x.nome}</TableHead>
                  ))}
                  <TableHead>Motivos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((a) => (
                  <TableRow key={a.matriculaId}>
                    <TableCell>
                      <div className="font-medium text-ink">{a.nomeAluno}</div>
                      <div className="text-xs text-ink-muted">Matrícula {a.numeroMatricula}</div>
                    </TableCell>
                    <TableCell className={`text-right ${a.frequencia !== null && a.frequencia < d.regra.frequenciaMinima ? "font-medium text-danger-fg" : ""}`}>
                      {num(a.frequencia, "%")}
                    </TableCell>
                    {d.disciplinas.map((x) => {
                      const m = a.disciplinas.find((y) => y.disciplinaId === x.disciplinaId);
                      return (
                        <TableCell key={x.disciplinaId} className="text-right">
                          <CelulaMedia media={m?.media ?? null} anterior={m?.mediaAnterior ?? null} minima={d.regra.mediaMinima} />
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {a.motivos.length === 0 ? (
                          <Badge variant="success">OK</Badge>
                        ) : (
                          a.motivos.map((m) => (
                            <Badge key={m.codigo} variant={ROTULO_MOTIVO[m.codigo]?.variante ?? "neutral"} title={m.texto}>
                              {ROTULO_MOTIVO[m.codigo]?.rotulo ?? m.codigo}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/**
 * Módulo 2 — acompanhamento de aprendizagens: visão da escola (turmas com
 * alunos em atenção) e detalhe da turma (disciplinas e alunos com os motivos).
 */
export function AcompanhamentoAprendizagem() {
  const [escolaId, setEscolaId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState<number | undefined>(undefined);
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const q = useAprendizagemEscola(escolaId || undefined, anoLetivo);

  if (turmaId) return <DetalheTurma turmaId={turmaId} aoVoltar={() => setTurmaId(null)} />;

  const turmas = [...(q.data?.turmas ?? [])].sort(
    (x, y) => y.resumo.emAtencao - x.resumo.emAtencao || x.turma.nome.localeCompare(y.turma.nome)
  );
  const totais = turmas.reduce(
    (t, x) => ({ alunos: t.alunos + x.resumo.alunos, emAtencao: t.emAtencao + x.resumo.emAtencao, freq: t.freq + x.resumo.frequenciaBaixa }),
    { alunos: 0, emAtencao: 0, freq: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <SeletorEscola
          valor={escolaId}
          aoMudar={(id) => {
            setEscolaId(id);
            setAnoLetivo(undefined);
          }}
        />
        {q.data && q.data.anosDisponiveis.length > 1 && (
          <div className="space-y-1.5">
            <Label htmlFor="ano-aprendizagem">Ano letivo</Label>
            <Select value={String(q.data.anoLetivo)} onValueChange={(v) => setAnoLetivo(Number(v))}>
              <SelectTrigger id="ano-aprendizagem" className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {q.data.anosDisponiveis.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!escolaId ? (
        <Panel>
          <EmptyState icon="school" title="Escolha uma escola" description="Mostra, por turma, quantos alunos estão abaixo da média, com frequência baixa ou em queda no bimestre." />
        </Panel>
      ) : q.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : q.isError ? (
        <Panel><EmptyState icon="warning" title="Não foi possível carregar o acompanhamento" description={(q.error as Error).message} /></Panel>
      ) : q.data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Turmas" value={turmas.length} icon="grid" />
            <KpiCard label="Alunos ativos" value={totais.alunos} icon="users" />
            <KpiCard label="Em atenção" value={totais.emAtencao} icon="warning" color="#B3301A" />
            <KpiCard label="Frequência baixa" value={totais.freq} icon="calendar" color="#B3301A" />
          </div>
          <Panel title={`Turmas de ${q.data.anoLetivo}`} headerRight="Bimestre mais recente com avaliação em cada turma" pad={false}>
            {turmas.length === 0 ? (
              <EmptyState icon="school" title="Nenhuma turma ativa neste ano letivo" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead className="text-right">Bimestre</TableHead>
                      <TableHead className="text-right">Alunos</TableHead>
                      <TableHead className="text-right">Em atenção</TableHead>
                      <TableHead className="text-right">Frequência baixa</TableHead>
                      <TableHead className="text-right">Média geral</TableHead>
                      <TableHead>Regra</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turmas.map((t) => (
                      <TableRow key={t.turma.id}>
                        <TableCell>
                          <div className="font-medium text-ink">{t.turma.nome}</div>
                          <div className="text-xs text-ink-muted">{t.turma.serie} · {t.turma.turno}</div>
                        </TableCell>
                        <TableCell className="text-right">{t.bimestre}º</TableCell>
                        <TableCell className="text-right">{t.resumo.alunos}</TableCell>
                        <TableCell className="text-right">
                          {t.resumo.emAtencao > 0 ? <Badge variant="danger">{t.resumo.emAtencao}</Badge> : "0"}
                        </TableCell>
                        <TableCell className="text-right">{t.resumo.frequenciaBaixa}</TableCell>
                        <TableCell className="text-right">
                          <CelulaMedia media={t.resumo.mediaGeral} anterior={null} minima={t.regra.mediaMinima} />
                        </TableCell>
                        <TableCell className="text-xs text-ink-muted">
                          {num(t.regra.mediaMinima)} / {num(t.regra.frequenciaMinima, "%")}
                          {t.regra.origem === "PADRAO" ? " (padrão)" : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setTurmaId(t.turma.id)}>Detalhar</Button>
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
