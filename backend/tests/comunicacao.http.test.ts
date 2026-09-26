// Módulo 9 pelas rotas: formato que o painel envia, campos extras descartados
// e erros de validação padronizados. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

let app: FastifyInstance;
let token = "";
const ids: Record<string, string> = {};
const auth = () => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
  _resetarLimiteLogin();
  const password = await bcrypt.hash("senha-de-teste-forte-123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin-m9@teste.local" }, update: {},
    create: { email: "admin-m9@teste.local", nome: "Admin M9", role: "ADMIN", password },
  });
  const outro = await prisma.user.upsert({
    where: { email: "dest-m9@teste.local" }, update: {},
    create: { email: "dest-m9@teste.local", nome: "Destinatário M9", role: "RESPONSAVEL", password },
  });
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular M9" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental M9", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais M9", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "1º Ano M9", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia M9", codigo: "M9-01" } });
  const outraEscola = await prisma.escola.create({ data: { nome: "Outra Escola M9", codigo: "M9-02" } });
  const turma = await prisma.turma.create({ data: { nome: "1A-M9", turno: "MATUTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id } });
  const aluno = await prisma.matricula.create({
    data: {
      anoLetivo: 2026, status: "ATIVA", dataNascimento: new Date("2019-01-10"), sexo: "F", nomeResponsavel: "Resp M9",
      escolaId: escola.id, etapaId: etapa.id, turmaId: turma.id, numeroMatricula: "M9000001", nomeAluno: "Aluna Fictícia M9",
    },
  });
  Object.assign(ids, { admin: admin.id, outro: outro.id, escola: escola.id, outraEscola: outraEscola.id, turma: turma.id, aluno: aluno.id });
  app = await buildApp();
  await app.ready();
  const login = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email: "admin-m9@teste.local", password: "senha-de-teste-forte-123" } });
  token = login.json().accessToken;
});

afterAll(async () => {
  await app.close();
});

describe("comunicados", () => {
  it("cria com o formato do painel e ignora campos que o cliente não pode definir", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/comunicados", headers: auth(),
      payload: {
        titulo: "Aviso M9", mensagem: "Texto", tipo: "AVISO", destinatarios: "TURMA_ESPECIFICA", turmaId: ids.turma,
        autorNome: "Direção", escolaId: ids.escola, autorId: "forjado", id: "id-forjado", createdAt: "2000-01-01", categoria: "",
      },
    });
    expect(res.statusCode).toBe(201);
    const c = res.json();
    expect(c.id).not.toBe("id-forjado");
    expect(c.autorId).toBeNull();
    expect(c.categoria).toBeNull();
    ids.comunicado = c.id;
  });

  it("TURMA_ESPECIFICA sem turma → 400 VALIDATION", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/comunicados", headers: auth(),
      payload: { titulo: "X", mensagem: "Y", tipo: "AVISO", destinatarios: "TURMA_ESPECIFICA", autorNome: "Z" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().issues).toEqual([{ campo: "turmaId", mensagem: "Informe a turma" }]);
  });

  it("editar não troca a escola do comunicado", async () => {
    const res = await app.inject({
      method: "PUT", url: `/api/comunicados/${ids.comunicado}`, headers: auth(),
      payload: { titulo: "Aviso M9 editado", escolaId: ids.outraEscola },
    });
    expect(res.statusCode).toBe(200);
    const c = await prisma.comunicado.findUniqueOrThrow({ where: { id: ids.comunicado } });
    expect(c.titulo).toBe("Aviso M9 editado");
    expect(c.escolaId).toBe(ids.escola);
  });

  it("filtros da lista: booleano e paginação vindos da URL", async () => {
    const res = await app.inject({ method: "GET", url: `/api/comunicados?escolaId=${ids.escola}&ativo=true&page=1&limit=5`, headers: auth() });
    expect(res.statusCode).toBe(200);
    const b = res.json();
    expect(b.data.map((c: { id: string }) => c.id)).toContain(ids.comunicado);
  });
});

