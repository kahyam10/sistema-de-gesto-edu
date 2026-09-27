import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { rotaTransporteService } from "../services/rota-transporte.service.js";
import {
  createRotaTransporteSchema,
  updateRotaTransporteSchema,
  vincularAlunoRotaSchema,
  vincularEscolaRotaSchema,
} from "../schemas/transporte.schemas.js";

export async function rotaTransporteRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar rotas de transporte
  app.get(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Listar rotas de transporte",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            turno: {
              type: "string",
              enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"],
            },
            tipo: { type: "string", enum: ["RURAL", "URBANA", "FLUVIAL"] },
            escolaId: { type: "string" },
            ativo: { type: "string", enum: ["true", "false"] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          turno?: string;
          tipo?: string;
          escolaId?: string;
          ativo?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turno, tipo, escolaId, ativo } = request.query;
        const filters: NonNullable<Parameters<typeof rotaTransporteService.findAll>[0]> = {};
        if (turno) filters.turno = turno;
        if (tipo) filters.tipo = tipo;
        if (escolaId) filters.escolaId = escolaId;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        return reply.send(await rotaTransporteService.findAll(filters));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar rotas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar rota por ID (com escolas e alunos vinculados)
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Buscar rota de transporte por ID",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        return reply.send(
          await rotaTransporteService.findById(request.params.id)
        );
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar rota";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar rota de transporte
  app.post(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Criar rota de transporte",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createRotaTransporteSchema.parse(request.body);
        const rota = await rotaTransporteService.create(data);
        return reply.status(201).send(rota);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao criar rota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar rota de transporte
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Atualizar rota de transporte",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = updateRotaTransporteSchema.parse(request.body);
        const rota = await rotaTransporteService.update(
          request.params.id,
          data
        );
        return reply.send(rota);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar rota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar rota de transporte
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Deletar rota de transporte",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await rotaTransporteService.delete(request.params.id);
        return reply.send({ message: "Rota deletada com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao deletar rota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Vincular escola à rota
  app.post(
    "/:id/escolas",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Vincular escola à rota",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = vincularEscolaRotaSchema.parse(request.body);
        const vinculo = await rotaTransporteService.vincularEscola(
          request.params.id,
          escolaId
        );
        return reply.status(201).send(vinculo);
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
            : "Erro ao vincular escola à rota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Desvincular escola da rota
  app.delete(
    "/:id/escolas/:escolaId",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Desvincular escola da rota",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await rotaTransporteService.desvincularEscola(
          request.params.id,
          request.params.escolaId
        );
        return reply.send({ message: "Escola desvinculada da rota" });
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
            : "Erro ao desvincular escola da rota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Vincular aluno à rota (valida duplicidade e capacidade do veículo)
  app.post(
    "/:id/alunos",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Vincular aluno (matrícula) à rota",
        description:
          "Valida duplicidade (BIZ_027) e capacidade do veículo da rota (BIZ_028).",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = vincularAlunoRotaSchema.parse(request.body);
        const vinculo = await rotaTransporteService.vincularAluno(
          request.params.id,
          data
        );
        return reply.status(201).send(vinculo);
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
            : "Erro ao vincular aluno à rota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Desvincular aluno da rota
  app.delete(
    "/:id/alunos/:matriculaId",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Desvincular aluno da rota",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await rotaTransporteService.desvincularAluno(
          request.params.id,
          request.params.matriculaId
        );
        return reply.send({ message: "Aluno desvinculado da rota" });
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
            : "Erro ao desvincular aluno da rota";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
