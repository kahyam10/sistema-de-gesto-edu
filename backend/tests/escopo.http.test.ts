// Escopo por escola (direção/coordenação/secretaria) e por turma (professor),
// aplicado na camada de dados, + minimização de campos para o professor.
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;
const ids: Record<string, string> = {};

async function token(email: string) {
  const r = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
  expect(r.statusCode).toBe(200);
  return { authorization: `Bearer ${r.json().accessToken}` };
}

beforeAll(async () => {
  _resetarLimiteLogin();
  await prisma.comunicado.deleteMany();
  await prisma.transferenciaMatricula.deleteMany();
  await prisma.turmaProfessor.deleteMany();
  await prisma.escolaProfissional.deleteMany();
  await prisma.sessaoRefresh.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular Escopo" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental Escopo", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Iniciais Escopo", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "5º Ano Escopo", nivelId: nivel.id } });
  const escolaA = await prisma.escola.create({ data: { nome: "Escola Fictícia A", codigo: "ESC-A" } });
  const escolaB = await prisma.escola.create({ data: { nome: "Escola Fictícia B", codigo: "ESC-B" } });
  ids.escolaA = escolaA.id;
  ids.escolaB = escolaB.id;
  ids.etapa = etapa.id;
  const turmaA = await prisma.turma.create({ data: { nome: "5A", turno: "MATUTINO", anoLetivo: 2026, escolaId: escolaA.id, serieId: serie.id } });
  const turmaA2 = await prisma.turma.create({ data: { nome: "5C", turno: "VESPERTINO", anoLetivo: 2026, escolaId: escolaA.id, serieId: serie.id } });
  const turmaB = await prisma.turma.create({ data: { nome: "5B", turno: "MATUTINO", anoLetivo: 2026, escolaId: escolaB.id, serieId: serie.id } });
  ids.turmaA = turmaA.id;
  ids.turmaA2 = turmaA2.id;
  ids.turmaB = turmaB.id;
  const base = {
    anoLetivo: 2026, status: "ATIVA", dataNascimento: new Date("2015-01-01"), sexo: "F",
    nomeResponsavel: "Responsável Fictício", etapaId: etapa.id,
    cpfAluno: "00000000000", nisAluno: "00000000000", endereco: "Rua Fictícia, 1", cep: "00000-000",
    alergias: "Amendoim", contatoEmergenciaNome: "Tia Fictícia",
  };
  ids.matA = (await prisma.matricula.create({ data: { ...base, numeroMatricula: "ESCA0001", nomeAluno: "Aluna A", escolaId: escolaA.id, turmaId: turmaA.id } })).id;
  ids.matA2 = (await prisma.matricula.create({ data: { ...base, numeroMatricula: "ESCA0002", nomeAluno: "Aluna A2", escolaId: escolaA.id, turmaId: turmaA2.id } })).id;
  ids.matB = (await prisma.matricula.create({ data: { ...base, numeroMatricula: "ESCB0001", nomeAluno: "Aluna B", escolaId: escolaB.id, turmaId: turmaB.id } })).id;

  const prof = await prisma.profissionalEducacao.create({
    data: { nome: "Prof Fictício", cpf: "00000000272", tipo: "PROFESSOR", banco: "000", conta: "0000-0" },
  });
  await prisma.escolaProfissional.create({ data: { escolaId: escolaA.id, profissionalId: prof.id } });
  await prisma.turmaProfessor.create({ data: { turmaId: turmaA.id, profissionalId: prof.id, tipo: "PROFESSOR" } });

  const hash = await bcrypt.hash(SENHA, 10);
  await prisma.user.createMany({
    data: [
      { email: "sec-a@teste.local", nome: "Secretaria A", role: "SECRETARIA", password: hash, escolaId: escolaA.id },
      { email: "dir-sem@teste.local", nome: "Diretor sem escola", role: "DIRETOR", password: hash },
      { email: "prof-esc@teste.local", nome: "Prof", role: "PROFESSOR", password: hash, profissionalId: prof.id },
      { email: "admin-esc@teste.local", nome: "Admin", role: "ADMIN", password: hash },
    ],
  });
  await prisma.comunicado.createMany({
    data: [
      { titulo: "Da rede", mensagem: "x", tipo: "AVISO", destinatarios: "TODOS", autorNome: "SEMEC" },
      { titulo: "Da A", mensagem: "x", tipo: "AVISO", destinatarios: "TODOS", autorNome: "A", escolaId: escolaA.id },
      { titulo: "Da B", mensagem: "x", tipo: "AVISO", destinatarios: "TODOS", autorNome: "B", escolaId: escolaB.id },
    ],
  });

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("secretaria só enxerga e altera a própria escola", () => {
  it("listas trazem só a escola A (mesmo pedindo a B pela query)", async () => {
    const h = await token("sec-a@teste.local");
    const mats = (await app.inject({ method: "GET", url: "/api/matriculas", headers: h })).json();
    expect(mats.map((m: { id: string }) => m.id).sort()).toEqual([ids.matA, ids.matA2].sort());
    const pedindoB = (await app.inject({ method: "GET", url: `/api/matriculas?escolaId=${ids.escolaB}`, headers: h })).json();
    expect(pedindoB).toEqual([]);
    const escolas = (await app.inject({ method: "GET", url: "/api/escolas", headers: h })).json();
    const listaEscolas = Array.isArray(escolas) ? escolas : escolas.data;
    expect(listaEscolas.map((e: { id: string }) => e.id)).toEqual([ids.escolaA]);
  });

  it("registro da escola B não é encontrado nem alterável", async () => {
    const h = await token("sec-a@teste.local");
    const get = await app.inject({ method: "GET", url: `/api/matriculas/${ids.matB}`, headers: h });
    expect(get.statusCode).toBe(404);
    const put = await app.inject({ method: "PUT", url: `/api/matriculas/${ids.matB}`, headers: h, payload: { observacoes: "invasão" } });
    expect(put.statusCode).toBeGreaterThanOrEqual(400);
    const b = await prisma.matricula.findUniqueOrThrow({ where: { id: ids.matB } });
    expect(b.observacoes).toBeNull();
  });

  it("não cria matrícula na escola B nem move aluno para turma da B", async () => {
    const h = await token("sec-a@teste.local");
    const criar = await app.inject({
      method: "POST", url: "/api/matriculas", headers: h,
      payload: {
        nomeAluno: "Intrusa", dataNascimento: "2015-01-01", sexo: "F", nomeResponsavel: "X",
        escolaId: ids.escolaB, etapaId: ids.etapa, anoLetivo: 2026,
      },
    });
    expect(criar.statusCode).toBe(403);
    const mover = await app.inject({ method: "PUT", url: `/api/matriculas/${ids.matA}`, headers: h, payload: { turmaId: ids.turmaB } });
    expect(mover.statusCode).toBe(403);
  });

  it("chamada de turma da B é recusada", async () => {
    const h = await token("sec-a@teste.local");
    const r = await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: h,
      payload: { turmaId: ids.turmaB, data: "2026-09-21", presencas: [{ matriculaId: ids.matB, status: "PRESENTE" }] },
    });
    expect([403, 404]).toContain(r.statusCode);
    expect(await prisma.frequencia.count({ where: { turmaId: ids.turmaB } })).toBe(0);
  });

  it("comunicados: vê os da rede e os da A; não publica para a rede nem para a B", async () => {
    const h = await token("sec-a@teste.local");
    const lista = (await app.inject({ method: "GET", url: "/api/comunicados", headers: h })).json();
    const titulos = (Array.isArray(lista) ? lista : lista.data).map((c: { titulo: string }) => c.titulo).sort();
    expect(titulos).toEqual(["Da A", "Da rede"]);
    for (const escolaId of [ids.escolaB, undefined]) {
      const r = await app.inject({
        method: "POST", url: "/api/comunicados", headers: h,
        payload: { titulo: "T", mensagem: "M", tipo: "AVISO", destinatarios: "TODOS", autorNome: "Sec", ...(escolaId ? { escolaId } : {}) },
      });
      expect(r.statusCode).toBeGreaterThanOrEqual(400);
    }
  });

  it("transfere aluno próprio para outra escola (sai do escopo) mas não o aluno alheio", async () => {
    const h = await token("sec-a@teste.local");
    const alheio = await app.inject({ method: "PATCH", url: `/api/matriculas/${ids.matB}/transferir`, headers: h, payload: { escolaId: ids.escolaA } });
    expect(alheio.statusCode).toBe(404);
    const turmaErrada = await app.inject({
      method: "PATCH", url: `/api/matriculas/${ids.matA2}/transferir`, headers: h,
      payload: { escolaId: ids.escolaB, turmaId: ids.turmaA },
    });
    expect(turmaErrada.statusCode).toBe(400);
    const ok = await app.inject({
      method: "PATCH", url: `/api/matriculas/${ids.matA2}/transferir`, headers: h,
      payload: { escolaId: ids.escolaB, turmaId: ids.turmaB, motivo: "mudança" },
    });
    expect(ok.statusCode).toBeLessThan(300);
    expect((await prisma.matricula.findUniqueOrThrow({ where: { id: ids.matA2 } })).escolaId).toBe(ids.escolaB);
  });

  it("diretor sem escola vinculada não enxerga dados de escola nenhuma", async () => {
    const h = await token("dir-sem@teste.local");
    const mats = (await app.inject({ method: "GET", url: "/api/matriculas", headers: h })).json();
    expect(mats).toEqual([]);
  });

  it("ADMIN continua vendo a rede toda", async () => {
    const h = await token("admin-esc@teste.local");
    const mats = (await app.inject({ method: "GET", url: "/api/matriculas", headers: h })).json();
    expect(mats.length).toBeGreaterThanOrEqual(3);
  });
});

