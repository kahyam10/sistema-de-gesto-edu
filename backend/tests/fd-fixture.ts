// Fixture mínima (dados 100% fictícios) para os testes fd-*: cria uma
// estrutura escola → etapa → série → turma isolada por sufixo, sem apagar
// nada de outros arquivos de teste.
import { prisma } from "../src/lib/prisma.js";

export async function criarEstrutura(suf: string, anoLetivo = 2026) {
  const tipo = await prisma.tipoEducacao.create({ data: { nome: `Regular ${suf}` } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: `Fundamental ${suf}`, tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: `Anos Iniciais ${suf}`, etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: `3º Ano ${suf}`, nivelId: nivel.id } });
  const escola = await prisma.escola.create({ data: { nome: `Escola Fictícia ${suf}`, codigo: `${suf}-ESC` } });
  const turma = await prisma.turma.create({
    data: { nome: `3A-${suf}`, turno: "MATUTINO", anoLetivo, escolaId: escola.id, serieId: serie.id },
  });
  return { tipo, etapa, nivel, serie, escola, turma };
}

let seq = 0;
export async function criarAluno(
  suf: string,
  e: { escola: { id: string }; etapa: { id: string }; turma: { id: string } },
  nome: string,
  anoLetivo = 2026,
  turmaId: string | null = e.turma.id
) {
  seq++;
  return prisma.matricula.create({
    data: {
      numeroMatricula: `${suf}${String(seq).padStart(5, "0")}`,
      anoLetivo,
      status: "ATIVA",
      nomeAluno: nome,
      dataNascimento: new Date("2017-01-10"),
      sexo: "F",
      nomeResponsavel: `Resp ${nome}`,
      escolaId: e.escola.id,
      etapaId: e.etapa.id,
      turmaId,
    },
  });
}

/** n dias distintos (meia-noite UTC) a partir de 2026-02-01 + offset. */
export function dias(n: number, ano = 2026): Date[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(ano, 1, 1 + i)));
}
