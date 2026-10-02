// Notificações só para quem está no escopo do remetente; lista pessoal com
// limite; planejamento sem atividade de outra escola e com status conferido
// na própria escrita; acesso de responsável não reaproveita conta de
// servidor. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { planejamentoService } from "../src/services/planejamento.service.js";
import { matriculaService } from "../src/services/matricula.service.js";
import { LIMITE_NOTIFICACOES_USUARIO } from "../src/services/notificacao.service.js";
import { cenarioDuasEscolas, entrar } from "./fb-cenario.js";

let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
const ids: Record<string, string> = {};
const tokens = new Map<string, { authorization: string }>();
const req = async (email: string, method: string, url: string, payload?: unknown) => {
  if (!tokens.has(email)) tokens.set(email, await entrar(app, email));
  return app.inject({ method: method as "GET", url, headers: tokens.get(email)!, ...(payload ? { payload: payload as object } : {}) });
};
const aviso = (extra: Record<string, unknown>) => ({ titulo: "Aviso fictício", mensagem: "Texto", tipo: "LEMBRETE", ...extra });

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas("fb73");
  // Professor que leciona nas DUAS escolas (planejamento)
  const profAB = await prisma.profissionalEducacao.create({ data: { nome: "Prof AB fb73", cpf: "00000073009", tipo: "PROFESSOR" } });
  await prisma.turmaProfessor.createMany({
    data: [
      { turmaId: c.turmaA.id, profissionalId: profAB.id, tipo: "PROFESSOR" },
      { turmaId: c.turmaB.id, profissionalId: profAB.id, tipo: "PROFESSOR" },
    ],
  });
  const uProfAB = await prisma.user.findUniqueOrThrow({ where: { id: c.uProfA.id } }).then(async (modelo) =>
    prisma.user.create({ data: { email: "prof-ab-fb73@teste.local", nome: "Prof AB", role: "PROFESSOR", password: modelo.password, profissionalId: profAB.id } })
  );
  ids.uProfAB = uProfAB.id;
  const lp = await prisma.disciplina.create({ data: { nome: "Português fb73", codigo: "LP-FB73", etapaId: c.etapa.id } });
  ids.lp = lp.id;
  const atividade = (escolaId: string | null, titulo: string) =>
    prisma.atividadePedagogica.create({
      data: { titulo, tipo: "JOGO", descricao: "Fictícia", disciplinaId: lp.id, escolaId, autorId: c.uAdmin.id },
    });
  ids.atvRede = (await atividade(null, "Atividade da rede")).id;
  ids.atvA = (await atividade(c.escolaA.id, "Atividade da A")).id;
  ids.atvB = (await atividade(c.escolaB.id, "Atividade da B")).id;

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  vi.restoreAllMocks();
  await app.close();
  // Planos e atividades têm FK "Restrict" para usuário/atividade: limpa o que
  // este arquivo criou para não travar a limpeza (deleteMany) de outros arquivos
  await prisma.planoAulaAtividade.deleteMany({ where: { atividade: { disciplinaId: ids.lp } } });
  await prisma.planoAula.deleteMany({ where: { disciplinaId: ids.lp } });
  await prisma.atividadePedagogica.deleteMany({ where: { disciplinaId: ids.lp } });
  await prisma.disciplina.deleteMany({ where: { id: ids.lp } });
});

describe("notificações: destinatário precisa estar no escopo do remetente", () => {
  const enviar = (email: string, userId: string) => req(email, "POST", "/api/notificacoes", aviso({ userId }));

  it("professor A notifica colega e responsável de aluno da sua turma", async () => {
    expect((await enviar(c.uProfA.email, c.uSecA.id)).statusCode).toBe(201);
    expect((await enviar(c.uProfA.email, c.uRespA.id)).statusCode).toBe(201);
  });

  it("professor A NÃO notifica professor/responsável da escola B, responsável de outra turma, nem a gestão", async () => {
    for (const alvo of [c.uProfB.id, c.uRespB.id, c.uRespA2.id, c.uAdmin.id, c.uSemVinculo.id]) {
      const r = await enviar(c.uProfA.email, alvo);
      expect(r.statusCode).toBe(403);
    }
    expect(await prisma.notificacao.count({ where: { userId: { in: [c.uProfB.id, c.uRespB.id, c.uRespA2.id, c.uAdmin.id] } } })).toBe(0);
  });

  it("em massa: um destinatário fora do escopo barra o lote inteiro", async () => {
    const antes = await prisma.notificacao.count({ where: { userId: c.uSecA.id } });
    const r = await req(c.uProfA.email, "POST", "/api/notificacoes/bulk", aviso({ userIds: [c.uSecA.id, c.uProfB.id] }));
    expect(r.statusCode).toBe(403);
    expect(await prisma.notificacao.count({ where: { userId: c.uSecA.id } })).toBe(antes);
  });

  it("secretaria A alcança os responsáveis da escola A (qualquer turma), não os da B; gestão alcança todos", async () => {
    expect((await enviar(c.uSecA.email, c.uRespA2.id)).statusCode).toBe(201);
    expect((await enviar(c.uSecA.email, c.uRespB.id)).statusCode).toBe(403);
    expect((await enviar(c.uAdmin.email, c.uRespB.id)).statusCode).toBe(201);
  });

  it("lista pessoal tem limite padrão e continua sendo um array", async () => {
    await prisma.notificacao.createMany({
      data: Array.from({ length: LIMITE_NOTIFICACOES_USUARIO + 5 }, (_, i) => ({
        userId: c.uRespB.id, titulo: `N${i}`, mensagem: "x", tipo: "SISTEMA", canais: ["APP"],
      })),
    });
    const r = await req(c.uRespB.email, "GET", `/api/notificacoes/usuario/${c.uRespB.id}`);
    expect(r.statusCode).toBe(200);
    expect(Array.isArray(r.json())).toBe(true);
    expect(r.json()).toHaveLength(LIMITE_NOTIFICACOES_USUARIO);
  });
});

