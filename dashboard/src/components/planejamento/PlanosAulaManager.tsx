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
import { useTurmas, useDisciplinasByEtapa } from "@/hooks/useApi";
import {
  useAcaoPlano, useAtividadesPedagogicas, useConteudos, usePlano, usePlanos, useSalvarPlano,
} from "@/hooks/usePlanejamento";
import {
  COORDENACAO_PEDAGOGICA, STATUS_PLANO, lerHabilidades, rotuloTipo,
  type DadosPlano, type PlanoAula, type StatusPlano,
} from "@/lib/api-planejamento";
import type { Turma } from "@/lib/api";
import {
  AJUDA_BNCC, FiltroSelect, Habilidades, OPCOES_BIMESTRE, etapaDaTurma, fmtData, opcoesTurma,
} from "./comum";

const hoje = () => new Date().toISOString().slice(0, 10);

interface Form {
  turmaId: string;
  disciplinaId: string;
  bimestre: string;
  dataAula: string;
  titulo: string;
  objetivos: string;
  desenvolvimento: string;
  recursos: string;
  avaliacao: string;
  habilidades: string;
  conteudoProgramaticoId: string;
  atividades: string[];
}

const formVazio = (turmaId = ""): Form => ({
  turmaId, disciplinaId: "", bimestre: "1", dataAula: hoje(), titulo: "", objetivos: "",
  desenvolvimento: "", recursos: "", avaliacao: "", habilidades: "", conteudoProgramaticoId: "", atividades: [],
});

const formDoPlano = (p: PlanoAula): Form => ({
  turmaId: p.turmaId, disciplinaId: p.disciplinaId, bimestre: String(p.bimestre), dataAula: p.dataAula.slice(0, 10),
  titulo: p.titulo, objetivos: p.objetivos, desenvolvimento: p.desenvolvimento ?? "", recursos: p.recursos ?? "",
  avaliacao: p.avaliacao ?? "", habilidades: p.habilidadesBncc.join(", "),
  conteudoProgramaticoId: p.conteudoProgramaticoId ?? "", atividades: p.atividades.map((a) => a.id),
});

