import { FastifyInstance } from "fastify";
import { ReuniaoPaisService } from "../services/reuniao-pais.service";
import { authMiddleware } from "../middleware/auth";
import {
  createReuniaoPaisSchema, escolaQuerySchema, idParamSchema, listarReunioesQuerySchema,
  registrarPresencaReuniaoSchema, updateReuniaoPaisSchema,
} from "../schemas/comunicacao.schemas.js";

const reuniaoPaisService = new ReuniaoPaisService();

export async function reuniaoPaisRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/reunioes-pais - Lista todas as reuniões
  app.get("/", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Listar reuniões de pais e responsáveis",
      description: "Lista todas as reuniões de pais com filtros opcionais por escola, turma, tipo, status e período",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: "Lista de reuniões",
          type: "array",
        },
        401: {
          description: "Não autorizado",
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { page, limit, ...filters } = listarReunioesQuerySchema.parse(request.query);

    // Suporte a paginação
    if (page && limit) {
      const result = await reuniaoPaisService.findAllPaginated(filters, { page, limit });
      return reply.status(200).send(result);
    }

    const reunioes = await reuniaoPaisService.findAll(filters);
    return reply.status(200).send(reunioes);
  });

  // GET /api/reunioes-pais/:id - Busca uma reunião por ID
  app.get("/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Buscar reunião por ID",
      description: "Retorna os detalhes de uma reunião específica",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da reunião" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const reuniao = await reuniaoPaisService.findById(id);
    return reply.status(200).send(reuniao);
  });

  // POST /api/reunioes-pais - Cria uma nova reunião
  app.post("/", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Criar reunião de pais",
      description: "Agenda uma nova reunião de pais e responsáveis",
      security: [{ bearerAuth: [] }],
      response: {
        201: {
          description: "Reunião criada com sucesso",
          type: "object",
        },
        400: {
          description: "Dados inválidos",
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        401: {
          description: "Não autorizado",
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const data = createReuniaoPaisSchema.parse(request.body);
    const reuniao = await reuniaoPaisService.create(data);
    return reply.status(201).send(reuniao);
  });

  // PUT /api/reunioes-pais/:id - Atualiza uma reunião
  app.put("/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Atualizar reunião",
      description: "Atualiza os dados de uma reunião de pais",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da reunião" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateReuniaoPaisSchema.parse(request.body);
    const reuniao = await reuniaoPaisService.update(id, data);
    return reply.status(200).send(reuniao);
  });

  // DELETE /api/reunioes-pais/:id - Deleta uma reunião
  app.delete("/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Deletar reunião",
      description: "Remove uma reunião de pais do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da reunião" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const result = await reuniaoPaisService.delete(id);
    return reply.status(200).send(result);
  });

  // POST /api/reunioes-pais/presencas - Registra presença em reunião
  app.post("/presencas", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Registrar presença",
      description: "Registra a presença de um responsável em uma reunião",
      security: [{ bearerAuth: [] }],
      response: {
        201: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const data = registrarPresencaReuniaoSchema.parse(request.body);
    const presenca = await reuniaoPaisService.registrarPresenca(data);
    return reply.status(201).send(presenca);
  });

  // GET /api/reunioes-pais/:reuniaoId/presencas - Lista presenças de uma reunião
  app.get("/:reuniaoId/presencas", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Listar presenças de uma reunião",
      description: "Lista todos os responsáveis que compareceram a uma reunião",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          reuniaoId: { type: "string", description: "ID da reunião" },
        },
        required: ["reuniaoId"],
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { reuniaoId } = request.params as { reuniaoId: string };
    const presencas = await reuniaoPaisService.findPresencasByReuniao(
      reuniaoId
    );
    return reply.status(200).send(presencas);
  });

  // DELETE /api/reunioes-pais/presencas/:id - Deleta uma presença
  app.delete("/presencas/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Deletar presença",
      description: "Remove o registro de presença de um responsável",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da presença" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const result = await reuniaoPaisService.deletePresenca(id);
    return reply.status(200).send(result);
  });

  // GET /api/reunioes-pais/relatorios/estatisticas - Estatísticas de reuniões
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Estatísticas de reuniões",
      description: "Retorna estatísticas gerais ou por escola das reuniões de pais",
      security: [{ bearerAuth: [] }],
      response: {
        // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
      },
    },
  }, async (request, reply) => {
    const { escolaId } = escolaQuerySchema.parse(request.query);
    const estatisticas = await reuniaoPaisService.getEstatisticas(escolaId);
    return reply.status(200).send(estatisticas);
  });
}
