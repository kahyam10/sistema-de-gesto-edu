// Escopo de dados do PROFESSOR em models "de escola" (AEE, grêmio, colegiado,
// reunião de pais, plantão) e nos includes (rota de transporte, reunião de
// pais, atendimentos AEE). Professor da escola A não vê nem altera nada da B.
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { cenarioDuasEscolas, entrar, itens } from "./fb-cenario.js";

let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
const ids: Record<string, string> = {};
const tokens = new Map<string, { authorization: string }>();
const h = async (email: string) => {
  if (!tokens.has(email)) tokens.set(email, await entrar(app, email));
  return tokens.get(email)!;
};
const req = async (email: string, method: string, url: string, payload?: unknown) =>
  app.inject({ method: method as "GET", url, headers: await h(email), ...(payload ? { payload: payload as object } : {}) });

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas("fb71");
  const sala = (escolaId: string, nome: string) =>
    prisma.salaRecursos.create({ data: { escolaId, nome, tipo: "TIPO_I", turno: "MATUTINO" } });
  ids.salaA = (await sala(c.escolaA.id, "Sala AEE A")).id;
  ids.salaB = (await sala(c.escolaB.id, "Sala AEE B")).id;
  const pei = (matriculaId: string) =>
    prisma.planoEducacionalIndividualizado.create({ data: { matriculaId, anoLetivo: 2026, deficiencia: "Fictícia" } });
  const peiA = await pei(c.matA.id);
  const peiA2 = await pei(c.matA2.id);
  const peiB = await pei(c.matB.id);
  const atend = (peiId: string, salaRecursosId: string, observacoes: string) =>
    prisma.atendimentoAEE.create({ data: { peiId, salaRecursosId, data: new Date("2026-05-05"), observacoes } });
  await atend(peiA.id, ids.salaA, "obs A");
  await atend(peiA2.id, ids.salaA, "obs A2 (turma de outro professor)");
  await atend(peiB.id, ids.salaB, "obs B");

  for (const [k, escolaId] of [["A", c.escolaA.id], ["B", c.escolaB.id]] as const) {
    ids[`gremio${k}`] = (await prisma.gremioEstudantil.create({ data: { nome: `Grêmio ${k}`, anoLetivo: 2026, escolaId } })).id;
    ids[`colegiado${k}`] = (await prisma.colegiadoEscolar.create({
      data: { escolaId, dataInicioMandato: new Date("2026-01-01"), dataFimMandato: new Date("2027-12-31") },
    })).id;
    ids[`reuniao${k}`] = (await prisma.reuniaoPais.create({
      data: {
        escolaId, titulo: `Reunião ${k}`, data: new Date("2026-11-10"), horario: "19:00", tipo: "BIMESTRAL",
        // a reunião da A é da turma 3C, em que o professor A NÃO leciona
        turmaId: k === "A" ? c.turmaA2.id : c.turmaB.id,
      },
    })).id;
    ids[`plantao${k}`] = (await prisma.plantaoPedagogico.create({
      data: { escolaId, data: new Date("2026-11-12"), tipo: "COLETIVO", horarioInicio: "14:00", horarioFim: "17:00" },
    })).id;
  }
  await prisma.presencaReuniao.create({
    data: { reuniaoId: ids.reuniaoA, matriculaId: c.matA2.id, nomeResponsavel: "Responsável A2", presente: true },
  });

  const rota = await prisma.rotaTransporte.create({
    data: { nome: "Rota fictícia", codigo: "FB71-R1", turno: "MATUTINO", itinerario: "Centro → Zona rural" },
  });
  ids.rota = rota.id;
  await prisma.rotaAluno.createMany({
    data: [c.matA, c.matA2, c.matB].map((m) => ({ rotaId: rota.id, matriculaId: m.id, pontoEmbarque: "Ponto fictício" })),
  });

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("AEE: professor só enxerga a sala da escola e os alunos das suas turmas", () => {
  it("lista de salas de recursos traz só a da escola A", async () => {
    const r = await req(c.uProfA.email, "GET", "/api/aee/salas-recursos");
    expect(r.statusCode).toBe(200);
    expect(itens<{ id: string }>(r.json()).map((s) => s.id)).toEqual([ids.salaA]);
  });

  it("sala e atendimentos da escola B não aparecem", async () => {
    expect((await req(c.uProfA.email, "GET", `/api/aee/salas-recursos/${ids.salaB}`)).statusCode).toBe(404);
    const at = await req(c.uProfA.email, "GET", `/api/aee/atendimentos/sala/${ids.salaB}`);
    expect(at.statusCode).toBe(200);
    expect(at.json()).toEqual([]);
  });

  it("na sala da A, o professor vê só o atendimento do aluno da sua turma; a secretaria vê todos", async () => {
    const prof = (await req(c.uProfA.email, "GET", `/api/aee/salas-recursos/${ids.salaA}`)).json();
    expect(prof.atendimentos.map((a: { observacoes: string }) => a.observacoes)).toEqual(["obs A"]);
    const porSala = (await req(c.uProfA.email, "GET", `/api/aee/atendimentos/sala/${ids.salaA}`)).json();
    expect(porSala.map((a: { observacoes: string }) => a.observacoes)).toEqual(["obs A"]);
    const sec = (await req(c.uSecA.email, "GET", `/api/aee/salas-recursos/${ids.salaA}`)).json();
    expect(sec.atendimentos).toHaveLength(2);
  });
});

