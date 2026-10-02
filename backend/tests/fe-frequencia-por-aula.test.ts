// Frente E — frequência POR AULA (Fundamental II: Matemática às 7h e
// Português às 9h têm chamadas separadas). Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { frequenciaService } from "../src/services/frequencia.service.js";
import { portalService } from "../src/services/portal.service.js";
import { notaService } from "../src/services/nota.service.js";
import { exportacaoPresencaService } from "../src/services/exportacao-presenca.service.js";
import { criarEstrutura, criarAluno } from "./fd-fixture.js";

const SENHA = "senha-de-teste-forte-fe-123";
// 2026-03-02 = segunda-feira; 2026-03-03 = terça; 2026-03-04 = quarta
const SEGUNDA = "2026-03-02";
const TERCA = "2026-03-03";

let app: FastifyInstance;
let e: Awaited<ReturnType<typeof criarEstrutura>>;
let infantil: Awaited<ReturnType<typeof criarEstrutura>>;
let ana: { id: string }, beto: { id: string }, cris: { id: string };
let profA: { id: string }, profB: { id: string };
let mat: { id: string }, port: { id: string }, artes: { id: string }, cienciasA: { id: string }, aulaTerca: { id: string };
let tokenA: string, tokenB: string, tokenAdmin: string;

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
async function login(email: string) {
  const res = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
  return res.json().accessToken as string;
}
const chamada = (token: string, payload: Record<string, unknown>) =>
  app.inject({ method: "POST", url: "/api/frequencia/turma", headers: bearer(token), payload });
const registros = (turmaId: string, data: string) =>
  prisma.frequencia.findMany({ where: { turmaId, data: new Date(data) }, orderBy: [{ horaInicio: "asc" }] });

beforeAll(async () => {
  _resetarLimiteLogin();
  e = await criarEstrutura("FEA");
  infantil = await criarEstrutura("FEI");
  ana = await criarAluno("FEA", e, "Ana FEA");
  beto = await criarAluno("FEA", e, "Beto FEA");
  cris = await criarAluno("FEI", infantil, "Cris FEI");

  profA = await prisma.profissionalEducacao.create({ data: { nome: "Prof Matemática FE", cpf: "00000000FE1", tipo: "PROFESSOR" } });
  profB = await prisma.profissionalEducacao.create({ data: { nome: "Prof Português FE", cpf: "00000000FE2", tipo: "PROFESSOR" } });
  for (const p of [profA, profB]) {
    await prisma.turmaProfessor.create({ data: { turmaId: e.turma.id, profissionalId: p.id, tipo: "PROFESSOR" } });
  }
  await prisma.turmaProfessor.create({ data: { turmaId: infantil.turma.id, profissionalId: profA.id, tipo: "PROFESSOR" } });

  const aula = (diaSemana: string, horaInicio: string, horaFim: string, disciplina: string, profissionalId: string | null) =>
    prisma.gradeHoraria.create({ data: { turmaId: e.turma.id, diaSemana, horaInicio, horaFim, disciplina, profissionalId } });
  mat = await aula("SEGUNDA", "07:00", "07:50", "Matemática", profA.id);
  port = await aula("SEGUNDA", "09:00", "09:50", "Português", profB.id);
  artes = await aula("SEGUNDA", "10:00", "10:50", "Artes", null);
  cienciasA = await aula("SEGUNDA", "11:00", "11:50", "Ciências", profA.id);
  aulaTerca = await aula("TERCA", "07:00", "07:50", "História", profB.id);

  const hash = await bcrypt.hash(SENHA, 10);
  await prisma.user.create({ data: { email: "fe-prof-a@teste.local", nome: "Prof A FE", role: "PROFESSOR", password: hash, profissionalId: profA.id } });
  await prisma.user.create({ data: { email: "fe-prof-b@teste.local", nome: "Prof B FE", role: "PROFESSOR", password: hash, profissionalId: profB.id } });
  await prisma.user.create({ data: { email: "fe-admin@teste.local", nome: "Admin FE", role: "ADMIN", password: hash } });

  app = await buildApp();
  await app.ready();
  tokenA = await login("fe-prof-a@teste.local");
  tokenB = await login("fe-prof-b@teste.local");
  tokenAdmin = await login("fe-admin@teste.local");
});

