import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { liderTurmaService } from "../services/lider-turma.service.js";
import {
  createLiderTurmaSchema,
  updateLiderTurmaSchema,
} from "../schemas/democratica.schemas.js";
import { authMiddleware } from "../middleware/auth.js";

export async function liderTurmaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista líderes de turma
  app.get(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Listar líderes de turma",
        description:
          "Lista líderes e vice-líderes de turma com filtros por turma, ano letivo, escola e situação.",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            turmaId: { type: "string" },
            anoLetivo: { type: "string", example: "2026" },
            escolaId: { type: "string" },
            ativo: { type: "string", enum: ["true", "false"] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          turmaId?: string;
          anoLetivo?: string;
          escolaId?: string;
          ativo?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, anoLetivo, escolaId, ativo } = request.query;

        const filters: any = {};
        if (turmaId) filters.turmaId = turmaId;
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (escolaId) filters.escolaId = escolaId;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        const lideres = await liderTurmaService.findAll(filters);
        return reply.send(lideres);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar líderes de turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca líder de turma por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Buscar líder de turma por ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const lider = await liderTurmaService.findById(request.params.id);
        return reply.send(lider);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar líder de turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria líder/vice-líder de turma
  app.post(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Registrar líder ou vice-líder de turma",
        description:
          "Registra o líder ou vice-líder de uma turma para o ano letivo. A matrícula deve pertencer à turma e só pode haver um líder e um vice por turma/ano.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["turmaId", "matriculaId", "anoLetivo", "tipo"],
          properties: {
            turmaId: { type: "string" },
            matriculaId: { type: "string" },
            anoLetivo: { type: "number", example: 2026 },
            tipo: { type: "string", enum: ["LIDER", "VICE_LIDER"] },
            formaEscolha: {
              type: "string",
              enum: ["ELEICAO", "INDICACAO", "VOLUNTARIO"],
              default: "ELEICAO",
            },
            dataEscolha: { type: "string", format: "date" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createLiderTurmaSchema.parse(request.body);
        const lider = await liderTurmaService.create(body);
        return reply.status(201).send(lider);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao registrar líder de turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza líder de turma
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar líder de turma",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = updateLiderTurmaSchema.parse(request.body);
        const lider = await liderTurmaService.update(request.params.id, body);
        return reply.send(lider);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar líder de turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove líder de turma
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover líder de turma",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await liderTurmaService.delete(request.params.id);
        return reply.send({ message: "Líder de turma removido com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover líder de turma";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
