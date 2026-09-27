import { describe, it, expect } from "vitest";
import { diasAte, hojeNaRede, idadeEm } from "../src/lib/utils";

describe("hojeNaRede", () => {
  it("usa o fuso da Bahia, não UTC", () => {
    // 26/09 às 22h na Bahia = 27/09 01h em UTC
    expect(hojeNaRede(new Date("2026-09-27T01:00:00Z"))).toBe("2026-09-26");
    expect(hojeNaRede(new Date("2026-09-27T03:00:00Z"))).toBe("2026-09-27");
  });
});

describe("datas puras (nascimento, vencimento)", () => {
  it("idade conta o aniversário no próprio dia, sem deslocar pelo fuso", () => {
    expect(idadeEm("2018-09-27T00:00:00.000Z", "2026-09-27")).toBe(8);
    expect(idadeEm("2018-09-28", "2026-09-27")).toBe(7);
    expect(idadeEm("2018-02-28", "2026-03-01")).toBe(8);
  });

  it("dias até uma data: 0 no próprio dia, negativo depois", () => {
    expect(diasAte("2026-09-27T00:00:00.000Z", "2026-09-27")).toBe(0);
    expect(diasAte("2026-09-26", "2026-09-27")).toBe(-1);
    expect(diasAte("2026-10-27", "2026-09-27")).toBe(30);
  });
});