afterAll(async () => {
  await app.close();
});

describe("duas aulas no mesmo dia, professores diferentes", () => {
  it("Matemática (7h) e Português (9h) não se sobrescrevem", async () => {
    const r1 = await chamada(tokenA, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: mat.id,
      presencas: [{ matriculaId: ana.id, status: "PRESENTE" }, { matriculaId: beto.id, status: "FALTA" }],
    });
    expect(r1.statusCode).toBe(201);
    expect(r1.json().aula).toMatchObject({ gradeHorariaId: mat.id, disciplina: "Matemática", horaInicio: "07:00" });

    const r2 = await chamada(tokenB, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: port.id,
      presencas: [{ matriculaId: ana.id, status: "FALTA" }, { matriculaId: beto.id, status: "PRESENTE" }],
    });
    expect(r2.statusCode).toBe(201);

    const regs = await registros(e.turma.id, SEGUNDA);
    expect(regs).toHaveLength(4);
    const de = (aulaId: string, matriculaId: string) =>
      regs.find((r) => r.aulaChave === aulaId && r.matriculaId === matriculaId);
    expect(de(mat.id, ana.id)).toMatchObject({ status: "PRESENTE", disciplina: "Matemática", horaInicio: "07:00", gradeHorariaId: mat.id });
    expect(de(mat.id, beto.id)).toMatchObject({ status: "FALTA" });
    expect(de(port.id, ana.id)).toMatchObject({ status: "FALTA", disciplina: "Português", horaInicio: "09:00" });
    expect(de(port.id, beto.id)).toMatchObject({ status: "PRESENTE" });
  });

  it("professor NÃO lança aula de outro professor (403 PERM_AULA)", async () => {
    const r = await chamada(tokenA, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: port.id,
      presencas: [{ matriculaId: ana.id, status: "PRESENTE" }],
    });
    expect(r.statusCode).toBe(403);
    expect(r.json().code).toBe("PERM_AULA");
    // nada mudou na chamada do professor B
    const reg = await prisma.frequencia.findFirst({ where: { matriculaId: ana.id, aulaChave: port.id } });
    expect(reg?.status).toBe("FALTA");
  });

  it("professor NÃO corrige (PATCH) nem apaga registro da aula de outro professor", async () => {
    const reg = await prisma.frequencia.findFirstOrThrow({ where: { matriculaId: ana.id, aulaChave: port.id } });
    const patchA = await app.inject({ method: "PATCH", url: `/api/frequencia/${reg.id}`, headers: bearer(tokenA), payload: { status: "PRESENTE" } });
    expect(patchA.statusCode).toBe(403);
    const delA = await app.inject({ method: "DELETE", url: `/api/frequencia/${reg.id}`, headers: bearer(tokenA) });
    expect(delA.statusCode).toBe(403);
    const patchB = await app.inject({ method: "PATCH", url: `/api/frequencia/${reg.id}`, headers: bearer(tokenB), payload: { observacao: "Chegou atrasada (fictício)" } });
    expect(patchB.statusCode).toBe(200);
  });

  it("aula sem professor na grade: qualquer professor da turma lança", async () => {
    const r = await chamada(tokenA, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: artes.id,
      presencas: [{ matriculaId: ana.id, status: "PRESENTE" }],
    });
    expect(r.statusCode).toBe(201);
  });

  it("gestão lança qualquer aula da turma", async () => {
    const r = await chamada(tokenAdmin, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: port.id,
      presencas: [{ matriculaId: beto.id, status: "PRESENTE" }],
    });
    expect(r.statusCode).toBe(201);
  });
});

