"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { notasApi, type Boletim, type Turma } from "@/lib/api";
import { configuracaoVigente } from "@/lib/medias";
import { useConfiguracoesAvaliacao } from "./useApi";

/** etapaId da turma (Série → Nível → Etapa). */
function etapaDaTurma(turma: Turma): string | undefined {
  return turma.serie?.nivel?.etapaId ?? turma.serie?.nivel?.etapa?.id ?? turma.serie?.etapa?.id;
}

/**
 * Configuração de avaliação vigente para a turma (média mínima etc.), com a
 * mesma prioridade do backend. `config` null = rede sem configuração.
 */
export function useConfiguracaoDaTurma(turma: Turma | undefined) {
  const q = useConfiguracoesAvaliacao(turma ? { anoLetivo: turma.anoLetivo } : undefined);
  const config = useMemo(
    () =>
      turma && q.data
        ? configuracaoVigente(q.data, { anoLetivo: turma.anoLetivo, escolaId: turma.escolaId, etapaId: etapaDaTurma(turma) })
        : null,
    [turma, q.data],
  );
  return { config, isLoading: !!turma && q.isLoading };
}

/**
 * Boletim (média e situação calculadas pelo backend) dos alunos ATIVOS da
 * turma, numa ÚNICA requisição (GET /api/notas/boletim-turma/:turmaId) — antes
 * era uma por aluno, o que numa turma grande encostava no rate limit.
 * A chave começa com "boletim": as mutações de nota que invalidam ["boletim"]
 * também atualizam esta consulta. Matrícula não ativa fica sem boletim ("—").
 */
export function useBoletinsDaTurma(turma: Turma | undefined) {
  const q = useQuery({
    queryKey: ["boletim", "turma", turma?.id, turma?.anoLetivo],
    queryFn: () => notasApi.getBoletimTurma(turma!.id, turma!.anoLetivo),
    enabled: !!turma,
  });
  const porMatricula = useMemo(() => {
    const mapa = new Map<string, Boletim>();
    for (const b of q.data?.boletins ?? []) mapa.set(b.matricula.id, b);
    return mapa;
  }, [q.data]);
  return {
    porMatricula,
    isLoading: !!turma && q.isLoading,
    // Falha da requisição da turma: nenhum aluno tem boletim
    erros: q.isError ? (turma?.matriculas ?? []).length : 0,
  };
}
