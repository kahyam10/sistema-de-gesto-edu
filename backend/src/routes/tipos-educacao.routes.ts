import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { tipoEducacaoService } from "../services/index.js";
import {
  createTipoEducacaoSchema,
  updateTipoEducacaoSchema,
} from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function tiposEducacaoRoutes(app: FastifyInstance) {
  // Listar todos os tipos de educação
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tipos = await tipoEducacaoService.findAll();
      return reply.send(tipos);
    } catch (error: unknown) {
      return responderErroRota(error, reply, 500);
    }
  });

  // Buscar tipo de educação por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const tipo = await tipoEducacaoService.findById(id);

        if (!tipo) {
          return reply
            .status(404)
            .send({ error: "Tipo de educação não encontrado" });
        }

        return reply.send(tipo);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar tipo de educação
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createTipoEducacaoSchema.parse(request.body);
      const tipo = await tipoEducacaoService.create(data);
      return reply.status(201).send(tipo);
    } catch (error: unknown) {
      return responderErroRota(error, reply);
    }
  });

  // Atualizar tipo de educação
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateTipoEducacaoSchema.parse(request.body);
        const tipo = await tipoEducacaoService.update(id, data);
        return reply.send(tipo);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar tipo de educação
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await tipoEducacaoService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
