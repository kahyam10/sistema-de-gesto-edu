"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { useDisciplinasByEtapa, useEscolas, useSeries } from "@/hooks/useApi";
import { useConteudos, useRemoverConteudo, useSalvarConteudo } from "@/hooks/usePlanejamento";
import { COORDENACAO_PEDAGOGICA, lerHabilidades, type ConteudoProgramatico } from "@/lib/api-planejamento";
import type { Serie } from "@/lib/api";
import { AJUDA_BNCC, FiltroSelect, Habilidades, OPCOES_BIMESTRE } from "./comum";

const ANO = new Date().getFullYear();
const REDE = "__rede__";

/**
 * Conteúdo programático por série, disciplina e bimestre. A SEMEC cadastra o
 * da rede; direção e coordenação complementam com o da própria escola.
 */
export function ConteudosProgramaticosManager() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const podeEditar = COORDENACAO_PEDAGOGICA.includes(role);
  const ehGestao = role === "ADMIN" || role === "SEMEC";

  const { data: series = [] } = useSeries();
  const { data: escolas = [] } = useEscolas();
  const listaEscolas = escolas as Array<{ id: string; nome: string }>;
  const [anoLetivo, setAnoLetivo] = useState(String(ANO));
  const [serieId, setSerieId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [bimestre, setBimestre] = useState("");
  const serie = (series as Serie[]).find((s) => s.id === serieId);
  const { data: disciplinas = [] } = useDisciplinasByEtapa(serie?.nivel?.etapaId);
  useEffect(() => setDisciplinaId(""), [serieId]);

  const q = useConteudos(
    { anoLetivo: Number(anoLetivo) || undefined, serieId, disciplinaId: disciplinaId || undefined, bimestre: bimestre ? Number(bimestre) : undefined },
    !!serieId
  );
  const salvar = useSalvarConteudo();
  const remover = useRemoverConteudo();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ConteudoProgramatico | null>(null);
  const [f, setF] = useState({ disciplinaId: "", bimestre: "1", titulo: "", descricao: "", habilidades: "", ordem: "0", escola: "" });
  const abrir = (c: ConteudoProgramatico | null) => {
    setEditando(c);
    setF(c
      ? { disciplinaId: c.disciplinaId, bimestre: String(c.bimestre), titulo: c.titulo, descricao: c.descricao ?? "", habilidades: c.habilidadesBncc.join(", "), ordem: String(c.ordem), escola: c.escolaId ?? REDE }
      : { disciplinaId, bimestre: bimestre || "1", titulo: "", descricao: "", habilidades: "", ordem: "0", escola: ehGestao ? REDE : user?.escola?.id ?? listaEscolas[0]?.id ?? "" });
    setAberto(true);
  };
  const gravar = () => {
    const dados = {
      anoLetivo: Number(anoLetivo), serieId, disciplinaId: f.disciplinaId, bimestre: Number(f.bimestre),
      titulo: f.titulo, descricao: f.descricao, habilidadesBncc: lerHabilidades(f.habilidades), ordem: Number(f.ordem) || 0,
      escolaId: f.escola === REDE ? undefined : f.escola,
    };
    salvar.mutate({ id: editando?.id, dados }, { onSuccess: () => setAberto(false) });
  };

  const opcoesEscola = useMemo(
    () => [...(ehGestao ? [{ valor: REDE, rotulo: "Rede municipal (todas as escolas)" }] : []), ...listaEscolas.map((e) => ({ valor: e.id, rotulo: e.nome }))],
    [ehGestao, listaEscolas]
  );
  const conteudos = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-ano">Ano letivo</Label>
          <Input id="c-ano" type="number" className="w-28" value={anoLetivo} onChange={(e) => setAnoLetivo(e.target.value)} />
        </div>
        <FiltroSelect id="c-serie" rotulo="Série" valor={serieId} aoMudar={setSerieId} todos={null} largura="w-52"
          opcoes={(series as Serie[]).map((s) => ({ valor: s.id, rotulo: s.nome }))} />
        <FiltroSelect id="c-disc" rotulo="Disciplina" valor={disciplinaId} aoMudar={setDisciplinaId} todos="Todas" largura="w-52"
          opcoes={disciplinas.map((d) => ({ valor: d.id, rotulo: d.nome }))} desabilitado={!serie} />
        <FiltroSelect id="c-bim" rotulo="Bimestre" valor={bimestre} aoMudar={setBimestre} opcoes={OPCOES_BIMESTRE} largura="w-40" />
        {podeEditar && (
          <Button className="ml-auto" disabled={!serieId} onClick={() => abrir(null)}>Novo conteúdo</Button>
        )}
      </div>

      {!serieId ? (
        <Panel><EmptyState icon="book" title="Escolha uma série" description="O conteúdo programático é organizado por série, disciplina e bimestre." /></Panel>
      ) : q.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Panel title="Conteúdo programático" headerRight={`${conteudos.length} item(ns)`} pad={false}>
          {conteudos.length === 0 ? (
            <EmptyState icon="book" title="Nenhum conteúdo cadastrado com esses filtros" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bim.</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Planos</TableHead>
                    {podeEditar && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conteudos.map((c) => {
                    const editavel = podeEditar && (ehGestao || c.escolaId !== null);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>{c.bimestre}º</TableCell>
                        <TableCell>
                          <div className="font-medium text-ink">{c.titulo}</div>
                          {c.descricao && <div className="text-xs text-ink-muted line-clamp-2">{c.descricao}</div>}
                          <div className="mt-1"><Habilidades codigos={c.habilidadesBncc} /></div>
                        </TableCell>
                        <TableCell className="text-sm">{c.disciplina.nome}</TableCell>
                        <TableCell>{c.escola ? <Badge variant="neutral">{c.escola.nome}</Badge> : <Badge variant="info">Rede</Badge>}</TableCell>
                        <TableCell className="text-right">{c._count.planosAula}</TableCell>
                        {podeEditar && (
                          <TableCell className="text-right whitespace-nowrap">
                            {editavel && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => abrir(c)}>Editar</Button>{" "}
                                <Button size="sm" variant="ghost" disabled={remover.isPending || c._count.planosAula > 0}
                                  title={c._count.planosAula > 0 ? "Usado em planos de aula" : undefined}
                                  onClick={() => remover.mutate(c.id)}>Excluir</Button>
                              </>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar conteúdo" : "Novo conteúdo programático"}</DialogTitle>
            <DialogDescription>{serie?.nome} · ano letivo {anoLetivo}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FiltroSelect id="cf-disc" rotulo="Disciplina" valor={f.disciplinaId} todos={null} largura="w-full" desabilitado={!!editando}
              aoMudar={(v) => setF((x) => ({ ...x, disciplinaId: v }))} opcoes={disciplinas.map((d) => ({ valor: d.id, rotulo: d.nome }))} />
            <FiltroSelect id="cf-bim" rotulo="Bimestre" valor={f.bimestre} todos={null} largura="w-full"
              aoMudar={(v) => setF((x) => ({ ...x, bimestre: v }))} opcoes={OPCOES_BIMESTRE} />
            <FiltroSelect id="cf-escola" rotulo="Vale para" valor={f.escola} todos={null} largura="w-full" desabilitado={!!editando}
              aoMudar={(v) => setF((x) => ({ ...x, escola: v }))} opcoes={opcoesEscola} />
            <div className="space-y-1.5">
              <Label htmlFor="cf-ordem">Ordem no bimestre</Label>
              <Input id="cf-ordem" type="number" min={0} value={f.ordem} onChange={(e) => setF((x) => ({ ...x, ordem: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-titulo">Título</Label>
            <Input id="cf-titulo" value={f.titulo} maxLength={200} onChange={(e) => setF((x) => ({ ...x, titulo: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-desc">Descrição (opcional)</Label>
            <Textarea id="cf-desc" rows={4} value={f.descricao} onChange={(e) => setF((x) => ({ ...x, descricao: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-bncc">Habilidades da BNCC (opcional)</Label>
            <Input id="cf-bncc" value={f.habilidades} onChange={(e) => setF((x) => ({ ...x, habilidades: e.target.value }))} />
            <p className="text-xs text-ink-muted">{AJUDA_BNCC}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={gravar} disabled={!f.disciplinaId || !f.titulo.trim() || !f.escola || salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
