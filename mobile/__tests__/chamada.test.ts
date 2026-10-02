import { aulaPreSelecionada, horaAtualNaRede, minutosDoDia } from "../src/utils/chamada";

const aulas = [
  { gradeHorariaId: "port", horaInicio: "09:00", horaFim: "09:50" },
  { gradeHorariaId: "mat", horaInicio: "07:00", horaFim: "07:50" },
  { gradeHorariaId: "hist", horaInicio: "10:10", horaFim: "11:00" },
];

describe("chamada por aula", () => {
  it("minutosDoDia", () => {
    expect(minutosDoDia("07:30")).toBe(450);
  });

  it("hora atual usa o fuso da Bahia (UTC-3)", () => {
    expect(horaAtualNaRede(new Date("2026-03-02T10:05:00Z"))).toBe("07:05");
    expect(horaAtualNaRede(new Date("2026-03-03T01:30:00Z"))).toBe("22:30");
  });

  it("pré-seleciona a aula em andamento", () => {
    expect(aulaPreSelecionada(aulas, "07:20")).toBe("mat");
    expect(aulaPreSelecionada(aulas, "09:00")).toBe("port");
  });

  it("no intervalo ou antes da primeira, pega a próxima", () => {
    expect(aulaPreSelecionada(aulas, "06:30")).toBe("mat");
    expect(aulaPreSelecionada(aulas, "07:50")).toBe("port"); // 07:50 já terminou Matemática
    expect(aulaPreSelecionada(aulas, "10:00")).toBe("hist");
  });

  it("depois da última, fica com a última do dia", () => {
    expect(aulaPreSelecionada(aulas, "15:00")).toBe("hist");
  });

  it("sem aulas → null", () => {
    expect(aulaPreSelecionada([], "08:00")).toBeNull();
  });
});
