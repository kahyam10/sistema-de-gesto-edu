// Frente I — piso de recuperação (nota mínima para recuperação) e frequência
// por disciplina nas telas: sem número fixo, sempre da configuração / API.
import { describe, it, expect } from "vitest";
import {
  erroNotaMinimaRecuperacao,
  formatarFrequenciaDisciplina,
  limitesDaConfiguracao,
  tomDaMedia,
} from "../src/lib/medias";
import type { ConfiguracaoAvaliacao } from "../src/lib/api";

describe("tomDaMedia com piso da configuração", () => {
  it("separa recuperação (abaixo) de reprovação direta (abaixo do piso)", () => {
    expect(tomDaMedia(6, 6, 4)).toBe("ok");
    expect(tomDaMedia(4, 6, 4)).toBe("abaixo"); // piso inclusivo
    expect(tomDaMedia(3.5, 6, 4)).toBe("reprovacao");
    // piso 3 (padrão): 3,5 é recuperação
    expect(tomDaMedia(3.5, 6, 3)).toBe("abaixo");
    expect(tomDaMedia(2.9, 6, 3)).toBe("reprovacao");
  });
  it("sem piso (configuração antiga) não inventa limite: só ok/abaixo", () => {
    expect(tomDaMedia(1, 6)).toBe("abaixo");
    expect(tomDaMedia(1, 6, null)).toBe("abaixo");
    expect(tomDaMedia(null, 6, 4)).toBe("neutro");
    expect(tomDaMedia(5, null, 4)).toBe("neutro");
  });
});

describe("limitesDaConfiguracao", () => {
  it("lê média mínima e piso; sem configuração = null", () => {
    const cfg = { mediaMinima: 7, notaMinimaRecuperacao: 4.5 } as ConfiguracaoAvaliacao;
    expect(limitesDaConfiguracao(cfg)).toEqual({ mediaMinima: 7, notaMinimaRecuperacao: 4.5 });
    expect(limitesDaConfiguracao(null)).toEqual({ mediaMinima: null, notaMinimaRecuperacao: null });
    // backend sem o campo
    expect(limitesDaConfiguracao({ mediaMinima: 6 } as ConfiguracaoAvaliacao).notaMinimaRecuperacao).toBeNull();
  });
});

describe("erroNotaMinimaRecuperacao (formulário)", () => {
  it("0 ≤ piso ≤ média mínima", () => {
    expect(erroNotaMinimaRecuperacao("3", "6")).toBeNull();
    expect(erroNotaMinimaRecuperacao("6", "6")).toBeNull();
    expect(erroNotaMinimaRecuperacao("0", "6")).toBeNull();
    expect(erroNotaMinimaRecuperacao("6.5", "6")).toMatch(/maior que a média mínima/);
    expect(erroNotaMinimaRecuperacao("-1", "6")).toMatch(/entre 0 e 10/);
    expect(erroNotaMinimaRecuperacao("", "6")).toMatch(/Informe/);
  });
});

describe("formatarFrequenciaDisciplina", () => {
  it("percentual da disciplina; travessão sem aula registrada", () => {
    expect(formatarFrequenciaDisciplina({ percentualPresenca: 75, totalAulas: 4 })).toBe("75%");
    expect(formatarFrequenciaDisciplina(null)).toBe("—");
    expect(formatarFrequenciaDisciplina(undefined)).toBe("—");
    expect(formatarFrequenciaDisciplina({ percentualPresenca: 0, totalAulas: 0 })).toBe("—");
  });
});