/** Formulário de criação/edição. Turma e disciplina ficam fixas na edição. */
function PlanoDialog({
  aberto, aoFechar, turmas, plano,
}: { aberto: boolean; aoFechar: () => void; turmas: Turma[]; plano: PlanoAula | null }) {
  const [f, setF] = useState<Form>(formVazio());
  const salvar = useSalvarPlano();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (aberto) setF(plano ? formDoPlano(plano) : formVazio(turmas.length === 1 ? turmas[0].id : ""));
  }, [aberto, plano, turmas]);

  const turma = turmas.find((t) => t.id === f.turmaId);
  const { data: disciplinas = [] } = useDisciplinasByEtapa(etapaDaTurma(turma));
  const pronto = !!turma && !!f.disciplinaId;
  const { data: conteudos = [] } = useConteudos(
    { anoLetivo: turma?.anoLetivo, serieId: turma?.serieId, disciplinaId: f.disciplinaId, bimestre: Number(f.bimestre), escolaId: turma?.escolaId },
    pronto
  );
  const { data: atividades = [] } = useAtividadesPedagogicas(
    { disciplinaId: f.disciplinaId, serieId: turma?.serieId, escolaId: turma?.escolaId },
    pronto
  );

  const enviar = () => {
    const dados: DadosPlano = {
      turmaId: f.turmaId, disciplinaId: f.disciplinaId, bimestre: Number(f.bimestre), dataAula: f.dataAula,
      titulo: f.titulo, objetivos: f.objetivos, desenvolvimento: f.desenvolvimento, recursos: f.recursos,
      avaliacao: f.avaliacao, habilidadesBncc: lerHabilidades(f.habilidades),
      conteudoProgramaticoId: f.conteudoProgramaticoId, atividades: f.atividades,
    };
    salvar.mutate({ id: plano?.id, dados }, { onSuccess: aoFechar });
  };
  const valido = f.turmaId && f.disciplinaId && f.dataAula && f.titulo.trim() && f.objetivos.trim();

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plano ? "Editar plano de aula" : "Novo plano de aula"}</DialogTitle>
          <DialogDescription>
            O plano fica como rascunho, visível só para você, até ser enviado para a coordenação.
          </DialogDescription>
        </DialogHeader>

        {plano?.status === "DEVOLVIDO" && plano.parecer && (
          <div className="rounded-md border border-hairline bg-warning-soft p-3 text-sm text-warning-fg">
            <strong>Devolutiva da coordenação:</strong> {plano.parecer}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FiltroSelect id="plano-turma" rotulo="Turma" valor={f.turmaId} todos={null} largura="w-full"
            aoMudar={(v) => setF((x) => ({ ...x, turmaId: v, disciplinaId: "", conteudoProgramaticoId: "", atividades: [] }))}
            opcoes={opcoesTurma(turmas)} desabilitado={!!plano} />
          <FiltroSelect id="plano-disciplina" rotulo="Disciplina" valor={f.disciplinaId} todos={null} largura="w-full"
            aoMudar={(v) => setF((x) => ({ ...x, disciplinaId: v, conteudoProgramaticoId: "", atividades: [] }))}
            opcoes={disciplinas.map((d) => ({ valor: d.id, rotulo: d.nome }))} desabilitado={!!plano || !turma} />
          <FiltroSelect id="plano-bimestre" rotulo="Bimestre" valor={f.bimestre} todos={null} largura="w-full"
            aoMudar={(v) => setF((x) => ({ ...x, bimestre: v, conteudoProgramaticoId: "" }))} opcoes={OPCOES_BIMESTRE} />
          <div className="space-y-1.5">
            <Label htmlFor="plano-data">Data da aula</Label>
            <Input id="plano-data" type="date" value={f.dataAula} onChange={(e) => set("dataAula", e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plano-titulo">Título</Label>
          <Input id="plano-titulo" value={f.titulo} maxLength={200} onChange={(e) => set("titulo", e.target.value)} />
        </div>

        <FiltroSelect id="plano-conteudo" rotulo="Conteúdo programático (opcional)" valor={f.conteudoProgramaticoId}
          todos="Nenhum" largura="w-full" aoMudar={(v) => set("conteudoProgramaticoId", v)} desabilitado={!pronto}
          opcoes={conteudos.map((c) => ({ valor: c.id, rotulo: `${c.titulo}${c.escolaId ? "" : " (rede)"}` }))} />

        {[
          ["objetivos", "Objetivos", 3],
          ["desenvolvimento", "Desenvolvimento / metodologia", 5],
          ["recursos", "Recursos", 2],
          ["avaliacao", "Avaliação", 3],
        ].map(([campo, rotulo, linhas]) => (
          <div key={campo as string} className="space-y-1.5">
            <Label htmlFor={`plano-${campo}`}>{rotulo}{campo === "objetivos" ? "" : " (opcional)"}</Label>
            <Textarea id={`plano-${campo}`} rows={linhas as number} value={f[campo as keyof Form] as string}
              onChange={(e) => set(campo as "objetivos", e.target.value)} />
          </div>
        ))}

        <div className="space-y-1.5">
          <Label htmlFor="plano-bncc">Habilidades da BNCC (opcional)</Label>
          <Input id="plano-bncc" value={f.habilidades} placeholder="EF03LP01, EF03LP02"
            onChange={(e) => set("habilidades", e.target.value)} />
          <p className="text-xs text-ink-muted">{AJUDA_BNCC}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Atividades do banco (opcional)</Label>
          {!pronto ? (
            <p className="text-xs text-ink-muted">Escolha turma e disciplina para ver as atividades.</p>
          ) : atividades.length === 0 ? (
            <p className="text-xs text-ink-muted">Nenhuma atividade cadastrada para esta disciplina.</p>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-md border border-hairline divide-y divide-hairline">
              {atividades.map((a) => (
                <label key={a.id} className="flex items-start gap-2 p-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={f.atividades.includes(a.id)}
                    onChange={(e) => set("atividades", e.target.checked ? [...f.atividades, a.id] : f.atividades.filter((x) => x !== a.id))} />
                  <span>
                    <span className="font-medium text-ink">{a.titulo}</span>
                    <span className="text-xs text-ink-muted"> · {rotuloTipo(a.tipo)}{a.escolaId ? "" : " · rede"}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={!valido || salvar.isPending}>
            {salvar.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Detalhe do plano com as ações cabíveis ao papel e à situação. */
function PlanoDetalhe({
  id, aoFechar, aoEditar, usuario,
}: { id: string | null; aoFechar: () => void; aoEditar: (p: PlanoAula) => void; usuario: { id: string; role: string } }) {
  const q = usePlano(id);
  const acao = useAcaoPlano();
  const [parecer, setParecer] = useState("");
  useEffect(() => setParecer(""), [id]);
  const p = q.data;
  const ehAutor = p?.autorId === usuario.id;
  const editavel = ehAutor && (p?.status === "RASCUNHO" || p?.status === "DEVOLVIDO");
  const revisa = !!p && p.status === "ENVIADO" && !ehAutor && COORDENACAO_PEDAGOGICA.includes(usuario.role);

  const Secao = ({ titulo, texto }: { titulo: string; texto: string | null }) =>
    texto ? (
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{titulo}</div>
        <p className="mt-1 whitespace-pre-line text-sm text-ink">{texto}</p>
      </div>
    ) : null;

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {!p ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{p.titulo}</DialogTitle>
              <DialogDescription>
                {p.turma.nome} · {p.disciplina.nome} · {p.bimestre}º bimestre · aula em {fmtData(p.dataAula)} · por {p.autor.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_PLANO[p.status].variante}>{STATUS_PLANO[p.status].rotulo}</Badge>
              {p.revisadoPor && (
                <span className="text-xs text-ink-muted">revisado por {p.revisadoPor.nome} em {fmtData(p.revisadoEm)}</span>
              )}
            </div>
            {p.parecer && (
              <div className={`rounded-md border border-hairline p-3 text-sm ${p.status === "DEVOLVIDO" ? "bg-warning-soft text-warning-fg" : "bg-surface-muted text-ink-2"}`}>
                <strong>Parecer da coordenação:</strong> {p.parecer}
              </div>
            )}
            {p.conteudoProgramatico && (
              <div className="text-sm"><span className="text-ink-muted">Conteúdo programático:</span> {p.conteudoProgramatico.titulo}</div>
            )}
            <Habilidades codigos={p.habilidadesBncc} />
            <Secao titulo="Objetivos" texto={p.objetivos} />
            <Secao titulo="Desenvolvimento" texto={p.desenvolvimento} />
            <Secao titulo="Recursos" texto={p.recursos} />
            <Secao titulo="Avaliação" texto={p.avaliacao} />
            {p.atividades.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Atividades</div>
                <ul className="mt-1 space-y-2">
                  {p.atividades.map((a) => (
                    <li key={a.id} className="rounded-md border border-hairline p-2 text-sm">
                      <div className="font-medium text-ink">{a.titulo} <span className="text-xs text-ink-muted">· {rotuloTipo(a.tipo)}</span></div>
                      <p className="whitespace-pre-line text-ink-2">{a.descricao}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {revisa && (
              <div className="space-y-1.5 border-t border-hairline pt-3">
                <Label htmlFor="parecer">Parecer (obrigatório para devolver)</Label>
                <Textarea id="parecer" rows={3} value={parecer} onChange={(e) => setParecer(e.target.value)} />
              </div>
            )}

            <DialogFooter className="flex-wrap gap-2">
              {editavel && (
                <>
                  <Button variant="destructive" disabled={acao.isPending}
                    onClick={() => acao.mutate({ tipo: "remover", id: p.id }, { onSuccess: aoFechar })}>Excluir</Button>
                  <Button variant="outline" onClick={() => aoEditar(p)}>Editar</Button>
                  <Button disabled={acao.isPending} onClick={() => acao.mutate({ tipo: "enviar", id: p.id })}>
                    Enviar para a coordenação
                  </Button>
                </>
              )}
              {revisa && (
                <>
                  <Button variant="outline" disabled={acao.isPending || !parecer.trim()}
                    onClick={() => acao.mutate({ tipo: "revisar", id: p.id, decisao: "DEVOLVIDO", parecer })}>Devolver</Button>
                  <Button disabled={acao.isPending}
                    onClick={() => acao.mutate({ tipo: "revisar", id: p.id, decisao: "APROVADO", parecer: parecer || undefined })}>Aprovar</Button>
                </>
              )}
              {!editavel && !revisa && <Button variant="outline" onClick={aoFechar}>Fechar</Button>}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Módulo 2 — planos de aula: professor escreve e envia; coordenação aprova ou devolve. */
export function PlanosAulaManager() {
  const { user } = useAuth();
  const usuario = { id: user?.id ?? "", role: user?.role ?? "" };
  const ehProfessor = usuario.role === "PROFESSOR";
  const { data: todasTurmas = [] } = useTurmas();
  const turmas = useMemo(() => (todasTurmas as Turma[]).filter((t) => t.ativo), [todasTurmas]);

  const [turmaId, setTurmaId] = useState("");
  const [bimestre, setBimestre] = useState("");
  const [status, setStatus] = useState(ehProfessor ? "" : "ENVIADO");
  const [meus, setMeus] = useState(ehProfessor);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [turmaId, bimestre, status, meus]);

  const q = usePlanos({ turmaId, bimestre: bimestre ? Number(bimestre) : undefined, status, meus: meus || undefined, page, limit: 20 });
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ aberto: boolean; plano: PlanoAula | null }>({ aberto: false, plano: null });

  const lista = q.data?.data ?? [];
  const pag = q.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <FiltroSelect id="f-turma" rotulo="Turma" valor={turmaId} aoMudar={setTurmaId} opcoes={opcoesTurma(turmas)} todos="Todas" largura="w-64" />
        <FiltroSelect id="f-bimestre" rotulo="Bimestre" valor={bimestre} aoMudar={setBimestre} opcoes={OPCOES_BIMESTRE} largura="w-40" />
        <FiltroSelect id="f-status" rotulo="Situação" valor={status} aoMudar={setStatus} largura="w-52"
          opcoes={(Object.keys(STATUS_PLANO) as StatusPlano[]).map((s) => ({ valor: s, rotulo: STATUS_PLANO[s].rotulo }))} />
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-2">
          <input type="checkbox" checked={meus} onChange={(e) => setMeus(e.target.checked)} />
          Só os meus
        </label>
        <Button className="ml-auto" onClick={() => setEditando({ aberto: true, plano: null })} disabled={turmas.length === 0}>
          Novo plano
        </Button>
      </div>

      <Panel title="Planos de aula" headerRight={pag ? `${pag.total} plano(s)` : undefined} pad={false}>
        {q.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : q.isError ? (
          <EmptyState icon="warning" title="Não foi possível carregar os planos" description={(q.error as Error).message} />
        ) : lista.length === 0 ? (
          <EmptyState icon="notebook" title="Nenhum plano encontrado"
            description={status === "ENVIADO" ? "Nenhum plano aguardando revisão com esses filtros." : "Rascunhos de outros professores não aparecem aqui."} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aula</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Turma · disciplina</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-sm">{fmtData(p.dataAula)}<div className="text-xs text-ink-muted">{p.bimestre}º bim.</div></TableCell>
                    <TableCell>
                      <div className="font-medium text-ink">{p.titulo}</div>
                      {p.conteudoProgramatico && <div className="text-xs text-ink-muted">{p.conteudoProgramatico.titulo}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{p.turma.nome} · {p.disciplina.nome}<div className="text-xs text-ink-muted">{p.turma.escola.nome}</div></TableCell>
                    <TableCell className="text-sm">{p.autor.nome}</TableCell>
                    <TableCell><Badge variant={STATUS_PLANO[p.status].variante}>{STATUS_PLANO[p.status].rotulo}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetalhe(p.id)}>Abrir</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {pag && pag.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-hairline p-3 text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-ink-muted">Página {pag.page} de {pag.totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= pag.totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
          </div>
        )}
      </Panel>

      <PlanoDetalhe id={detalhe} usuario={usuario} aoFechar={() => setDetalhe(null)}
        aoEditar={(p) => { setDetalhe(null); setEditando({ aberto: true, plano: p }); }} />
      <PlanoDialog aberto={editando.aberto} plano={editando.plano} turmas={turmas}
        aoFechar={() => setEditando({ aberto: false, plano: null })} />
    </div>
  );
}
