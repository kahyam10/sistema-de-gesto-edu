import { describe, it, expect } from "vitest";
import { urlSegura } from "../src/lib/utils";

describe("urlSegura (anexo de comunicado)", () => {
  it("aceita só https", () => {
    expect(urlSegura("https://exemplo.gov.br/anexo.pdf")).toBe("https://exemplo.gov.br/anexo.pdf");
    expect(urlSegura("  HTTPS://Exemplo.gov.br/a.pdf ")).toBe("https://exemplo.gov.br/a.pdf");
  });

  it("recusa http, javascript, data, relativa e lixo", () => {
    expect(urlSegura("http://exemplo.gov.br/a.pdf")).toBeNull();
    expect(urlSegura("javascript:alert(1)")).toBeNull();
    expect(urlSegura("JaVaScRiPt:alert(1)")).toBeNull();
    expect(urlSegura(" javascript:alert(1)")).toBeNull();
    expect(urlSegura("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(urlSegura("/anexos/a.pdf")).toBeNull();
    expect(urlSegura("//exemplo.gov.br/a.pdf")).toBeNull();
    expect(urlSegura("https://")).toBeNull();
    expect(urlSegura("")).toBeNull();
    expect(urlSegura(null)).toBeNull();
    expect(urlSegura(undefined)).toBeNull();
  });
});
