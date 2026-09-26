import { FastifyInstance } from "fastify";
import { PlantaoPedagogicoService } from "../services/plantao-pedagogico.service";
import { authMiddleware } from "../middleware/auth";
import {
  createPlantaoSchema, escolaQuerySchema, idParamSchema, listarPlantoesQuerySchema,
  periodoObrigatorioQuerySchema, updatePlantaoSchema,
} from "../schemas/comunicacao.schemas.js";

const plantaoPedagogicoService = new PlantaoPedagogicoService();

export async function plantaoPedagogicoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/plantoes-pedagogicos - Lista todos os plantões
  app.get("/", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Listar plantões pedagógicos",
      description: "Lista todos os plantões pedagógicos com filtros opcionais",
      security: [{ bearerAuth: [] }],
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } } },
    },
  }, async (request, reply) => {
    const filters = listarPlantoesQuerySchema.parse(request.query);

    const plantoes = await plantaoPedagogicoService.findAll(filters);
    return reply.status(200).send(plantoes);
  });

  // GET /api/plantoes-pedagogicos/:id - Busca um plantão por ID
  app.get("/:id", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Buscar plantão por ID",
      description: "Retorna os detalhes de um plantão pedagógico específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do plantão" },
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
    const plantao = await plantaoPedagogicoService.findById(id);
    return reply.status(200).send(plantao);
  });

  // POST /api/plantoes-pedagogicos - Cria um novo plantão
  app.post("/", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Criar plantão pedagógico",
      description: "Cria um novo plantão pedagógico para atendimento",
      security: [{ bearerAuth: [] }],
      response: { 201: { type: "object", additionalProperties: true } },
    },
  }, async (request, reply) => {
    const data = createPlantaoSchema.parse(request.body);
    const plantao = await plantaoPedagogicoService.create(data);
    return reply.status(201).send(plantao);
  });

  // PUT /api/plantoes-pedagogicos/:id - Atualiza um plantão
  app.put("/:id", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Atualizar plantão",
      description: "Atualiza os dados de um plantão pedagógico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do plantão" },
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
    const data = updatePlantaoSchema.parse(request.body);
    const plantao = await plantaoPedagogicoService.update(id, data);
    return reply.status(200).send(plantao);
  });

  // DELETE /api/plantoes-pedagogicos/:id - Deleta um plantão
  app.delete("/:id", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Deletar plantão",
      description: "Remove um plantão pedagógico do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do plantão" },
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
    const result = await plantaoPedagogicoService.delete(id);
    return reply.status(200).send(result);
  });

  // GET /api/plantoes-pedagogicos/escola/:escolaId/periodo - Busca plantões por escola e período
  app.get("/escola/:escolaId/periodo", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Buscar plantões por escola e período",
      description: "Lista plantões de uma escola em um período específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          escolaId: { type: "string", description: "ID da escola" },
        },
        required: ["escolaId"],
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.params as { escolaId: string };
    const { dataInicio, dataFim } = periodoObrigatorioQuerySchema.parse(request.query);

    const plantoes = await plantaoPedagogicoService.findByEscolaAndPeriodo(escolaId, dataInicio, dataFim);
    return reply.status(200).send(plantoes);
  });

  // GET /api/plantoes-pedagogicos/relatorios/estatisticas - Estatísticas de plantões
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Estatísticas de plantões",
      description: "Retorna estatísticas gerais ou por escola dos plantões pedagógicos",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: "Estatísticas",
          type: "object",
          properties: {
            total: { type: "number" },
            porTipo: { type: "object" },
            porMes: { type: "object" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = escolaQuerySchema.parse(request.query);
    const estatisticas = await plantaoPedagogicoService.getEstatisticas(
      escolaId
    );
    return reply.status(200).send(estatisticas);
  });
}
