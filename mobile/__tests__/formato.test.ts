import { dataBR, hojeISO, nota } from "../src/utils/formato";

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
});
