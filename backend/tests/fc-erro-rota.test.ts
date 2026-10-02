// Frente C — erros internos não vazam pelas rotas.
// Antes, ~220 blocos catch devolviam error.message com 400/500 para QUALQUER
// erro (inclusive "Invalid `prisma.x.findMany()` invocation in /app/dist/...").
// Agora: AppError/ZodError/new Error("negócio") como antes; o resto vai ao
// tratador global, que não expõe detalhes. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { responderErroRota, isErroNegocioSimples } from "../src/lib/erro-rota.js";
import { NotFoundError } from "../src/errors/index.js";
import { notaService } from "../src/services/index.js";

const SENHA = "senha-de-teste-forte-fc-1";
let app: FastifyInstance;
let token = "";
const auth = () => ({ authorization: `Bearer ${token}` });
const VAZAMENTO = /prisma|invocation|\/app\/|dist\/|node_modules|\.ts:\d|\.js:\d/i;

function replyFalso() {
  const r = { statusCode: 0, body: undefined as unknown };
  const reply = {
    status(c: number) { r.statusCode = c; return reply; },
    send(b: unknown) { r.body = b; return reply; },
  } as unknown as FastifyReply;
  return { reply, r };
}

describe("responderErroRota (unidade)", () => {
  it("erro de negócio simples (new Error) mantém mensagem e status", () => {
    const { reply, r } = replyFalso();
    responderErroRota(new Error("Matrícula X não pertence a esta turma"), reply);
    expect(r).toEqual({ statusCode: 400, body: { error: "Matrícula X não pertence a esta turma" } });
    const b = replyFalso();
    responderErroRota(new Error("Turma está lotada"), b.reply, 500);
    expect(b.r.statusCode).toBe(500);
  });

  it("AppError e ZodError seguem como antes", () => {
    const a = replyFalso();
    responderErroRota(new NotFoundError("NF_014"), a.reply);
    expect(a.r.statusCode).toBe(404);
    const zz = replyFalso();
    const zerr = z.object({ a: z.string() }).safeParse({});
    responderErroRota(zerr.success ? null : zerr.error, zz.reply);
    expect(zz.r.statusCode).toBe(400);
  });

  it("erros do Prisma, TypeError, subclasses e não-Error são relançados", () => {
    const known = new Prisma.PrismaClientKnownRequestError("Invalid `prisma.x.findMany()` invocation in /app/dist/x.js", {
      code: "P2002",
      clientVersion: "5",
    });
    const validation = new Prisma.PrismaClientValidationError("Invalid `prisma.frequencia.findMany()` invocation", {
      clientVersion: "5",
    });
    const unknown = new Prisma.PrismaClientUnknownRequestError("boom /app/dist", { clientVersion: "5" });
    class OutroErro extends Error {}
    for (const e of [known, validation, unknown, new TypeError("x is undefined"), new RangeError("r"), new OutroErro("o"), "texto", { message: "obj" }]) {
      const { reply, r } = replyFalso();
      expect(() => responderErroRota(e, reply)).toThrow();
      expect(r.statusCode).toBe(0);
    }
    expect(isErroNegocioSimples(new Error("a"))).toBe(true);
    expect(isErroNegocioSimples(known)).toBe(false);
  });
});

describe("rotas HTTP (integração)", () => {
  beforeAll(async () => {
    _resetarLimiteLogin();
    await prisma.user.create({
      data: { email: "semec-fc-erro@teste.local", nome: "SEMEC FC", role: "SEMEC", password: await bcrypt.hash(SENHA, 10) },
    });
    app = await buildApp();
    await app.ready();
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/mobile/login",
      payload: { email: "semec-fc-erro@teste.local", password: SENHA },
    });
    token = login.json().accessToken;
    expect(token).toBeTruthy();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it("erro do Prisma dentro de uma rota não expõe a mensagem interna", async () => {
    const err = new Prisma.PrismaClientValidationError(
      "Invalid `prisma.nota.findMany()` invocation in /app/dist/services/nota.service.js:42:7 → Argument skip must be >= 0",
      { clientVersion: "5" }
    );
    const spy = vi.spyOn(notaService, "findAll").mockRejectedValueOnce(err);
    const res = await app.inject({ method: "GET", url: "/api/notas", headers: auth() });
    expect(spy).toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).not.toMatch(VAZAMENTO);
    expect(res.json().error.code).toBe("DB_002");
  });

  it("erro inesperado (TypeError) vira 500 genérico", async () => {
    vi.spyOn(notaService, "findAll").mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'x') at /app/dist/a.js:1:2"));
    const res = await app.inject({ method: "GET", url: "/api/notas", headers: auth() });
    expect(res.statusCode).toBe(500);
    expect(res.body).not.toMatch(VAZAMENTO);
    expect(res.body).not.toContain("Cannot read properties");
  });

  it("P2025 do Prisma vira 404 sem detalhe", async () => {
    vi.spyOn(notaService, "findAll").mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("An operation failed because it depends on one or more records that were required but not found. /app/dist", {
        code: "P2025",
        clientVersion: "5",
      })
    );
    const res = await app.inject({ method: "GET", url: "/api/notas", headers: auth() });
    expect(res.statusCode).toBe(404);
    expect(res.body).not.toMatch(VAZAMENTO);
  });

  it("erro de negócio do service (new Error) continua chegando ao usuário", async () => {
    const payload = { nome: "Prof Duplicado FC", cpf: "00000001919", tipo: "PROFESSOR" };
    const a = await app.inject({ method: "POST", url: "/api/profissionais", headers: auth(), payload });
    expect(a.statusCode).toBe(201);
    const b = await app.inject({ method: "POST", url: "/api/profissionais", headers: auth(), payload });
    expect(b.statusCode).toBe(400);
    expect(b.json().error).toBe("Já existe um profissional cadastrado com este CPF");
  });
});
