// Cabeçalhos de segurança da API (@fastify/helmet) e CSP própria do Swagger.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

function conferirCabecalhosDaApi(h: Record<string, unknown>) {
  const csp = String(h["content-security-policy"]);
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'none'");
  expect(csp).toContain("form-action 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("no-referrer");
  expect(h["cross-origin-resource-policy"]).toBe("same-origin");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin");
  expect(h["x-powered-by"]).toBeUndefined();
}

describe("cabeçalhos de segurança", () => {
  it("rota pública (/health)", async () => {
    const r = await app.inject({ method: "GET", url: "/health" });
    expect(r.statusCode).toBe(200);
    conferirCabecalhosDaApi(r.headers);
  });

  it("respostas de erro do guard (401) e caminho inválido (400) também", async () => {
    conferirCabecalhosDaApi((await app.inject({ method: "GET", url: "/api/escolas" })).headers);
    conferirCabecalhosDaApi((await app.inject({ method: "GET", url: "/%61pi/escolas" })).headers);
    conferirCabecalhosDaApi((await app.inject({ method: "GET", url: "/nao-existe" })).headers);
  });

  it("HSTS fora de produção não é enviado (só atrás do HTTPS de produção)", async () => {
    const r = await app.inject({ method: "GET", url: "/health" });
    expect(r.headers["strict-transport-security"]).toBeUndefined();
  });

  it("CORS do dashboard continua funcionando (preflight + Content-Disposition exposto)", async () => {
    const r = await app.inject({
      method: "OPTIONS",
      url: "/api/escolas",
      headers: { origin: "http://localhost:3050", "access-control-request-method": "GET" },
    });
    expect(r.statusCode).toBe(204);
    expect(r.headers["access-control-allow-origin"]).toBe("http://localhost:3050");
    const g = await app.inject({ method: "GET", url: "/health", headers: { origin: "http://localhost:3050" } });
    expect(g.headers["access-control-expose-headers"]).toContain("Content-Disposition");
  });

  it("Swagger UI (fora de produção) carrega com CSP própria, sem a da API", async () => {
    const r = await app.inject({ method: "GET", url: "/docs" });
    expect(r.statusCode).toBe(200);
    const csp = String(r.headers["content-security-policy"]);
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("default-src 'none'");
    expect(csp).not.toContain("upgrade-insecure-requests");
    const json = await app.inject({ method: "GET", url: "/docs/json" });
    expect(json.statusCode).toBe(200);
  });
});
