"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEscolas } from "@/hooks/useApi";

/** Escolha de escola. Com uma só (diretor/secretaria), já vem selecionada. */
export function SeletorEscola({ valor, aoMudar }: { valor: string; aoMudar: (id: string) => void }) {
  const { data: escolas = [], isLoading } = useEscolas();
  const lista = escolas as Array<{ id: string; nome: string }>;

  useEffect(() => {
    if (!valor && lista.length === 1) aoMudar(lista[0].id);
  }, [valor, lista, aoMudar]);

  return (
    <div className="space-y-1.5 min-w-[260px]">
      <Label htmlFor="seletor-escola">Escola</Label>
      <Select value={valor} onValueChange={aoMudar} disabled={isLoading}>
        <SelectTrigger id="seletor-escola">
          <SelectValue placeholder={isLoading ? "Carregando…" : "Selecione a escola"} />
        </SelectTrigger>
        <SelectContent>
          {lista.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
