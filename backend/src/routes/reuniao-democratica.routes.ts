import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { reuniaoDemocraticaService } from "../services/reuniao-democratica.service.js";
import {
  createReuniaoDemocraticaSchema,
  updateReuniaoDemocraticaSchema,
  registrarAtaSchema,
} from "../schemas/democratica.schemas.js";
import { authMiddleware } from "../middleware/auth.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { consultaListaSchema } from "../schemas/index.js";

export async function reuniaoDemocraticaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista reuniões democráticas
  app.get(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Listar reuniões e assembleias",
        description:
          "Lista reuniões da gestão democrática (colegiado, grêmio, assembleias) com filtros e paginação opcional.",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: { type: "string" },
            orgao: {
              type: "string",
              enum: ["COLEGIADO", "GREMIO", "ASSEMBLEIA_GERAL", "OUTRO"],
            },
            status: {
              type: "string",
              enum: ["AGENDADA", "REALIZADA", "CANCELADA"],
            },
            colegiadoId: { type: "string" },
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
          escolaId?: string;
          orgao?: string;
          status?: string;
          colegiadoId?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, orgao, status, colegiadoId } = request.query;
        const consulta = consultaListaSchema.parse(request.query);

        const filters: NonNullable<Parameters<typeof reuniaoDemocraticaService.findAllPaginated>[0]> = {};
        if (escolaId) filters.escolaId = escolaId;
        if (orgao) filters.orgao = orgao;
        if (status) filters.status = status;
        if (colegiadoId) filters.colegiadoId = colegiadoId;
        if (consulta.dataInicio) filters.dataInicio = consulta.dataInicio;
        if (consulta.dataFim) filters.dataFim = consulta.dataFim;

        if (consulta.page && consulta.limit) {
          const result = await reuniaoDemocraticaService.findAllPaginated(
            filters,
            { page: consulta.page, limit: consulta.limit }
          );
          return reply.send(result);
        }

        const reunioes = await reuniaoDemocraticaService.findAll(filters);
        return reply.send(reunioes);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Busca reunião por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Buscar reunião por ID",
        description: "Retorna a reunião com presenças e colegiado vinculado.",
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
        const reuniao = await reuniaoDemocraticaService.findById(
          request.params.id
        );
        return reply.send(reuniao);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Cria reunião
  app.post(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Agendar reunião ou assembleia",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["titulo", "orgao", "data", "horario", "escolaId"],
          properties: {
            titulo: { type: "string", example: "Assembleia Geral de Pais" },
            orgao: {
              type: "string",
              enum: ["COLEGIADO", "GREMIO", "ASSEMBLEIA_GERAL", "OUTRO"],
            },
            data: { type: "string", format: "date", example: "2026-08-15" },
            horario: { type: "string", example: "19:00" },
            local: { type: "string" },
            pauta: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  descricao: { type: "string" },
                },
              },
            },
            escolaId: { type: "string" },
            colegiadoId: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createReuniaoDemocraticaSchema.parse(request.body);
        const reuniao = await reuniaoDemocraticaService.create(body);
        return reply.status(201).send(reuniao);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualiza reunião
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar reunião",
        description: "Reuniões canceladas não podem ser alteradas.",
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
        const body = updateReuniaoDemocraticaSchema.parse(request.body);
        const reuniao = await reuniaoDemocraticaService.update(
          request.params.id,
          body
        );
        return reply.send(reuniao);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Remove reunião
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover reunião",
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
        await reuniaoDemocraticaService.delete(request.params.id);
        return reply.send({ message: "Reunião deletada com sucesso" });
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Registra ata (com decisões e presenças)
  app.patch(
    "/:id/registrar-ata",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Registrar ata da reunião",
        description:
          "Registra a ata, decisões e presenças, e marca a reunião como REALIZADA. As presenças enviadas substituem as anteriores (operação idempotente).",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["ata"],
          properties: {
            ata: { type: "string", description: "Texto da ata (mínimo 10 caracteres)" },
            decisoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  votosFavor: { type: "number" },
                  votosContra: { type: "number" },
                  abstencoes: { type: "number" },
                },
              },
            },
            presencas: {
              type: "array",
              items: {
                type: "object",
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
                  presente: { type: "boolean", default: true },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = registrarAtaSchema.parse(request.body);
        const reuniao = await reuniaoDemocraticaService.registrarAta(
          request.params.id,
          body
        );
        return reply.send(reuniao);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Cancela reunião
  app.patch(
    "/:id/cancelar",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Cancelar reunião",
        description: "Marca a reunião como CANCELADA (imutável a partir daí).",
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
        const reuniao = await reuniaoDemocraticaService.cancelar(
          request.params.id
        );
        return reply.send(reuniao);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
