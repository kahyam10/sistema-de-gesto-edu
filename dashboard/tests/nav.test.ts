import { describe, it, expect } from "vitest";
import { filterNavForRole, NAV_SECTIONS, podeAcessarRota } from "@/components/shell/nav";

describe("filterNavForRole", () => {
  it("ADMIN vê todas as seções, inclusive Projeto", () => {
    const sections = filterNavForRole("ADMIN");
    expect(sections.map((s) => s.label)).toContain("Projeto");
    const total = sections.reduce((acc, s) => acc + s.items.length, 0);
    const totalGeral = NAV_SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
    expect(total).toBe(totalGeral);
  });

  it("PROFESSOR não vê a seção Projeto, RH nem Exportações", () => {
    const sections = filterNavForRole("PROFESSOR");
    expect(sections.map((s) => s.label)).not.toContain("Projeto");
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).not.toContain("/rh");
    expect(hrefs).not.toContain("/exportacoes");
    expect(hrefs).toContain("/pedagogico");
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/portal");
    expect(hrefs).toContain("/gestao-democratica");
  });

  it("SECRETARIA vê RH (lotação/ACs), mas não Exportações (só ADMIN, SEMEC e COORDENADOR)", () => {
    const hrefs = filterNavForRole("SECRETARIA").flatMap((s) =>
      s.items.map((i) => i.href)
    );
    expect(hrefs).toContain("/rh");
    expect(hrefs).not.toContain("/exportacoes");
    expect(hrefs).toContain("/alimentacao");
    expect(hrefs).toContain("/transporte");
  });

  it("RESPONSAVEL vê apenas o próprio portal", () => {
    const sections = filterNavForRole("RESPONSAVEL");
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toEqual(["/portal"]);
    expect(sections.map((s) => s.label)).not.toContain("Projeto");
    expect(sections.map((s) => s.label)).not.toContain("Estrutura");
  });

  it("USER (sem função) vê apenas o próprio portal", () => {
    const hrefs = filterNavForRole("USER").flatMap((s) =>
      s.items.map((i) => i.href)
    );
    expect(hrefs).toEqual(["/portal"]);
  });

  it("papel desconhecido/undefined vê apenas itens 'all' (portal)", () => {
    const sections = filterNavForRole(undefined);
    const hrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toContain("/portal");
    expect(hrefs).not.toContain("/");
    expect(hrefs).not.toContain("/modulos");
  });

  it("remove seções que ficarem vazias", () => {
    for (const role of ["USER", "RESPONSAVEL", "PROFESSOR"]) {
      for (const s of filterNavForRole(role)) {
        expect(s.items.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("podeAcessarRota", () => {
  it("segue as mesmas regras do menu", () => {
    expect(podeAcessarRota("/planejamento", "SECRETARIA")).toBe(false);
    expect(podeAcessarRota("/planejamento", "PROFESSOR")).toBe(true);
    expect(podeAcessarRota("/rh", "PROFESSOR")).toBe(false);
    expect(podeAcessarRota("/cadastros/hierarquia", "DIRETOR")).toBe(false);
    expect(podeAcessarRota("/cadastros/escolas/abc", "PROFESSOR")).toBe(true);
    expect(podeAcessarRota("/pedagogico", "RESPONSAVEL")).toBe(false);
    expect(podeAcessarRota("/portal", "RESPONSAVEL")).toBe(true);
  });

  it("a raiz e rotas fora do menu ficam a cargo da página/API", () => {
    expect(podeAcessarRota("/", "RESPONSAVEL")).toBe(true);
    expect(podeAcessarRota("/questionario-turma/t1", "PROFESSOR")).toBe(true);
  });
});
