// Comunicados: professor só publica/edita nas escolas em que leciona (nunca
// "para a rede"), autor vem da sessão (fim do "SEMEC" falso), e RESPONSAVEL/
// USER só leem os comunicados publicados destinados a eles. Dados fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { contextoAcesso } from "../src/lib/contexto.js";
import { ComunicadoService } from "../src/services/comunicado.service.js";
import { cenarioDuasEscolas, entrar, itens } from "./fb-cenario.js";

let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
const ids: Record<string, string> = {};
const tokens = new Map<string, { authorization: string }>();
const req = async (email: string, method: string, url: string, payload?: unknown) => {
  if (!tokens.has(email)) tokens.set(email, await entrar(app, email));
  return app.inject({ method: method as "GET", url, headers: tokens.get(email)!, ...(payload ? { payload: payload as object } : {}) });
};
const service = new ComunicadoService();
const comoPapel = <T>(papel: string, fn: () => Promise<T>) => contextoAcesso.run({ cache: new Map(), papel }, fn);

const novo = (extra: Record<string, unknown> = {}) => ({
  titulo: "Aviso fictício", mensagem: "Texto", tipo: "AVISO", destinatarios: "PROFESSORES", autorNome: "SEMEC", ...extra,
});

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas("fb72");
  const ontem = new Date(Date.now() - 86400000);
  const amanha = new Date(Date.now() + 86400000);
  const com = async (chave: string, data: Record<string, unknown>) => {
    ids[chave] = (await prisma.comunicado.create({
      data: { mensagem: "x", tipo: "AVISO", autorNome: "Gestão", dataPublicacao: ontem, ...data } as never,
    })).id;
  };
  await com("redePais", { titulo: "Rede: aos pais", destinatarios: "PAIS" });
  await com("redeProf", { titulo: "Rede: aos professores", destinatarios: "PROFESSORES" });
  await com("aTodos", { titulo: "A: a todos", destinatarios: "TODOS", escolaId: c.escolaA.id });
  await com("aRascunho", { titulo: "A: agendado", destinatarios: "PAIS", escolaId: c.escolaA.id, dataPublicacao: amanha });
  await com("aInativo", { titulo: "A: inativo", destinatarios: "PAIS", escolaId: c.escolaA.id, ativo: false });
  await com("aTurmaA", { titulo: "A: turma 3A", destinatarios: "TURMA_ESPECIFICA", turmaId: c.turmaA.id, escolaId: c.escolaA.id });
  await com("aTurmaA2", { titulo: "A: turma 3C", destinatarios: "TURMA_ESPECIFICA", turmaId: c.turmaA2.id, escolaId: c.escolaA.id });
  await com("bPais", { titulo: "B: aos pais", destinatarios: "PAIS", escolaId: c.escolaB.id });
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const VISIVEIS_RESP_A = ["A: a todos", "A: turma 3A", "Rede: aos pais"];

describe("professor: publica só na própria escola, assina pela sessão", () => {
  it("sem escola (= para a rede toda) ou na escola B → 403, nada gravado", async () => {
    expect((await req(c.uProfA.email, "POST", "/api/comunicados", novo({ titulo: "Phishing rede" }))).statusCode).toBe(403);
    const naB = await req(c.uProfA.email, "POST", "/api/comunicados", novo({ titulo: "Phishing B", escolaId: c.escolaB.id }));
    expect([403, 404]).toContain(naB.statusCode);
    expect(await prisma.comunicado.count({ where: { titulo: { startsWith: "Phishing" } } })).toBe(0);
  });

  it("na escola A publica, mas o autor é ele (o 'SEMEC' do corpo é ignorado)", async () => {
    const r = await req(c.uProfA.email, "POST", "/api/comunicados", novo({ escolaId: c.escolaA.id, autorId: c.profB.id }));
    expect(r.statusCode).toBe(201);
    const salvo = await prisma.comunicado.findUniqueOrThrow({ where: { id: r.json().id } });
    expect(salvo.autorNome).toBe(c.profA.nome);
    expect(salvo.autorId).toBe(c.profA.id);
    ids.doProf = salvo.id;
  });

  it("não edita nem apaga comunicado da rede ou da escola B", async () => {
    for (const id of [ids.redePais, ids.bPais]) {
      expect((await req(c.uProfA.email, "PUT", `/api/comunicados/${id}`, { titulo: "Alterado" })).statusCode).toBeGreaterThanOrEqual(400);
      expect((await req(c.uProfA.email, "DELETE", `/api/comunicados/${id}`)).statusCode).toBeGreaterThanOrEqual(400);
    }
    expect(await prisma.comunicado.count({ where: { id: { in: [ids.redePais, ids.bPais] }, titulo: { not: "Alterado" } } })).toBe(2);
  });

  it("edita comunicado da própria escola", async () => {
    expect((await req(c.uProfA.email, "PUT", `/api/comunicados/${ids.doProf}`, { titulo: "Corrigido" })).statusCode).toBe(200);
  });
});

