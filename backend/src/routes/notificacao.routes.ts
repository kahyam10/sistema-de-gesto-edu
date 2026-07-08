import { FastifyInstance } from "fastify";
import { NotificacaoService } from "../services/notificacao.service";
import { authMiddleware } from "../middleware/auth";

const notificacaoService = new NotificacaoService();

export async function notificacaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/notificacoes - Lista todas as notificações
  app.get("/", {
    schema: {
      tags: ["Notificações"],
      summary: "Listar notificações",
      description: "Lista todas as notificações com filtros opcionais por usuário, tipo, prioridade e status de leitura",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "ID do usuário",
          },
          tipo: {
            type: "string",
            enum: ["SISTEMA", "ACADEMICO", "FINANCEIRO", "COMUNICADO", "LEMBRETE", "URGENTE"],
            description: "Tipo da notificação",
          },
          prioridade: {
            type: "string",
            enum: ["BAIXA", "NORMAL", "ALTA", "URGENTE"],
            description: "Prioridade da notificação",
          },
          lida: {
            type: "string",
            enum: ["true", "false"],
            description: "Filtrar por notificações lidas/não lidas",
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
          description: "Lista de notificações",
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
    const { userId, tipo, prioridade, lida, page, limit } = request.query as any;

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (tipo) filters.tipo = tipo;
    if (prioridade) filters.prioridade = prioridade;
    if (lida !== undefined) filters.lida = lida === "true";

    // Suporte a paginação
    if (page && limit) {
      const result = await notificacaoService.findAllPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.status(200).send(result);
    }

    const notificacoes = await notificacaoService.findAll(filters);
    return reply.status(200).send(notificacoes);
  });

  // GET /api/notificacoes/usuario/:userId - Busca notificações de um usuário
  app.get("/usuario/:userId", {
    schema: {
      tags: ["Notificações"],
      summary: "Buscar notificações por usuário",
      description: "Lista notificações de um usuário específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          userId: { type: "string", description: "ID do usuário" },
        },
        required: ["userId"],
      },
      querystring: {
        type: "object",
        properties: {
          filtro: {
            type: "string",
            enum: ["NAO_LIDAS", "LIDAS", "TODAS"],
            description: "Filtro de leitura",
            default: "TODAS",
          },
        },
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as any;
    const { filtro } = request.query as any;

    const notificacoes = await notificacaoService.findByUser(
      userId,
      filtro as "NAO_LIDAS" | "LIDAS" | "TODAS"
    );
    return reply.status(200).send(notificacoes);
  });

  // GET /api/notificacoes/:id - Busca uma notificação por ID
  app.get("/:id", {
    schema: {
      tags: ["Notificações"],
      summary: "Buscar notificação por ID",
      description: "Retorna os detalhes de uma notificação específica",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da notificação" },
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
    const notificacao = await notificacaoService.findById(id);
    return reply.status(200).send(notificacao);
  });

  // POST /api/notificacoes - Cria uma nova notificação
  app.post("/", {
    schema: {
      tags: ["Notificações"],
      summary: "Criar notificação",
      description: "Cria uma nova notificação para um ou mais usuários do sistema",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["userId", "titulo", "mensagem", "tipo"],
        properties: {
          userId: {
            type: "string",
            description: "ID do usuário destinatário",
          },
          titulo: {
            type: "string",
            description: "Título da notificação",
            example: "Manutenção Programada",
          },
          mensagem: {
            type: "string",
            description: "Conteúdo da notificação",
            example: "O sistema ficará indisponível das 22h às 23h para manutenção.",
          },
          tipo: {
            type: "string",
            enum: ["SISTEMA", "ACADEMICO", "FINANCEIRO", "COMUNICADO", "LEMBRETE", "URGENTE"],
            description: "Tipo da notificação",
          },
          prioridade: {
            type: "string",
            enum: ["BAIXA", "NORMAL", "ALTA", "URGENTE"],
            description: "Prioridade da notificação",
            default: "NORMAL",
          },
          categoria: {
            type: "string",
            description: "Categoria da notificação",
          },
          linkAcao: {
            type: "string",
            description: "URL de redirecionamento ao clicar",
          },
          canais: {
            type: "array",
            items: {
              type: "string",
              enum: ["APP", "EMAIL", "SMS", "PUSH"],
            },
            description: "Canais de envio",
            default: ["APP"],
          },
          agendadaPara: {
            type: "string",
            format: "date-time",
            description: "Data/hora para envio agendado",
          },
          expirarEm: {
            type: "string",
            format: "date-time",
            description: "Data/hora de expiração",
          },
        },
      },
      response: {
        201: {
          description: "Notificação criada com sucesso",
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
    const notificacao = await notificacaoService.create(data);
    return reply.status(201).send(notificacao);
  });

  // POST /api/notificacoes/bulk - Cria notificações em massa
  app.post("/bulk", {
    schema: {
      tags: ["Notificações"],
      summary: "Criar notificações em massa",
      description: "Cria múltiplas notificações de uma vez",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["notificacoes"],
        properties: {
          notificacoes: {
            type: "array",
            items: {
              type: "object",
              required: ["userId", "titulo", "mensagem", "tipo"],
              properties: {
                userId: { type: "string" },
                titulo: { type: "string" },
                mensagem: { type: "string" },
                tipo: { type: "string", enum: ["SISTEMA", "ACADEMICO", "FINANCEIRO", "COMUNICADO", "LEMBRETE", "URGENTE"] },
                prioridade: { type: "string", enum: ["BAIXA", "NORMAL", "ALTA", "URGENTE"] },
              },
            },
          },
        },
      },
      response: {
        201: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const notificacoes = await notificacaoService.createBulk(data);
    return reply.status(201).send(notificacoes);
  });

  // POST /api/notificacoes/:id/marcar-lida - Marca notificação como lida
  app.post("/:id/marcar-lida", {
    schema: {
      tags: ["Notificações"],
      summary: "Marcar notificação como lida",
      description: "Marca uma notificação como lida pelo usuário",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da notificação" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const notificacao = await notificacaoService.marcarComoLida(id);
    return reply.status(200).send(notificacao);
  });

  // POST /api/notificacoes/usuario/:userId/marcar-todas-lidas - Marca todas as notificações como lidas
  app.post("/usuario/:userId/marcar-todas-lidas", {
    schema: {
      tags: ["Notificações"],
      summary: "Marcar todas como lidas",
      description: "Marca todas as notificações de um usuário como lidas",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          userId: { type: "string", description: "ID do usuário" },
        },
        required: ["userId"],
      },
      response: {
        200: { description: "Todas as notificações marcadas como lidas", type: "object", properties: { count: { type: "number" } } },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as any;
    const result = await notificacaoService.marcarTodasComoLidas(userId);
    return reply.status(200).send(result);
  });

  // DELETE /api/notificacoes/:id - Deleta uma notificação
  app.delete("/:id", {
    schema: {
      tags: ["Notificações"],
      summary: "Deletar notificação",
      description: "Remove uma notificação do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da notificação" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await notificacaoService.delete(id);
    return reply.status(200).send(result);
  });

  // DELETE /api/notificacoes/usuario/:userId/lidas - Deleta todas as notificações lidas
  app.delete("/usuario/:userId/lidas", {
    schema: {
      tags: ["Notificações"],
      summary: "Deletar notificações lidas",
      description: "Remove todas as notificações lidas de um usuário",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          userId: { type: "string", description: "ID do usuário" },
        },
        required: ["userId"],
      },
      response: {
        200: { description: "Notificações lidas deletadas", type: "object", properties: { count: { type: "number" } } },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as any;
    const result = await notificacaoService.deletarLidas(userId);
    return reply.status(200).send(result);
  });

  // GET /api/notificacoes/usuario/:userId/count-nao-lidas - Conta notificações não lidas
  app.get("/usuario/:userId/count-nao-lidas", {
    schema: {
      tags: ["Notificações"],
      summary: "Contar notificações não lidas",
      description: "Retorna o número de notificações não lidas de um usuário",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          userId: { type: "string", description: "ID do usuário" },
        },
        required: ["userId"],
      },
      response: {
        200: { description: "Contagem", type: "object", properties: { count: { type: "number" } } },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as any;
    const result = await notificacaoService.countNaoLidas(userId);
    return reply.status(200).send(result);
  });

  // GET /api/notificacoes/relatorios/estatisticas - Estatísticas de notificações
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Notificações"],
      summary: "Estatísticas de notificações",
      description: "Retorna estatísticas gerais ou por usuário das notificações",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          userId: { type: "string", description: "ID do usuário (opcional)" },
        },
      },
      response: {
        200: {
          description: "Estatísticas",
          type: "object",
          properties: {
            total: { type: "number" },
            lidas: { type: "number" },
            naoLidas: { type: "number" },
            porTipo: { type: "object" },
            porPrioridade: { type: "object" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.query as any;
    const estatisticas = await notificacaoService.getEstatisticas(userId);
    return reply.status(200).send(estatisticas);
  });

  // PUT /api/notificacoes/:id/status-envio - Atualiza status de envio
  app.put("/:id/status-envio", {
    schema: {
      tags: ["Notificações"],
      summary: "Atualizar status de envio",
      description: "Atualiza o status de envio de uma notificação em um canal específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da notificação" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        required: ["canal", "enviado"],
        properties: {
          canal: { type: "string", enum: ["APP", "EMAIL", "SMS", "PUSH"], description: "Canal de envio" },
          enviado: { type: "boolean", description: "Status de envio" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { canal, enviado } = request.body as any;

    if (!canal || enviado === undefined) {
      return reply.status(400).send({
        error: "canal e enviado são obrigatórios",
      });
    }

    const notificacao = await notificacaoService.atualizarStatusEnvio(
      id,
      canal,
      enviado
    );
    return reply.status(200).send(notificacao);
  });
}
