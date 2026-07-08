import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/index.js";
import { ZodError } from "zod";
import { phaseService } from "../services/phase.service.js";
import { createPhaseSchema, updatePhaseSchema } from "../schemas/index.js";

interface IdParams {
  id: string;
}

// Registrado em server.ts com prefix "/api/phases"
export async function phaseRoutes(app: FastifyInstance) {
  // Listar todas as fases
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const phases = await phaseService.findAll();
      return reply.send(phases);
    } catch (error) {
      console.error("Error listing phases:", error);
      return reply.status(500).send({ error: "Erro ao listar fases" });
    }
  });

  // Buscar fase por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: IdParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const phase = await phaseService.findById(id);

        if (!phase) {
          return reply.status(404).send({ error: "Fase não encontrada" });
        }

        return reply.send(phase);
      } catch (error) {
        console.error("Error getting phase:", error);
        return reply.status(500).send({ error: "Erro ao buscar fase" });
      }
    }
  );

  // Criar nova fase
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createPhaseSchema.parse(request.body);
      const phase = await phaseService.create(data);
      return reply.status(201).send(phase);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
      const message =
        error instanceof Error ? error.message : "Erro ao criar fase";
      return reply.status(400).send({ error: message });
    }
  });

  // Atualizar fase
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: IdParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updatePhaseSchema.parse(request.body);

        const existing = await phaseService.findById(id);
        if (!existing) {
          return reply.status(404).send({ error: "Fase não encontrada" });
        }

        const phase = await phaseService.update(id, data);
        return reply.send(phase);
      } catch (error: unknown) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar fase";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Excluir fase
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: IdParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const existing = await phaseService.findById(id);
        if (!existing) {
          return reply.status(404).send({ error: "Fase não encontrada" });
        }

        await phaseService.delete(id);
        return reply.status(204).send();
      } catch (error) {
        console.error("Error deleting phase:", error);
        return reply.status(500).send({ error: "Erro ao excluir fase" });
      }
    }
  );
}
