import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { avaliacaoService } from "../services/index.js";
import {
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function avaliacoesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista avaliações com filtros
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          turmaId?: string;
          disciplinaId?: string;
          bimestre?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, disciplinaId, bimestre, page, limit } = request.query;
        const filters: {
          turmaId?: string;
          disciplinaId?: string;
          bimestre?: number;
        } = {};
        if (turmaId) filters.turmaId = turmaId;
        if (disciplinaId) filters.disciplinaId = disciplinaId;
        if (bimestre) filters.bimestre = parseInt(bimestre);

        // Suporte a paginação
        if (page && limit) {
          const result = await avaliacaoService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const avaliacoes = await avaliacaoService.findAll(filters);
        return reply.send(avaliacoes);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar avaliações";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const avaliacao = await avaliacaoService.findById(id);

        if (!avaliacao) {
          return reply
            .status(404)
            .send({ error: "Avaliação não encontrada" });
        }

        return reply.send(avaliacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria avaliação
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createAvaliacaoSchema.parse(request.body);
        const avaliacao = await avaliacaoService.create(body);
        return reply.status(201).send(avaliacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza avaliação
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateAvaliacaoSchema.parse(request.body);
        const avaliacao = await avaliacaoService.update(id, body);
        return reply.send(avaliacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove avaliação
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await avaliacaoService.delete(id);
        return reply.send({ message: "Avaliação removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
