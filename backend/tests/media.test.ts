import { describe, it, expect } from "vitest";
import { mediaPonderada, notaNaEscala } from "../src/lib/media.js";

describe("média com valorMaximo", () => {
  it("converte a nota para a escala 0–10", () => {
    expect(notaNaEscala(4, 5)).toBe(8);
    expect(notaNaEscala(15, 20)).toBe(7.5);
    expect(notaNaEscala(7, 10)).toBe(7);
  });

  it("não mistura escalas: prova de 5 pontos + trabalho de 10", () => {
    // antes: (4*1 + 8*1)/2 = 6,0 — o 4 de 5 contava como 4 de 10
    expect(mediaPonderada([{ valor: 4, valorMaximo: 5, peso: 1 }, { valor: 8, valorMaximo: 10, peso: 1 }])).toBe(8);
  });

  it("respeita o peso e ignora lista vazia", () => {
    expect(mediaPonderada([{ valor: 10, valorMaximo: 10, peso: 2 }, { valor: 2.5, valorMaximo: 5, peso: 1 }])).toBe(8.33);
    expect(mediaPonderada([])).toBeNull();
  });
});
