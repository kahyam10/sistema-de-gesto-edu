import { describe, it, expect } from "vitest";
import type { Boletim, ConfiguracaoAvaliacao } from "../src/lib/api";
import {
  alunoDoBoletim,
  comoSituacao,
  configuracaoVigente,
  formatarMedia,
  mediaDasMedias,
  tomDaMedia,
} from "../src/lib/medias";

const cfg = (p: Partial<ConfiguracaoAvaliacao>): ConfiguracaoAvaliacao => ({
  id: p.id ?? "c",
  anoLetivo: 2026,
  sistemaAvaliacao: "NOTA",
  numeroPeriodos: 4,
  mediaMinima: 6,
  percentualFrequenciaMinima: 75,
  recuperacaoParalela: true,
  recuperacaoFinal: true,
  createdAt: "",
  updatedAt: "",
  ...p,
});

const disc = (id: string, mediaFinal: number | null, situacao: string, medias: Array<number | null> = []) => ({
  disciplinaId: id,
  disciplinaNome: `Disciplina ${id}`,
  bimestres: medias.map((media, i) => ({ bimestre: i + 1, media, avaliacoes: [] })),
  mediaFinal,
  situacao,
});

const boletim = (disciplinas: Boletim["disciplinas"], situacaoGeral = "EM_CURSO"): Boletim => ({
  matricula: { id: "m1", numeroMatricula: "2026-0001", nomeAluno: "Aluno Fictício" },
  disciplinas,
  situacaoGeral,
});

describe("mediaDasMedias", () => {
  it("null/undefined ficam de fora (não viram 0) e nunca dá NaN", () => {
    expect(mediaDasMedias([8, null, 6, undefined])).toBe(7);
    expect(mediaDasMedias([null, undefined])).toBeNull();
    expect(mediaDasMedias([])).toBeNull();
    expect(mediaDasMedias([7, 8, 8])).toBe(7.67);
  });
});

describe("formatarMedia", () => {
  it("sem média mostra travessão, não 0", () => {
    expect(formatarMedia(null)).toBe("—");
    expect(formatarMedia(undefined)).toBe("—");
    expect(formatarMedia(Number.NaN)).toBe("—");
    expect(formatarMedia(0)).toBe("0.0");
    expect(formatarMedia(6.456, 2)).toBe("6.46");
  });
});

describe("tomDaMedia", () => {
  it("usa a média mínima da configuração, não 7 fixo", () => {
    expect(tomDaMedia(6.5, 6)).toBe("ok");
    expect(tomDaMedia(6.5, 7)).toBe("abaixo");
    expect(tomDaMedia(5.9, 6)).toBe("abaixo");
  });
  it("sem média ou sem configuração = neutro", () => {
    expect(tomDaMedia(null, 6)).toBe("neutro");
    expect(tomDaMedia(8, null)).toBe("neutro");
  });
});

describe("configuracaoVigente (mesma prioridade do backend)", () => {
  const rede = cfg({ id: "rede", mediaMinima: 5, escolaId: "", etapaId: "" });
  const escola = cfg({ id: "escola", mediaMinima: 5.5, escolaId: "e1" });
  const etapa = cfg({ id: "etapa", mediaMinima: 6, etapaId: "t1" });
  const ambos = cfg({ id: "ambos", mediaMinima: 7, escolaId: "e1", etapaId: "t1" });
  const outroAno = cfg({ id: "2025", anoLetivo: 2025, escolaId: "e1", etapaId: "t1" });
  const turma = { anoLetivo: 2026, escolaId: "e1", etapaId: "t1" };

  it("escola+etapa > etapa > escola > rede", () => {
    expect(configuracaoVigente([rede, escola, etapa, ambos], turma)?.id).toBe("ambos");
    expect(configuracaoVigente([rede, escola, etapa], turma)?.id).toBe("etapa");
    expect(configuracaoVigente([rede, escola], turma)?.id).toBe("escola");
    expect(configuracaoVigente([rede], turma)?.id).toBe("rede");
  });
  it("ignora outro ano letivo; sem nada = null (a tela não inventa limite)", () => {
    expect(configuracaoVigente([outroAno], turma)).toBeNull();
    expect(configuracaoVigente([], turma)).toBeNull();
  });
});

describe("alunoDoBoletim (conselho de classe)", () => {
  it("usa mediaFinal e situacaoGeral da API; disciplina sem média não conta como 0", () => {
    const b = boletim(
      [disc("a", 8, "APROVADO"), disc("b", null, "EM_CURSO"), disc("c", 4.5, "RECUPERACAO")],
      "EM_CURSO",
    );
    const a = alunoDoBoletim({ id: "m1", nomeAluno: "Aluno Fictício" }, b);
    // Antes: média simples das notas brutas e 0 para quem não tinha nota
    expect(a.mediaGeral).toBe(6.25);
    expect(a.situacao).toBe("EM_CURSO");
    expect(a.disciplinas.map((d) => d.media)).toEqual([8, null, 4.5]);
  });

  it("sem boletim: sem média e sem situação (nunca APROVADO por omissão)", () => {
    const a = alunoDoBoletim({ id: "m2", nomeAluno: "Outro Aluno" }, undefined);
    expect(a.mediaGeral).toBeNull();
    expect(a.situacao).toBeNull();
  });

  it("situação desconhecida vira EM_CURSO", () => {
    expect(comoSituacao("QUALQUER")).toBe("EM_CURSO");
    expect(comoSituacao(undefined)).toBe("EM_CURSO");
    expect(comoSituacao("REPROVADO")).toBe("REPROVADO");
  });
});
