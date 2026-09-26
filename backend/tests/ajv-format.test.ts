import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { formatarErroAjv } from "../src/errors/ajv-format.js";
import bcrypt from "bcryptjs";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

// Erros do schema JSON das rotas no mesmo formato dos erros zod, em PT-BR

describe("formatarErroAjv", () => {
  it("campo obrigatório, tipo e enum em PT-BR", () => {
    const r = formatarErroAjv([
      { instancePath: "", keyword: "required", params: { missingProperty: "titulo" } },
      { instancePath: "/prioridade", keyword: "enum", params: { allowedValues: ["BAIXA", "ALTA"] } },
      { instancePath: "/itens/0/valor", keyword: "type", params: { type: "number" } },
    ], "body");
    expect(r.statusCode).toBe(400);
    expect(r.error).toBe("VALIDATION");
    expect(r.issues).toEqual([
      { campo: "titulo", mensagem: "Campo obrigatório" },
      { campo: "prioridade", mensagem: "Valor inválido. Use: BAIXA, ALTA" },
      { campo: "itens.0.valor", mensagem: "Deve ser número" },
    ]);
    expect(r.message).toBe("Dados inválidos em 3 campo(s) (corpo): titulo, prioridade, itens.0.valor");
  });

  it("um erro só vira mensagem direta", () => {
    const r = formatarErroAjv([{ instancePath: "/email", keyword: "format", params: { format: "email" } }]);
    expect(r.message).toBe("email: Formato inválido: use e-mail");
  });
});

describe("rota com schema devolve o formato padrão", () => {
  let app: FastifyInstance;
  let token = "";
  beforeAll(async () => {
    _resetarLimiteLogin();
    const password = await bcrypt.hash("senha-de-teste-forte-123", 10);
    await prisma.user.upsert({
      where: { email: "admin-ajv@teste.local" },
      update: {},
      create: { email: "admin-ajv@teste.local", nome: "Admin AJV", role: "ADMIN", password },
    });
    app = await buildApp();
    await app.ready();
    const login = await app.inject({
      method: "POST", url: "/api/auth/mobile/login",
      payload: { email: "admin-ajv@teste.local", password: "senha-de-teste-forte-123" },
    });
    token = login.json().accessToken;
  });
  afterAll(async () => { await app.close(); });

  it("POST /api/notificacoes sem campos → 400 VALIDATION com issues em PT-BR", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/notificacoes", headers: { authorization: `Bearer ${token}` }, payload: { titulo: "x" },
    });
    expect(res.statusCode).toBe(400);
    const b = res.json();
    expect(b.error).toBe("VALIDATION");
    expect(b.issues).toEqual(expect.arrayContaining([{ campo: "userId", mensagem: "Campo obrigatório" }]));
  });
});
