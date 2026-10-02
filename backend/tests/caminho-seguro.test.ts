import { describe, it, expect } from "vitest";
import { caminhoSuspeito } from "../src/lib/caminho-seguro.js";

describe("caminhoSuspeito (bypass do guard por URL codificada)", () => {
  it("recusa variantes que o roteador decodifica ou normaliza", () => {
    for (const c of ["/%61pi/escolas", "/api/%65scolas", "/api/%2561uditoria", "/api/auditoria#",
      "//api/escolas", "/api//escolas", "/api/./escolas", "/api/../api/escolas", "/api\\escolas", "/api/escolas/."]) {
      expect(caminhoSuspeito(c), c).toBe(true);
    }
  });
  it("aceita os caminhos normais da API", () => {
    for (const c of ["/api/escolas", "/api/escolas/", "/api/escolas/clx1abc2/salas", "/api/auth/login", "/health"]) {
      expect(caminhoSuspeito(c), c).toBe(false);
    }
  });
});
