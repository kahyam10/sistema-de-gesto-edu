"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { EmptyState, EmptyWidget } from "@/components/ui/empty-state";
import {
  usePortalMeusAlunos,
  useComunicadosPorUsuario,
  useMarcarComunicadoLido,
} from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { BoletimAluno } from "./BoletimAluno";
import { FrequenciaAluno } from "./FrequenciaAluno";

/** Portal do Aluno/Responsável — seleção de aluno, boletim, frequência e comunicados. */
export function PortalResponsavel() {
  const { user } = useAuth();
  const { data: alunos = [], isLoading } = usePortalMeusAlunos();
  const [selecionadoId, setSelecionadoId] = useState<string>("");

  const { data: comunicados = [] } = useComunicadosPorUsuario(user?.id);
  const marcarLido = useMarcarComunicadoLido();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <EmptyState
        icon="graduation"
        title="Nenhum aluno vinculado ao seu acesso"
        description="Procure a secretaria da escola para vincular o seu usuário à matrícula do(s) aluno(s) que você acompanha."
      />
    );
  }

  const atual =
    alunos.find((a) => a.matricula.id === selecionadoId) ?? alunos[0];
  const { matricula } = atual;

  return (
    <div className="space-y-6">
      {/* Seletor de aluno (quando há mais de um vínculo) */}
      {alunos.length > 1 && (
        <div className="max-w-sm space-y-2">
          <Label>Aluno</Label>
          <Select
            value={matricula.id}
            onValueChange={setSelecionadoId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o aluno" />
            </SelectTrigger>
            <SelectContent>
              {alunos.map((a) => (
                <SelectItem key={a.matricula.id} value={a.matricula.id}>
                  {a.matricula.nomeAluno} — {a.matricula.escola.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Card do aluno */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{matricula.nomeAluno}</CardTitle>
              <CardDescription>
                Matrícula {matricula.numeroMatricula} · Ano letivo {matricula.anoLetivo}
              </CardDescription>
            </div>
            <Badge variant={matricula.status === "ATIVA" ? "success" : "neutral"}>
              {matricula.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Escola
              </p>
              <p className="font-medium text-ink">{matricula.escola.nome}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Etapa
              </p>
              <p className="font-medium text-ink">{matricula.etapa.nome}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Turma
              </p>
              <p className="font-medium text-ink">
                {matricula.turma
                  ? `${matricula.turma.nome} · ${matricula.turma.serie.nome} · ${matricula.turma.turno}`
                  : "Aguardando enturmação"}
              </p>
            </div>
          </div>
          {atual.parentesco && (
            <p className="mt-3 text-[12px] text-ink-muted">
              Seu vínculo: {atual.parentesco}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Boletim */}
      <BoletimAluno matriculaId={matricula.id} />

      {/* Frequência */}
      <FrequenciaAluno matriculaId={matricula.id} />

      {/* Comunicados */}
      <Card>
        <CardHeader>
          <CardTitle>Comunicados</CardTitle>
          <CardDescription>Avisos da escola e da rede municipal</CardDescription>
        </CardHeader>
        <CardContent>
          {comunicados.length === 0 ? (
            <EmptyWidget icon="speaker" label="Nenhum comunicado para você no momento." />
          ) : (
            <div className="space-y-2">
              {comunicados.slice(0, 8).map((c) => {
                const recibo = c.destinatariosLeitura?.find(
                  (d) => d.userId === user?.id
                );
                const lido = !!recibo?.lido;
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-hairline px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">
                          {c.titulo}
                        </span>
                        {!lido && <Badge variant="info">Novo</Badge>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-muted">
                        {c.mensagem}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-soft">
                        {new Date(c.dataPublicacao).toLocaleDateString("pt-BR")} · {c.autorNome}
                      </p>
                    </div>
                    {!lido && user && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={marcarLido.isPending}
                        onClick={() =>
                          marcarLido.mutate({ id: c.id, userId: user.id })
                        }
                      >
                        Marcar como lido
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
