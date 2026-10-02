import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { nivelEnsinoService } from "../services/index.js";
import {
  createNivelEnsinoSchema,
  updateNivelEnsinoSchema,
} from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function niveisEnsinoRoutes(app: FastifyInstance) {
  // Listar todos os níveis de ensino
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const niveis = await nivelEnsinoService.findAll();
      return reply.send(niveis);
    } catch (error: unknown) {
      return responderErroRota(error, reply, 500);
    }
  });

  // Buscar níveis por etapa
  app.get(
    "/etapa/:etapaId",
    async (
      request: FastifyRequest<{ Params: { etapaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { etapaId } = request.params;
        const niveis = await nivelEnsinoService.findByEtapaId(etapaId);
        return reply.send(niveis);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Buscar nível de ensino por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const nivel = await nivelEnsinoService.findById(id);

        if (!nivel) {
          return reply
            .status(404)
            .send({ error: "Nível de ensino não encontrado" });
        }

        return reply.send(nivel);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar nível de ensino
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createNivelEnsinoSchema.parse(request.body);
      const nivel = await nivelEnsinoService.create(data);
      return reply.status(201).send(nivel);
    } catch (error: unknown) {
      return responderErroRota(error, reply);
    }
  });

  // Atualizar nível de ensino
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateNivelEnsinoSchema.parse(request.body);
        const nivel = await nivelEnsinoService.update(id, data);
        return reply.send(nivel);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar nível de ensino
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await nivelEnsinoService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
