// Frente D — portal: frequência do aluno no mesmo recorte das estatísticas
// (turma atual) e limite de 75% pela razão exata. Dados 100% fictícios.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { portalService } from "../src/services/portal.service.js";
import { criarEstrutura, criarAluno, dias } from "./fd-fixture.js";

let e: Awaited<ReturnType<typeof criarEstrutura>>;
let turmaAntiga: { id: string };
let aluno: { id: string };
let resp: { id: string };
let profUser: { id: string };

beforeAll(async () => {
  e = await criarEstrutura("FDT");
  turmaAntiga = await prisma.turma.create({
    data: { nome: "2A-FDT", turno: "MATUTINO", anoLetivo: 2025, escolaId: e.escola.id, serieId: e.serie.id },
  });
  aluno = await criarAluno("FDT", e, "Nina FDT");
  // Histórico do ano anterior (outra turma): 10 faltas
  await prisma.frequencia.createMany({
    data: dias(10, 2025).map((data) => ({ matriculaId: aluno.id, turmaId: turmaAntiga.id, data, status: "FALTA" })),
  });
  // Turma atual: 149 presenças em 200 aulas (74,5%)
  await prisma.frequencia.createMany({
    data: dias(200, 2026).map((data, i) => ({ matriculaId: aluno.id, turmaId: e.turma.id, data, status: i < 149 ? "PRESENTE" : "FALTA" })),
  });
  resp = await prisma.user.create({ data: { email: "resp.fdt@teste.local", password: "hash-ficticio", nome: "Resp FDT", role: "RESPONSAVEL" } });
  await prisma.matriculaUsuario.create({ data: { matriculaId: aluno.id, userId: resp.id, parentesco: "Mãe" } });
  const prof = await prisma.profissionalEducacao.create({ data: { nome: "Prof FDT", cpf: "00000001929", tipo: "PROFESSOR" } });
  await prisma.turmaProfessor.create({ data: { turmaId: e.turma.id, profissionalId: prof.id, tipo: "PROFESSOR" } });
  profUser = await prisma.user.create({
    data: { email: "prof.fdt@teste.local", password: "hash-ficticio", nome: "Prof FDT", role: "PROFESSOR", profissionalId: prof.id },
  });
});

describe("portal do responsável: frequência do aluno", () => {
  it("registros só da turma atual (mesmo recorte das estatísticas), não o histórico inteiro", async () => {
    const r = await portalService.frequenciaAluno(resp.id, aluno.id);
    expect(r.estatisticas!.totalAulas).toBe(200);
    expect(r.registros).toHaveLength(200);
    expect(r.registros.every((x) => x.turmaId === e.turma.id)).toBe(true);
    expect(r.estatisticas!.percentualPresenca).toBe(75);
    expect(r.estatisticas!.abaixoDoLimite).toBe(true);
  });

  it("respeita o período quando vier", async () => {
    const de = new Date("2026-02-01T00:00:00Z");
    const ate = new Date("2026-02-10T00:00:00Z");
    const r = await portalService.frequenciaAluno(resp.id, aluno.id, de, ate);
    expect(r.registros).toHaveLength(10);
    expect(r.estatisticas!.totalAulas).toBe(10);
  });
});

describe("portal: limite de 75% pela razão exata", () => {
  it("professor vê o aluno com 74,5% (exibido 75%) como abaixo do limite", async () => {
    const r = await portalService.alunosDaTurma(profUser.id, e.turma.id);
    const a = r.alunos.find((x) => x.id === aluno.id)!;
    expect(a.percentualPresenca).toBe(75);
    expect(a.abaixoDoLimite).toBe(true);
    expect(r.totalAbaixoDoLimite).toBe(1);
  });

  it("resumo da escola conta a turma com 74,5% entre as abaixo de 75%", async () => {
    const r = await portalService.resumoEscola(e.escola.id, 2026);
    expect(r.turmas.find((t) => t.turmaId === e.turma.id)?.percentualFrequencia).toBe(75);
    expect(r.frequencia.turmasAbaixoDe75).toBe(1);
    // formato da lista de turmas mantido (sem campo interno extra)
    expect(Object.keys(r.turmas[0]).sort()).toEqual(["nome", "percentualFrequencia", "serie", "totalAlunosAtivos", "turmaId", "turno"]);
  });
});
