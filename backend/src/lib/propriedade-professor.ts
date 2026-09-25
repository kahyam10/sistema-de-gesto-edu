// Propriedade da turma para PROFESSOR: o RBAC por papel (lib/rbac.ts) deixa o
// professor escrever em frequência/notas/avaliações/grade, mas sem esta checagem
// ele poderia lançar em QUALQUER turma da rede. Aqui a turma alvo é descoberta
// pelo corpo ou pelo registro do banco e comparada com os vínculos
// TurmaProfessor do profissional do usuário logado. Turma não identificada = negado.
import { prisma } from "./prisma.js";

export const RECURSOS_DO_PROFESSOR = /^\/api\/(frequencia|notas|avaliacoes|grade-horaria)(\/|$)/;

type Corpo = Record<string, unknown> | undefined;

const texto = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);

/** Descobre a turma afetada por uma escrita. null = não foi possível identificar. */
export async function turmaAlvo(url: string, method: string, body: Corpo): Promise<string | null> {
  const m = url.match(/^\/api\/(frequencia|notas|avaliacoes|grade-horaria)(?:\/([^/]+))?$/);
  if (!m) return null;
  const [, recurso, segmento] = m;

  if (method === "POST") {
    if (recurso === "notas" && segmento === "turma") {
      const avaliacaoId = texto(body?.avaliacaoId);
      if (!avaliacaoId) return null;
      const a = await prisma.avaliacao.findUnique({ where: { id: avaliacaoId }, select: { turmaId: true } });
      return a?.turmaId ?? null;
    }
    if (segmento && segmento !== "turma") return null;
    return texto(body?.turmaId);
  }

  // PUT/PATCH/DELETE /:id
  if (!segmento) return null;
  switch (recurso) {
    case "frequencia":
      return (await prisma.frequencia.findUnique({ where: { id: segmento }, select: { turmaId: true } }))?.turmaId ?? null;
    case "notas":
      return (await prisma.nota.findUnique({ where: { id: segmento }, select: { turmaId: true } }))?.turmaId ?? null;
    case "avaliacoes":
      return (await prisma.avaliacao.findUnique({ where: { id: segmento }, select: { turmaId: true } }))?.turmaId ?? null;
    case "grade-horaria":
      return (await prisma.gradeHoraria.findUnique({ where: { id: segmento }, select: { turmaId: true } }))?.turmaId ?? null;
  }
  return null;
}

export async function profissionalDoUsuario(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { profissionalId: true } });
  return u?.profissionalId ?? null;
}

export async function professorLecionaNaTurma(profissionalId: string, turmaId: string) {
  const v = await prisma.turmaProfessor.findUnique({
    where: { turmaId_profissionalId: { turmaId, profissionalId } },
    select: { id: true },
  });
  return !!v;
}
