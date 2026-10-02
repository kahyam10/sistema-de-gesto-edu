// Guard global x URL codificada: a autorização precisa usar o MESMO caminho que
// o roteador escolheu. Antes, "/%61pi/escolas" devolvia 200 sem login e
// "/api/%61uditoria" fugia do RBAC. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import net from "node:net";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { reconstruirCaminho, resolverCaminho } from "../src/lib/caminho-canonico.js";

const SENHA = "senha-de-teste-forte-fa-1";
let app: FastifyInstance;
const auth: Record<string, { authorization: string }> = {};

async function criarELogar(email: string, role: string) {
  await prisma.user.create({
    data: { email, nome: "Usuário Fictício FA", role, password: await bcrypt.hash(SENHA, 10) },
  });
  const r = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
  expect(r.statusCode).toBe(200);
  return { authorization: `Bearer ${r.json().accessToken}` };
}

const get = (url: string, headers?: Record<string, string>) => app.inject({ method: "GET", url, headers });

beforeAll(async () => {
  await _resetarLimiteLogin();
  await prisma.sessaoRefresh.deleteMany();
  await prisma.auditLog.deleteMany();
  // Só os usuários deste arquivo: outros arquivos deixam dados que referenciam os deles
  await prisma.user.deleteMany({ where: { email: { startsWith: "fa-" } } });
  app = await buildApp();
  await app.ready();
  auth.SEMEC = await criarELogar("fa-semec@teste.local", "SEMEC");
  auth.PROFESSOR = await criarELogar("fa-prof@teste.local", "PROFESSOR");
});

afterAll(async () => {
  await app.close();
});

// Variantes que o roteador decodifica/normaliza para rotas protegidas
const VARIANTES = [
  "/%61pi/escolas",
  "/%61pi/auditoria",
  "/api/%65scolas",
  "/api/esc%6Flas", // hex maiúsculo
  "/api/esc%6flas", // hex minúsculo
  "/api/%61uditoria",
  "/api/%41uditoria", // "A" maiúsculo: rota inexistente, mas continua recusado
  "/%2561pi/escolas", // dupla codificação
  "/api/escolas%2F",
  "//api/escolas",
  "//api/auditoria",
  "/api//auditoria",
  "/api/%6Eotas",
];

describe("caminho canônico — unidade", () => {
  it("remonta parâmetros e curinga", () => {
    expect(reconstruirCaminho("/api/escolas/:id/salas/:salaId", { id: "a", salaId: "b" })).toBe("/api/escolas/a/salas/b");
    expect(reconstruirCaminho("/docs/static/*", { "*": "x/y.js" })).toBe("/docs/static/x/y.js");
    // valor de parâmetro com "/" (veio de %2F) não é remontável
    expect(reconstruirCaminho("/api/escolas/:id", { id: "a/b" })).toBeNull();
    // padrões que não sabemos remontar → null (fail-closed)
    expect(reconstruirCaminho("/api/x/:id(^\\d+)", { id: "1" })).toBeNull();
  });

  it("recusa cru diferente do remontado e caracteres ambíguos", () => {
    expect(resolverCaminho("/%61pi/escolas", "/api/escolas", {})).toEqual({ ok: false });
    expect(resolverCaminho("/api/escolas#", "/api/escolas", {})).toEqual({ ok: false });
    expect(resolverCaminho("/api/escolas?x=%61", "/api/escolas", {})).toEqual({ ok: true, caminho: "/api/escolas", rotaEncontrada: true });
    expect(resolverCaminho("/api/escolas/", "/api/escolas", {})).toEqual({ ok: true, caminho: "/api/escolas", rotaEncontrada: true });
    expect(resolverCaminho("/api/nada", undefined, { "*": "api/nada" })).toEqual({ ok: true, caminho: "/api/nada", rotaEncontrada: false });
  });
});

describe("guard global — sem login", () => {
  it.each(VARIANTES)("%s → 400 (nunca 200)", async (url) => {
    const r = await get(url);
    expect(r.statusCode).toBe(400);
  });

  it("rotas normais seguem exigindo login (401)", async () => {
    expect((await get("/api/escolas")).statusCode).toBe(401);
    expect((await get("/api/escolas/")).statusCode).toBe(401);
    expect((await get("/api/auditoria")).statusCode).toBe(401);
    // caminho sem rota sob /api continua exigindo login
    expect((await get("/api/nao-existe")).statusCode).toBe(401);
  });

  it("rota pública reconhecida pelo padrão; variante codificada dela não", async () => {
    const r = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "x@teste.local" } });
    expect(r.statusCode).toBe(400); // validação do corpo, não 401
    const cod = await app.inject({ method: "POST", url: "/api/auth/%6Cogin", payload: { email: "x@teste.local" } });
    expect(cod.statusCode).toBe(400);
    expect(cod.json().code).toBe("CAMINHO_INVALIDO");
  });

  it("/health continua público", async () => {
    expect((await get("/health")).statusCode).toBe(200);
  });
});

