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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { profissionaisApi } from "@/lib/api";
import { AREAS_AC, DIAS, type AtividadeComplementar, type DadosAC } from "@/lib/api-rh";
import { useAlternarAC, useAtividadesComplementares, useSalvarAC } from "@/hooks/useRh";
import { SeletorEscola } from "./SeletorEscola";

const rotuloArea = Object.fromEntries(AREAS_AC.map((a) => [a.valor, a.rotulo]));
const rotuloDia = Object.fromEntries(DIAS.map((d) => [d.valor, d.rotulo]));
const SEM_COORDENADOR = "__nenhum__";

const vazio = (escolaId: string): DadosAC => ({
  escolaId, area: "GERAL", diaSemana: "SEGUNDA", horaInicio: "14:00", horaFim: "16:00", participantes: [],
});

/** Cadastro das ACs (Atividades Complementares) por área, com participantes. */
export function AtividadesComplementaresManager() {
  const [escolaId, setEscolaId] = useState("");
  const [editando, setEditando] = useState<{ id?: string; dados: DadosAC } | null>(null);
  const q = useAtividadesComplementares(escolaId || undefined);
  const salvar = useSalvarAC();
  const alternar = useAlternarAC();
  const profissionais = useQuery({
    queryKey: ["profissionais", "escola", escolaId],
    queryFn: () => profissionaisApi.getByEscola(escolaId),
    enabled: !!escolaId,
  });
  const listaProf = useMemo(
    () => ((profissionais.data ?? []) as Array<{ id: string; nome: string }>).slice().sort((a, b) => a.nome.localeCompare(b.nome)),
    [profissionais.data]
  );

  function abrir(ac?: AtividadeComplementar) {
    setEditando(
      ac
        ? {
            id: ac.id,
            dados: {
              escolaId: ac.escolaId, area: ac.area, titulo: ac.titulo ?? undefined, diaSemana: ac.diaSemana,
              horaInicio: ac.horaInicio, horaFim: ac.horaFim, local: ac.local ?? undefined,
              coordenadorId: ac.coordenadorId ?? undefined, observacoes: ac.observacoes ?? undefined,
              participantes: ac.participantes.map((p) => p.id),
            },
          }
        : { dados: vazio(escolaId) }
    );
  }

  const set = <K extends keyof DadosAC>(k: K, v: DadosAC[K]) =>
    setEditando((e) => (e ? { ...e, dados: { ...e.dados, [k]: v } } : e));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SeletorEscola valor={escolaId} aoMudar={setEscolaId} />
        <Button onClick={() => abrir()} disabled={!escolaId}>Nova AC</Button>
      </div>

      {!escolaId ? (
        <Panel><EmptyState icon="calendar" title="Escolha uma escola" description="Cadastre os horários de AC por área e quem participa." /></Panel>
      ) : q.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : q.isError ? (
        <Panel><EmptyState icon="warning" title="Não foi possível carregar as ACs" description={(q.error as Error).message} /></Panel>
      ) : (q.data ?? []).length === 0 ? (
        <Panel><EmptyState icon="calendar" title="Nenhuma AC cadastrada" action={<Button onClick={() => abrir()}>Cadastrar a primeira</Button>} /></Panel>
      ) : (
        <Panel title="ACs da escola" pad={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Coordenação</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data!.map((ac) => (
                  <TableRow key={ac.id} className={ac.ativo ? "" : "opacity-60"}>
                    <TableCell>
                      <div className="font-medium text-ink">{rotuloArea[ac.area] ?? ac.area}</div>
                      {ac.titulo && <div className="text-xs text-ink-muted">{ac.titulo}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rotuloDia[ac.diaSemana]} · {ac.horaInicio}–{ac.horaFim}
                      {ac.local && <div className="text-xs text-ink-muted">{ac.local}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{ac.coordenador?.nome ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {ac.participantes.length === 0 ? "—" : ac.participantes.map((p) => p.nome).join(", ")}
                    </TableCell>
                    <TableCell>{ac.ativo ? <Badge variant="success">Ativa</Badge> : <Badge variant="neutral">Inativa</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => abrir(ac)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => alternar.mutate({ id: ac.id, ativo: !ac.ativo })}>
                        {ac.ativo ? "Desativar" : "Reativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando?.id ? "Editar AC" : "Nova AC"}</DialogTitle>
            <DialogDescription>
              O sistema recusa horário que bata com aula ou outra AC de quem participa, e só aceita profissionais lotados na escola.
            </DialogDescription>
          </DialogHeader>
          {editando && (
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                salvar.mutate({ id: editando.id, dados: editando.dados }, { onSuccess: () => setEditando(null) });
              }}
            >
              <div className="space-y-1.5">
                <Label>Área</Label>
                <Select value={editando.dados.area} onValueChange={(v) => set("area", v as DadosAC["area"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS_AC.map((a) => <SelectItem key={a.valor} value={a.valor}>{a.rotulo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-titulo">Título (opcional)</Label>
                <Input id="ac-titulo" value={editando.dados.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} maxLength={150} />
              </div>
              <div className="space-y-1.5">
                <Label>Dia</Label>
                <Select value={editando.dados.diaSemana} onValueChange={(v) => set("diaSemana", v as DadosAC["diaSemana"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIAS.map((d) => <SelectItem key={d.valor} value={d.valor}>{d.rotulo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ac-ini">Início</Label>
                  <Input id="ac-ini" type="time" value={editando.dados.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ac-fim">Fim</Label>
                  <Input id="ac-fim" type="time" value={editando.dados.horaFim} onChange={(e) => set("horaFim", e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-local">Local (opcional)</Label>
                <Input id="ac-local" value={editando.dados.local ?? ""} onChange={(e) => set("local", e.target.value)} maxLength={150} />
              </div>
              <div className="space-y-1.5">
                <Label>Coordenação (opcional)</Label>
                <Select
                  value={editando.dados.coordenadorId ?? SEM_COORDENADOR}
                  onValueChange={(v) => set("coordenadorId", v === SEM_COORDENADOR ? undefined : v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_COORDENADOR}>Sem coordenação</SelectItem>
                    {listaProf.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <fieldset className="sm:col-span-2 space-y-1.5">
                <legend className="text-sm font-medium text-ink">Participantes</legend>
                {profissionais.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : listaProf.length === 0 ? (
                  <p className="text-sm text-ink-muted">Nenhum profissional lotado nesta escola.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-md border border-hairline p-2">
                    {listaProf.map((p) => {
                      const marcado = editando.dados.participantes.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-sm py-1">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() =>
                              set("participantes", marcado
                                ? editando.dados.participantes.filter((x) => x !== p.id)
                                : [...editando.dados.participantes, p.id])
                            }
                          />
                          {p.nome}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="ac-obs">Observações (opcional)</Label>
                <Textarea id="ac-obs" value={editando.dados.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} maxLength={2000} />
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
                <Button type="submit" disabled={salvar.isPending}>{salvar.isPending ? "Salvando…" : "Salvar"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
