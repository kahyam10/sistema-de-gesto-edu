import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { escolaService } from "../services/index.js";
import { createEscolaSchema, updateEscolaSchema, censoEscolaSchema } from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function escolasRoutes(app: FastifyInstance) {
  // Listar todas as escolas
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const escolas = await escolaService.findAll();
      return reply.send(escolas);
    } catch (error: unknown) {
      return responderErroRota(error, reply, 500);
    }
  });

  // Buscar escola por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const escola = await escolaService.findById(id);

        if (!escola) {
          return reply.status(404).send({ error: "Escola não encontrada" });
        }

        return reply.send(escola);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Buscar estatísticas da escola
  app.get(
    "/:id/estatisticas",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const estatisticas = await escolaService.getEstatisticas(id);

        if (!estatisticas) {
          return reply.status(404).send({ error: "Escola não encontrada" });
        }

        return reply.send(estatisticas);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar escola
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createEscolaSchema.parse(request.body);

      // Verifica se código já existe
      const existing = await escolaService.findByCodigo(data.codigo);
      if (existing) {
        return reply
          .status(400)
          .send({ error: "Código de escola já cadastrado" });
      }

      const escola = await escolaService.create(data);
      return reply.status(201).send(escola);
    } catch (error: unknown) {
      return responderErroRota(error, reply);
    }
  });

  // Atualizar escola
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateEscolaSchema.parse(request.body);
        const escola = await escolaService.update(id, data);
        return reply.send(escola);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Salvar questionário do Censo Escolar da escola
  app.put(
    "/:id/censo",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const escola = await escolaService.updateCenso(
          id,
          censoEscolaSchema.parse(request.body)
        );
        return reply.send(escola);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar escola
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await escolaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