describe("guard global — com login", () => {
  it("SEMEC: rotas normais 200; variantes codificadas 400", async () => {
    expect((await get("/api/escolas", auth.SEMEC)).statusCode).toBe(200);
    expect((await get("/api/escolas/", auth.SEMEC)).statusCode).toBe(200);
    expect((await get("/api/auditoria", auth.SEMEC)).statusCode).toBe(200);
    expect((await get("/api/escolas?busca=%61", auth.SEMEC)).statusCode).toBe(200);
    for (const url of VARIANTES) {
      expect((await get(url, auth.SEMEC)).statusCode, url).toBe(400);
    }
    expect([403, 404]).toContain((await get("/api/nao-existe", auth.SEMEC)).statusCode);
  });

  it("PROFESSOR: auditoria 403 e nenhuma variante foge do RBAC", async () => {
    expect((await get("/api/auditoria", auth.PROFESSOR)).statusCode).toBe(403);
    expect((await get("/api/auditoria/", auth.PROFESSOR)).statusCode).toBe(403);
    for (const url of VARIANTES) {
      const r = await get(url, auth.PROFESSOR);
      expect(r.statusCode, url).not.toBe(200);
      expect(r.statusCode, url).toBe(400);
    }
  });

  it("PROFESSOR: escrita em recurso pedagógico codificado não pula a checagem de turma", async () => {
    const r = await app.inject({ method: "POST", url: "/api/%6Eotas", headers: auth.PROFESSOR, payload: {} });
    expect(r.statusCode).toBe(400);
    const normal = await app.inject({ method: "POST", url: "/api/notas", headers: auth.PROFESSOR, payload: {} });
    expect(normal.statusCode).not.toBe(200); // corpo inválido/sem turma
  });
});

// light-my-request descarta o "#..." antes de chegar ao Fastify: aqui vai
// pelo socket, exatamente como um cliente HTTP mandaria.
describe("guard global — HTTP real (fragmento e bytes crus)", () => {
  let porta = 0;
  let servidor: FastifyInstance;
  beforeAll(async () => {
    servidor = await buildApp();
    await servidor.listen({ port: 0, host: "127.0.0.1" });
    porta = (servidor.server.address() as net.AddressInfo).port;
  });
  afterAll(async () => {
    await servidor.close();
  });

  function cru(caminho: string, headers = ""): Promise<number> {
    return new Promise((resolve, reject) => {
      const s = net.connect(porta, "127.0.0.1", () => {
        s.write(`GET ${caminho} HTTP/1.1\r\nHost: localhost\r\n${headers}Connection: close\r\n\r\n`);
      });
      let dados = "";
      s.on("data", (d) => (dados += d.toString()));
      s.on("end", () => resolve(Number(dados.split(" ")[1])));
      s.on("error", reject);
    });
  }

  it.each(["/api/auditoria#", "/api/%61uditoria#", "/%61pi/escolas#x", "/api/escolas#", "/%61pi/auditoria"])(
    "%s sem login → nunca 200",
    async (caminho) => {
      const st = await cru(caminho);
      expect(st).not.toBe(200);
      expect([400, 401]).toContain(st);
    }
  );

  // o cliente de teste normaliza "." / ".." / "\\"; pelo socket chegam crus
  it.each(["/api/./auditoria", "/api/escolas/../auditoria", "/api\\auditoria", "/api/escolas/.", "/api/auditoria/.."])(
    "%s → 400 com e sem login",
    async (caminho) => {
      expect(await cru(caminho)).toBe(400);
      expect(await cru(caminho, `Authorization: ${auth.PROFESSOR.authorization}\r\n`)).toBe(400);
      expect(await cru(caminho, `Authorization: ${auth.SEMEC.authorization}\r\n`)).toBe(400);
    }
  );

  it("PROFESSOR com '#' ou codificação não lê auditoria", async () => {
    const h = `Authorization: ${auth.PROFESSOR.authorization}\r\n`;
    for (const c of ["/api/auditoria#", "/api/%61uditoria#", "/api/%61uditoria"]) {
      const st = await cru(c, h);
      expect(st, c).not.toBe(200);
    }
    expect(await cru("/api/escolas", `Authorization: ${auth.SEMEC.authorization}\r\n`)).toBe(200);
  });
});
