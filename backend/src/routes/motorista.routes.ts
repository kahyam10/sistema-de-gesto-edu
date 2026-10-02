import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { motoristaService } from "../services/motorista.service.js";
import {
  createMotoristaSchema,
  updateMotoristaSchema,
} from "../schemas/transporte.schemas.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { diasAlertaQuerySchema } from "../schemas/parametros.schemas.js";

export async function motoristaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar motoristas
  app.get(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Listar motoristas",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            ativo: { type: "string", enum: ["true", "false"] },
            vinculo: {
              type: "string",
              enum: ["EFETIVO", "CONTRATADO", "TERCEIRIZADO"],
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { ativo?: string; vinculo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { ativo, vinculo } = request.query;
        const filters: NonNullable<Parameters<typeof motoristaService.findAll>[0]> = {};
        if (ativo !== undefined) filters.ativo = ativo === "true";
        if (vinculo) filters.vinculo = vinculo;

        return reply.send(await motoristaService.findAll(filters));
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Alertas de CNH e curso de transporte escolar vencendo
  app.get(
    "/alertas-cnh",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Alertas de CNH e curso de transporte escolar vencendo",
        description:
          "Motoristas ativos com CNH ou curso de transporte escolar vencidos ou vencendo nos próximos dias (default 30).",
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
        const { dias } = diasAlertaQuerySchema.parse(request.query);
        return reply.send(await motoristaService.alertasCnh(dias));
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Buscar motorista por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Buscar motorista por ID",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        return reply.send(await motoristaService.findById(request.params.id));
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Cadastrar motorista
  app.post(
    "/",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Cadastrar motorista",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createMotoristaSchema.parse(request.body);
        const motorista = await motoristaService.create(data);
        return reply.status(201).send(motorista);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualizar motorista
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Atualizar motorista",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = updateMotoristaSchema.parse(request.body);
        const motorista = await motoristaService.update(
          request.params.id,
          data
        );
        return reply.send(motorista);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar motorista
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Transporte Escolar"],
        summary: "Deletar motorista",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await motoristaService.delete(request.params.id);
        return reply.send({ message: "Motorista deletado com sucesso" });
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
