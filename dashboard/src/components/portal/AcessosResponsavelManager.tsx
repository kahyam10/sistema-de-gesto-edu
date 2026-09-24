"use client";

import { useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyWidget } from "@/components/ui/empty-state";
import {
  useMatriculas,
  useAcessosMatricula,
  useCriarAcessoMatricula,
  useRevogarAcessoMatricula,
} from "@/hooks/useApi";
import type { Matricula } from "@/lib/api";

const FORM_INICIAL = {
  email: "",
  nome: "",
  senha: "",
  tipoVinculo: "RESPONSAVEL" as "RESPONSAVEL" | "ALUNO",
  parentesco: "",
};

/** Gestão de acessos de responsáveis ao portal — busca de matrícula + CRUD de vínculos. */
export function AcessosResponsavelManager() {
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<Matricula | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  const { data: matriculas = [], isLoading: loadingMatriculas } = useMatriculas();
  const { data: acessos = [], isLoading: loadingAcessos } = useAcessosMatricula(
    selecionada?.id ?? ""
  );
  const criarAcesso = useCriarAcessoMatricula();
  const revogarAcesso = useRevogarAcessoMatricula();

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo.length < 2) return [];
    return matriculas
      .filter(
        (m) =>
          m.nomeAluno.toLowerCase().includes(termo) ||
          m.numeroMatricula.toLowerCase().includes(termo)
      )
      .slice(0, 8);
  }, [busca, matriculas]);

  const handleCriar = () => {
    if (!selecionada || !form.email.trim()) return;
    criarAcesso.mutate(
      {
        matriculaId: selecionada.id,
        data: {
          email: form.email.trim(),
          nome: form.nome.trim() || undefined,
          senha: form.senha || undefined,
          tipoVinculo: form.tipoVinculo,
          parentesco: form.parentesco.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setDialogAberto(false);
          setForm(FORM_INICIAL);
        },
      }
    );
  };

  const handleRevogar = (vinculoId: string) => {
    if (!selecionada) return;
    if (window.confirm("Tem certeza que deseja revogar este acesso?")) {
      revogarAcesso.mutate({ matriculaId: selecionada.id, vinculoId });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acessos de responsáveis</CardTitle>
        <CardDescription>
          Vincule contas de responsáveis (ou do próprio aluno maior de idade) ao portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca de matrícula */}
        <div className="max-w-md space-y-2">
          <Label>Buscar matrícula</Label>
          <Input
            placeholder="Nome do aluno ou número da matrícula..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {loadingMatriculas && busca.trim().length >= 2 && (
            <Skeleton className="h-16 w-full" />
          )}
          {resultados.length > 0 && (
            <div className="overflow-hidden rounded-md border border-hairline">
              {resultados.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelecionada(m);
                    setBusca("");
                  }}
                  className="flex w-full items-center justify-between gap-2 border-b border-hairline px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-surface-alt"
                >
                  <span className="font-medium text-ink">{m.nomeAluno}</span>
                  <span className="font-mono text-[11.5px] text-ink-muted">
                    {m.numeroMatricula}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matrícula selecionada + acessos */}
        {!selecionada ? (
          <EmptyWidget
            icon="search"
            label="Busque e selecione uma matrícula para gerir os acessos dos responsáveis."
          />
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline bg-surface-alt px-3 py-2.5">
              <div className="text-[13px]">
                <span className="font-semibold text-ink">{selecionada.nomeAluno}</span>
                <span className="ml-2 font-mono text-[11.5px] text-ink-muted">
                  {selecionada.numeroMatricula}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setDialogAberto(true)}>
                  Novo acesso
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelecionada(null)}>
                  Trocar aluno
                </Button>
              </div>
            </div>

            {loadingAcessos ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : acessos.length === 0 ? (
              <EmptyWidget
                icon="users"
                label="Nenhum acesso vinculado a esta matrícula ainda."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Parentesco</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acessos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.user.nome}</TableCell>
                      <TableCell>{a.user.email}</TableCell>
                      <TableCell>
                        <Badge variant={a.tipoVinculo === "ALUNO" ? "info" : "default"}>
                          {a.tipoVinculo}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.parentesco || "—"}</TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.ativo ? "success" : "neutral"}>
                          {a.ativo ? "Ativo" : "Suspenso"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={revogarAcesso.isPending}
                          onClick={() => handleRevogar(a.id)}
                        >
                          Revogar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog: novo acesso */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo acesso ao portal</DialogTitle>
            <DialogDescription>
              Acesso para <strong>{selecionada?.nomeAluno}</strong>. Se o e-mail já
              possuir conta, nome e senha são ignorados — apenas o vínculo é criado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="responsavel@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Senha (mín. 6)</Label>
                <Input
                  type="password"
                  placeholder="Senha inicial"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de vínculo</Label>
                <Select
                  value={form.tipoVinculo}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tipoVinculo: v as "RESPONSAVEL" | "ALUNO" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESPONSAVEL">Responsável</SelectItem>
                    <SelectItem value="ALUNO">Aluno (maior de idade)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Parentesco</Label>
                <Input
                  placeholder="Mãe, Pai, Tutor legal..."
                  value={form.parentesco}
                  onChange={(e) => setForm((f) => ({ ...f, parentesco: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriar}
              disabled={!form.email.trim() || criarAcesso.isPending}
            >
              Criar acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
