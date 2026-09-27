import { describe, it, expect } from "vitest";
import { hojeNaRede, hojeNaRedeISO } from "../src/lib/datas.js";

describe("hoje na rede (Bahia)", () => {
  it("depois das 21h locais ainda é o mesmo dia", () => {
    // 27/09 às 22h na Bahia = 28/09 01h UTC
    expect(hojeNaRedeISO(new Date("2026-09-28T01:00:00Z"))).toBe("2026-09-27");
    expect(hojeNaRede(new Date("2026-09-28T01:00:00Z")).toISOString()).toBe("2026-09-27T00:00:00.000Z");
    expect(hojeNaRedeISO(new Date("2026-09-28T03:00:00Z"))).toBe("2026-09-28");
  });
});
