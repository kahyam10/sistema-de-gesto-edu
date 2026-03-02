import { FastifyInstance } from "fastify";
import { AcompanhamentoService } from "../services/acompanhamento.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new AcompanhamentoService();

export async function acompanhamentoRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // Listar todos os acompanhamentos
  app.get("/", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Listar acompanhamentos pedagógicos",
      description: "Lista todos os acompanhamentos individualizados com filtros opcionais por escola, tipo, status e profissional",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          escolaId: {
            type: "string",
            description: "ID da escola",
          },
          tipo: {
            type: "string",
            enum: ["APRENDIZAGEM", "COMPORTAMENTO", "FREQUENCIA", "EMOCIONAL", "FAMILIAR"],
            description: "Tipo de acompanhamento",
          },
          status: {
            type: "string",
            enum: ["ATIVO", "CONCLUIDO", "SUSPENSO"],
            description: "Status do acompanhamento",
          },
          profissionalId: {
            type: "string",
            description: "ID do profissional responsável",
          },
          page: {
            type: "number",
            description: "Número da página (paginação)",
          },
          limit: {
            type: "number",
            description: "Limite de registros por página",
          },
        },
      },
      response: {
        200: {
          description: "Lista de acompanhamentos",
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
    const { escolaId, tipo, status, profissionalId, page, limit } = request.query as any;

    const filters = { escolaId, tipo, status, profissionalId };

    // Suporte a paginação
    if (page && limit) {
      const result = await service.findAllPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.send(result);
    }

    const acompanhamentos = await service.findAll(filters);
    return reply.send(acompanhamentos);
  });

  // Buscar acompanhamento por ID
  app.get("/:id", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Buscar acompanhamento por ID",
      description: "Retorna os detalhes de um acompanhamento específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const acompanhamento = await service.findById(id);
    return reply.send(acompanhamento);
  });

  // Buscar acompanhamentos por matrícula
  app.get("/matricula/:matriculaId", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Buscar acompanhamentos por matrícula",
      description: "Lista todos os acompanhamentos de um aluno específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          matriculaId: { type: "string", description: "ID da matrícula do aluno" },
        },
        required: ["matriculaId"],
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { matriculaId } = request.params as { matriculaId: string };
    const acompanhamentos = await service.findByMatricula(matriculaId);
    return reply.send(acompanhamentos);
  });

  // Criar acompanhamento
  app.post("/", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Criar acompanhamento pedagógico",
      description: "Cria um novo acompanhamento individualizado para aluno",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["matriculaId", "tipo", "profissionalId"],
        properties: {
          matriculaId: {
            type: "string",
            description: "ID da matrícula do aluno",
          },
          tipo: {
            type: "string",
            enum: ["APRENDIZAGEM", "COMPORTAMENTO", "FREQUENCIA", "EMOCIONAL", "FAMILIAR"],
            description: "Tipo de acompanhamento",
          },
          profissionalId: {
            type: "string",
            description: "ID do profissional responsável",
          },
          motivo: {
            type: "string",
            description: "Motivo do acompanhamento",
          },
          objetivos: {
            type: "string",
            description: "Objetivos do acompanhamento",
          },
          estrategias: {
            type: "string",
            description: "Estratégias a serem aplicadas",
          },
          observacoes: {
            type: "string",
            description: "Observações iniciais",
          },
          periodicidade: {
            type: "string",
            description: "Periodicidade do acompanhamento",
            example: "Semanal",
          },
        },
      },
      response: {
        201: {
          description: "Acompanhamento criado com sucesso",
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
    const data = request.body as any;
    const acompanhamento = await service.create(data);
    return reply.status(201).send(acompanhamento);
  });

  // Atualizar acompanhamento
  app.put("/:id", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Atualizar acompanhamento",
      description: "Atualiza os dados de um acompanhamento",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          objetivos: { type: "string" },
          estrategias: { type: "string" },
          observacoes: { type: "string" },
          periodicidade: { type: "string" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const acompanhamento = await service.update(id, data);
    return reply.send(acompanhamento);
  });

  // Deletar acompanhamento
  app.delete("/:id", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Deletar acompanhamento",
      description: "Remove um acompanhamento do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      response: {
        204: { type: "null" },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.delete(id);
    return reply.status(204).send();
  });

  // Registrar evolução
  app.post("/:id/evolucao", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Registrar evolução",
      description: "Registra a evolução do aluno no acompanhamento",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        required: ["descricao"],
        properties: {
          descricao: { type: "string", description: "Descrição da evolução" },
          data: { type: "string", format: "date-time", description: "Data da evolução" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const acompanhamento = await service.registrarEvolucao(id, data);
    return reply.send(acompanhamento);
  });

  // Concluir acompanhamento
  app.post("/:id/concluir", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Concluir acompanhamento",
      description: "Marca um acompanhamento como concluído",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        required: ["resultado"],
        properties: {
          resultado: { type: "string", description: "Resultado final do acompanhamento" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { resultado } = request.body as { resultado: string };
    const acompanhamento = await service.concluir(id, resultado);
    return reply.send(acompanhamento);
  });

  // Suspender acompanhamento
  app.post("/:id/suspender", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Suspender acompanhamento",
      description: "Suspende temporariamente um acompanhamento",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        required: ["motivo"],
        properties: {
          motivo: { type: "string", description: "Motivo da suspensão" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { motivo } = request.body as { motivo: string };
    const acompanhamento = await service.suspender(id, motivo);
    return reply.send(acompanhamento);
  });

  // Reativar acompanhamento
  app.post("/:id/reativar", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Reativar acompanhamento",
      description: "Reativa um acompanhamento suspenso",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do acompanhamento" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const acompanhamento = await service.reativar(id);
    return reply.send(acompanhamento);
  });

  // Obter estatísticas
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Acompanhamento Pedagógico"],
      summary: "Estatísticas de acompanhamentos",
      description: "Retorna estatísticas gerais ou por escola dos acompanhamentos pedagógicos",
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
            ativos: { type: "number" },
            concluidos: { type: "number" },
            porTipo: { type: "object" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await service.getEstatisticas(escolaId);
    return reply.send(estatisticas);
  });
}
