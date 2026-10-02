import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { serieService } from "../services/index.js";
import { createSerieSchema, updateSerieSchema } from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function seriesRoutes(app: FastifyInstance) {
  // Listar todas as séries
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const series = await serieService.findAll();
      return reply.send(series);
    } catch (error: unknown) {
      return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Buscar séries por nível de ensino
  app.get(
    "/nivel/:nivelId",
    async (
      request: FastifyRequest<{ Params: { nivelId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { nivelId } = request.params;
        const series = await serieService.findByNivel(nivelId);
        return reply.send(series);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
      return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
      }
    }
  );
}
