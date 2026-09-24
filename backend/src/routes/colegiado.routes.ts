import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { colegiadoService } from "../services/colegiado.service.js";
import {
  createColegiadoSchema,
  updateColegiadoSchema,
  createMembroColegiadoSchema,
  updateMembroColegiadoSchema,
} from "../schemas/democratica.schemas.js";
import { authMiddleware } from "../middleware/auth.js";

export async function colegiadoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista colegiados
  app.get(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Listar colegiados escolares",
        description:
          "Lista os colegiados escolares com filtros por escola e situação.",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: { type: "string", description: "ID da escola" },
            ativo: { type: "string", enum: ["true", "false"] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { escolaId?: string; ativo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, ativo } = request.query;

        const filters: any = {};
        if (escolaId) filters.escolaId = escolaId;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        const colegiados = await colegiadoService.findAll(filters);
        return reply.send(colegiados);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar colegiados";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca colegiado por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Buscar colegiado por ID",
        description:
          "Retorna o colegiado com membros ativos e as últimas 10 reuniões.",
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
        const colegiado = await colegiadoService.findById(request.params.id);
        return reply.send(colegiado);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar colegiado";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria colegiado
  app.post(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Criar colegiado escolar",
        description:
          "Cria um colegiado escolar com período de mandato definido.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["escolaId", "dataInicioMandato", "dataFimMandato"],
          properties: {
            nome: { type: "string", example: "Colegiado Escolar" },
            escolaId: { type: "string" },
            dataInicioMandato: { type: "string", format: "date", example: "2026-02-01" },
            dataFimMandato: { type: "string", format: "date", example: "2028-01-31" },
            ativo: { type: "boolean", default: true },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createColegiadoSchema.parse(request.body);
        const colegiado = await colegiadoService.create(body);
        return reply.status(201).send(colegiado);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao criar colegiado";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza colegiado
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar colegiado escolar",
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
        const body = updateColegiadoSchema.parse(request.body);
        const colegiado = await colegiadoService.update(request.params.id, body);
        return reply.send(colegiado);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar colegiado";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove colegiado
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover colegiado escolar",
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
        await colegiadoService.delete(request.params.id);
        return reply.send({ message: "Colegiado deletado com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao remover colegiado";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adiciona membro ao colegiado
  app.post(
    "/:id/membros",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Adicionar membro ao colegiado",
        description:
          "Adiciona um membro (professor, pai, aluno, funcionário, comunidade ou direção) ao colegiado. Vínculos com profissional/matrícula são opcionais.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["nome", "segmento"],
          properties: {
            nome: { type: "string" },
            segmento: {
              type: "string",
              enum: [
                "PROFESSOR",
                "PAI_RESPONSAVEL",
                "ALUNO",
                "FUNCIONARIO",
                "COMUNIDADE",
                "DIRECAO",
              ],
            },
            cargo: {
              type: "string",
              enum: [
                "PRESIDENTE",
                "VICE_PRESIDENTE",
                "SECRETARIO",
                "TESOUREIRO",
                "TITULAR",
                "SUPLENTE",
              ],
              default: "TITULAR",
            },
            profissionalId: { type: "string" },
            matriculaId: { type: "string" },
            ativo: { type: "boolean", default: true },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = createMembroColegiadoSchema.parse(request.body);
        const membro = await colegiadoService.addMembro(request.params.id, body);
        return reply.status(201).send(membro);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar membro";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza membro do colegiado
  app.put(
    "/membros/:membroId",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar membro do colegiado",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["membroId"],
          properties: { membroId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { membroId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = updateMembroColegiadoSchema.parse(request.body);
        const membro = await colegiadoService.updateMembro(
          request.params.membroId,
          body
        );
        return reply.send(membro);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar membro";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove membro do colegiado
  app.delete(
    "/membros/:membroId",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover membro do colegiado",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["membroId"],
          properties: { membroId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { membroId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await colegiadoService.removeMembro(request.params.membroId);
        return reply.send({ message: "Membro removido do colegiado" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao remover membro";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
