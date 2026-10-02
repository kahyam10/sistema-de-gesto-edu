// Frente H — Conselho de Classe e Recuperação pedem o boletim da TURMA numa
// requisição só (antes: uma por aluno, perto do rate limit). Dados fictícios.
import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notasApi, type Boletim, type Turma } from "@/lib/api";
import { useBoletinsDaTurma } from "@/hooks/useAvaliacaoTurma";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const boletim = (id: string, nomeAluno: string): Boletim => ({
  matricula: { id, nomeAluno, numeroMatricula: `N-${id}` },
  disciplinas: [],
  situacaoGeral: "EM_CURSO",
});

const turma = {
  id: "turma-fh",
  nome: "3A",
  anoLetivo: 2026,
  matriculas: Array.from({ length: 40 }, (_, i) => ({ id: `m${i}`, nomeAluno: `Aluno ${i}` })),
} as unknown as Turma;

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Provedor({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Provedor;
}

describe("useBoletinsDaTurma", () => {
  it("faz UMA requisição por turma (turmaId + anoLetivo), não uma por aluno", async () => {
    const porTurma = vi.spyOn(notasApi, "getBoletimTurma").mockResolvedValue({
      turma: { id: "turma-fh", nome: "3A", serie: "3º Ano", anoLetivo: 2026 },
      boletins: [boletim("m0", "Aluno 0"), boletim("m1", "Aluno 1")],
    });
    const individual = vi.spyOn(notasApi, "getBoletim");
    const { result } = renderHook(() => useBoletinsDaTurma(turma), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(porTurma).toHaveBeenCalledTimes(1);
    expect(porTurma).toHaveBeenCalledWith("turma-fh", 2026);
    expect(individual).not.toHaveBeenCalled();
    expect(result.current.porMatricula.get("m1")?.matricula.nomeAluno).toBe("Aluno 1");
    expect(result.current.porMatricula.has("m2")).toBe(false);
    expect(result.current.erros).toBe(0);
  });

  it("sem turma não pede nada; erro da requisição marca todos os alunos como sem boletim", async () => {
    const porTurma = vi.spyOn(notasApi, "getBoletimTurma").mockRejectedValue(new Error("falhou"));
    const vazio = renderHook(() => useBoletinsDaTurma(undefined), { wrapper: wrapper() });
    expect(vazio.result.current.isLoading).toBe(false);
    expect(porTurma).not.toHaveBeenCalled();

    const { result } = renderHook(() => useBoletinsDaTurma(turma), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.erros).toBe(40));
    expect(result.current.porMatricula.size).toBe(0);
  });
});
