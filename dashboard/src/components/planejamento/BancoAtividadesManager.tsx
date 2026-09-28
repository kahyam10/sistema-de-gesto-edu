"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useDisciplinas, useEscolas, useSeries } from "@/hooks/useApi";
import { useAtividadesPedagogicas, useRemoverAtividade, useSalvarAtividade } from "@/hooks/usePlanejamento";
import {
  TIPOS_ATIVIDADE, lerHabilidades, rotuloTipo, type AtividadePedagogica, type TipoAtividade,
} from "@/lib/api-planejamento";
import type { Serie } from "@/lib/api";
import { AJUDA_BNCC, FiltroSelect, Habilidades } from "./comum";
import { useEhGestao } from "@/hooks/use-papel";

const REDE = "__rede__";
const SEM_SERIE = "";

/** Banco de atividades: a rede compartilha as suas; cada escola, as dela. */
export function BancoAtividadesManager() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const ehGestao = useEhGestao();
  const { data: disciplinas = [] } = useDisciplinas({ ativo: true });
  const { data: series = [] } = useSeries();
  const { data: escolas = [] } = useEscolas();
  const listaEscolas = escolas as Array<{ id: string; nome: string }>;

  const [disciplinaId, setDisciplinaId] = useState("");
  const [tipo, setTipo] = useState("");
  const [busca, setBusca] = useState("");
  const [minhas, setMinhas] = useState(false);
  const q = useAtividadesPedagogicas({ disciplinaId: disciplinaId || undefined, tipo: tipo || undefined, busca: busca.trim() || undefined, minhas: minhas || undefined });
  const salvar = useSalvarAtividade();
  const remover = useRemoverAtividade();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<AtividadePedagogica | null>(null);
  const [f, setF] = useState({ titulo: "", tipo: "EXERCICIO" as TipoAtividade, descricao: "", disciplinaId: "", serieId: SEM_SERIE, escola: "", habilidades: "" });

  // A série precisa ser da mesma etapa da disciplina
  const disciplinaForm = (disciplinas as Array<{ id: string; nome: string; etapaId: string }>).find((d) => d.id === f.disciplinaId);
  const seriesDaEtapa = useMemo(
    () => (series as Serie[]).filter((s) => !disciplinaForm || s.nivel?.etapaId === disciplinaForm.etapaId),
    [series, disciplinaForm]
  );
  const opcoesEscola = [
    ...(ehGestao ? [{ valor: REDE, rotulo: "Rede municipal (todas as escolas)" }] : []),
    ...listaEscolas.map((e) => ({ valor: e.id, rotulo: e.nome })),
  ];

  const abrir = (a: AtividadePedagogica | null) => {
    setEditando(a);
    setF(a
      ? { titulo: a.titulo, tipo: a.tipo, descricao: a.descricao, disciplinaId: a.disciplinaId, serieId: a.serieId ?? SEM_SERIE, escola: a.escolaId ?? REDE, habilidades: a.habilidadesBncc.join(", ") }
      : { titulo: "", tipo: "EXERCICIO", descricao: "", disciplinaId, serieId: SEM_SERIE, escola: ehGestao ? REDE : listaEscolas.length === 1 ? listaEscolas[0].id : "", habilidades: "" });
    setAberto(true);
  };
  const gravar = () => {
    const dados = {
      titulo: f.titulo, tipo: f.tipo, descricao: f.descricao, disciplinaId: f.disciplinaId,
      serieId: f.serieId || undefined, escolaId: f.escola === REDE ? undefined : f.escola,
      habilidadesBncc: lerHabilidades(f.habilidades),
    };
    salvar.mutate({ id: editando?.id, dados }, { onSuccess: () => setAberto(false) });
  };
  // Professor mexe só nas próprias; direção/coordenação nas da escola; gestão em todas
  const podeAlterar = (a: AtividadePedagogica) =>
    ehGestao || (role === "PROFESSOR" ? a.autorId === user?.id : a.escolaId !== null);

  const atividades = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <FiltroSelect id="a-disc" rotulo="Disciplina" valor={disciplinaId} aoMudar={setDisciplinaId} todos="Todas" largura="w-56"
          opcoes={(disciplinas as Array<{ id: string; nome: string }>).map((d) => ({ valor: d.id, rotulo: d.nome }))} />
        <FiltroSelect id="a-tipo" rotulo="Tipo" valor={tipo} aoMudar={setTipo} todos="Todos" largura="w-44"
          opcoes={TIPOS_ATIVIDADE.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))} />
        <div className="space-y-1.5">
          <Label htmlFor="a-busca">Buscar</Label>
          <Input id="a-busca" className="w-56" value={busca} placeholder="título ou texto" onChange={(e) => setBusca(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-2">
          <input type="checkbox" checked={minhas} onChange={(e) => setMinhas(e.target.checked)} />
          Só as minhas
        </label>
        <Button className="ml-auto" onClick={() => abrir(null)}>Nova atividade</Button>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : atividades.length === 0 ? (
        <Panel><EmptyState icon="archive" title="Nenhuma atividade no banco com esses filtros" /></Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {atividades.map((a) => (
            <Panel key={a.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">{a.titulo}</div>
                  <div className="text-xs text-ink-muted">
                    {rotuloTipo(a.tipo)} · {a.disciplina.nome}{a.serie ? ` · ${a.serie.nome}` : ""}
                  </div>
                </div>
                {a.escola ? <Badge variant="neutral">{a.escola.nome}</Badge> : <Badge variant="info">Rede</Badge>}
              </div>
              <p className="mt-2 flex-1 whitespace-pre-line text-sm text-ink-2 line-clamp-5">{a.descricao}</p>
              <div className="mt-2"><Habilidades codigos={a.habilidadesBncc} /></div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                <span>por {a.autor.nome} · em {a._count.planos} plano(s)</span>
                {podeAlterar(a) && (
                  <span className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => abrir(a)}>Editar</Button>
                    <Button size="sm" variant="ghost" disabled={remover.isPending || a._count.planos > 0}
                      title={a._count.planos > 0 ? "Usada em planos de aula" : undefined}
                      onClick={() => remover.mutate(a.id)}>Excluir</Button>
                  </span>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar atividade" : "Nova atividade"}</DialogTitle>
            <DialogDescription>Sem dados de alunos: o banco é compartilhado entre professores.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="af-titulo">Título</Label>
            <Input id="af-titulo" value={f.titulo} maxLength={200} onChange={(e) => setF((x) => ({ ...x, titulo: e.target.value }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FiltroSelect id="af-tipo" rotulo="Tipo" valor={f.tipo} todos={null} largura="w-full"
              aoMudar={(v) => setF((x) => ({ ...x, tipo: v as TipoAtividade }))} opcoes={TIPOS_ATIVIDADE.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))} />
            <FiltroSelect id="af-disc" rotulo="Disciplina" valor={f.disciplinaId} todos={null} largura="w-full" desabilitado={!!editando}
              aoMudar={(v) => setF((x) => ({ ...x, disciplinaId: v, serieId: SEM_SERIE }))}
              opcoes={(disciplinas as Array<{ id: string; nome: string }>).map((d) => ({ valor: d.id, rotulo: d.nome }))} />
            <FiltroSelect id="af-serie" rotulo="Série" valor={f.serieId} todos="Qualquer série da etapa" largura="w-full" desabilitado={!f.disciplinaId}
              aoMudar={(v) => setF((x) => ({ ...x, serieId: v }))} opcoes={seriesDaEtapa.map((s) => ({ valor: s.id, rotulo: s.nome }))} />
            <FiltroSelect id="af-escola" rotulo="Disponível para" valor={f.escola} todos={null} largura="w-full" desabilitado={!!editando}
              aoMudar={(v) => setF((x) => ({ ...x, escola: v }))} opcoes={opcoesEscola} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-desc">Enunciado e orientações</Label>
            <Textarea id="af-desc" rows={7} value={f.descricao} onChange={(e) => setF((x) => ({ ...x, descricao: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-bncc">Habilidades da BNCC (opcional)</Label>
            <Input id="af-bncc" value={f.habilidades} onChange={(e) => setF((x) => ({ ...x, habilidades: e.target.value }))} />
            <p className="text-xs text-ink-muted">{AJUDA_BNCC}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={gravar} disabled={!f.titulo.trim() || !f.descricao.trim() || !f.disciplinaId || !f.escola || salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