describe("planejamento", () => {
  const plano = (extra: Record<string, unknown> = {}) => ({
    turmaId: c.turmaA.id, disciplinaId: ids.lp, bimestre: 1, dataAula: "2032-03-10",
    titulo: "Plano fictício", objetivos: "Objetivo", ...extra,
  });

  it("plano da turma da A não liga atividade da escola B (mesmo para quem leciona nas duas)", async () => {
    const email = "prof-ab-fb73@teste.local";
    const r = await req(email, "POST", "/api/planejamento/planos", plano({ atividades: [ids.atvB] }));
    expect(r.statusCode).toBe(404);
    expect(await prisma.planoAulaAtividade.count({ where: { atividadeId: ids.atvB } })).toBe(0);
    const ok = await req(email, "POST", "/api/planejamento/planos", plano({ atividades: [ids.atvRede, ids.atvA] }));
    expect(ok.statusCode).toBe(201);
    ids.plano = ok.json().id;
    // nem na atualização
    const upd = await req(email, "PUT", `/api/planejamento/planos/${ids.plano}`, { atividades: [ids.atvB] });
    expect(upd.statusCode).toBe(404);
  });

  it("status conferido na própria escrita: leitura velha não grava (409)", async () => {
    const u = { id: ids.uProfAB, role: "PROFESSOR" };
    // O plano já foi ENVIADO por outra operação, mas a leitura (velha) diz RASCUNHO
    await prisma.planoAula.update({ where: { id: ids.plano }, data: { status: "ENVIADO" } });
    const velho = { id: ids.plano, autorId: u.id, status: "RASCUNHO", turmaId: c.turmaA.id, disciplinaId: ids.lp };
    const espiao = vi.spyOn(planejamentoService as unknown as { planoDoAutor: () => Promise<unknown> }, "planoDoAutor");

    espiao.mockResolvedValueOnce(velho);
    await expect(planejamentoService.atualizarPlano(ids.plano, { titulo: "Alterado depois do envio" }, u))
      .rejects.toMatchObject({ code: "BIZ_039", statusCode: 409 });
    espiao.mockResolvedValueOnce(velho);
    await expect(planejamentoService.enviarPlano(ids.plano, u)).rejects.toMatchObject({ code: "BIZ_039" });
    espiao.mockResolvedValueOnce(velho);
    await expect(planejamentoService.removerPlano(ids.plano, u)).rejects.toMatchObject({ code: "BIZ_039" });
    espiao.mockRestore();

    const p = await prisma.planoAula.findUniqueOrThrow({ where: { id: ids.plano } });
    expect(p.titulo).toBe("Plano fictício");
    expect(p.status).toBe("ENVIADO");
  });

  it("revisão conferida na escrita: decisão sobre leitura velha dá conflito", async () => {
    const coord = { id: c.uAdmin.id, role: "ADMIN" };
    await planejamentoService.revisarPlano(ids.plano, { decisao: "APROVADO" } as never, coord);
    // Outra revisão leu "ENVIADO" antes da aprovação acima e só agora grava
    const espiao = vi
      .spyOn(prisma.planoAula, "findFirst")
      .mockResolvedValueOnce({ status: "ENVIADO", autorId: ids.uProfAB } as never);
    await expect(planejamentoService.revisarPlano(ids.plano, { decisao: "DEVOLVIDO", parecer: "x" } as never, coord))
      .rejects.toMatchObject({ code: "BIZ_039" });
    expect(espiao).toHaveBeenCalled();
    espiao.mockRestore();
    expect((await prisma.planoAula.findUniqueOrThrow({ where: { id: ids.plano } })).status).toBe("APROVADO");
  });
});

describe("acesso de responsável", () => {
  it("e-mail de conta de servidor (papel ≠ RESPONSAVEL) é recusado, sem vínculo criado", async () => {
    for (const u of [c.uProfA, c.uSecA, c.uAdmin, c.uSemVinculo]) {
      await expect(matriculaService.criarAcesso(c.matA.id, { email: u.email, tipoVinculo: "RESPONSAVEL" } as never))
        .rejects.toMatchObject({ statusCode: 409 });
    }
    expect(await prisma.matriculaUsuario.count({ where: { userId: { in: [c.uProfA.id, c.uSecA.id, c.uAdmin.id, c.uSemVinculo.id] } } })).toBe(0);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: c.uProfA.id } });
    expect(u.role).toBe("PROFESSOR");
  });

  it("conta de responsável existente continua sendo reaproveitada", async () => {
    const v = await matriculaService.criarAcesso(c.matA2.id, { email: c.uRespA.email, tipoVinculo: "RESPONSAVEL" } as never);
    expect(v.userId).toBe(c.uRespA.id);
  });
});
