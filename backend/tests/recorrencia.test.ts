import { describe, it, expect } from "vitest";
import { expandir, ocorrencias } from "../src/lib/recorrencia.js";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const iso = (xs: Date[]) => xs.map((x) => x.toISOString().slice(0, 10));
const ev = (dataInicio: string, tipoRecorrencia: string | null, diaRecorrencia: string | null = null, dataFim: string | null = null) =>
  ({ dataInicio: d(dataInicio), dataFim: dataFim ? d(dataFim) : null, tipoRecorrencia, diaRecorrencia });

describe("recorrência do calendário", () => {
  it("semanal no dia informado, a partir da dataInicio e até o fim do ano letivo", () => {
    // 01/10/2026 é quinta; repete às segundas
    expect(iso(ocorrencias(ev("2026-10-01", "SEMANAL", "SEGUNDA"), d("2026-09-01"), d("2026-12-31"), d("2026-10-20"))))
      .toEqual(["2026-10-05", "2026-10-12", "2026-10-19"]);
  });

  it("semanal sem dia usa o dia da semana da dataInicio e respeita a janela", () => {
    expect(iso(ocorrencias(ev("2026-10-01", "SEMANAL"), d("2026-10-10"), d("2026-10-31"), null)))
      .toEqual(["2026-10-15", "2026-10-22", "2026-10-29"]);
  });

  it("mensal pula meses sem o dia (31)", () => {
    expect(iso(ocorrencias(ev("2026-08-31", "MENSAL"), d("2026-08-01"), d("2026-12-31"), null)))
      .toEqual(["2026-08-31", "2026-10-31", "2026-12-31"]);
  });

  it("anual mantém dia e mês; 29/02 só em ano bissexto", () => {
    expect(iso(ocorrencias(ev("2028-02-29", "ANUAL"), d("2028-01-01"), d("2032-12-31"), null)))
      .toEqual(["2028-02-29", "2032-02-29"]);
  });

  it("sem tipo: só a própria data", () => {
    expect(iso(ocorrencias(ev("2026-10-05", null), d("2026-10-01"), d("2026-10-31"), null))).toEqual(["2026-10-05"]);
  });

  it("expande com id composto, duração e referência ao evento base", () => {
    const base = { id: "ev1", titulo: "Formação", ...ev("2026-10-05", "SEMANAL", null, "2026-10-06") };
    const xs = expandir(base, d("2026-10-07"), d("2026-10-13"), null);
    // a ocorrência de 05–06/10 já terminou; entra a de 12–13/10
    expect(xs.map((x) => [x.id, x.dataInicio.toISOString().slice(0, 10), x.dataFim?.toISOString().slice(0, 10)]))
      .toEqual([["ev1@2026-10-12", "2026-10-12", "2026-10-13"]]);
    expect(xs[0].ocorrenciaDe.id).toBe("ev1");
    expect(xs[0].titulo).toBe("Formação");
  });
});

describe("recorrência: dataInicio é o início da repetição", () => {
  it("04/03 (quarta) + SEMANAL na SEGUNDA → 09/03, 16/03 (a própria 04/03 não é ocorrência)", () => {
    expect(iso(ocorrencias(ev("2026-03-04", "SEMANAL", "SEGUNDA"), d("2026-03-01"), d("2026-03-20"), null)))
      .toEqual(["2026-03-09", "2026-03-16"]);
  });

  it("MENSAL com dia já passado no mês da dataInicio começa no mês seguinte", () => {
    expect(iso(ocorrencias(ev("2026-03-20", "MENSAL", "10"), d("2026-03-01"), d("2026-05-31"), null)))
      .toEqual(["2026-04-10", "2026-05-10"]);
  });
});
