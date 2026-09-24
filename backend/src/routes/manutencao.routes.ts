import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { manutencaoService } from "../services/manutencao.service.js";
import {
  createManutencaoSchema,
  updateManutencaoSchema,
} from "../schemas/transporte.schemas.js";

export async function manutencaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar manutenções (paginação opcional via page/limit)
  app.get(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Listar manutenções de veículos",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            veiculoId: { type: "string" },
            status: {
              type: "string",
              enum: ["AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"],
            },
            tipo: {
              type: "string",
              enum: [
                "PREVENTIVA",
                "CORRETIVA",
                "REVISAO",
                "TROCA_OLEO",
                "PNEUS",
                "FREIOS",
                "OUTRA",
              ],
            },
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
            page: { type: "string", example: "1" },
            limit: { type: "string", example: "20" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          veiculoId?: string;
          status?: string;
          tipo?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { veiculoId, status, tipo, dataInicio, dataFim, page, limit } =
          request.query;

        const filters: any = {};
        if (veiculoId) filters.veiculoId = veiculoId;
        if (status) filters.status = status;
        if (tipo) filters.tipo = tipo;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        if (page && limit) {
          return reply.send(
            await manutencaoService.findAllPaginated(filters, {
              page: parseInt(page),
              limit: parseInt(limit),
            })
          );
        }

        return reply.send(await manutencaoService.findAll(filters));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar manutenções";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Custo total de manutenções concluídas por veículo
  app.get(
    "/custos-por-veiculo",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Custo total de manutenções concluídas por veículo",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { dataInicio?: string; dataFim?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { dataInicio, dataFim } = request.query;
        const filters: any = {};
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        return reply.send(await manutencaoService.custoTotalPorVeiculo(filters));
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
            : "Erro ao calcular custos por veículo";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar manutenção por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Buscar manutenção por ID",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        return reply.send(await manutencaoService.findById(request.params.id));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar manutenção";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Agendar manutenção
  app.post(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Agendar manutenção de veículo",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createManutencaoSchema.parse(request.body);
        const manutencao = await manutencaoService.create(data);
        return reply.status(201).send(manutencao);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao agendar manutenção";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar manutenção
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Atualizar manutenção",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = updateManutencaoSchema.parse(request.body);
        const manutencao = await manutencaoService.update(
          request.params.id,
          data
        );
        return reply.send(manutencao);
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
            : "Erro ao atualizar manutenção";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar manutenção
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Deletar manutenção",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await manutencaoService.delete(request.params.id);
        return reply.send({ message: "Manutenção deletada com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao deletar manutenção";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
