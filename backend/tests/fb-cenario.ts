// Cenário fictício compartilhado pelos testes fb-*: duas escolas (A e B),
// professores, secretaria, admin e responsáveis. Cada arquivo usa um sufixo
// próprio para não colidir nos campos únicos (e-mail, código, CPF, matrícula).
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";

export const SENHA = "senha-de-teste-forte-123";

export async function cenarioDuasEscolas(suf: string) {
  const tipo = await prisma.tipoEducacao.create({ data: { nome: `Regular ${suf}` } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: `Fundamental ${suf}`, tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: `Iniciais ${suf}`, etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: `3º Ano ${suf}`, nivelId: nivel.id } });
  const escolaA = await prisma.escola.create({ data: { nome: `Escola Fictícia A ${suf}`, codigo: `${suf}-A` } });
  const escolaB = await prisma.escola.create({ data: { nome: `Escola Fictícia B ${suf}`, codigo: `${suf}-B` } });
  const turma = (nome: string, escolaId: string) =>
    prisma.turma.create({ data: { nome, turno: "MATUTINO", anoLetivo: 2026, escolaId, serieId: serie.id } });
  const turmaA = await turma("3A", escolaA.id);
  const turmaA2 = await turma("3C", escolaA.id); // da escola A, mas o professor A NÃO leciona
  const turmaB = await turma("3B", escolaB.id);
  const base = {
    anoLetivo: 2026, status: "ATIVA", dataNascimento: new Date("2017-01-01"), sexo: "F",
    nomeResponsavel: "Responsável Fictício", etapaId: etapa.id,
  };
  const mat = (n: string, nomeAluno: string, escolaId: string, turmaId: string) =>
    prisma.matricula.create({ data: { ...base, numeroMatricula: `${suf}${n}`, nomeAluno, escolaId, turmaId } });
  const matA = await mat("A0001", "Aluna A", escolaA.id, turmaA.id);
  const matA2 = await mat("A0002", "Aluna A2", escolaA.id, turmaA2.id);
  const matB = await mat("B0001", "Aluna B", escolaB.id, turmaB.id);

  const prof = (nome: string, n: string) =>
    prisma.profissionalEducacao.create({
      // CPF obviamente fictício e único por arquivo: 00000 + dígitos do sufixo + n
      data: { nome, cpf: `00000${suf.replace(/\D/g, "").padStart(3, "0")}${n.padStart(3, "0")}`, tipo: "PROFESSOR" },
    });
  const profA = await prof(`Prof A ${suf}`, "1");
  const profB = await prof(`Prof B ${suf}`, "2");
  await prisma.escolaProfissional.create({ data: { escolaId: escolaA.id, profissionalId: profA.id } });
  await prisma.escolaProfissional.create({ data: { escolaId: escolaB.id, profissionalId: profB.id } });
  await prisma.turmaProfessor.create({ data: { turmaId: turmaA.id, profissionalId: profA.id, tipo: "PROFESSOR" } });
  await prisma.turmaProfessor.create({ data: { turmaId: turmaB.id, profissionalId: profB.id, tipo: "PROFESSOR" } });

  const hash = await bcrypt.hash(SENHA, 4);
  const user = (email: string, nome: string, role: string, extra: Record<string, string> = {}) =>
    prisma.user.create({ data: { email: `${email}-${suf}@teste.local`, nome, role, password: hash, ...extra } });
  const uProfA = await user("prof-a", "Usuário Prof A", "PROFESSOR", { profissionalId: profA.id });
  const uProfB = await user("prof-b", "Usuário Prof B", "PROFESSOR", { profissionalId: profB.id });
  const uSecA = await user("sec-a", "Secretaria A", "SECRETARIA", { escolaId: escolaA.id });
  const uAdmin = await user("admin", "Admin", "ADMIN");
  const uRespA = await user("resp-a", "Responsável A", "RESPONSAVEL");
  const uRespA2 = await user("resp-a2", "Responsável A2", "RESPONSAVEL");
  const uRespB = await user("resp-b", "Responsável B", "RESPONSAVEL");
  const uSemVinculo = await user("user-sem", "Usuário sem vínculo", "USER");
  await prisma.matriculaUsuario.createMany({
    data: [
      { matriculaId: matA.id, userId: uRespA.id },
      { matriculaId: matA2.id, userId: uRespA2.id },
      { matriculaId: matB.id, userId: uRespB.id },
    ],
  });

  return {
    etapa, serie, escolaA, escolaB, turmaA, turmaA2, turmaB, matA, matA2, matB, profA, profB,
    uProfA, uProfB, uSecA, uAdmin, uRespA, uRespA2, uRespB, uSemVinculo,
  };
}

/** Faz login pelo app mobile (token no corpo) e devolve o cabeçalho Authorization. */
export async function entrar(app: FastifyInstance, email: string) {
  const r = await app.inject({ method: "POST", url: "/api/auth/mobile/login", payload: { email, password: SENHA } });
  if (r.statusCode !== 200) throw new Error(`login falhou para ${email}: ${r.statusCode}`);
  return { authorization: `Bearer ${r.json().accessToken}` };
}

/** Listas podem vir como array ou { data } (paginadas). */
export const itens = <T = Record<string, unknown>>(corpo: unknown): T[] =>
  (Array.isArray(corpo) ? corpo : (corpo as { data?: T[] })?.data ?? []) as T[];
