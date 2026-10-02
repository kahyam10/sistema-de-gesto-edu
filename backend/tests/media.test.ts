import { describe, it, expect } from "vitest";
import { mediaDasAvaliacoes, mediaDosBimestres, mediaPonderada, notaNaEscala, notasParaMedia } from "../src/lib/media.js";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

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

  it("soma de pesos 0 cai na média simples (não fica null para sempre); peso negativo conta 0", () => {
    expect(mediaPonderada([{ valor: 8, valorMaximo: 10, peso: 0 }, { valor: 2, valorMaximo: 5, peso: 0 }])).toBe(6);
    expect(mediaPonderada([{ valor: 8, valorMaximo: 10, peso: 1 }, { valor: 0, valorMaximo: 10, peso: -1 }])).toBe(8);
  });
});

describe("avaliação sem nota", () => {
  const hoje = d("2026-10-02");
  const avs = [
    { data: d("2026-09-01"), peso: 2, valorMaximo: 10, nota: 9 },
    { data: d("2026-10-02"), peso: 1, valorMaximo: 10, nota: null }, // hoje: já realizada → 0
    { data: d("2026-10-03"), peso: 5, valorMaximo: 10, nota: null }, // futura → fora
  ];

  it("realizada (data <= hoje na rede) sem nota conta 0; futura sem nota não entra", () => {
    expect(notasParaMedia(avs, hoje)).toEqual([
      { valor: 9, valorMaximo: 10, peso: 2 },
      { valor: 0, valorMaximo: 10, peso: 1 },
    ]);
    expect(mediaDasAvaliacoes(avs, hoje)).toBe(6); // (9*2 + 0*1) / 3
  });

  it("avaliação gravada com horário conta pelo dia (UTC), não pelo instante", () => {
    expect(notasParaMedia([{ data: new Date("2026-10-02T15:00:00Z"), peso: 1, valorMaximo: 10, nota: null }], hoje)).toHaveLength(1);
  });

  it("futura com nota já lançada entra; só futuras sem nota → sem média", () => {
    expect(mediaDasAvaliacoes([{ data: d("2026-12-01"), peso: 1, valorMaximo: 10, nota: 7 }], hoje)).toBe(7);
    expect(mediaDasAvaliacoes([{ data: d("2026-12-01"), peso: 1, valorMaximo: 10, nota: null }], hoje)).toBeNull();
  });

  it("média final = média simples dos bimestres com média", () => {
    expect(mediaDosBimestres([5, null, 7, null])).toBe(6);
    expect(mediaDosBimestres([null, null])).toBeNull();
  });
});
