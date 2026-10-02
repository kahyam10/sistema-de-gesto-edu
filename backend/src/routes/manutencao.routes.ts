import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { manutencaoService } from "../services/manutencao.service.js";
import {
  createManutencaoSchema,
  updateManutencaoSchema,
} from "../schemas/transporte.schemas.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { consultaListaSchema } from "../schemas/index.js";

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
        const { veiculoId, status, tipo } = request.query;
        const consulta = consultaListaSchema.parse(request.query);

        const filters: NonNullable<Parameters<typeof manutencaoService.findAllPaginated>[0]> = {};
        if (veiculoId) filters.veiculoId = veiculoId;
        if (status) filters.status = status;
        if (tipo) filters.tipo = tipo;
        if (consulta.dataInicio) filters.dataInicio = consulta.dataInicio;
        if (consulta.dataFim) filters.dataFim = consulta.dataFim;

        if (consulta.page && consulta.limit) {
          return reply.send(
            await manutencaoService.findAllPaginated(filters, {
              page: consulta.page,
              limit: consulta.limit,
            })
          );
        }

        return reply.send(await manutencaoService.findAll(filters));
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        const consulta = consultaListaSchema.parse(request.query);
        const filters: NonNullable<Parameters<typeof manutencaoService.custoTotalPorVeiculo>[0]> = {};
        if (consulta.dataInicio) filters.dataInicio = consulta.dataInicio;
        if (consulta.dataFim) filters.dataFim = consulta.dataFim;

        return reply.send(await manutencaoService.custoTotalPorVeiculo(filters));
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
      }
    }
  );
}