describe("autor: só a gestão da rede escolhe o nome", () => {
  it("secretaria não assina como SEMEC", async () => {
    const r = await req(c.uSecA.email, "POST", "/api/comunicados", novo({ escolaId: c.escolaA.id }));
    expect(r.statusCode).toBe(201);
    expect(r.json().autorNome).not.toBe("SEMEC");
  });
  it("com o usuário da sessão, o autor é o nome do usuário", async () => {
    const criado = await contextoAcesso.run(
      { cache: new Map(), papel: "SECRETARIA", escopo: { tipo: "ESCOLA", escolaId: c.escolaA.id } },
      () => service.create(novo({ escolaId: c.escolaA.id }), { id: c.uSecA.id, role: "SECRETARIA" })
    );
    expect(criado.autorNome).toBe(c.uSecA.nome);
  });
  it("ADMIN assina como o setor informado", async () => {
    const r = await req(c.uAdmin.email, "POST", "/api/comunicados", novo());
    expect(r.statusCode).toBe(201);
    expect(r.json().autorNome).toBe("SEMEC");
  });
});

describe("RESPONSAVEL/USER só leem o que é deles", () => {
  // Só os comunicados criados por este arquivo (outros arquivos da suíte criam os seus)
  const titulos = (lista: Array<{ id: string; titulo: string }>) => {
    const meus = new Set(Object.values(ids));
    return lista.filter((x) => meus.has(x.id)).map((x) => x.titulo).sort();
  };

  it("lista (service com o usuário da sessão): publicados, ativos, aos pais/todos/turma do filho, rede ou escola do filho", async () => {
    const u = { id: c.uRespA.id, role: "RESPONSAVEL" };
    const lista = await comoPapel("RESPONSAVEL", () => service.findAll({}, u));
    expect(titulos(lista)).toEqual(VISIVEIS_RESP_A);
    const pag = await comoPapel("RESPONSAVEL", () => service.findAllPaginated({}, { page: 1, limit: 50 }, u));
    expect(titulos(pag.data)).toEqual(VISIVEIS_RESP_A);
    expect(pag.pagination.total).toBeGreaterThanOrEqual(VISIVEIS_RESP_A.length);
  });

  it("detalhe fora do filtro = 404; dentro, só o próprio recibo de leitura", async () => {
    const u = { id: c.uRespA.id, role: "RESPONSAVEL" };
    for (const k of ["bPais", "redeProf", "aRascunho", "aInativo", "aTurmaA2"]) {
      await expect(comoPapel("RESPONSAVEL", () => service.findById(ids[k], u))).rejects.toMatchObject({ statusCode: 404 });
    }
    await prisma.comunicadoDestinatario.create({ data: { comunicadoId: ids.aTodos, userId: c.uRespA2.id, lido: true } });
    const visto = await comoPapel("RESPONSAVEL", () => service.findById(ids.aTodos, u));
    expect(visto.destinatariosLeitura).toEqual([]);
  });

  it("USER sem vínculo e chamada sem usuário identificado não veem nada", async () => {
    expect(await comoPapel("USER", () => service.findAll({}, { id: c.uSemVinculo.id, role: "USER" }))).toEqual([]);
    expect(await comoPapel("RESPONSAVEL", () => service.findAll({}))).toEqual([]);
    await expect(comoPapel("RESPONSAVEL", () => service.findById(ids.redePais))).rejects.toMatchObject({ statusCode: 404 });
  });

  it("pela API: nada fora do permitido, detalhe alheio 404, estatísticas 403", async () => {
    const lista = await req(c.uRespA.email, "GET", "/api/comunicados");
    expect(lista.statusCode).toBe(200);
    for (const t of titulos(itens(lista.json()))) expect(VISIVEIS_RESP_A).toContain(t);
    expect((await req(c.uRespA.email, "GET", `/api/comunicados/${ids.bPais}`)).statusCode).toBe(404);
    expect((await req(c.uRespA.email, "GET", `/api/comunicados/${ids.aRascunho}`)).statusCode).toBe(404);
    expect((await req(c.uRespA.email, "GET", "/api/comunicados/relatorios/estatisticas")).statusCode).toBe(403);
    const semVinculo = await req(c.uSemVinculo.email, "GET", "/api/comunicados");
    expect(itens(semVinculo.json())).toEqual([]);
  });

  it("lista pessoal (/usuario/:id) segue o mesmo filtro", async () => {
    const r = await req(c.uRespA.email, "GET", `/api/comunicados/usuario/${c.uRespA.id}`);
    expect(r.statusCode).toBe(200);
    expect(titulos(r.json())).toEqual(VISIVEIS_RESP_A);
  });
});
