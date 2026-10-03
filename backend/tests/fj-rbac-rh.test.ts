// Frente J: exportações oficiais, licenças e ponto só para ADMIN, SEMEC e
// COORDENADOR (decisão do usuário). DIRETOR e SECRETARIA perdem leitura e
// escrita; PROFESSOR e papéis externos continuam sem acesso. Teste puro da
// tabela de autorização (lib/rbac.ts) — o escopo por escola está no teste HTTP.
import { describe, it, expect } from "vitest";
import { autorizar, RH_EXPORTACAO } from "../src/lib/rbac.js";

const u = (role: string) => ({ id: "u1", role });

const LEITURAS = [
  "/api/licencas",
  "/api/licencas/l1",
  "/api/licencas/status/ativas",
  "/api/licencas/relatorio/p1",
  "/api/pontos",
  "/api/pontos/p1",
  "/api/pontos/relatorio/p1/3/2026",
  "/api/exportacao/educacenso",
  "/api/exportacao/sistema-presenca",
];
const ESCRITAS: Array<[string, string]> = [
  ["POST", "/api/licencas"],
  ["PUT", "/api/licencas/l1"],
  ["POST", "/api/licencas/l1/aprovar"],
  ["POST", "/api/licencas/l1/cancelar"],
  ["POST", "/api/pontos"],
  ["POST", "/api/pontos/registrar"],
  ["PUT", "/api/pontos/p1"],
  ["POST", "/api/exportacao/educacenso"],
];

describe("RH e exportações: só ADMIN, SEMEC e COORDENADOR", () => {
  it("a lista é exatamente a decidida pelo usuário", () => {
    expect([...RH_EXPORTACAO].sort()).toEqual(["ADMIN", "COORDENADOR", "SEMEC"]);
  });

  it.each(["ADMIN", "SEMEC", "COORDENADOR"])("%s lê e escreve", (role) => {
    for (const url of LEITURAS) expect(autorizar(url, "GET", u(role)), url).toBe("OK");
    for (const [m, url] of ESCRITAS) expect(autorizar(url, m, u(role)), `${m} ${url}`).toBe("OK");
  });

  it.each(["DIRETOR", "SECRETARIA", "PROFESSOR", "RESPONSAVEL", "USER", "PAPEL_INVENTADO"])(
    "%s não lê nem escreve",
    (role) => {
      for (const url of LEITURAS) expect(autorizar(url, "GET", u(role)), url).toBe("NEGADO");
      for (const [m, url] of ESCRITAS) expect(autorizar(url, m, u(role)), `${m} ${url}`).toBe("NEGADO");
    }
  );

  it("excluir licença/ponto continua só da gestão da rede (coordenador não apaga)", () => {
    for (const url of ["/api/licencas/l1", "/api/pontos/p1"]) {
      expect(autorizar(url, "DELETE", u("ADMIN"))).toBe("OK");
      expect(autorizar(url, "DELETE", u("SEMEC"))).toBe("OK");
      expect(autorizar(url, "DELETE", u("COORDENADOR"))).toBe("NEGADO");
      expect(autorizar(url, "DELETE", u("DIRETOR"))).toBe("NEGADO");
    }
  });

  it("não afeta o restante do RH: lotação segue com a equipe operacional", () => {
    expect(autorizar("/api/lotacao", "GET", u("DIRETOR"))).toBe("OK");
    expect(autorizar("/api/lotacao", "GET", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/atividades-complementares", "GET", u("DIRETOR"))).toBe("OK");
  });

  it("prefixo parecido não herda a regra", () => {
    // "/api/pontosx" não é o recurso de ponto: cai na negação padrão (não classificado)
    expect(autorizar("/api/pontosx", "GET", u("COORDENADOR"))).toBe("NEGADO");
  });
});
