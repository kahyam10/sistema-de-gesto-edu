// Frente K: respostas de ponto e licenças. O serializador do Fastify descarta
// o que o schema de resposta não declara (e troca null por "" e array por {}):
// a lista de ponto chegava SEM horários e sem profissional, e a lista sem
// paginação virava {}. Agora a saída é curada pelo service (select explícito)
// e as rotas não têm schema 200/201. Ponto nunca devolve latitude/longitude
// (geolocalização do servidor) e o profissional sai só com { id, nome, tipo }.
// Dados 100% fictícios (sufixo fk61).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { hojeNaRede } from "../src/lib/datas.js";
import { cenarioDuasEscolas, entrar } from "./fb-cenario.js";

let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
let auth: { authorization: string };
const ids: Record<string, string> = {};
const req = (method: string, url: string, payload?: unknown) =>
  app.inject({ method: method as "GET", url, headers: auth, ...(payload ? { payload: payload as object } : {}) });

const SEM_GEO = (p: Record<string, unknown>) => {
  expect(p).not.toHaveProperty("latitude");
  expect(p).not.toHaveProperty("longitude");
};
const PROF_RESUMO = (p: Record<string, unknown>) => {
  expect(Object.keys(p.profissional as object).sort()).toEqual(["id", "nome", "tipo"]);
};

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas("fk61");
  await prisma.profissionalEducacao.update({
    where: { id: c.profA.id },
    data: { banco: "000", agencia: "0000", conta: "00000-0", pix: "pix-ficticio-fk61" },
  });
  ids.ponto = (
    await prisma.ponto.create({
      data: {
        profissionalId: c.profA.id, escolaId: c.escolaA.id, data: new Date("2026-03-02"),
        entrada: "07:00", saida: "11:30", horasTrabalhadas: 4.5, latitude: -14.1, longitude: -39.3,
      },
    })
  ).id;
  ids.licenca = (
    await prisma.licenca.create({
      data: { profissionalId: c.profA.id, tipo: "FERIAS", dataInicio: new Date("2026-07-01"), dataFim: new Date("2026-07-05"), diasCorridos: 5 },
    })
  ).id;
  const hoje = hojeNaRede();
  ids.ativa = (
    await prisma.licenca.create({
      data: {
        profissionalId: c.profA.id, tipo: "LICENCA_PREMIO", status: "APROVADA", diasCorridos: 3, motivo: "Prêmio fictício",
        dataInicio: new Date(hoje.getTime() - 86_400_000), dataFim: new Date(hoje.getTime() + 86_400_000),
      },
    })
  ).id;
  app = await buildApp();
  await app.ready();
  auth = await entrar(app, c.uAdmin.email);
});

afterAll(async () => {
  await app.close();
});

describe("GET /api/pontos", () => {
  it("sem paginação: array com horários, horas e profissional, sem geolocalização", async () => {
    const r = await req("GET", `/api/pontos?profissionalId=${c.profA.id}`);
    expect(r.statusCode).toBe(200);
    const corpo = r.json();
    expect(Array.isArray(corpo)).toBe(true);
    const p = corpo.find((x: { id: string }) => x.id === ids.ponto);
    expect(p).toMatchObject({ entrada: "07:00", saida: "11:30", horasTrabalhadas: 4.5, entrada2: null, justificativa: null, tipoRegistro: "NORMAL" });
    expect(p.profissional.nome).toBe(c.profA.nome);
    PROF_RESUMO(p);
    SEM_GEO(p);
  });

  it("paginada: { data, pagination } com os mesmos campos", async () => {
    const r = await req("GET", `/api/pontos?profissionalId=${c.profA.id}&page=1&limit=10`);
    expect(r.statusCode).toBe(200);
    const corpo = r.json();
    expect(corpo.pagination).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
    const [p] = corpo.data;
    expect(p).toMatchObject({ id: ids.ponto, entrada: "07:00", saida: "11:30", horasTrabalhadas: 4.5 });
    expect(p.profissional.nome).toBe(c.profA.nome);
    PROF_RESUMO(p);
    SEM_GEO(p);
  });

  it("filtro por tipoRegistro aceita os valores reais do modelo", async () => {
    expect((await req("GET", "/api/pontos?tipoRegistro=FALTA_JUSTIFICADA")).statusCode).toBe(200);
    expect((await req("GET", "/api/pontos?tipoRegistro=INVENTADO")).statusCode).toBe(400);
  });

  it("detalhe e relatório mensal: sem geolocalização, sem cadastro do profissional", async () => {
    const d = await req("GET", `/api/pontos/${ids.ponto}`);
    expect(d.statusCode).toBe(200);
    expect(d.json()).toMatchObject({ entrada: "07:00", saida: "11:30", observacoes: null });
    SEM_GEO(d.json());
    PROF_RESUMO(d.json());
    expect(d.body).not.toContain("pix-ficticio");

    const rel = await req("GET", `/api/pontos/relatorio/${c.profA.id}/3/2026`);
    expect(rel.statusCode).toBe(200);
    expect(rel.json()).toMatchObject({ totalHoras: 4.5, diasTrabalhados: 1 });
    expect(rel.json().pontos[0]).toMatchObject({ id: ids.ponto, entrada: "07:00", horasTrabalhadas: 4.5 });
    SEM_GEO(rel.json().pontos[0]);
  });
});