describe("chamada diária × por aula (sem mistura)", () => {
  it("turma sem grade no dia segue com chamada diária (aulaChave DIA)", async () => {
    const r = await chamada(tokenA, {
      turmaId: infantil.turma.id, data: SEGUNDA,
      presencas: [{ matriculaId: cris.id, status: "PRESENTE" }],
    });
    expect(r.statusCode).toBe(201);
    expect(r.json().aula).toBeNull();
    const regs = await registros(infantil.turma.id, SEGUNDA);
    expect(regs).toHaveLength(1);
    expect(regs[0]).toMatchObject({ aulaChave: "DIA", gradeHorariaId: null, disciplina: null, horaInicio: null });
    // reenvio do dia atualiza o mesmo registro
    await chamada(tokenA, { turmaId: infantil.turma.id, data: SEGUNDA, presencas: [{ matriculaId: cris.id, status: "FALTA" }] });
    const depois = await registros(infantil.turma.id, SEGUNDA);
    expect(depois).toHaveLength(1);
    expect(depois[0].status).toBe("FALTA");
  });

  it("recusa chamada diária num dia que tem grade", async () => {
    const r = await chamada(tokenAdmin, { turmaId: e.turma.id, data: SEGUNDA, presencas: [{ matriculaId: ana.id, status: "PRESENTE" }] });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatch(/informe a aula/);
  });

  it("recusa chamada por aula em turma sem grade no dia", async () => {
    const r = await chamada(tokenAdmin, {
      turmaId: infantil.turma.id, data: SEGUNDA, gradeHorariaId: mat.id,
      presencas: [{ matriculaId: cris.id, status: "PRESENTE" }],
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatch(/não tem aulas na grade/);
  });

  it("recusa aula de outro dia da semana e aula inexistente", async () => {
    const outroDia = await chamada(tokenAdmin, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: aulaTerca.id,
      presencas: [{ matriculaId: ana.id, status: "PRESENTE" }],
    });
    expect(outroDia.statusCode).toBe(400);
    expect(outroDia.json().error).toMatch(/não é desta turma neste dia/);
    const inexistente = await chamada(tokenAdmin, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: "aula-inexistente-fe",
      presencas: [{ matriculaId: ana.id, status: "PRESENTE" }],
    });
    expect(inexistente.statusCode).toBe(400);
  });

  it("POST /api/frequencia (registro avulso) segue a mesma regra", async () => {
    const semAula = await app.inject({
      method: "POST", url: "/api/frequencia", headers: bearer(tokenAdmin),
      payload: { matriculaId: ana.id, turmaId: e.turma.id, data: TERCA, status: "PRESENTE" },
    });
    expect(semAula.statusCode).toBe(400);
    const comAula = await app.inject({
      method: "POST", url: "/api/frequencia", headers: bearer(tokenAdmin),
      payload: { matriculaId: ana.id, turmaId: e.turma.id, data: TERCA, status: "PRESENTE", gradeHorariaId: aulaTerca.id },
    });
    expect(comAula.statusCode).toBe(201);
    expect(comAula.json()).toMatchObject({ aulaChave: aulaTerca.id, disciplina: "História" });
    // professor A não lança a aula de terça (é do professor B)
    const profAvulso = await app.inject({
      method: "POST", url: "/api/frequencia", headers: bearer(tokenA),
      payload: { matriculaId: beto.id, turmaId: e.turma.id, data: TERCA, status: "PRESENTE", gradeHorariaId: aulaTerca.id },
    });
    expect(profAvulso.statusCode).toBe(403);
  });
});

describe("reenvio da chamada de uma aula", () => {
  it("preserva a justificativa lançada pela secretaria e não toca nas outras aulas", async () => {
    const reg = await prisma.frequencia.findFirstOrThrow({ where: { matriculaId: beto.id, aulaChave: mat.id } });
    await frequenciaService.update(reg.id, { status: "JUSTIFICADA", justificativa: "Atestado (fictício)" });
    const r = await chamada(tokenA, {
      turmaId: e.turma.id, data: SEGUNDA, gradeHorariaId: mat.id,
      presencas: [{ matriculaId: beto.id, status: "JUSTIFICADA" }],
    });
    expect(r.statusCode).toBe(201);
    const depois = await prisma.frequencia.findFirstOrThrow({ where: { matriculaId: beto.id, aulaChave: mat.id } });
    expect(depois).toMatchObject({ status: "JUSTIFICADA", justificativa: "Atestado (fictício)" });
    const portugues = await prisma.frequencia.findFirstOrThrow({ where: { matriculaId: beto.id, aulaChave: port.id } });
    expect(portugues.status).toBe("PRESENTE");
    expect(portugues.justificativa).toBeNull();
  });
});

