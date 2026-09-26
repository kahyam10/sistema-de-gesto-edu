"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Turma } from "@/lib/api";

/** Rótulo curto e datas em pt-BR (data da aula vem como meia-noite UTC). */
export const fmtData = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

export const etapaDaTurma = (t: Turma | undefined) =>
  (t?.serie?.nivel as { etapaId?: string } | undefined)?.etapaId;

const TODOS = "__todos__";

/** Select com opção "Todos" (valor vazio) para filtros. */
export function FiltroSelect({
  id, rotulo, valor, aoMudar, opcoes, todos = "Todos", largura = "w-48", desabilitado,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: Array<{ valor: string; rotulo: string }>;
  todos?: string | null;
  largura?: string;
  desabilitado?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Select
        value={valor || (todos !== null ? TODOS : undefined)}
        onValueChange={(v) => aoMudar(v === TODOS ? "" : v)}
        disabled={desabilitado}
      >
        <SelectTrigger id={id} className={largura}>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {todos !== null && <SelectItem value={TODOS}>{todos}</SelectItem>}
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const OPCOES_BIMESTRE = [1, 2, 3, 4].map((b) => ({ valor: String(b), rotulo: `${b}º bimestre` }));

export function opcoesTurma(turmas: Turma[]) {
  return turmas.map((t) => ({
    valor: t.id,
    rotulo: `${t.nome}${t.escola?.nome ? ` · ${t.escola.nome}` : ""} (${t.anoLetivo})`,
  }));
}

/** Códigos BNCC como badges; a existência na BNCC não é verificada pelo sistema. */
export function Habilidades({ codigos }: { codigos: string[] }) {
  if (!codigos.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {codigos.map((c) => (
        <Badge key={c} variant="outline" className="font-mono text-[11px]">{c}</Badge>
      ))}
    </div>
  );
}

export const AJUDA_BNCC =
  "Códigos separados por vírgula (ex.: formato EF05MA01). O sistema confere só o formato, não se o código existe na BNCC.";
