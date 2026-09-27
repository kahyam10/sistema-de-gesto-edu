// Schemas de resposta do Fastify: o serializador DESCARTA o que o schema não
// declara (e troca null por "" em campo "string"). Estes testes travam as rotas
// em que o schema não batia com o service e a tela recebia objetos vazios —
// e confirmam que a grade horária não expõe o cadastro do professor.
// Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";

const SENHA = "senha-de-teste-forte-123";
let app: FastifyInstance;
let token = "";
const ids: Record<string, string> = {};
const get = (url: string) => app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}` } });
const post = (url: string, payload: object) =>
  app.inject({ method: "POST", url, payload, headers: { authorization: `Bearer ${token}` } });

beforeAll(async () => {
  _resetarLimiteLogin();
  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular RS" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Fundamental RS", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais RS", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "2º Ano RS", nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: "Escola Fictícia RS", codigo: "RS-01" } });
  const turma = await prisma.turma.create({ data: { nome: "2A-RS", turno: "MATUTINO", anoLetivo: 2032, escolaId: escola.id, serieId: serie.id } });
  const disciplina = await prisma.disciplina.create({ data: { nome: "Ciências RS", codigo: "CIE-RS", etapaId: etapa.id } });
  const aluno = await prisma.matricula.create({
    data: {
      anoLetivo: 2032, status: "ATIVA", dataNascimento: new Date("2024-02-10"), sexo: "M", nomeResponsavel: "Resp RS",
      escolaId: escola.id, etapaId: etapa.id, turmaId: turma.id, numeroMatricula: "RS000001", nomeAluno: "Aluno Fictício RS",
    },
  });
  // Dados bancários fictícios: servem só para provar que não vazam pela grade
  const prof = await prisma.profissionalEducacao.create({
    data: { nome: "Prof RS", cpf: "00000009927", tipo: "PROFESSOR", banco: "000", agencia: "0000", conta: "00000-0", pix: "pix-ficticio-rs" },
  });
  await prisma.turmaProfessor.create({ data: { turmaId: turma.id, profissionalId: prof.id, tipo: "PROFESSOR" } });
  await prisma.gradeHoraria.create({
    data: { turmaId: turma.id, diaSemana: "SEGUNDA", horaInicio: "07:30", horaFim: "08:20", disciplina: "Ciências RS", profissionalId: prof.id },
  });
  const av = await prisma.avaliacao.create({
    data: { nome: "Prova RS", tipo: "PROVA", bimestre: 1, valorMaximo: 5, data: new Date("2032-03-10"), turmaId: turma.id, disciplinaId: disciplina.id },
  });
  await prisma.nota.create({ data: { valor: 4, turmaId: turma.id, disciplina: "Ciências RS", bimestre: 1, avaliacaoId: av.id, matriculaId: aluno.id } });
  const dias = [3, 4, 5, 6].map((d) => new Date(Date.UTC(2032, 2, d)));
  await prisma.frequencia.createMany({
    data: dias.map((data, i) => ({ matriculaId: aluno.id, turmaId: turma.id, data, status: i < 2 ? "PRESENTE" : "FALTA" })),
  });
  await prisma.user.create({
    data: { email: "semec-rs@teste.local", nome: "SEMEC RS", role: "SEMEC", password: await bcrypt.hash(SENHA, 10) },
  });
  Object.assign(ids, { turma: turma.id, aluno: aluno.id, etapa: etapa.id, avaliacao: av.id });

  app = await buildApp();
  await app.ready();
  const login = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email: "semec-rs@teste.local", password: SENHA } });
  token = login.json().accessToken;
});

afterAll(async () => {
  await app.close();
});

describe("respostas completas (schema de resposta = formato do service)", () => {
  it("grade horária traz turma e nome do professor, sem CPF nem dados bancários", async () => {
    const res = await get(`/api/grade-horaria?turmaId=${ids.turma}`);
    expect(res.statusCode).toBe(200);
    const [h] = res.json();
    expect(h.turma).toMatchObject({ nome: "2A-RS", turno: "MATUTINO", escola: { nome: "Escola Fictícia RS" } });
    expect(h.profissional).toEqual({ id: expect.any(String), nome: "Prof RS" });
    expect(res.body).not.toMatch(/00000009927|pix-ficticio-rs|00000-0/);
    expect(h.observacoes).toBeNull(); // null não vira ""
  });

  it("resumo e baixa frequência da turma trazem aluno e estatísticas", async () => {
    const resumo = (await get(`/api/frequencia/turma/${ids.turma}/resumo`)).json();
    expect(resumo[0].matricula.nomeAluno).toBe("Aluno Fictício RS");
    expect(resumo[0].estatisticas).toMatchObject({ totalAulas: 4, presencas: 2, faltas: 2, percentualPresenca: 50, abaixoDoLimite: true });
    const baixa = (await get(`/api/frequencia/turma/${ids.turma}/baixa-frequencia`)).json();
    expect(baixa).toHaveLength(1);
    expect(baixa[0].matricula.numeroMatricula).toBe("RS000001");
    const doDia = (await get(`/api/frequencia/turma/${ids.turma}/data/2032-03-03`)).json();
    expect(doDia[0]).toMatchObject({ status: "PRESENTE", justificativa: null, matricula: { nomeAluno: "Aluno Fictício RS" } });
    const est = (await get(`/api/frequencia/estatisticas/${ids.aluno}/${ids.turma}`)).json();
    expect(est).toMatchObject({ percentualPresenca: 50, abaixoDoLimite: true });
  });

  it("boletim traz aluno, disciplinas e a média na escala 0–10", async () => {
    const res = await get(`/api/notas/boletim/${ids.aluno}?anoLetivo=2032`);
    expect(res.statusCode).toBe(200);
    const b = res.json();
    expect(b.matricula.nomeAluno).toBe("Aluno Fictício RS");
    expect(b.turma.nome).toBe("2A-RS");
    const cie = b.disciplinas.find((d: { disciplinaNome: string }) => d.disciplinaNome === "Ciências RS");
    expect(cie.bimestres.find((x: { bimestre: number }) => x.bimestre === 1).media).toBe(8); // 4 de 5
  });

  it("turmas trazem a situação das matrículas (chamada/notas) e só o nome do professor", async () => {
    const res = await get(`/api/turmas?anoLetivo=2032`);
    expect(res.statusCode).toBe(200);
    const turmas = res.json();
    const t = (Array.isArray(turmas) ? turmas : turmas.data).find((x: { id: string }) => x.id === ids.turma);
    expect(t.matriculas[0]).toMatchObject({ nomeAluno: "Aluno Fictício RS", numeroMatricula: "RS000001", status: "ATIVA" });
    expect(t.professores[0].profissional).toEqual({ id: expect.any(String), nome: "Prof RS", tipo: "PROFESSOR" });
    expect(res.body).not.toMatch(/00000009927|pix-ficticio-rs/);
    const uma = await get(`/api/turmas/${ids.turma}`);
    expect(uma.json().professores[0].profissional).not.toHaveProperty("cpf");
  });

  it("disciplinas trazem a etapa e mantêm null", async () => {
    const lista = (await get(`/api/disciplinas?etapaId=${ids.etapa}`)).json();
    expect(lista[0].etapa.nome).toBe("Fundamental RS");
    expect(lista[0].descricao).toBeNull();
  });

  it("escritas devolvem o que o service monta (chamada e notas da turma)", async () => {
    const chamada = await post("/api/frequencia/turma", {
      turmaId: ids.turma, data: "2032-03-10", presencas: [{ matriculaId: ids.aluno, status: "PRESENTE" }],
    });
    expect(chamada.statusCode).toBe(201);
    expect(chamada.json()).toMatchObject({ message: expect.stringContaining("1 aluno"), registros: [expect.objectContaining({ status: "PRESENTE" })] });
    const notas = await post("/api/notas/turma", { avaliacaoId: ids.avaliacao, notas: [{ matriculaId: ids.aluno, valor: 5 }] });
    expect(notas.statusCode).toBe(201);
    expect(notas.json()).toMatchObject({ message: expect.stringContaining("1 aluno"), notas: [expect.objectContaining({ valor: 5 })] });
  });
});
