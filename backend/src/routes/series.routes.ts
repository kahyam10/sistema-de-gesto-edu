import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { serieService } from "../services/index.js";
import { createSerieSchema, updateSerieSchema } from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function seriesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  // Listar todas as séries
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const series = await serieService.findAll();
      return reply.send(series);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao listar séries";
      return reply.status(500).send({ error: message });
    }
  });

  // Buscar série por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const serie = await serieService.findById(id);

        if (!serie) {
          return reply.status(404).send({ error: "Série não encontrada" });
        }

        return reply.send(serie);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar série";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar séries por etapa
  app.get(
    "/etapa/:etapaId",
    async (
      request: FastifyRequest<{ Params: { etapaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { etapaId } = request.params;
        const series = await serieService.findByEtapa(etapaId);
        return reply.send(series);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar séries";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar série
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createSerieSchema.parse(request.body);
      const serie = await serieService.create(data);
      return reply.status(201).send(serie);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar série";
      return reply.status(400).send({ error: message });
    }
  });

  // Atualizar série
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateSerieSchema.parse(request.body);
        const serie = await serieService.update(id, data);
        return reply.send(serie);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar série";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar série
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await serieService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar série";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
