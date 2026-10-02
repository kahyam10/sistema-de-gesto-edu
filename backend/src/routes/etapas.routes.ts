import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { etapaService } from "../services/index.js";
import { createEtapaSchema, updateEtapaSchema } from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function etapasRoutes(app: FastifyInstance) {
  // Listar todas as etapas
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const etapas = await etapaService.findAll();
      return reply.send(etapas);
    } catch (error: unknown) {
      return responderErroRota(error, reply, 500);
    }
  });

  // Buscar etapa por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const etapa = await etapaService.findById(id);

        if (!etapa) {
          return reply.status(404).send({ error: "Etapa não encontrada" });
        }

        return reply.send(etapa);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar etapa
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createEtapaSchema.parse(request.body);
      const etapa = await etapaService.create(data);
      return reply.status(201).send(etapa);
    } catch (error: unknown) {
      return responderErroRota(error, reply);
    }
  });

  // Atualizar etapa
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateEtapaSchema.parse(request.body);
        const etapa = await etapaService.update(id, data);
        return reply.send(etapa);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar etapa
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await etapaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
