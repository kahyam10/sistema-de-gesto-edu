import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { phaseService } from "../services/phase.service";
import { authMiddleware } from "../middleware/auth.js";

interface CreatePhaseBody {
  name: string;
  description: string;
  monthRange: string;
  duration: string;
  ordem?: number;
  status?: string;
  moduleIds?: string[];
}

interface UpdatePhaseBody {
  name?: string;
  description?: string;
  monthRange?: string;
  duration?: string;
  ordem?: number;
  status?: string;
  moduleIds?: string[];
}

interface IdParams {
  id: string;
}

export async function phaseRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/phases - Listar todas as fases
  app.get(
    "/api/phases",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const phases = await phaseService.findAll();
        return reply.send(phases);
      } catch (error) {
        console.error("Error listing phases:", error);
        return reply.status(500).send({ error: "Erro ao listar fases" });
      }
    }
  );

  // GET /api/phases/:id - Buscar fase por ID
  app.get(
    "/api/phases/:id",
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

  // POST /api/phases - Criar nova fase
  app.post(
    "/api/phases",
    async (
      request: FastifyRequest<{ Body: CreatePhaseBody }>,
      reply: FastifyReply
    ) => {
      try {
        const data = request.body;

        if (
          !data.name ||
          !data.description ||
          !data.monthRange ||
          !data.duration
        ) {
          return reply
            .status(400)
            .send({
              error: "Nome, descrição, período e duração são obrigatórios",
            });
        }

        const phase = await phaseService.create(data);
        return reply.status(201).send(phase);
      } catch (error) {
        console.error("Error creating phase:", error);
        return reply.status(500).send({ error: "Erro ao criar fase" });
      }
    }
  );

  // PUT /api/phases/:id - Atualizar fase
  app.put(
    "/api/phases/:id",
    async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdatePhaseBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;

        const existing = await phaseService.findById(id);
        if (!existing) {
          return reply.status(404).send({ error: "Fase não encontrada" });
        }

        const phase = await phaseService.update(id, data);
        return reply.send(phase);
      } catch (error) {
        console.error("Error updating phase:", error);
        return reply.status(500).send({ error: "Erro ao atualizar fase" });
      }
    }
  );

  // DELETE /api/phases/:id - Excluir fase
  app.delete(
    "/api/phases/:id",
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
