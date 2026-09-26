// Telas novas dos apps (agenda, cardápio, contatos, meus dados, notificações)
// e as travas de "só o que é seu". Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-123";
const DIA = 24 * 60 * 60 * 1000;
let app: FastifyInstance;
const ids: Record<string, string> = {};

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
async function token(email: string) {
  const res = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
  return res.json().accessToken as string;
}
const get = async (email: string, url: string) =>
  app.inject({ method: "GET", url, headers: bearer(await token(email)) });
const post = async (email: string, url: string) =>
  app.inject({ method: "POST", url, headers: bearer(await token(email)), payload: {} });

// Mesmo "hoje" do servidor (Bahia), como meia-noite UTC
const hoje = new Date(new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bahia" }).format(new Date()));
const emDias = (n: number) => new Date(hoje.getTime() + n * DIA);

beforeAll(async () => {
  _resetarLimiteLogin();
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular Apps" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental Apps", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais Apps", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "3º Ano Apps", nivelId: nivel.id } });
  const escola = await prisma.escola.create({
    data: { nome: "Escola Fictícia Apps", codigo: "APP-01", telefone: "(00) 0000-0000", email: "escola@exemplo.test" },
  });
  const alheia = await prisma.escola.create({ data: { nome: "Escola Alheia Apps", codigo: "APP-99" } });
  const turma = await prisma.turma.create({
    data: { nome: "3A-APP", turno: "MATUTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id },
  });
  const outraTurma = await prisma.turma.create({
    data: { nome: "3B-APP", turno: "VESPERTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id },
  });
  const aluno = await prisma.matricula.create({
    data: {
      anoLetivo: 2026, status: "ATIVA", dataNascimento: new Date("2017-03-10"), sexo: "F",
      nomeResponsavel: "Responsável Fictícia", escolaId: escola.id, etapaId: etapa.id,
      numeroMatricula: "APP000001", nomeAluno: "Aluna Fictícia Apps", turmaId: turma.id,
    },
  });
  const profissional = await prisma.profissionalEducacao.create({
    data: { nome: "Professor Fictício Apps", cpf: "00000000868", tipo: "PROFESSOR" },
  });
  await prisma.turmaProfessor.create({ data: { turmaId: turma.id, profissionalId: profissional.id, tipo: "PROFESSOR" } });

  const hash = await bcrypt.hash(SENHA, 10);
  const resp = await prisma.user.create({ data: { email: "resp-apps@teste.local", nome: "Resp Apps", role: "RESPONSAVEL", password: hash } });
  const prof = await prisma.user.create({
    data: { email: "prof-apps@teste.local", nome: "Prof Apps", role: "PROFESSOR", password: hash, profissionalId: profissional.id },
  });
  const outro = await prisma.user.create({ data: { email: "outro-apps@teste.local", nome: "Outro Apps", role: "RESPONSAVEL", password: hash } });
  await prisma.matriculaUsuario.create({ data: { matriculaId: aluno.id, userId: resp.id, parentesco: "Mãe" } });
  Object.assign(ids, { resp: resp.id, prof: prof.id, outro: outro.id, escola: escola.id, alheia: alheia.id, turma: turma.id });

  const ano = await prisma.anoLetivo.upsert({ where: { ano: 2099 }, update: {}, create: { ano: 2099 } });
  await prisma.eventoCalendario.createMany({
    data: [
      { titulo: "Feriado da rede (apps)", tipo: "FERIADO", dataInicio: emDias(5), anoLetivoId: ano.id },
      { titulo: "Feira da escola (apps)", tipo: "EVENTO", escopo: "ESCOLA", dataInicio: emDias(10), anoLetivoId: ano.id, escolaId: escola.id },
      { titulo: "Evento de outra escola (apps)", tipo: "EVENTO", escopo: "ESCOLA", dataInicio: emDias(10), anoLetivoId: ano.id, escolaId: alheia.id },
      { titulo: "Evento antigo (apps)", tipo: "EVENTO", dataInicio: emDias(-30), anoLetivoId: ano.id },
    ],
  });
  await prisma.reuniaoPais.createMany({
    data: [
      { escolaId: escola.id, turmaId: turma.id, titulo: "Reunião da 3A (apps)", data: emDias(3), horario: "19:00", tipo: "BIMESTRAL", ata: "ATA INTERNA" },
      { escolaId: escola.id, turmaId: outraTurma.id, titulo: "Reunião da 3B (apps)", data: emDias(3), horario: "19:00", tipo: "BIMESTRAL" },
    ],
  });
  await prisma.plantaoPedagogico.create({
    data: { escolaId: escola.id, data: emDias(7), tipo: "COLETIVO", horarioInicio: "14:00", horarioFim: "17:00", profissionais: "[\"x\"]" },
  });
  await prisma.cardapio.createMany({
    data: [
      { data: emDias(1), turno: "MATUTINO", tipoRefeicao: "LANCHE_MANHA", descricao: "Cuscuz com ovo (apps)", escolaId: escola.id, itens: [{ alimento: "flocão", quantidadePorAluno: 50 }] },
      { data: emDias(1), turno: "MATUTINO", tipoRefeicao: "LANCHE_MANHA", descricao: "Cardápio de outra escola (apps)", escolaId: alheia.id },
    ],
  });
  const [visivel, alheio, deProfessores] = await Promise.all([
    prisma.comunicado.create({ data: { titulo: "Aviso aos pais (apps)", mensagem: "Texto", tipo: "AVISO", destinatarios: "PAIS", autorNome: "Direção", escolaId: escola.id } }),
    prisma.comunicado.create({ data: { titulo: "Aviso de outra escola (apps)", mensagem: "Texto", tipo: "AVISO", destinatarios: "TODOS", autorNome: "X", escolaId: alheia.id } }),
    prisma.comunicado.create({ data: { titulo: "Só professores (apps)", mensagem: "Texto", tipo: "AVISO", destinatarios: "PROFESSORES", autorNome: "Direção", escolaId: escola.id } }),
  ]);
  Object.assign(ids, { comVisivel: visivel.id, comAlheio: alheio.id, comProf: deProfessores.id });
  const [nResp, nOutro] = await Promise.all([
    prisma.notificacao.create({ data: { userId: resp.id, titulo: "Boletim disponível", mensagem: "Texto", tipo: "ACADEMICO", canais: ["APP"] } }),
    prisma.notificacao.create({ data: { userId: outro.id, titulo: "De outra pessoa", mensagem: "Texto", tipo: "SISTEMA", canais: ["APP"] } }),
  ]);
  Object.assign(ids, { notifResp: nResp.id, notifOutro: nOutro.id });

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("agenda, cardápio, contatos e meus dados", () => {
  it("agenda traz rede + escola do filho, só reuniões da turma dele, sem ata", async () => {
    const res = await get("resp-apps@teste.local", "/api/portal/meu/agenda?dias=30");
    expect(res.statusCode).toBe(200);
    const b = res.json();
    const eventos = b.eventos.map((e: { titulo: string }) => e.titulo);
    expect(eventos).toContain("Feriado da rede (apps)");
    expect(eventos).toContain("Feira da escola (apps)");
    expect(eventos).not.toContain("Evento de outra escola (apps)");
    expect(eventos).not.toContain("Evento antigo (apps)");
    const reunioes = b.reunioes.map((r: { titulo: string }) => r.titulo);
    expect(reunioes).toEqual(["Reunião da 3A (apps)"]);
    expect(b.reunioes[0].ata).toBeUndefined();
    expect(b.plantoes).toHaveLength(1);
    expect(b.plantoes[0].profissionais).toBeUndefined();
  });

  it("agenda valida o parâmetro dias", async () => {
    const res = await get("resp-apps@teste.local", "/api/portal/meu/agenda?dias=999");
    expect(res.statusCode).toBe(400);
  });

  it("cardápio só da escola do filho e sem quantidades por aluno", async () => {
    const res = await get("resp-apps@teste.local", "/api/portal/meu/cardapio");
    expect(res.statusCode).toBe(200);
    const descr = res.json().refeicoes.map((r: { descricao: string }) => r.descricao);
    expect(descr).toContain("Cuscuz com ovo (apps)");
    expect(descr).not.toContain("Cardápio de outra escola (apps)");
    expect(res.json().refeicoes[0].itens).toBeUndefined();
  });

  it("contatos: só as escolas do usuário", async () => {
    const res = await get("resp-apps@teste.local", "/api/portal/meu/escolas");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { id: ids.escola, nome: "Escola Fictícia Apps", telefone: "(00) 0000-0000", email: "escola@exemplo.test", endereco: null },
    ]);
    const semVinculo = await get("outro-apps@teste.local", "/api/portal/meu/escolas");
    expect(semVinculo.json()).toEqual([]);
  });

  it("professor vê as escolas das turmas em que leciona", async () => {
    const res = await get("prof-apps@teste.local", "/api/portal/meu/escolas");
    expect(res.json().map((e: { id: string }) => e.id)).toEqual([ids.escola]);
  });

  it("meus dados mostra o próprio cadastro e os vínculos", async () => {
    const res = await get("resp-apps@teste.local", "/api/portal/meu/dados");
    expect(res.statusCode).toBe(200);
    const b = res.json();
    expect(b.usuario.email).toBe("resp-apps@teste.local");
    expect(b.usuario.password).toBeUndefined();
    expect(b.alunosVinculados).toEqual([
      { nomeAluno: "Aluna Fictícia Apps", numeroMatricula: "APP000001", parentesco: "Mãe", escola: "Escola Fictícia Apps", turma: "3A-APP" },
    ]);
    expect(b.sessoesAtivas).toBeGreaterThanOrEqual(1);
  });
});

describe("comunicados: lista e trava de destinatário", () => {
  it("professor vê os comunicados para professores da escola; responsável não", async () => {
    const prof = (await get("prof-apps@teste.local", "/api/portal/meu/comunicados")).json().map((c: { id: string }) => c.id);
    expect(prof).toContain(ids.comProf);
    expect(prof).not.toContain(ids.comVisivel);
    const resp = (await get("resp-apps@teste.local", "/api/portal/meu/comunicados")).json().map((c: { id: string }) => c.id);
    expect(resp).toContain(ids.comVisivel);
    expect(resp).not.toContain(ids.comProf);
  });

  it("marcar-lido/confirmar só em comunicado que é seu (senão 404)", async () => {
    expect((await post("resp-apps@teste.local", `/api/comunicados/${ids.comVisivel}/marcar-lido`)).statusCode).toBe(200);
    expect((await post("resp-apps@teste.local", `/api/comunicados/${ids.comVisivel}/confirmar`)).statusCode).toBe(200);
    expect((await post("resp-apps@teste.local", `/api/comunicados/${ids.comAlheio}/marcar-lido`)).statusCode).toBe(404);
    expect((await post("resp-apps@teste.local", `/api/comunicados/${ids.comProf}/confirmar`)).statusCode).toBe(404);
    expect(await prisma.comunicadoDestinatario.count({ where: { comunicadoId: { in: [ids.comAlheio, ids.comProf] } } })).toBe(0);
  });
});

describe("notificações são pessoais", () => {
  it("lê e marca as próprias", async () => {
    const lista = await get("resp-apps@teste.local", `/api/notificacoes/usuario/${ids.resp}`);
    expect(lista.statusCode).toBe(200);
    expect(lista.json().map((n: { id: string }) => n.id)).toEqual([ids.notifResp]);
    expect((await post("resp-apps@teste.local", `/api/notificacoes/${ids.notifResp}/marcar-lida`)).statusCode).toBe(200);
    expect((await post("resp-apps@teste.local", `/api/notificacoes/usuario/${ids.resp}/marcar-todas-lidas`)).statusCode).toBe(200);
  });

  it("não lê nem marca as de outra pessoa (inclusive professor)", async () => {
    expect((await get("prof-apps@teste.local", `/api/notificacoes/usuario/${ids.outro}`)).statusCode).toBe(403);
    expect((await get("prof-apps@teste.local", `/api/notificacoes/${ids.notifOutro}`)).statusCode).toBe(403);
    expect((await post("resp-apps@teste.local", `/api/notificacoes/${ids.notifOutro}/marcar-lida`)).statusCode).toBe(403);
    expect((await post("prof-apps@teste.local", `/api/notificacoes/usuario/${ids.outro}/marcar-todas-lidas`)).statusCode).toBe(403);
    const n = await prisma.notificacao.findUniqueOrThrow({ where: { id: ids.notifOutro } });
    expect(n.lida).toBe(false);
  });

  it("lista geral de notificações é só da equipe", async () => {
    expect((await get("prof-apps@teste.local", "/api/notificacoes")).statusCode).toBe(403);
  });
});

describe("horário da chamada", () => {
  it("chamada devolve registradaEm depois de salvar", async () => {
    const data = hoje.toISOString().slice(0, 10);
    const antes = await get("prof-apps@teste.local", `/api/portal/professor/turmas/${ids.turma}/chamada?data=${data}`);
    expect(antes.json().registradaEm).toBeNull();
    const aluno = antes.json().alunos[0];
    const salvar = await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: bearer(await token("prof-apps@teste.local")),
      payload: { turmaId: ids.turma, data, presencas: [{ matriculaId: aluno.id, status: "PRESENTE" }] },
    });
    expect(salvar.statusCode).toBeLessThan(300);
    const depois = await get("prof-apps@teste.local", `/api/portal/professor/turmas/${ids.turma}/chamada?data=${data}`);
    expect(depois.json().registradaEm).toEqual(expect.any(String));
  });
});