describe("escritas de ponto", () => {
  it("POST sem tipoRegistro → 201 com NORMAL; resposta sem geolocalização", async () => {
    const r = await req("POST", "/api/pontos", {
      profissionalId: c.profA.id, escolaId: c.escolaA.id, data: "2026-03-03", entrada: "07:00", saida: "12:00", latitude: -14.2, longitude: -39.4,
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json()).toMatchObject({ tipoRegistro: "NORMAL", entrada: "07:00", saida: "12:00", horasTrabalhadas: 5, observacoes: null });
    SEM_GEO(r.json());
    // a coordenada foi gravada, só não volta na resposta
    expect((await prisma.ponto.findUnique({ where: { id: r.json().id } }))?.latitude).toBe(-14.2);
    // o enum continua valendo quando informado
    const ruim = await req("POST", "/api/pontos", { profissionalId: c.profA.id, data: "2026-03-04", tipoRegistro: "INVENTADO" });
    expect(ruim.statusCode).toBe(400);
  });

  it("PUT e /registrar devolvem o registro sem geolocalização", async () => {
    const put = await req("PUT", `/api/pontos/${ids.ponto}`, { saida: "12:00", observacoes: "Ajuste fictício" });
    expect(put.statusCode, put.body).toBe(200);
    expect(put.json()).toMatchObject({ saida: "12:00", horasTrabalhadas: 5, observacoes: "Ajuste fictício" });
    SEM_GEO(put.json());

    const reg = await req("POST", "/api/pontos/registrar", {
      profissionalId: c.profB.id, escolaId: c.escolaB.id, tipo: "ENTRADA", horario: "07:15", latitude: -14.5, longitude: -39.5,
    });
    expect(reg.statusCode, reg.body).toBe(201);
    expect(reg.json()).toMatchObject({ entrada: "07:15", saida: null });
    SEM_GEO(reg.json());
  });
});

describe("licenças", () => {
  const CAMPOS = [
    "id", "profissionalId", "tipo", "dataInicio", "dataFim", "diasCorridos", "diasUteis", "motivo", "observacoes",
    "status", "documentoPath", "aprovadaPor", "dataAprovacao", "justificativaRejeicao", "createdAt", "updatedAt",
  ];

  it("GET sem paginação: array com os campos reais, null preservado", async () => {
    const r = await req("GET", `/api/licencas?profissionalId=${c.profA.id}`);
    expect(r.statusCode).toBe(200);
    expect(Array.isArray(r.json())).toBe(true);
    const l = r.json().find((x: { id: string }) => x.id === ids.licenca);
    expect(l).toMatchObject({
      tipo: "FERIAS", status: "PENDENTE", diasCorridos: 5, diasUteis: null, motivo: null, observacoes: null,
      documentoPath: null, aprovadaPor: null, dataAprovacao: null, justificativaRejeicao: null,
      dataInicio: "2026-07-01T00:00:00.000Z", dataFim: "2026-07-05T00:00:00.000Z",
    });
    expect(Object.keys(l).filter((k) => k !== "profissional").sort()).toEqual([...CAMPOS].sort());
    expect(l.profissional.nome).toBe(c.profA.nome);
    PROF_RESUMO(l);
  });

  it("GET paginada: { data, pagination } com os mesmos campos", async () => {
    const r = await req("GET", `/api/licencas?profissionalId=${c.profA.id}&page=1&limit=10`);
    expect(r.statusCode).toBe(200);
    expect(r.json().pagination).toMatchObject({ page: 1, limit: 10, total: 2 });
    const l = r.json().data.find((x: { id: string }) => x.id === ids.licenca);
    expect(l).toMatchObject({ diasCorridos: 5, motivo: null, diasUteis: null });
    PROF_RESUMO(l);
  });

  it("filtro por tipo aceita os tipos reais do modelo", async () => {
    const r = await req("GET", `/api/licencas?tipo=LICENCA_PREMIO&profissionalId=${c.profA.id}`);
    expect(r.statusCode).toBe(200);
    expect(r.json().map((l: { id: string }) => l.id)).toEqual([ids.ativa]);
  });

  it("detalhe, ativas e relatório", async () => {
    const d = await req("GET", `/api/licencas/${ids.licenca}`);
    expect(d.statusCode).toBe(200);
    expect(d.json()).toMatchObject({ id: ids.licenca, diasCorridos: 5, motivo: null, justificativaRejeicao: null });
    PROF_RESUMO(d.json());
    expect(d.body).not.toContain("pix-ficticio");
    expect(d.body).not.toContain(c.profA.cpf);

    const at = await req("GET", "/api/licencas/status/ativas");
    expect(at.statusCode).toBe(200);
    const ativa = at.json().find((l: { id: string }) => l.id === ids.ativa);
    expect(ativa).toMatchObject({ tipo: "LICENCA_PREMIO", diasCorridos: 3, motivo: "Prêmio fictício" });
    expect(ativa.profissional.nome).toBe(c.profA.nome);
    PROF_RESUMO(ativa);

    const rel = await req("GET", `/api/licencas/relatorio/${c.profA.id}`);
    expect(rel.statusCode).toBe(200);
    expect(rel.json().totalDias).toBe(8);
    const lr = rel.json().licencas.find((l: { id: string }) => l.id === ids.licenca);
    expect(lr).toMatchObject({ diasCorridos: 5, diasUteis: null, motivo: null });
    // resumo: observações, documento e decisão ficam no detalhe
    expect(lr).not.toHaveProperty("documentoPath");
    expect(lr).not.toHaveProperty("observacoes");
  });

  it("POST/PUT/aprovar/cancelar devolvem a licença com os campos reais", async () => {
    const cr = await req("POST", "/api/licencas", { profissionalId: c.profB.id, tipo: "LICENCA_MEDICA", dataInicio: "2026-08-03", dataFim: "2026-08-07" });
    expect(cr.statusCode, cr.body).toBe(201);
    expect(cr.json()).toMatchObject({ status: "PENDENTE", diasCorridos: 5, diasUteis: 5, motivo: null, observacoes: null });
    const id = cr.json().id;

    const put = await req("PUT", `/api/licencas/${id}`, { observacoes: "Obs fictícia" });
    expect(put.statusCode, put.body).toBe(200);
    expect(put.json()).toMatchObject({ observacoes: "Obs fictícia", motivo: null, diasCorridos: 5 });

    const ap = await req("POST", `/api/licencas/${id}/aprovar`, { aprovado: true });
    expect(ap.statusCode, ap.body).toBe(200);
    expect(ap.json()).toMatchObject({ status: "APROVADA", aprovadaPor: c.uAdmin.id, justificativaRejeicao: null, message: "Licença aprovada com sucesso" });
    expect(typeof ap.json().dataAprovacao).toBe("string");

    const ca = await req("POST", `/api/licencas/${id}/cancelar`, {});
    expect(ca.statusCode, ca.body).toBe(200);
    expect(ca.json()).toMatchObject({ status: "CANCELADA", diasCorridos: 5 });
  });
});
