import { describe, it, expect } from "vitest";
import { tomDaNota } from "../src/lib/medias";

describe("tomDaNota (cor da nota no lançamento)", () => {
  it("converte pela escala da avaliação antes de comparar", () => {
    // prova valendo 5: nota 4 = 8,0 → ok com média 6
    expect(tomDaNota(4, 5, 6, 3)).toBe("ok");
    // prova valendo 10: nota 4 → faixa de recuperação (entre 3 e 6)
    expect(tomDaNota(4, 10, 6, 3)).toBe("abaixo");
  });
  it("respeita o piso configurado", () => {
    expect(tomDaNota(3.5, 10, 6, 4)).toBe("reprovacao");
    expect(tomDaNota(3.5, 10, 6, 3)).toBe("abaixo");
  });
  it("sem configuração ou sem nota → neutro", () => {
    expect(tomDaNota(7, 10, null, null)).toBe("neutro");
    expect(tomDaNota(Number.NaN, 10, 6, 3)).toBe("neutro");
  });
});