describe("notificações", () => {
  it("envio em massa aceita userIds (formato do painel)", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/notificacoes/bulk", headers: auth(),
      payload: { userIds: [ids.outro, ids.admin], titulo: "Lembrete M9", mensagem: "Texto", tipo: "LEMBRETE", canais: ["APP"] },
    });
    expect(res.statusCode).toBe(201);
    expect(await prisma.notificacao.count({ where: { titulo: "Lembrete M9" } })).toBe(2);
  });

  it("status de envio valida o canal", async () => {
    const n = await prisma.notificacao.findFirstOrThrow({ where: { titulo: "Lembrete M9", userId: ids.outro } });
    const ruim = await app.inject({ method: "PUT", url: `/api/notificacoes/${n.id}/status-envio`, headers: auth(), payload: { canal: "FAX", enviado: true } });
    expect(ruim.statusCode).toBe(400);
    expect(ruim.json().error).toBe("VALIDATION");
    const ok = await app.inject({ method: "PUT", url: `/api/notificacoes/${n.id}/status-envio`, headers: auth(), payload: { canal: "EMAIL", enviado: true } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().enviadaEmail).toBe(true);
  });
});

describe("reuniões de pais e plantões", () => {
  it("cria reunião e registra presença no formato do painel", async () => {
    const r = await app.inject({
      method: "POST", url: "/api/reunioes-pais", headers: auth(),
      payload: { escolaId: ids.escola, turmaId: ids.turma, titulo: "Reunião M9", data: "2026-10-02", horario: "08:00", tipo: "BIMESTRAL", local: "" },
    });
    expect(r.statusCode).toBe(201);
    const p = await app.inject({
      method: "POST", url: "/api/reunioes-pais/presencas", headers: auth(),
      payload: { reuniaoId: r.json().id, matriculaId: ids.aluno, nomeResponsavel: "Resp M9", parentesco: "Mãe", presente: true },
    });
    expect(p.statusCode).toBe(201);
    expect(p.json().nomeResponsavel).toBe("Resp M9");
  });

  it("horário inválido → 400 com campo em PT-BR", async () => {
    const r = await app.inject({
      method: "POST", url: "/api/reunioes-pais", headers: auth(),
      payload: { escolaId: ids.escola, titulo: "Reunião ruim", data: "2026-10-02", horario: "25:00", tipo: "BIMESTRAL" },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().issues[0]).toEqual({ campo: "horario", mensagem: "Horário inválido (HH:MM)" });
  });

  it("plantão: fim antes do início é recusado; período exige as duas datas", async () => {
    const ruim = await app.inject({
      method: "POST", url: "/api/plantoes-pedagogicos", headers: auth(),
      payload: { escolaId: ids.escola, data: "2026-10-05", tipo: "COLETIVO", horarioInicio: "17:00", horarioFim: "14:00" },
    });
    expect(ruim.statusCode).toBe(400);
    const ok = await app.inject({
      method: "POST", url: "/api/plantoes-pedagogicos", headers: auth(),
      payload: { escolaId: ids.escola, data: "2026-10-05", tipo: "COLETIVO", horarioInicio: "14:00", horarioFim: "17:00" },
    });
    expect(ok.statusCode).toBe(201);
    const semDatas = await app.inject({ method: "GET", url: `/api/plantoes-pedagogicos/escola/${ids.escola}/periodo`, headers: auth() });
    expect(semDatas.statusCode).toBe(400);
    const periodo = await app.inject({
      method: "GET", url: `/api/plantoes-pedagogicos/escola/${ids.escola}/periodo?dataInicio=2026-10-01&dataFim=2026-10-31`, headers: auth(),
    });
    expect(periodo.statusCode).toBe(200);
    expect(periodo.json()).toHaveLength(1);
  });
});
