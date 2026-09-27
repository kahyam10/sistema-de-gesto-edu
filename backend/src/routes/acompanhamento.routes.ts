import { FastifyInstance } from "fastify";
import {
  concluirAcompanhamentoSchema, createAcompanhamentoSchema, escolaQuerySchema, listarAcompanhamentosQuerySchema,
  registrarEvolucaoSchema, suspenderAcompanhamentoSchema, updateAcompanhamentoSchema,
} from "../schemas/programas.schemas.js";
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
    const { page, limit, ...filters } = listarAcompanhamentosQuerySchema.parse(request.query);

    // Suporte a paginação
    if (page && limit) {
      const result = await service.findAllPaginated(filters, { page, limit });
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
    const data = createAcompanhamentoSchema.parse(request.body);
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
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateAcompanhamentoSchema.parse(request.body);
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
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = registrarEvolucaoSchema.parse(request.body);
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
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { resultado } = concluirAcompanhamentoSchema.parse(request.body);
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
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { motivo } = suspenderAcompanhamentoSchema.parse(request.body);
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
      response: {
        // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
      },
    },
  }, async (request, reply) => {
    const { escolaId } = escolaQuerySchema.parse(request.query);
    const estatisticas = await service.getEstatisticas(escolaId);
    return reply.send(estatisticas);
  });
}
