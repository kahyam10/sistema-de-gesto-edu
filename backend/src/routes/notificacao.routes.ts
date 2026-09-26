import { FastifyInstance } from "fastify";
import { NotificacaoService } from "../services/notificacao.service";
import { authMiddleware } from "../middleware/auth";
import { garantirProprio, podeVerDeOutro } from "../lib/proprio.js";
import { NotFoundError, PermissionError } from "../errors/index.js";
import { prisma } from "../lib/prisma.js";
import {
  createNotificacaoSchema, createNotificacoesEmMassaSchema, filtroLeituraNotificacaoSchema, idParamSchema,
  listarNotificacoesQuerySchema, statusEnvioSchema, usuarioQuerySchema,
} from "../schemas/comunicacao.schemas.js";

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
    const { page, limit, ...filters } = listarNotificacoesQuerySchema.parse(request.query);

    // Suporte a paginação
    if (page && limit) {
      const result = await notificacaoService.findAllPaginated(filters, { page, limit });
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
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    garantirProprio(request, userId);
    const { filtro } = filtroLeituraNotificacaoSchema.parse(request.query);

    const notificacoes = await notificacaoService.findByUser(userId, filtro);
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
    const { id } = idParamSchema.parse(request.params);
    const alvo = await prisma.notificacao.findUnique({ where: { id }, select: { userId: true } });
    if (!alvo) throw new NotFoundError("NF_028");
    if (alvo.userId !== request.user.id && !podeVerDeOutro(request.user)) throw new PermissionError("PERM_004");
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
    const data = createNotificacaoSchema.parse(request.body);
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
      response: {
        201: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const data = createNotificacoesEmMassaSchema.parse(request.body);
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
    const { id } = idParamSchema.parse(request.params);
    const alvo = await prisma.notificacao.findUnique({ where: { id }, select: { userId: true } });
    if (!alvo) throw new NotFoundError("NF_028");
    if (alvo.userId !== request.user.id && !podeVerDeOutro(request.user)) throw new PermissionError("PERM_004");
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
    const { userId } = request.params as { userId: string };
    garantirProprio(request, userId);
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
    const { id } = idParamSchema.parse(request.params);
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
    const { userId } = request.params as { userId: string };
    garantirProprio(request, userId);
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
    const { userId } = request.params as { userId: string };
    garantirProprio(request, userId);
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
    const { userId } = usuarioQuerySchema.parse(request.query);
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
      response: {
        200: { type: "object", additionalProperties: true },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { canal, enviado } = statusEnvioSchema.parse(request.body);

    const notificacao = await notificacaoService.atualizarStatusEnvio(
      id,
      canal,
      enviado
    );
    return reply.status(200).send(notificacao);
  });
}
