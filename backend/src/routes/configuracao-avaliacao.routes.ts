import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { configuracaoAvaliacaoService } from "../services/index.js";
import {
  createConfiguracaoAvaliacaoSchema,
  updateConfiguracaoAvaliacaoSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function configuracaoAvaliacaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista configurações
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          anoLetivo?: string;
          escolaId?: string;
          etapaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivo, escolaId, etapaId } = request.query;
        const filters: {
          anoLetivo?: number;
          escolaId?: string;
          etapaId?: string;
        } = {};
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (escolaId) filters.escolaId = escolaId;
        if (etapaId) filters.etapaId = etapaId;

        const configs = await configuracaoAvaliacaoService.findAll(filters);
        return reply.send(configs);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar configurações";
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
        const config = await configuracaoAvaliacaoService.findById(id);

        if (!config) {
          return reply
            .status(404)
            .send({ error: "Configuração não encontrada" });
        }

        return reply.send(config);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria configuração
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createConfiguracaoAvaliacaoSchema.parse(request.body);
        const config = await configuracaoAvaliacaoService.create(body);
        return reply.status(201).send(config);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza configuração
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateConfiguracaoAvaliacaoSchema.parse(request.body);
        const config = await configuracaoAvaliacaoService.update(id, body);
        return reply.send(config);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove configuração
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await configuracaoAvaliacaoService.delete(id);
        return reply.send({ message: "Configuração removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
