import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/index.js";
import { ZodError } from "zod";
import { tipoEducacaoService } from "../services/index.js";
import {
  createTipoEducacaoSchema,
  updateTipoEducacaoSchema,
} from "../schemas/index.js";

export async function tiposEducacaoRoutes(app: FastifyInstance) {
  // Listar todos os tipos de educação
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tipos = await tipoEducacaoService.findAll();
      return reply.send(tipos);
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
        error instanceof Error
          ? error.message
          : "Erro ao listar tipos de educação";
      return reply.status(500).send({ error: message });
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
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar tipo de educação";
        return reply.status(500).send({ error: message });
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
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao criar tipo de educação";
      return reply.status(400).send({ error: message });
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
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar tipo de educação";
        return reply.status(400).send({ error: message });
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
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao deletar tipo de educação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
