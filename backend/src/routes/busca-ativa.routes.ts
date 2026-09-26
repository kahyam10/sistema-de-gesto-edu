import { FastifyInstance } from "fastify";
import {
  createBuscaAtivaSchema, createEncaminhamentoSchema, createVisitaSchema, escolaQuerySchema, listarBuscaAtivaQuerySchema,
  updateBuscaAtivaSchema, updateEncaminhamentoSchema, updateVisitaSchema,
} from "../schemas/programas.schemas.js";
import { BuscaAtivaService } from "../services/busca-ativa.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new BuscaAtivaService();

export async function buscaAtivaRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // ==================== BUSCA ATIVA ====================

  // Listar todas as buscas ativas
  app.get(
    "/",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Listar casos de busca ativa",
        description:
          "Lista todos os casos de busca ativa com filtros opcionais e suporte a paginação",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de casos de busca ativa",
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const { page, limit, ...filters } = listarBuscaAtivaQuerySchema.parse(request.query);

      // Suporte a paginação
      if (page && limit) {
        const result = await service.findAllPaginated(filters, { page, limit });
        return reply.send(result);
      }

      const buscasAtivas = await service.findAll(filters);
      return reply.send(buscasAtivas);
    },
  );

  // Buscar uma busca ativa por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Buscar caso por ID",
        description:
          "Retorna os detalhes completos de um caso de busca ativa específico",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do caso de busca ativa" },
          },
          required: ["id"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
          404: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const buscaAtiva = await service.findById(id);
      return reply.send(buscaAtiva);
    },
  );

  // Criar nova busca ativa
  app.post(
    "/",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Criar caso de busca ativa",
        description:
          "Cria um novo caso de busca ativa para aluno evadido ou em risco de evasão",
        security: [{ bearerAuth: [] }],
        response: {
          201: {
            description: "Caso de busca ativa criado com sucesso",
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const data = createBuscaAtivaSchema.parse(request.body);
      const buscaAtiva = await service.create(data);
      return reply.status(201).send(buscaAtiva);
    },
  );

  // Atualizar busca ativa
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Atualizar caso",
        description: "Atualiza os dados de um caso de busca ativa",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do caso" },
          },
          required: ["id"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
          404: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = updateBuscaAtivaSchema.parse(request.body);
      const buscaAtiva = await service.update(id, data);
      return reply.send(buscaAtiva);
    },
  );

  // Deletar busca ativa
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Deletar caso",
        description: "Remove um caso de busca ativa do sistema",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do caso" },
          },
          required: ["id"],
        },
        response: {
          204: { type: "null" },
          404: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id);
      return reply.status(204).send();
    },
  );

  // Obter estatísticas
  app.get(
    "/relatorios/estatisticas",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Estatísticas de busca ativa",
        description:
          "Retorna estatísticas gerais ou por escola dos casos de busca ativa",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Estatísticas",
            type: "object",
            properties: {
              total: { type: "number" },
              porStatus: { type: "object" },
              porPrioridade: { type: "object" },
              porMotivo: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { escolaId } = escolaQuerySchema.parse(request.query);
      const estatisticas = await service.getEstatisticas(escolaId);
      return reply.send(estatisticas);
    },
  );

  // ==================== VISITAS DOMICILIARES ====================

  // Criar visita domiciliar
  app.post(
    "/visitas",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Criar visita domiciliar",
        description:
          "Registra uma visita domiciliar realizada para um caso de busca ativa",
        security: [{ bearerAuth: [] }],
        response: {
          201: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const data = createVisitaSchema.parse(request.body);
      const visita = await service.createVisita(data);
      return reply.status(201).send(visita);
    },
  );

  // Listar visitas por busca ativa
  app.get(
    "/:buscaAtivaId/visitas",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Listar visitas de um caso",
        description:
          "Lista todas as visitas domiciliares realizadas para um caso específico",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            buscaAtivaId: {
              type: "string",
              description: "ID do caso de busca ativa",
            },
          },
          required: ["buscaAtivaId"],
        },
        response: {
          200: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
        },
      },
    },
    async (request, reply) => {
      const { buscaAtivaId } = request.params as { buscaAtivaId: string };
      const visitas = await service.findVisitasByBuscaAtiva(buscaAtivaId);
      return reply.send(visitas);
    },
  );

  // Atualizar visita
  app.put(
    "/visitas/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Atualizar visita",
        description: "Atualiza os dados de uma visita domiciliar",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID da visita" },
          },
          required: ["id"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = updateVisitaSchema.parse(request.body);
      const visita = await service.updateVisita(id, data);
      return reply.send(visita);
    },
  );

  // Deletar visita
  app.delete(
    "/visitas/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Deletar visita",
        description: "Remove uma visita domiciliar do sistema",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID da visita" },
          },
          required: ["id"],
        },
        response: {
          204: { type: "null" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.deleteVisita(id);
      return reply.status(204).send();
    },
  );

  // ==================== ENCAMINHAMENTOS EXTERNOS ====================

  // Criar encaminhamento externo
  app.post(
    "/encaminhamentos",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Criar encaminhamento externo",
        description:
          "Registra encaminhamento para órgãos externos (Conselho Tutelar, CRAS, etc.)",
        security: [{ bearerAuth: [] }],
        response: {
          201: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const data = createEncaminhamentoSchema.parse(request.body);
      const encaminhamento = await service.createEncaminhamento(data);
      return reply.status(201).send(encaminhamento);
    },
  );

  // Listar encaminhamentos por busca ativa
  app.get(
    "/:buscaAtivaId/encaminhamentos",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Listar encaminhamentos de um caso",
        description:
          "Lista todos os encaminhamentos externos realizados para um caso",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            buscaAtivaId: {
              type: "string",
              description: "ID do caso de busca ativa",
            },
          },
          required: ["buscaAtivaId"],
        },
        response: {
          200: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
        },
      },
    },
    async (request, reply) => {
      const { buscaAtivaId } = request.params as { buscaAtivaId: string };
      const encaminhamentos =
        await service.findEncaminhamentosByBuscaAtiva(buscaAtivaId);
      return reply.send(encaminhamentos);
    },
  );

  // Atualizar encaminhamento
  app.put(
    "/encaminhamentos/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Atualizar encaminhamento",
        description: "Atualiza os dados de um encaminhamento externo",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do encaminhamento" },
          },
          required: ["id"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = updateEncaminhamentoSchema.parse(request.body);
      const encaminhamento = await service.updateEncaminhamento(id, data);
      return reply.send(encaminhamento);
    },
  );

  // Deletar encaminhamento
  app.delete(
    "/encaminhamentos/:id",
    {
      schema: {
        tags: ["Busca Ativa"],
        summary: "Deletar encaminhamento",
        description: "Remove um encaminhamento externo do sistema",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do encaminhamento" },
          },
          required: ["id"],
        },
        response: {
          204: { type: "null" },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.deleteEncaminhamento(id);
      return reply.status(204).send();
    },
  );
}
