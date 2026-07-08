import { FastifyInstance } from "fastify";
import { PlantaoPedagogicoService } from "../services/plantao-pedagogico.service";
import { authMiddleware } from "../middleware/auth";

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
      querystring: {
        type: "object",
        properties: {
          escolaId: { type: "string", description: "Filtrar por escola" },
          turmaId: { type: "string", description: "Filtrar por turma" },
          tipo: { type: "string", enum: ["INDIVIDUAL", "COLETIVO", "POR_TURMA"] },
          dataInicio: { type: "string", format: "date" },
          dataFim: { type: "string", format: "date" },
          ativo: { type: "boolean" },
        },
      },
      response: { 200: { type: "array", items: { type: "object", additionalProperties: true } } },
    },
  }, async (request, reply) => {
    const { escolaId, turmaId, tipo, dataInicio, dataFim, ativo } =
      request.query as any;

    const filters: any = {};
    if (escolaId) filters.escolaId = escolaId;
    if (turmaId) filters.turmaId = turmaId;
    if (tipo) filters.tipo = tipo;
    if (ativo !== undefined) filters.ativo = ativo === "true";
    if (dataInicio) filters.dataInicio = new Date(dataInicio);
    if (dataFim) filters.dataFim = new Date(dataFim);

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
    const { id } = request.params as any;
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
      body: {
        type: "object",
        required: ["escolaId", "data", "tipo", "horarioInicio", "horarioFim"],
        properties: {
          escolaId: { type: "string" },
          data: { type: "string", format: "date" },
          tipo: { type: "string", enum: ["INDIVIDUAL", "COLETIVO", "POR_TURMA"] },
          horarioInicio: { type: "string" },
          horarioFim: { type: "string" },
          turmaId: { type: "string" },
          local: { type: "string" },
          observacoes: { type: "string" },
        },
      },
      response: { 201: { type: "object", additionalProperties: true } },
    },
  }, async (request, reply) => {
    const data = request.body as any;

    // Converter data string para Date
    if (data.data) {
      data.data = new Date(data.data);
    }

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
      body: {
        type: "object",
        properties: {
          data: { type: "string", format: "date" },
          horarioInicio: { type: "string" },
          horarioFim: { type: "string" },
          local: { type: "string" },
          observacoes: { type: "string" },
          ativo: { type: "boolean" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
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
    const { id } = request.params as any;
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
      querystring: {
        type: "object",
        required: ["dataInicio", "dataFim"],
        properties: {
          dataInicio: { type: "string", format: "date", description: "Data inicial (YYYY-MM-DD)" },
          dataFim: { type: "string", format: "date", description: "Data final (YYYY-MM-DD)" },
        },
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.params as any;
    const { dataInicio, dataFim } = request.query as any;

    if (!dataInicio || !dataFim) {
      return reply.status(400).send({
        error: "dataInicio e dataFim são obrigatórios",
      });
    }

    const plantoes = await plantaoPedagogicoService.findByEscolaAndPeriodo(
      escolaId,
      new Date(dataInicio),
      new Date(dataFim)
    );
    return reply.status(200).send(plantoes);
  });

  // GET /api/plantoes-pedagogicos/relatorios/estatisticas - Estatísticas de plantões
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Plantão Pedagógico"],
      summary: "Estatísticas de plantões",
      description: "Retorna estatísticas gerais ou por escola dos plantões pedagógicos",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          escolaId: { type: "string", description: "ID da escola (opcional)" },
        },
      },
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
    const { escolaId } = request.query as any;
    const estatisticas = await plantaoPedagogicoService.getEstatisticas(
      escolaId
    );
    return reply.status(200).send(estatisticas);
  });
}
