import { describe, it, expect } from "vitest";
import { hojeNaRede } from "../src/lib/utils";

describe("hojeNaRede", () => {
  it("usa o fuso da Bahia, não UTC", () => {
    // 26/09 às 22h na Bahia = 27/09 01h em UTC
    expect(hojeNaRede(new Date("2026-09-27T01:00:00Z"))).toBe("2026-09-26");
    expect(hojeNaRede(new Date("2026-09-27T03:00:00Z"))).toBe("2026-09-27");
  });
});