describe("professor: só as próprias turmas e sem dados desnecessários", () => {
  it("vê só alunos das turmas em que leciona, sem CPF/NIS/endereço, com saúde e emergência", async () => {
    const h = await token("prof-esc@teste.local");
    const mats = (await app.inject({ method: "GET", url: "/api/matriculas", headers: h })).json();
    expect(mats.map((m: { id: string }) => m.id)).toEqual([ids.matA]);
    const m = mats[0];
    for (const k of ["cpfAluno", "nisAluno", "endereco", "cep"]) expect(m).not.toHaveProperty(k);
    expect(m.alergias).toBe("Amendoim");
    expect(m.contatoEmergenciaNome).toBe("Tia Fictícia");
  });

  it("detalhe da própria turma vem minimizado; turma alheia não existe", async () => {
    const h = await token("prof-esc@teste.local");
    const propria = await app.inject({ method: "GET", url: `/api/turmas/${ids.turmaA}`, headers: h });
    expect(propria.statusCode).toBe(200);
    const texto = propria.body;
    expect(texto).not.toContain("00000000000");
    expect(texto).not.toContain("Rua Fictícia");
    const alheia = await app.inject({ method: "GET", url: `/api/turmas/${ids.turmaB}`, headers: h });
    expect(alheia.statusCode).toBe(404);
  });

  it("dados de colegas não trazem CPF nem dados bancários", async () => {
    const h = await token("prof-esc@teste.local");
    const r = await app.inject({ method: "GET", url: "/api/profissionais", headers: h });
    expect(r.statusCode).toBe(200);
    expect(r.body).not.toContain("00000000272");
    expect(r.body).not.toContain("0000-0");
  });
});
