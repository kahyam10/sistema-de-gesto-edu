import { prismaSemEscopo } from "./prisma.js";
import { PAPEIS_DA_ESCOLA, type Escopo } from "./contexto.js";

/** Escopo de dados do usuário autenticado (undefined = sem restrição por escola/turma). */
export async function calcularEscopo(user: { id: string; role: string }): Promise<Escopo | undefined> {
  if (PAPEIS_DA_ESCOLA.has(user.role)) {
    const u = await prismaSemEscopo.user.findUnique({ where: { id: user.id }, select: { escolaId: true } });
    return { tipo: "ESCOLA", escolaId: u?.escolaId ?? null };
  }
  if (user.role === "PROFESSOR") {
    const u = await prismaSemEscopo.user.findUnique({ where: { id: user.id }, select: { profissionalId: true } });
    if (!u?.profissionalId) return { tipo: "PROFESSOR", profissionalId: null, turmaIds: [], escolaIds: [] };
    const vinculos = await prismaSemEscopo.turmaProfessor.findMany({
      where: { profissionalId: u.profissionalId },
      select: { turmaId: true, turma: { select: { escolaId: true } } },
    });
    return {
      tipo: "PROFESSOR",
      profissionalId: u.profissionalId,
      turmaIds: vinculos.map((v) => v.turmaId),
      escolaIds: [...new Set(vinculos.map((v) => v.turma.escolaId))],
    };
  }
  return undefined; // ADMIN/SEMEC (rede toda) e RESPONSAVEL/USER (allowlist + validação no portal)
}
