// App mobile (tokens no corpo + Bearer) e propriedade de turma do PROFESSOR.
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;
let turmaDoProfessor: { id: string };
let outraTurma: { id: string };
let alunoDaTurma: { id: string };
let alunoOutraTurma: { id: string };
let disciplina: { id: string };
let profissional: { id: string };

async function loginMobile(email: string, password = SENHA) {
  const res = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password } });
  return { res, body: res.json() };
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
  _resetarLimiteLogin();
  await prisma.nota.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.frequencia.deleteMany();
  await prisma.turmaProfessor.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.sessaoRefresh.deleteMany();
  await prisma.user.deleteMany();

  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular Mobile" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental Mobile", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais Mobile", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "4º Ano Mobile", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia Mobile", codigo: "MOB-01" } });
  turmaDoProfessor = await prisma.turma.create({
    data: { nome: "4A-MOB", turno: "MATUTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id },
  });
  outraTurma = await prisma.turma.create({
    data: { nome: "4B-MOB", turno: "VESPERTINO", anoLetivo: 2026, escolaId: escola.id, serieId: serie.id },
  });
  const base = {
    anoLetivo: 2026, status: "ATIVA", dataNascimento: new Date("2016-02-10"), sexo: "M",
    nomeResponsavel: "Responsável Fictício", escolaId: escola.id, etapaId: etapa.id,
  };
  alunoDaTurma = await prisma.matricula.create({
    data: { ...base, numeroMatricula: "MOB000001", nomeAluno: "Aluno Fictício A", turmaId: turmaDoProfessor.id },
  });
  alunoOutraTurma = await prisma.matricula.create({
    data: { ...base, numeroMatricula: "MOB000002", nomeAluno: "Aluno Fictício B", turmaId: outraTurma.id },
  });
  disciplina = await prisma.disciplina.create({
    data: { nome: "Ciências Mobile", codigo: "CIE-MOB", etapaId: etapa.id },
  });
  profissional = await prisma.profissionalEducacao.create({
    data: { nome: "Professora Fictícia", cpf: "00000000191", tipo: "PROFESSOR" },
  });
  await prisma.turmaProfessor.create({
    data: { turmaId: turmaDoProfessor.id, profissionalId: profissional.id, tipo: "PROFESSOR" },
  });
  const hash = await bcrypt.hash(SENHA, 10);
  await prisma.user.create({
    data: { email: "prof@teste.local", nome: "Professora", role: "PROFESSOR", password: hash, profissionalId: profissional.id },
  });
  await prisma.user.create({
    data: { email: "prof-sem-vinculo@teste.local", nome: "Prof sem vínculo", role: "PROFESSOR", password: hash },
  });
  await prisma.user.create({ data: { email: "admin-mob@teste.local", nome: "Admin", role: "ADMIN", password: hash } });

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("auth do app mobile", () => {
  it("login devolve access + refresh no corpo e NÃO grava cookies", async () => {
    const { res, body } = await loginMobile("prof@teste.local");
    expect(res.statusCode).toBe(200);
    expect(typeof body.accessToken).toBe("string");
    expect(typeof body.refreshToken).toBe("string");
    expect(body.expiresIn).toBe(15 * 60);
    expect(body.user.role).toBe("PROFESSOR");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("senha errada → 401 com a mesma mensagem da web", async () => {
    const { res } = await loginMobile("prof@teste.local", "errada-errada-9");
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("Credenciais inválidas");
  });

  it("Bearer do app acessa /api/auth/me", async () => {
    const { body } = await loginMobile("prof@teste.local");
    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: bearer(body.accessToken) });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("prof@teste.local");
  });

  it("refresh rotaciona; reuso imediato → 409; logout revoga", async () => {
    const { body } = await loginMobile("prof@teste.local");
    const r1 = await app.inject({ method: "POST", url: "/api/auth/mobile/refresh", payload: { refreshToken: body.refreshToken } });
    expect(r1.statusCode).toBe(200);
    expect(r1.json().refreshToken).not.toBe(body.refreshToken);
    const r2 = await app.inject({ method: "POST", url: "/api/auth/mobile/refresh", payload: { refreshToken: body.refreshToken } });
    expect(r2.statusCode).toBe(409);

    const novo = r1.json().refreshToken;
    const out = await app.inject({ method: "POST", url: "/api/auth/mobile/logout", payload: { refreshToken: novo } });
    expect(out.statusCode).toBe(204);
    const r3 = await app.inject({ method: "POST", url: "/api/auth/mobile/refresh", payload: { refreshToken: novo } });
    expect(r3.statusCode).toBe(401);
  });

  it("refresh sem corpo válido → 401", async () => {
    const r = await app.inject({ method: "POST", url: "/api/auth/mobile/refresh", payload: {} });
    expect(r.statusCode).toBe(401);
  });
});

describe("professor só lança nas próprias turmas", () => {
  let token: string;
  beforeAll(async () => {
    token = (await loginMobile("prof@teste.local")).body.accessToken;
  });

  it("registra a chamada da própria turma", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: bearer(token),
      payload: { turmaId: turmaDoProfessor.id, data: "2026-09-21", presencas: [{ matriculaId: alunoDaTurma.id, status: "PRESENTE" }] },
    });
    expect(res.statusCode).toBeLessThan(300);
    // Relançar o mesmo dia substitui (não duplica)
    await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: bearer(token),
      payload: { turmaId: turmaDoProfessor.id, data: "2026-09-21", presencas: [{ matriculaId: alunoDaTurma.id, status: "FALTA" }] },
    });
    const regs = await prisma.frequencia.findMany({ where: { turmaId: turmaDoProfessor.id } });
    expect(regs).toHaveLength(1);
    expect(regs[0].status).toBe("FALTA");
  });

  it("NÃO registra chamada de turma alheia → 403 PERM_TURMA", async () => {
    const res = await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: bearer(token),
      payload: { turmaId: outraTurma.id, data: "2026-09-21", presencas: [{ matriculaId: alunoOutraTurma.id, status: "FALTA" }] },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe("PERM_TURMA");
  });

  it("professor sem profissional vinculado não lança nada", async () => {
    const t = (await loginMobile("prof-sem-vinculo@teste.local")).body.accessToken;
    const res = await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: bearer(t),
      payload: { turmaId: turmaDoProfessor.id, data: "2026-09-22", presencas: [] },
    });
    expect(res.statusCode).toBe(403);
  });

  it("cria avaliação na própria turma (autoria forçada) e lança notas", async () => {
    const criar = await app.inject({
      method: "POST", url: "/api/avaliacoes", headers: bearer(token),
      payload: {
        nome: "Prova 1", tipo: "PROVA", data: "2026-09-20", bimestre: 3,
        turmaId: turmaDoProfessor.id, disciplinaId: disciplina.id, profissionalId: "outro-qualquer",
      },
    });
    expect(criar.statusCode).toBe(201);
    const avaliacao = criar.json();
    expect(avaliacao.profissional.id).toBe(profissional.id);

    const lista = await app.inject({
      method: "GET", url: `/api/avaliacoes?turmaId=${turmaDoProfessor.id}&disciplinaId=${disciplina.id}`,
      headers: bearer(token),
    });
    expect(lista.statusCode).toBe(200);
    expect(lista.json()).toHaveLength(1);

    const notas = await app.inject({
      method: "POST", url: "/api/notas/turma", headers: bearer(token),
      payload: { avaliacaoId: avaliacao.id, notas: [{ matriculaId: alunoDaTurma.id, valor: 8.5 }] },
    });
    expect(notas.statusCode).toBeLessThan(300);
  });

  it("NÃO cria avaliação nem lança nota em turma alheia", async () => {
    const criar = await app.inject({
      method: "POST", url: "/api/avaliacoes", headers: bearer(token),
      payload: { nome: "Intrusa", tipo: "PROVA", data: "2026-09-20", bimestre: 3, turmaId: outraTurma.id, disciplinaId: disciplina.id },
    });
    expect(criar.statusCode).toBe(403);

    const admin = (await loginMobile("admin-mob@teste.local")).body.accessToken;
    const avaliacaoAlheia = await app.inject({
      method: "POST", url: "/api/avaliacoes", headers: bearer(admin),
      payload: { nome: "Da 4B", tipo: "PROVA", data: "2026-09-20", bimestre: 3, turmaId: outraTurma.id, disciplinaId: disciplina.id },
    });
    expect(avaliacaoAlheia.statusCode).toBe(201);
    const nota = await app.inject({
      method: "POST", url: "/api/notas/turma", headers: bearer(token),
      payload: { avaliacaoId: avaliacaoAlheia.json().id, notas: [{ matriculaId: alunoOutraTurma.id, valor: 10 }] },
    });
    expect(nota.statusCode).toBe(403);
  });

  it("ADMIN não sofre a restrição de turma", async () => {
    const admin = (await loginMobile("admin-mob@teste.local")).body.accessToken;
    const res = await app.inject({
      method: "POST", url: "/api/frequencia/turma", headers: bearer(admin),
      payload: { turmaId: outraTurma.id, data: "2026-09-21", presencas: [{ matriculaId: alunoOutraTurma.id, status: "PRESENTE" }] },
    });
    expect(res.statusCode).toBeLessThan(300);
  });
});

