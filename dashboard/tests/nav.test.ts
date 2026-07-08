import { describe, it, expect } from "vitest";
import { filterNavForRole, NAV_SECTIONS } from "@/components/shell/nav";

describe("filterNavForRole", () => {
  it("ADMIN vê todas as seções, inclusive Projeto", () => {
    const sections = filterNavForRole("ADMIN");
    expect(sections.map((s) => s.label)).toContain("Projeto");
    const total = sections.reduce((acc, s) => acc + s.items.length, 0);
    const totalGeral = NAV_SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
    expect(total).toBe(totalGeral);
  });

  it("PROFESSOR não vê a seção Projeto nem RH", () => {
    const sections = filterNavForRole("PROFESSOR");
    expect(sections.map((s) => s.label)).not.toContain("Projeto");
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).not.toContain("/rh");
    expect(hrefs).toContain("/pedagogico");
    expect(hrefs).toContain("/");
  });

  it("papel desconhecido/undefined vê apenas itens 'all'", () => {
    const sections = filterNavForRole(undefined);
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/");
    expect(hrefs).not.toContain("/modulos");
  });

  it("remove seções que ficarem vazias", () => {
    const sections = filterNavForRole("USER");
    for (const s of sections) {
      expect(s.items.length).toBeGreaterThan(0);
    }
  });
});