describe("gestão democrática e eventos: só a escola A, leitura e escrita", () => {
  const recursos = [
    ["gremios", "gremio"],
    ["colegiados", "colegiado"],
    ["reunioes-pais", "reuniao"],
    ["plantoes-pedagogicos", "plantao"],
  ] as const;

  it.each(recursos)("GET /api/%s lista só a escola A", async (rota, chave) => {
    const r = await req(c.uProfA.email, "GET", `/api/${rota}`);
    expect(r.statusCode).toBe(200);
    expect(itens<{ id: string }>(r.json()).map((x) => x.id)).toEqual([ids[`${chave}A`]]);
    expect((await req(c.uProfA.email, "GET", `/api/${rota}/${ids[`${chave}B`]}`)).statusCode).toBe(404);
  });

  it.each(recursos)("PUT/DELETE em /api/%s da escola B são recusados e nada muda", async (rota, chave) => {
    const id = ids[`${chave}B`];
    const put = await req(c.uProfA.email, "PUT", `/api/${rota}/${id}`, { nome: "Invasão", titulo: "Invasão", observacoes: "Invasão" });
    expect(put.statusCode).toBeGreaterThanOrEqual(400);
    const del = await req(c.uProfA.email, "DELETE", `/api/${rota}/${id}`);
    expect(del.statusCode).toBeGreaterThanOrEqual(400);
    // ainda existe e não foi alterado
    const admin = await req(c.uAdmin.email, "GET", `/api/${rota}/${id}`);
    expect(admin.statusCode).toBe(200);
    expect(JSON.stringify(admin.json())).not.toContain("Invasão");
  });

  it("não cria grêmio na escola B; na própria escola continua podendo", async () => {
    const naB = await req(c.uProfA.email, "POST", "/api/gremios", { nome: "Grêmio invasor", escolaId: c.escolaB.id, anoLetivo: 2027 });
    expect([403, 404]).toContain(naB.statusCode); // escola B nem é "vista" pelo professor A
    expect(await prisma.gremioEstudantil.count({ where: { nome: "Grêmio invasor" } })).toBe(0);
    const naA = await req(c.uProfA.email, "POST", "/api/gremios", { nome: "Grêmio 2027", escolaId: c.escolaA.id, anoLetivo: 2027 });
    expect(naA.statusCode).toBe(201);
  });

  it("detalhe da reunião da A não lista alunos de turma em que o professor não leciona", async () => {
    const prof = (await req(c.uProfA.email, "GET", `/api/reunioes-pais/${ids.reuniaoA}`)).json();
    expect(prof.turma.matriculas).toEqual([]);
    expect(prof.presencas).toEqual([]);
    const sec = (await req(c.uSecA.email, "GET", `/api/reunioes-pais/${ids.reuniaoA}`)).json();
    expect(sec.turma.matriculas.map((m: { id: string }) => m.id)).toEqual([c.matA2.id]);
    expect(sec.presencas).toHaveLength(1);
  });
});

describe("profissionais: professor vê a si e aos colegas das escolas em que leciona", () => {
  it("lista não traz o professor que só atua na escola B", async () => {
    const r = await req(c.uProfA.email, "GET", "/api/profissionais");
    expect(r.statusCode).toBe(200);
    const vistos = itens<{ id: string }>(r.json()).map((p) => p.id);
    expect(vistos).toContain(c.profA.id);
    expect(vistos).not.toContain(c.profB.id);
    expect((await req(c.uProfA.email, "GET", `/api/profissionais/${c.profB.id}`)).statusCode).toBe(404);
  });
});

describe("rota de transporte (da rede): alunos incluídos seguem o escopo", () => {
  const alunosDa = async (email: string) => {
    const r = await req(email, "GET", `/api/rotas-transporte/${ids.rota}`);
    expect(r.statusCode).toBe(200);
    return r.json().alunos.map((a: { matriculaId: string }) => a.matriculaId).sort();
  };

  it("professor A vê só o aluno da sua turma", async () => {
    expect(await alunosDa(c.uProfA.email)).toEqual([c.matA.id]);
  });
  it("secretaria A vê só os alunos da escola A", async () => {
    expect(await alunosDa(c.uSecA.email)).toEqual([c.matA.id, c.matA2.id].sort());
  });
  it("gestão vê todos", async () => {
    expect(await alunosDa(c.uAdmin.email)).toEqual([c.matA.id, c.matA2.id, c.matB.id].sort());
  });
});