describe("portal para o app (professor e responsável)", () => {
  it("chamada da própria turma traz só campos mínimos e o status do dia", async () => {
    const token = (await loginMobile("prof@teste.local")).body.accessToken;
    const res = await app.inject({
      method: "GET", url: `/api/portal/professor/turmas/${turmaDoProfessor.id}/chamada?data=2026-09-21`,
      headers: bearer(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.jaRegistrada).toBe(true);
    expect(body.alunos).toHaveLength(1);
    expect(Object.keys(body.alunos[0]).sort()).toEqual(
      ["id", "justificativa", "nomeAluno", "numeroMatricula", "status"].sort()
    );
  });

  it("chamada/notas de turma alheia → 403", async () => {
    const token = (await loginMobile("prof@teste.local")).body.accessToken;
    for (const sufixo of ["chamada", "notas"]) {
      const res = await app.inject({
        method: "GET", url: `/api/portal/professor/turmas/${outraTurma.id}/${sufixo}`, headers: bearer(token),
      });
      expect(res.statusCode).toBe(403);
    }
  });

  it("notas da turma traz disciplinas da etapa, avaliações e alunos", async () => {
    const token = (await loginMobile("prof@teste.local")).body.accessToken;
    const res = await app.inject({
      method: "GET", url: `/api/portal/professor/turmas/${turmaDoProfessor.id}/notas`, headers: bearer(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.disciplinas.map((d: { id: string }) => d.id)).toContain(disciplina.id);
    expect(body.avaliacoes.length).toBeGreaterThan(0);
    expect(body.alunos).toHaveLength(1);
  });

  it("responsável vê comunicados da escola do filho e confirma só em nome próprio", async () => {
    const hash = await bcrypt.hash(SENHA, 10);
    const resp = await prisma.user.create({
      data: { email: "resp-mob@teste.local", nome: "Responsável", role: "RESPONSAVEL", password: hash },
    });
    const outro = await prisma.user.create({
      data: { email: "outro-mob@teste.local", nome: "Outro", role: "RESPONSAVEL", password: hash },
    });
    await prisma.matriculaUsuario.create({ data: { matriculaId: alunoDaTurma.id, userId: resp.id } });
    const escolaDoAluno = (await prisma.matricula.findUniqueOrThrow({ where: { id: alunoDaTurma.id } })).escolaId;
    const escolaAlheia = await prisma.escola.create({ data: { nome: "Escola Alheia", codigo: "MOB-99" } });
    const visivel = await prisma.comunicado.create({
      data: { titulo: "Reunião de pais", mensagem: "Texto", tipo: "AVISO", destinatarios: "PAIS", autorNome: "Direção", escolaId: escolaDoAluno },
    });
    await prisma.comunicado.create({
      data: { titulo: "De outra escola", mensagem: "Texto", tipo: "AVISO", destinatarios: "TODOS", autorNome: "X", escolaId: escolaAlheia.id },
    });
    await prisma.comunicado.create({
      data: { titulo: "Só professores", mensagem: "Texto", tipo: "AVISO", destinatarios: "PROFESSORES", autorNome: "X", escolaId: escolaDoAluno },
    });

    const token = (await loginMobile("resp-mob@teste.local")).body.accessToken;
    const lista = await app.inject({ method: "GET", url: "/api/portal/meu/comunicados", headers: bearer(token) });
    expect(lista.statusCode).toBe(200);
    expect(lista.json().map((c: { titulo: string }) => c.titulo)).toEqual(["Reunião de pais"]);

    // Tenta confirmar "em nome" de outro usuário: o servidor usa a sessão
    const conf = await app.inject({
      method: "POST", url: `/api/comunicados/${visivel.id}/confirmar`, headers: bearer(token),
      payload: { userId: outro.id },
    });
    expect(conf.statusCode).toBe(200);
    const registros = await prisma.comunicadoDestinatario.findMany({ where: { comunicadoId: visivel.id } });
    expect(registros.map((r) => r.userId)).toEqual([resp.id]);

    const depois = await app.inject({ method: "GET", url: "/api/portal/meu/comunicados", headers: bearer(token) });
    expect(depois.json()[0].confirmado).toBe(true);
  });
});

describe("resumo do professor usa o dia da Bahia, não o do servidor (UTC)", () => {
  it("às 23h40 de quinta na Bahia (02h40 de sexta em UTC) mostra as aulas de quinta", async () => {
    await prisma.gradeHoraria.create({
      data: {
        turmaId: turmaDoProfessor.id, diaSemana: "QUINTA", horaInicio: "07:30", horaFim: "08:20",
        disciplina: "Ciências", profissionalId: profissional.id,
      },
    });
    const token = (await loginMobile("prof@teste.local")).body.accessToken;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T02:40:00Z"));
    try {
      const res = await app.inject({ method: "GET", url: "/api/portal/professor/resumo", headers: bearer(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json().aulasHoje.map((a: { turmaId: string }) => a.turmaId)).toContain(turmaDoProfessor.id);
    } finally {
      vi.useRealTimers();
    }
  });
});
