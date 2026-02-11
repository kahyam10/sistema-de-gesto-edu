import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { disciplinaService } from "../services/index.js";
import {
  createDisciplinaSchema,
  updateDisciplinaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function disciplinasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista disciplinas com filtros
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: { etapaId?: string; ativo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { etapaId, ativo } = request.query;
        const filters: { etapaId?: string; ativo?: boolean } = {};
        if (etapaId) filters.etapaId = etapaId;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        const disciplinas = await disciplinaService.findAll(filters);
        return reply.send(disciplinas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar disciplinas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca disciplina por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const disciplina = await disciplinaService.findById(id);

        if (!disciplina) {
          return reply.status(404).send({ error: "Disciplina não encontrada" });
        }

        return reply.send(disciplina);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca disciplinas por etapa
  app.get(
    "/etapa/:etapaId",
    async (
      request: FastifyRequest<{ Params: { etapaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { etapaId } = request.params;
        const disciplinas = await disciplinaService.findByEtapa(etapaId);
        return reply.send(disciplinas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar disciplinas por etapa";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria disciplina
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createDisciplinaSchema.parse(request.body);
        const disciplina = await disciplinaService.create(body);
        return reply.status(201).send(disciplina);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza disciplina
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateDisciplinaSchema.parse(request.body);
        const disciplina = await disciplinaService.update(id, body);
        return reply.send(disciplina);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove disciplina
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await disciplinaService.delete(id);
        return reply.send({ message: "Disciplina removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
