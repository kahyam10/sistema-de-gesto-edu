// Módulo 2 — planejamento pedagógico: conteúdo programático, banco de
// atividades, planos de aula com revisão e cobertura. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};

const chamar = (quem: string, method: "GET" | "POST" | "PUT" | "DELETE", url: string, payload?: object) =>
  app.inject({ method, url, payload, headers: { authorization: `Bearer ${tokens[quem]}` } });
const codigo = (r: { json: () => { error?: { code?: string } } }) => r.json().error?.code;

beforeAll(async () => {
  _resetarLimiteLogin();
  const hash = await bcrypt.hash(SENHA, 10);
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular PLN" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental PLN", tipoEducacaoId: tipo.id } });
  const outraEtapa = await prisma.etapaEnsino.create({ data: { nome: "Infantil PLN", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais PLN", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "3º Ano PLN", nivelId: nivel.id } });
  const outraSerie = await prisma.serie.create({ data: { nome: "4º Ano PLN", nivelId: nivel.id } });
  const escolaA = await prisma.escola.create({ data: { nome: "Escola Fictícia PLN A", codigo: "PLN-A" } });
  const escolaB = await prisma.escola.create({ data: { nome: "Escola Fictícia PLN B", codigo: "PLN-B" } });
  const turmaA = await prisma.turma.create({ data: { nome: "3A-PLN", turno: "MATUTINO", anoLetivo: 2032, escolaId: escolaA.id, serieId: serie.id } });
  const turmaB = await prisma.turma.create({ data: { nome: "3B-PLN", turno: "MATUTINO", anoLetivo: 2032, escolaId: escolaB.id, serieId: serie.id } });
  const lp = await prisma.disciplina.create({ data: { nome: "Português PLN", codigo: "LP-PLN", etapaId: etapa.id } });
  const infantil = await prisma.disciplina.create({ data: { nome: "Campos de experiência PLN", codigo: "CE-PLN", etapaId: outraEtapa.id } });

  const profA = await prisma.profissionalEducacao.create({ data: { nome: "Prof PLN A", cpf: "00000001163", tipo: "PROFESSOR" } });
  const profB = await prisma.profissionalEducacao.create({ data: { nome: "Prof PLN B", cpf: "00000001244", tipo: "PROFESSOR" } });
  await prisma.turmaProfessor.create({ data: { turmaId: turmaA.id, profissionalId: profA.id, tipo: "PROFESSOR" } });
  await prisma.turmaProfessor.create({ data: { turmaId: turmaB.id, profissionalId: profB.id, tipo: "PROFESSOR" } });

  const usuarios: Array<[string, string, string, Record<string, string>]> = [
    ["semec", "semec-pln@teste.local", "SEMEC", {}],
    ["coordA", "coord-pln@teste.local", "COORDENADOR", { escolaId: escolaA.id }],
    ["dirB", "dir-pln@teste.local", "DIRETOR", { escolaId: escolaB.id }],
    ["secA", "sec-pln@teste.local", "SECRETARIA", { escolaId: escolaA.id }],
    ["profA", "profa-pln@teste.local", "PROFESSOR", { profissionalId: profA.id }],
    ["profB", "profb-pln@teste.local", "PROFESSOR", { profissionalId: profB.id }],
    ["resp", "resp-pln@teste.local", "RESPONSAVEL", {}],
  ];
  for (const [, email, role, extra] of usuarios) {
    await prisma.user.create({ data: { email, nome: `Usuário ${role} PLN`, role, password: hash, ...extra } });
  }
  Object.assign(ids, {
    serie: serie.id, outraSerie: outraSerie.id, escolaA: escolaA.id, escolaB: escolaB.id,
    turmaA: turmaA.id, turmaB: turmaB.id, lp: lp.id, infantil: infantil.id,
  });

  app = await buildApp();
  await app.ready();
  for (const [chave, email] of usuarios) {
    const r = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
    tokens[chave] = r.json().accessToken;
  }
});

afterAll(async () => {
  await app.close();
  // Planos e atividades prendem o autor (Restrict): limpa para os testes
  // seguintes, que apagam a tabela de usuários inteira na preparação.
  await prisma.planoAula.deleteMany({ where: { turmaId: { in: [ids.turmaA, ids.turmaB] } } });
  await prisma.atividadePedagogica.deleteMany({ where: { disciplinaId: { in: [ids.lp, ids.infantil] } } });
  await prisma.conteudoProgramatico.deleteMany({ where: { disciplinaId: { in: [ids.lp, ids.infantil] } } });
});

describe("conteúdo programático", () => {
  const base = () => ({ anoLetivo: 2032, bimestre: 1, serieId: ids.serie, disciplinaId: ids.lp });

  it("SEMEC cria conteúdo da rede e normaliza os códigos BNCC", async () => {
    const r = await chamar("semec", "POST", "/api/planejamento/conteudos", {
      ...base(), titulo: "Leitura de contos", habilidadesBncc: ["ef03lp01", "EF03LP01", " EF03LP02 "],
    });
    expect(r.statusCode).toBe(201);
    expect(r.json().escolaId).toBeNull();
    expect(r.json().habilidadesBncc).toEqual(["EF03LP01", "EF03LP02"]);
    ids.conteudoRede = r.json().id;
  });

  it("código BNCC fora do formato é recusado no formato de validação", async () => {
    const r = await chamar("semec", "POST", "/api/planejamento/conteudos", { ...base(), titulo: "X", habilidadesBncc: ["EF-03"] });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe("VALIDATION");
    expect(r.json().issues[0].campo).toBe("habilidadesBncc.0");
  });

  it("coordenação cria só na própria escola; rede e disciplina de outra etapa são recusadas", async () => {
    const semEscola = await chamar("coordA", "POST", "/api/planejamento/conteudos", { ...base(), titulo: "Tentativa na rede" });
    expect(semEscola.statusCode).toBe(403);
    const outraEtapa = await chamar("coordA", "POST", "/api/planejamento/conteudos", { ...base(), disciplinaId: ids.infantil, escolaId: ids.escolaA, titulo: "X" });
    expect(outraEtapa.statusCode).toBe(400);
    expect(codigo(outraEtapa)).toBe("BIZ_040");
    const ok = await chamar("coordA", "POST", "/api/planejamento/conteudos", { ...base(), escolaId: ids.escolaA, titulo: "Projeto de leitura da escola" });
    expect(ok.statusCode).toBe(201);
    ids.conteudoA = ok.json().id;
    // conteúdo da rede não é editável pela escola
    const editarRede = await chamar("coordA", "PUT", `/api/planejamento/conteudos/${ids.conteudoRede}`, { titulo: "Alterado" });
    expect(editarRede.statusCode).toBe(403);
  });

  it("professor lê mas não cria; outra escola não vê o conteúdo da escola A", async () => {
    expect((await chamar("profA", "POST", "/api/planejamento/conteudos", { ...base(), escolaId: ids.escolaA, titulo: "X" })).statusCode).toBe(403);
    const lista = await chamar("dirB", "GET", `/api/planejamento/conteudos?anoLetivo=2032&escolaId=${ids.escolaB}`);
    expect(lista.statusCode).toBe(200);
    expect(lista.json().map((c: { id: string }) => c.id)).toEqual([ids.conteudoRede]);
    const doProf = await chamar("profA", "GET", `/api/planejamento/conteudos?anoLetivo=2032&serieId=${ids.serie}`);
    expect(doProf.json().map((c: { id: string }) => c.id).sort()).toEqual([ids.conteudoA, ids.conteudoRede].sort());
  });
});

describe("banco de atividades", () => {
  it("professor cadastra na escola em que leciona, não em outra", async () => {
    const ok = await chamar("profA", "POST", "/api/planejamento/atividades", {
      titulo: "Caça-palavras", tipo: "JOGO", descricao: "Encontrar palavras do conto", disciplinaId: ids.lp, serieId: ids.serie, escolaId: ids.escolaA,
    });
    expect(ok.statusCode).toBe(201);
    ids.atividade = ok.json().id;
    const outra = await chamar("profA", "POST", "/api/planejamento/atividades", {
      titulo: "X", tipo: "JOGO", descricao: "Y", disciplinaId: ids.lp, escolaId: ids.escolaB,
    });
    expect(outra.statusCode).toBe(403);
    expect((await chamar("secA", "POST", "/api/planejamento/atividades", { titulo: "X", tipo: "JOGO", descricao: "Y", disciplinaId: ids.lp, escolaId: ids.escolaA })).statusCode).toBe(403);
  });

  it("outra escola não vê; professor de outra escola não edita", async () => {
    expect((await chamar("dirB", "GET", `/api/planejamento/atividades/${ids.atividade}`)).statusCode).toBe(404);
    const lista = await chamar("profB", "GET", "/api/planejamento/atividades");
    expect(lista.json().map((a: { id: string }) => a.id)).not.toContain(ids.atividade);
    expect((await chamar("profB", "PUT", `/api/planejamento/atividades/${ids.atividade}`, { titulo: "Z" })).statusCode).toBe(404);
    // coordenação da escola pode revisar o texto da atividade
    expect((await chamar("coordA", "PUT", `/api/planejamento/atividades/${ids.atividade}`, { titulo: "Caça-palavras do conto" })).statusCode).toBe(200);
  });
});

describe("plano de aula: rascunho → envio → devolução → aprovação", () => {
  const plano = () => ({
    turmaId: ids.turmaA, disciplinaId: ids.lp, bimestre: 1, dataAula: "2032-03-10",
    titulo: "O conto e seus personagens", objetivos: "Identificar personagens e cenário",
    habilidadesBncc: ["EF03LP01"], conteudoProgramaticoId: ids.conteudoRede, atividades: [ids.atividade],
  });

  it("professor cria rascunho só nas próprias turmas", async () => {
    const r = await chamar("profA", "POST", "/api/planejamento/planos", plano());
    expect(r.statusCode).toBe(201);
    expect(r.json()).toMatchObject({ status: "RASCUNHO", atividades: [{ id: ids.atividade }] });
    ids.plano = r.json().id;
    // turma de outra escola: nem aparece para o professor (404, não revela que existe)
    expect((await chamar("profA", "POST", "/api/planejamento/planos", { ...plano(), turmaId: ids.turmaB })).statusCode).toBe(404);
    // conteúdo programático de outra série não serve
    const c = await chamar("semec", "POST", "/api/planejamento/conteudos", { anoLetivo: 2032, bimestre: 1, serieId: ids.outraSerie, disciplinaId: ids.lp, titulo: "Do 4º ano" });
    const errado = await chamar("profA", "POST", "/api/planejamento/planos", { ...plano(), conteudoProgramaticoId: c.json().id });
    expect(errado.statusCode).toBe(400);
    expect(codigo(errado)).toBe("BIZ_041");
  });

  it("rascunho não aparece para a coordenação", async () => {
    const lista = await chamar("coordA", "GET", `/api/planejamento/planos?turmaId=${ids.turmaA}`);
    expect(lista.json().pagination.total).toBe(0);
    expect((await chamar("coordA", "POST", `/api/planejamento/planos/${ids.plano}/revisar`, { decisao: "APROVADO" })).statusCode).toBe(404);
  });

  it("enviado fica travado; devolver exige parecer", async () => {
    expect((await chamar("profA", "POST", `/api/planejamento/planos/${ids.plano}/enviar`)).json().status).toBe("ENVIADO");
    const editar = await chamar("profA", "PUT", `/api/planejamento/planos/${ids.plano}`, { titulo: "Novo" });
    expect(editar.statusCode).toBe(409);
    expect(codigo(editar)).toBe("BIZ_039");
    expect((await chamar("profA", "POST", `/api/planejamento/planos/${ids.plano}/revisar`, { decisao: "APROVADO" })).statusCode).toBe(403);
    const semParecer = await chamar("coordA", "POST", `/api/planejamento/planos/${ids.plano}/revisar`, { decisao: "DEVOLVIDO" });
    expect(codigo(semParecer)).toBe("BIZ_044");
    const devolvido = await chamar("coordA", "POST", `/api/planejamento/planos/${ids.plano}/revisar`, { decisao: "DEVOLVIDO", parecer: "Detalhar a avaliação" });
    expect(devolvido.json()).toMatchObject({ status: "DEVOLVIDO", parecer: "Detalhar a avaliação" });
  });

  it("professor ajusta, reenvia e a coordenação aprova", async () => {
    const ajuste = await chamar("profA", "PUT", `/api/planejamento/planos/${ids.plano}`, { avaliacao: "Roda de conversa e registro escrito" });
    expect(ajuste.statusCode).toBe(200);
    await chamar("profA", "POST", `/api/planejamento/planos/${ids.plano}/enviar`);
    const aprovado = await chamar("coordA", "POST", `/api/planejamento/planos/${ids.plano}/revisar`, { decisao: "APROVADO" });
    expect(aprovado.json()).toMatchObject({ status: "APROVADO", revisadoPor: { nome: "Usuário COORDENADOR PLN" } });
    const apagar = await chamar("profA", "DELETE", `/api/planejamento/planos/${ids.plano}`);
    expect(apagar.statusCode).toBe(409);
  });

  it("outra escola e outro professor não veem; responsável é barrado", async () => {
    expect((await chamar("dirB", "GET", `/api/planejamento/planos/${ids.plano}`)).statusCode).toBe(404);
    expect((await chamar("profB", "GET", `/api/planejamento/planos/${ids.plano}`)).statusCode).toBe(404);
    expect((await chamar("resp", "GET", "/api/planejamento/planos")).statusCode).toBe(403);
  });

  it("atividade e conteúdo usados em plano não podem ser excluídos", async () => {
    const a = await chamar("profA", "DELETE", `/api/planejamento/atividades/${ids.atividade}`);
    expect(a.statusCode).toBe(409);
    expect(codigo(a)).toBe("BIZ_042");
    expect((await chamar("semec", "DELETE", `/api/planejamento/conteudos/${ids.conteudoRede}`)).statusCode).toBe(409);
  });
});

describe("cobertura do conteúdo programático", () => {
  it("mostra o que já tem plano aprovado e o que falta planejar", async () => {
    const r = await chamar("coordA", "GET", `/api/planejamento/cobertura?turmaId=${ids.turmaA}&bimestre=1`);
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(b.resumo).toEqual({ previstos: 2, aprovados: 1, semPlano: 1 });
    const lp = b.disciplinas.find((d: { disciplinaId: string }) => d.disciplinaId === ids.lp);
    const porId = Object.fromEntries(lp.conteudos.map((c: { id: string; situacao: string }) => [c.id, c.situacao]));
    expect(porId).toEqual({ [ids.conteudoRede]: "APROVADO", [ids.conteudoA]: "SEM_PLANO" });
  });
});