describe("consultas da chamada do dia", () => {
  it("aulas do dia: professor vê só as dele e as sem professor; gestão vê todas", async () => {
    const rA = await app.inject({ method: "GET", url: `/api/frequencia/turma/${e.turma.id}/aulas/${SEGUNDA}`, headers: bearer(tokenA) });
    expect(rA.statusCode).toBe(200);
    const bodyA = rA.json();
    expect(bodyA.modo).toBe("AULA");
    expect(bodyA.diaSemana).toBe("SEGUNDA");
    expect(bodyA.aulas.map((a: { disciplina: string }) => a.disciplina)).toEqual(["Matemática", "Artes", "Ciências"]);
    const matA = bodyA.aulas.find((a: { gradeHorariaId: string }) => a.gradeHorariaId === mat.id);
    expect(matA.totalRegistros).toBe(2);
    expect(typeof matA.registradaEm).toBe("string");
    expect(matA.profissional).toMatchObject({ id: profA.id, nome: "Prof Matemática FE" });
    const artesA = bodyA.aulas.find((a: { gradeHorariaId: string }) => a.gradeHorariaId === artes.id);
    expect(artesA.profissional).toBeNull();
    const cienciasDeA = bodyA.aulas.find((a: { gradeHorariaId: string }) => a.gradeHorariaId === cienciasA.id);
    expect(cienciasDeA).toMatchObject({ totalRegistros: 0, registradaEm: null });

    const rAdmin = await app.inject({ method: "GET", url: `/api/frequencia/turma/${e.turma.id}/aulas/${SEGUNDA}`, headers: bearer(tokenAdmin) });
    expect(rAdmin.json().aulas).toHaveLength(4);

    const rInf = await app.inject({ method: "GET", url: `/api/frequencia/turma/${infantil.turma.id}/aulas/${SEGUNDA}`, headers: bearer(tokenA) });
    expect(rInf.json()).toMatchObject({ modo: "DIA", aulas: [], chamadaDiaria: { totalRegistros: 1 } });

    // professor sem vínculo com a turma não enxerga a turma
    const rB = await app.inject({ method: "GET", url: `/api/frequencia/turma/${infantil.turma.id}/aulas/${SEGUNDA}`, headers: bearer(tokenB) });
    expect(rB.statusCode).toBe(404);
  });

  it("chamada de um dia devolve por aula (com filtro por aula)", async () => {
    const todas = await app.inject({ method: "GET", url: `/api/frequencia/turma/${e.turma.id}/data/${SEGUNDA}`, headers: bearer(tokenAdmin) });
    expect(todas.statusCode).toBe(200);
    const lista = todas.json() as Array<{ aulaChave: string; disciplina: string; horaInicio: string; gradeHorariaId: string }>;
    expect(new Set(lista.map((r) => r.aulaChave))).toEqual(new Set([mat.id, port.id, artes.id]));
    expect(lista[0]).toMatchObject({ disciplina: "Matemática", horaInicio: "07:00", gradeHorariaId: mat.id });

    const so = await app.inject({ method: "GET", url: `/api/frequencia/turma/${e.turma.id}/data/${SEGUNDA}?aulaChave=${port.id}`, headers: bearer(tokenAdmin) });
    expect((so.json() as Array<{ aulaChave: string }>).every((r) => r.aulaChave === port.id)).toBe(true);
    expect(so.json()).toHaveLength(2);
  });

  it("lista geral traz os campos da aula e mantém null (não \"\")", async () => {
    const r = await app.inject({ method: "GET", url: `/api/frequencia?turmaId=${infantil.turma.id}`, headers: bearer(tokenAdmin) });
    expect(r.statusCode).toBe(200);
    const [reg] = r.json();
    expect(reg).toMatchObject({ aulaChave: "DIA", gradeHorariaId: null, disciplina: null, horaInicio: null, justificativa: null });
    expect(reg.matricula).toMatchObject({ id: cris.id, nomeAluno: "Cris FEI" });
  });

  it("chamada do app (portal): modo AULA com as aulas do professor e os registros de cada uma", async () => {
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: "fe-prof-a@teste.local" } });
    const c = await portalService.chamadaDaTurma(userA.id, e.turma.id, new Date(SEGUNDA));
    expect(c.modo).toBe("AULA");
    expect(c.aulas.map((a) => a.gradeHorariaId)).toEqual([mat.id, artes.id, cienciasA.id]);
    const aulaMat = c.aulas[0];
    expect(aulaMat).toMatchObject({ disciplina: "Matemática", jaRegistrada: true, professorNome: "Prof Matemática FE" });
    expect(aulaMat.registros.find((r) => r.matriculaId === ana.id)?.status).toBe("PRESENTE");
    // os campos de cada aluno continuam os mesmos (status = chamada diária)
    expect(c.jaRegistrada).toBe(false);
    expect(Object.keys(c.alunos[0]).sort()).toEqual(["id", "justificativa", "nomeAluno", "numeroMatricula", "status"].sort());

    const inf = await portalService.chamadaDaTurma(userA.id, infantil.turma.id, new Date(SEGUNDA));
    expect(inf).toMatchObject({ modo: "DIA", aulas: [], jaRegistrada: true });
    expect(inf.alunos[0].status).toBe("FALTA");
  });

  it("resumo do professor: pendência por AULA (a chamada de Matemática não cobre Ciências)", async () => {
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: "fe-prof-a@teste.local" } });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-02T15:00:00Z"));
    try {
      const r = await portalService.resumoProfessor(userA.id);
      const minhas = r.aulasHoje.filter((a) => a.turmaId === e.turma.id);
      expect(minhas.map((a) => a.disciplina)).toEqual(["Matemática", "Ciências"]);
      expect(minhas[0].chamadaRegistradaEm).not.toBeNull();
      expect(minhas[1].chamadaRegistradaEm).toBeNull();
      expect(r.frequenciasPendentesHoje).toEqual([
        { turmaId: e.turma.id, turmaNome: e.turma.nome, gradeHorariaId: cienciasA.id, disciplina: "Ciências", horaInicio: "11:00" },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("percentual sobre aulas", () => {
  it("3 de 4 aulas = 75% (não abaixo); 2 de 4 = 50% (abaixo) — estatísticas, resumo, boletim e Sistema Presença", async () => {
    const ano = 2027;
    const ap = await criarEstrutura("FEP", ano);
    const davi = await criarAluno("FEP", ap, "Davi FEP", ano);
    const eva = await criarAluno("FEP", ap, "Eva FEP", ano);
    // Quarta-feira 2027-03-03 com 4 aulas (sem professor definido)
    const QUARTA = new Date("2027-03-03");
    const aulas = [];
    for (const [i, disc] of ["Mat", "Port", "Hist", "Geo"].entries()) {
      aulas.push(await prisma.gradeHoraria.create({
        data: { turmaId: ap.turma.id, diaSemana: "QUARTA", horaInicio: `0${7 + i}:00`, horaFim: `0${7 + i}:50`, disciplina: disc },
      }));
    }
    const statusDavi = ["PRESENTE", "PRESENTE", "PRESENTE", "FALTA"] as const;
    const statusEva = ["PRESENTE", "FALTA", "PRESENTE", "JUSTIFICADA"] as const;
    for (const [i, a] of aulas.entries()) {
      await frequenciaService.registrarTurma({
        turmaId: ap.turma.id, data: QUARTA, gradeHorariaId: a.id,
        presencas: [
          { matriculaId: davi.id, status: statusDavi[i] },
          { matriculaId: eva.id, status: statusEva[i], ...(statusEva[i] === "JUSTIFICADA" && { justificativa: "Fictícia" }) },
        ],
      });
    }

    const sDavi = await frequenciaService.calcularEstatisticas(davi.id, ap.turma.id);
    expect(sDavi).toMatchObject({ totalAulas: 4, presencas: 3, faltas: 1, percentualPresenca: 75, abaixoDoLimite: false });
    const sEva = await frequenciaService.calcularEstatisticas(eva.id, ap.turma.id);
    expect(sEva).toMatchObject({ totalAulas: 4, presencas: 2, percentualPresenca: 50, abaixoDoLimite: true });

    const baixa = await frequenciaService.listarAlunosComBaixaFrequencia(ap.turma.id);
    expect(baixa.map((b) => b.matricula.id)).toEqual([eva.id]);
    const resumo = await frequenciaService.getResumoTurma(ap.turma.id);
    expect(resumo.find((r) => r.matricula.id === davi.id)?.estatisticas.totalAulas).toBe(4);

    const boletim = await notaService.getBoletim(davi.id, undefined, new Date("2027-12-31"));
    expect(boletim.frequencia).toMatchObject({ totalAulas: 4, presencas: 3, percentualPresenca: 75, abaixoDoLimite: false });

    // Sistema Presença: percentual sobre AULAS (4 registros num único dia)
    const anoLetivo = await prisma.anoLetivo.upsert({ where: { ano }, update: {}, create: { ano } });
    const exp = await exportacaoPresencaService.gerarSistemaPresenca({ anoLetivoId: anoLetivo.id, mes: 3, escolaId: ap.escola.id });
    expect(exp.linhas.map((l) => l.nomeAluno)).toEqual(["Eva FEP"]);
    expect(exp.linhas[0]).toMatchObject({ totalAulas: 4, presencas: 2, faltas: 1, faltasJustificadas: 1, percentualFrequencia: 50 });
    // layout do arquivo inalterado: 17 colunas
    const linhaCsv = exp.conteudo.split("\r\n")[1];
    expect(linhaCsv.split(";")).toHaveLength(17);
  });

  it("Sistema Presença: 74,5% (149/200 aulas) entra na lista mesmo exibindo 75", async () => {
    const ano = 2028;
    const ap = await criarEstrutura("FEQ", ano);
    const fabi = await criarAluno("FEQ", ap, "Fabi FEQ", ano);
    // 200 aulas em março/2028 (chamada diária: turma sem grade), 149 presenças
    const dados = Array.from({ length: 200 }, (_, i) => ({
      matriculaId: fabi.id, turmaId: ap.turma.id,
      data: new Date(Date.UTC(ano, 2, 1 + (i % 31))),
      aulaChave: `AULA-FICTICIA-${Math.floor(i / 31)}`,
      status: i < 149 ? "PRESENTE" : "FALTA",
    }));
    await prisma.frequencia.createMany({ data: dados });
    const anoLetivo = await prisma.anoLetivo.upsert({ where: { ano }, update: {}, create: { ano } });
    const exp = await exportacaoPresencaService.gerarSistemaPresenca({ anoLetivoId: anoLetivo.id, mes: 3, escolaId: ap.escola.id });
    expect(exp.linhas).toHaveLength(1);
    expect(exp.linhas[0]).toMatchObject({ totalAulas: 200, presencas: 149, percentualFrequencia: 75 });
  });
});

describe("aula removida da grade", () => {
  it("histórico sobrevive: gradeHorariaId vira null, mas aulaChave/disciplina/horário ficam", async () => {
    await prisma.gradeHoraria.delete({ where: { id: artes.id } });
    const reg = await prisma.frequencia.findFirstOrThrow({ where: { matriculaId: ana.id, aulaChave: artes.id } });
    expect(reg).toMatchObject({ gradeHorariaId: null, disciplina: "Artes", horaInicio: "10:00", status: "PRESENTE" });
    const s = await frequenciaService.calcularEstatisticas(ana.id, e.turma.id);
    expect(s.totalAulas).toBe(4); // Mat, Port, Artes (segunda) + História (terça)
  });
});
