import { FastifyInstance } from "fastify";
import { BuscaAtivaService } from "../services/busca-ativa.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new BuscaAtivaService();

export async function buscaAtivaRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // ==================== BUSCA ATIVA ====================

  // Listar todas as buscas ativas
  app.get("/", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Listar casos de busca ativa",
      description: "Lista todos os casos de busca ativa com filtros opcionais e suporte a paginação",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          escolaId: { type: "string", description: "Filtrar por escola" },
          status: {
            type: "string",
            enum: ["ATIVA", "EM_ACOMPANHAMENTO", "RESOLVIDA", "CANCELADA"],
            description: "Filtrar por status"
          },
          prioridade: {
            type: "string",
            enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
            description: "Filtrar por prioridade"
          },
          motivo: {
            type: "string",
            enum: ["EVASAO", "INFREQUENCIA", "RISCO_ABANDONO", "TRANSFERENCIA_NAO_CONFIRMADA"],
            description: "Filtrar por motivo"
          },
          page: { type: "string", description: "Número da página" },
          limit: { type: "string", description: "Itens por página" },
        },
      },
      response: {
        200: {
          description: "Lista de casos de busca ativa",
          type: "object",
          additionalProperties: true,
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId, status, prioridade, motivo, page, limit } = request.query as any;

    const filters = { escolaId, status, prioridade, motivo };

    // Suporte a paginação
    if (page && limit) {
      const result = await service.findAllPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.send(result);
    }

    const buscasAtivas = await service.findAll(filters);
    return reply.send(buscasAtivas);
  });

  // Buscar uma busca ativa por ID
  app.get("/:id", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Buscar caso por ID",
      description: "Retorna os detalhes completos de um caso de busca ativa específico",
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
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const buscaAtiva = await service.findById(id);
    return reply.send(buscaAtiva);
  });

  // Criar nova busca ativa
  app.post("/", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Criar caso de busca ativa",
      description: "Cria um novo caso de busca ativa para aluno evadido ou em risco de evasão",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["matriculaId", "motivo", "responsavelId"],
        properties: {
          matriculaId: { type: "string", description: "ID da matrícula do aluno" },
          motivo: {
            type: "string",
            enum: ["EVASAO", "INFREQUENCIA", "RISCO_ABANDONO", "TRANSFERENCIA_NAO_CONFIRMADA"],
            description: "Motivo da busca ativa"
          },
          descricao: { type: "string", description: "Descrição detalhada do caso" },
          responsavelId: { type: "string", description: "ID do profissional responsável" },
          prioridade: {
            type: "string",
            enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
            description: "Prioridade do caso"
          },
        },
      },
      response: {
        201: {
          description: "Caso de busca ativa criado com sucesso",
          type: "object",
          additionalProperties: true,
        },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const buscaAtiva = await service.create(data);
    return reply.status(201).send(buscaAtiva);
  });

  // Atualizar busca ativa
  app.put("/:id", {
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
      body: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ATIVA", "EM_ACOMPANHAMENTO", "RESOLVIDA", "CANCELADA"] },
          prioridade: { type: "string", enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"] },
          descricao: { type: "string" },
          observacoes: { type: "string" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", properties: { error: { type: "string" } } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const buscaAtiva = await service.update(id, data);
    return reply.send(buscaAtiva);
  });

  // Deletar busca ativa
  app.delete("/:id", {
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
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.delete(id);
    return reply.status(204).send();
  });

  // Obter estatísticas
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Estatísticas de busca ativa",
      description: "Retorna estatísticas gerais ou por escola dos casos de busca ativa",
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
            porStatus: { type: "object" },
            porPrioridade: { type: "object" },
            porMotivo: { type: "object" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await service.getEstatisticas(escolaId);
    return reply.send(estatisticas);
  });

  // ==================== VISITAS DOMICILIARES ====================

  // Criar visita domiciliar
  app.post("/visitas", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Criar visita domiciliar",
      description: "Registra uma visita domiciliar realizada para um caso de busca ativa",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["buscaAtivaId", "data", "profissionalId"],
        properties: {
          buscaAtivaId: { type: "string", description: "ID do caso de busca ativa" },
          data: { type: "string", format: "date-time", description: "Data e hora da visita" },
          profissionalId: { type: "string", description: "ID do profissional que realizou a visita" },
          observacoes: { type: "string", description: "Observações sobre a visita" },
          resultado: { type: "string", enum: ["ALUNO_LOCALIZADO", "NAO_LOCALIZADO", "RECUSA", "FAMILIA_AUSENTE"] },
          proximaAcao: { type: "string", description: "Próxima ação a ser tomada" },
        },
      },
      response: {
        201: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const visita = await service.createVisita(data);
    return reply.status(201).send(visita);
  });

  // Listar visitas por busca ativa
  app.get("/:buscaAtivaId/visitas", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Listar visitas de um caso",
      description: "Lista todas as visitas domiciliares realizadas para um caso específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          buscaAtivaId: { type: "string", description: "ID do caso de busca ativa" },
        },
        required: ["buscaAtivaId"],
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { buscaAtivaId } = request.params as { buscaAtivaId: string };
    const visitas = await service.findVisitasByBuscaAtiva(buscaAtivaId);
    return reply.send(visitas);
  });

  // Atualizar visita
  app.put("/visitas/:id", {
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
      body: {
        type: "object",
        properties: {
          observacoes: { type: "string" },
          resultado: { type: "string", enum: ["ALUNO_LOCALIZADO", "NAO_LOCALIZADO", "RECUSA", "FAMILIA_AUSENTE"] },
          proximaAcao: { type: "string" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const visita = await service.updateVisita(id, data);
    return reply.send(visita);
  });

  // Deletar visita
  app.delete("/visitas/:id", {
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
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteVisita(id);
    return reply.status(204).send();
  });

  // ==================== ENCAMINHAMENTOS EXTERNOS ====================

  // Criar encaminhamento externo
  app.post("/encaminhamentos", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Criar encaminhamento externo",
      description: "Registra encaminhamento para órgãos externos (Conselho Tutelar, CRAS, etc.)",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["buscaAtivaId", "orgao", "data"],
        properties: {
          buscaAtivaId: { type: "string", description: "ID do caso de busca ativa" },
          orgao: { type: "string", description: "Órgão de destino", enum: ["CONSELHO_TUTELAR", "CRAS", "CREAS", "MINISTERIO_PUBLICO", "OUTRO"] },
          data: { type: "string", format: "date-time", description: "Data do encaminhamento" },
          motivo: { type: "string", description: "Motivo do encaminhamento" },
          observacoes: { type: "string" },
        },
      },
      response: {
        201: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const encaminhamento = await service.createEncaminhamento(data);
    return reply.status(201).send(encaminhamento);
  });

  // Listar encaminhamentos por busca ativa
  app.get("/:buscaAtivaId/encaminhamentos", {
    schema: {
      tags: ["Busca Ativa"],
      summary: "Listar encaminhamentos de um caso",
      description: "Lista todos os encaminhamentos externos realizados para um caso",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          buscaAtivaId: { type: "string", description: "ID do caso de busca ativa" },
        },
        required: ["buscaAtivaId"],
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { buscaAtivaId } = request.params as { buscaAtivaId: string };
    const encaminhamentos = await service.findEncaminhamentosByBuscaAtiva(buscaAtivaId);
    return reply.send(encaminhamentos);
  });

  // Atualizar encaminhamento
  app.put("/encaminhamentos/:id", {
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
      body: {
        type: "object",
        properties: {
          motivo: { type: "string" },
          observacoes: { type: "string" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const encaminhamento = await service.updateEncaminhamento(id, data);
    return reply.send(encaminhamento);
  });

  // Deletar encaminhamento
  app.delete("/encaminhamentos/:id", {
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
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteEncaminhamento(id);
    return reply.status(204).send();
  });
}
