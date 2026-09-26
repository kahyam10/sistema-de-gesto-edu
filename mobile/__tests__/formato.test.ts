import {
  capitalizar, dataBR, dataHoraBR, horaBR, iniciais, dataBRparaISO, dataPorExtenso, diaDaSemana, hojeISO, lerNumero, listaDeNomes, media, nota, saudacao,
} from "../src/utils/formato";

describe("formato", () => {
  it("hojeISO usa o fuso da Bahia (UTC-3)", () => {
    // 01:30 UTC do dia 25 ainda é dia 24 na Bahia
    expect(hojeISO(new Date("2026-09-25T01:30:00Z"))).toBe("2026-09-24");
    expect(hojeISO(new Date("2026-09-25T03:00:00Z"))).toBe("2026-09-25");
  });

  it("dataBR não desloca o dia", () => {
    expect(dataBR("2026-09-24")).toBe("24/09/2026");
    expect(dataBR("2026-09-24T00:00:00.000Z")).toBe("24/09/2026");
  });

  it("nota formata com vírgula e trata vazio", () => {
    expect(nota(8.5)).toBe("8,5");
    expect(nota(null)).toBe("—");
  });

  it("datas por extenso e dia da semana não deslocam por fuso", () => {
    expect(diaDaSemana("2026-09-25")).toBe("Sexta-feira");
    expect(dataPorExtenso("2026-09-25")).toBe("Sex, 25 de setembro");
  });

  it("saudação usa a hora da Bahia", () => {
    expect(saudacao(new Date("2026-09-25T11:00:00Z"))).toBe("Bom dia"); // 08h
    expect(saudacao(new Date("2026-09-25T17:00:00Z"))).toBe("Boa tarde"); // 14h
    expect(saudacao(new Date("2026-09-25T23:00:00Z"))).toBe("Boa noite"); // 20h
  });

  it("lerNumero aceita vírgula, vazio e digitação parcial; recusa lixo", () => {
    expect(lerNumero("7,5")).toBe(7.5);
    expect(lerNumero("8,")).toBe(8);
    expect(lerNumero("  ")).toBeNull();
    expect(lerNumero("1,2,3")).toBeNaN();
  });

  it("dataBRparaISO valida o calendário", () => {
    expect(dataBRparaISO("25/09/2026")).toBe("2026-09-25");
    expect(dataBRparaISO("31/02/2026")).toBeNull();
    expect(dataBRparaISO("2026-09-25")).toBeNull();
  });

  it("utilitários de texto e média", () => {
    expect(media([7, null, 8])).toBe(7.5);
    expect(media([null])).toBeNull();
    expect(capitalizar("MATUTINO")).toBe("Matutino");
    expect(listaDeNomes(["Ana Clara Souza", "Pedro Souza"])).toBe("Ana e Pedro");
    expect(iniciais("João Miguel Ribeiro")).toBe("JR");
    expect(iniciais("Ana de Souza")).toBe("AS");
  });

  it("horaBR e dataHoraBR convertem para o horário da Bahia", () => {
    expect(horaBR("2026-09-25T13:05:00.000Z")).toBe("10:05");
    expect(dataHoraBR("2026-09-26T01:30:00.000Z")).toBe("25/09 às 22:30");
  });
});
