import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { aprendizagemService } from "../services/aprendizagem.service.js";

const tag = { tags: ["Pedagógico — Acompanhamento de aprendizagens"], security: [{ bearerAuth: [] }] };
const bimestreSchema = z.object({
  bimestre: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).max(4).optional()),
});
const anoSchema = z.object({
  anoLetivo: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(2000).max(2100).optional()),
});

/**
 * Módulo 2 — /api/aprendizagem. Leitura pela equipe pedagógica (RBAC); o
 * escopo da camada de dados limita diretor à própria escola e professor às
 * próprias turmas (turma fora do escopo → 404).
 */
export async function aprendizagemRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/turma/:turmaId", { schema: { ...tag, summary: "Situação da turma no bimestre" } }, async (request) => {
    const { turmaId } = request.params as { turmaId: string };
    return aprendizagemService.turma(turmaId, bimestreSchema.parse(request.query).bimestre);
  });

  app.get("/escola/:escolaId", { schema: { ...tag, summary: "Resumo das turmas da escola" } }, async (request) => {
    const { escolaId } = request.params as { escolaId: string };
    return aprendizagemService.escola(escolaId, anoSchema.parse(request.query).anoLetivo);
  });
}
