// Toda rota GET sob /api precisa estar CLASSIFICADA em lib/rbac.ts:
// pública (PUBLIC_API), restrita (LEITURA_RESTRITA, com a lista de papéis)
// ou liberada à equipe pedagógica (LEITURA_PEDAGOGICA). Rota nova sem
// classificação nasce negada aos papéis pedagógicos E quebra este teste.
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import type { FastifyInstance, RouteOptions } from "fastify";
import { buildApp } from "../src/app.js";
import { autorizar, classificarLeitura } from "../src/lib/rbac.js";

const rotas = vi.hoisted(() => [] as Array<{ method: string; url: string }>);

vi.mock("fastify", async (importOriginal) => {
  const mod = await importOriginal<typeof import("fastify")>();
  const original = mod.default as unknown as (...a: unknown[]) => FastifyInstance;
  const comRegistro = (...a: unknown[]) => {
    const inst = original(...a);
    inst.addHook("onRoute", (r: RouteOptions) => {
      const metodos = Array.isArray(r.method) ? r.method : [r.method];
      for (const m of metodos) rotas.push({ method: String(m), url: r.url });
    });
    return inst;
  };
  return { ...mod, default: comRegistro };
});


let app: FastifyInstance;
beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

// Caminho concreto de exemplo para um padrão de rota (":id" → "x1")
const exemplo = (url: string) => url.replace(/:[^/]+/g, "x1").replace(/\*$/, "x1");
const semBarraFinal = (s: string) => (s.length > 1 && s.endsWith("/") ? s.slice(0, -1) : s);

describe("classificação das rotas GET", () => {
  it("o app registrou as rotas (sanidade da coleta)", () => {
    const gets = rotas.filter((r) => r.method === "GET" && r.url.startsWith("/api/"));
    expect(gets.length).toBeGreaterThan(100);
  });

  it("toda rota GET sob /api está classificada (pública, restrita ou liberada)", () => {
    const gets = [...new Set(rotas.filter((r) => r.method === "GET" && r.url.startsWith("/api")).map((r) => semBarraFinal(r.url)))];
    const semClasse = gets.filter((url) => classificarLeitura(exemplo(url)) === null || classificarLeitura(url) === null);
    if (semClasse.length) console.log("ROTAS_SEM_CLASSE\n" + semClasse.sort().join("\n"));
    expect(semClasse).toEqual([]);
  });
});

describe("leitura nasce fechada para a equipe pedagógica", () => {
  const u = (role: string) => ({ id: "u1", role });

  it("GET não classificado é negado a todos os papéis pedagógicos", () => {
    for (const role of ["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR", "SECRETARIA", "PROFESSOR"]) {
      expect(autorizar("/api/rota-nova-sem-classificacao", "GET", u(role))).toBe("NEGADO");
      expect(autorizar("/api/escolas/e1/rota-nova", "GET", u(role))).toBe("NEGADO");
    }
  });

  it("rotas existentes continuam como antes (concreto e padrão do roteador)", () => {
    expect(autorizar("/api/turmas/t1", "GET", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/turmas/:id", "GET", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/comunicados/", "GET", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/licencas", "GET", u("PROFESSOR"))).toBe("NEGADO");
    // RH só ADMIN, SEMEC e COORDENADOR (decisão do usuário, frente J)
    expect(autorizar("/api/licencas", "GET", u("SECRETARIA"))).toBe("NEGADO");
    expect(autorizar("/api/licencas", "GET", u("COORDENADOR"))).toBe("OK");
  });

  it("responsável não lê as estatísticas gerais de comunicados", () => {
    expect(autorizar("/api/comunicados/relatorios/estatisticas", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
    expect(autorizar("/api/comunicados/c1", "GET", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/comunicados", "GET", u("RESPONSAVEL"))).toBe("OK");
  });
});
