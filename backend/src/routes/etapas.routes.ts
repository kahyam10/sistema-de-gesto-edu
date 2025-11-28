import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { etapaService } from "../services/index.js";
import { createEtapaSchema, updateEtapaSchema } from "../schemas/index.js";

export async function etapasRoutes(app: FastifyInstance) {
  // Listar todas as etapas
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const etapas = await etapaService.findAll();
      return reply.send(etapas);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao listar etapas";
      return reply.status(500).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao buscar etapa";
        return reply.status(500).send({ error: message });
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
      const message =
        error instanceof Error ? error.message : "Erro ao criar etapa";
      return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar etapa";
        return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao deletar etapa";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
