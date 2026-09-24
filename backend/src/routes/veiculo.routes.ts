import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { veiculoService } from "../services/veiculo.service.js";
import {
  createVeiculoSchema,
  updateVeiculoSchema,
} from "../schemas/transporte.schemas.js";

export async function veiculoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar veículos da frota
  app.get(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Listar veículos da frota",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            tipo: {
              type: "string",
              enum: ["ONIBUS", "MICRO_ONIBUS", "VAN", "KOMBI", "LANCHA", "OUTRO"],
            },
            ativo: { type: "string", enum: ["true", "false"] },
            tipoPropriedade: {
              type: "string",
              enum: ["PROPRIO", "TERCEIRIZADO", "CEDIDO"],
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { tipo?: string; ativo?: string; tipoPropriedade?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { tipo, ativo, tipoPropriedade } = request.query;
        const filters: any = {};
        if (tipo) filters.tipo = tipo;
        if (ativo !== undefined) filters.ativo = ativo === "true";
        if (tipoPropriedade) filters.tipoPropriedade = tipoPropriedade;

        return reply.send(await veiculoService.findAll(filters));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar veículos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Alertas de vencimento da documentação (licenciamento, seguro, vistoria)
  app.get(
    "/alertas-vencimento",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Alertas de vencimento da documentação dos veículos",
        description:
          "Veículos ativos com licenciamento, seguro ou vistoria vencidos ou vencendo nos próximos dias (default 30).",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            dias: { type: "string", example: "30" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { dias?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const dias = request.query.dias ? parseInt(request.query.dias) : 30;
        return reply.send(await veiculoService.alertasVencimentos(dias));
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
            : "Erro ao buscar alertas de vencimento";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar veículo por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Buscar veículo por ID",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        return reply.send(await veiculoService.findById(request.params.id));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar veículo";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Cadastrar veículo
  app.post(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Cadastrar veículo",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createVeiculoSchema.parse(request.body);
        const veiculo = await veiculoService.create(data);
        return reply.status(201).send(veiculo);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao cadastrar veículo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar veículo
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Atualizar veículo",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = updateVeiculoSchema.parse(request.body);
        const veiculo = await veiculoService.update(request.params.id, data);
        return reply.send(veiculo);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar veículo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar veículo
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Deletar veículo",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await veiculoService.delete(request.params.id);
        return reply.send({ message: "Veículo deletado com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao deletar veículo";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
