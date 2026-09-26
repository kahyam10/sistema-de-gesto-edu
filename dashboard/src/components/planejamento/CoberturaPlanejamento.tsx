"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTurmas } from "@/hooks/useApi";
import { useCobertura } from "@/hooks/usePlanejamento";
import { STATUS_PLANO, type Cobertura } from "@/lib/api-planejamento";
import type { Turma } from "@/lib/api";
import { FiltroSelect, Habilidades, OPCOES_BIMESTRE, fmtData, opcoesTurma } from "./comum";

type Situacao = Cobertura["disciplinas"][number]["conteudos"][number]["situacao"];
const SITUACAO: Record<Situacao, { rotulo: string; variante: "success" | "info" | "neutral" | "danger" }> = {
  APROVADO: { rotulo: "Plano aprovado", variante: "success" },
  PLANEJADO: { rotulo: "Plano em revisão", variante: "info" },
  EM_RASCUNHO: { rotulo: "Em rascunho", variante: "neutral" },
  SEM_PLANO: { rotulo: "Sem plano", variante: "danger" },
};

/** Quanto do conteúdo programático previsto já tem plano de aula na turma. */
export function CoberturaPlanejamento() {
  const { data: todas = [] } = useTurmas();
  const turmas = useMemo(() => (todas as Turma[]).filter((t) => t.ativo), [todas]);
  const [turmaId, setTurmaId] = useState("");
  const [bimestre, setBimestre] = useState("");
  const q = useCobertura(turmaId || undefined, bimestre ? Number(bimestre) : undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <FiltroSelect id="cob-turma" rotulo="Turma" valor={turmaId} aoMudar={setTurmaId} todos={null} largura="w-72" opcoes={opcoesTurma(turmas)} />
        <FiltroSelect id="cob-bim" rotulo="Bimestre" valor={bimestre} aoMudar={setBimestre} todos="Ano todo" largura="w-40" opcoes={OPCOES_BIMESTRE} />
      </div>

      {!turmaId ? (
        <Panel><EmptyState icon="clipboard" title="Escolha uma turma" description="Compara o conteúdo programático previsto com os planos de aula já feitos." /></Panel>
      ) : q.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : q.isError ? (
        <Panel><EmptyState icon="warning" title="Não foi possível carregar a cobertura" description={(q.error as Error).message} /></Panel>
      ) : q.data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Conteúdos previstos" value={q.data.resumo.previstos} icon="book" />
            <KpiCard label="Com plano aprovado" value={q.data.resumo.aprovados} icon="check" color="#0A6142" />
            <KpiCard label="Sem plano" value={q.data.resumo.semPlano} icon="warning" color="#B3301A" />
          </div>
          {q.data.disciplinas.map((d) => (
            <Panel key={d.disciplinaId} title={d.nome}
              headerRight={`${d.aprovados}/${d.previstos} aprovados${d.planosSemConteudo ? ` · ${d.planosSemConteudo} plano(s) sem conteúdo vinculado` : ""}`}>
              {d.conteudos.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhum conteúdo programático cadastrado para esta série e disciplina.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {d.conteudos.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink">
                          {c.bimestre}º · {c.titulo} {c.daRede && <span className="text-xs text-ink-muted">(rede)</span>}
                        </div>
                        <Habilidades codigos={c.habilidadesBncc} />
                        {c.planos.length > 0 && (
                          <div className="mt-1 text-xs text-ink-muted">
                            {c.planos.map((p) => `${fmtData(p.dataAula)} ${p.titulo} (${STATUS_PLANO[p.status].rotulo.toLowerCase()})`).join(" · ")}
                          </div>
                        )}
                      </div>
                      <Badge variant={SITUACAO[c.situacao].variante}>{SITUACAO[c.situacao].rotulo}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </>
      ) : null}
    </div>
  );
}
