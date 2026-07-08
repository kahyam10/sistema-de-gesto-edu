import { FastifyInstance } from "fastify";
import { ComunicadoService } from "../services/comunicado.service";
import { authMiddleware } from "../middleware/auth";

const comunicadoService = new ComunicadoService();

export async function comunicadoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/comunicados - Lista todos os comunicados
  app.get("/", {
    schema: {
      tags: ["Comunicados"],
      summary: "Listar comunicados",
      description: "Lista todos os comunicados com filtros opcionais por escola, turma, tipo, categoria e destinatários",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          escolaId: {
            type: "string",
            description: "ID da escola",
          },
          turmaId: {
            type: "string",
            description: "ID da turma",
          },
          etapaId: {
            type: "string",
            description: "ID da etapa",
          },
          tipo: {
            type: "string",
            enum: ["INFORMATIVO", "URGENTE", "AVISO", "CONVITE", "ALERTA"],
            description: "Tipo do comunicado",
          },
          categoria: {
            type: "string",
            enum: ["ACADEMICO", "ADMINISTRATIVO", "EVENTOS", "SAUDE", "SEGURANCA", "GERAL"],
            description: "Categoria do comunicado",
          },
          destinatarios: {
            type: "string",
            enum: ["TODOS", "PAIS", "PROFESSORES", "ALUNOS", "FUNCIONARIOS", "DIRETORES"],
            description: "Público-alvo do comunicado",
          },
          ativo: {
            type: "string",
            enum: ["true", "false"],
            description: "Apenas comunicados ativos",
          },
          destaque: {
            type: "string",
            enum: ["true", "false"],
            description: "Apenas comunicados em destaque",
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
          description: "Lista de comunicados",
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
    const {
      escolaId,
      turmaId,
      etapaId,
      tipo,
      categoria,
      destinatarios,
      ativo,
      destaque,
      page,
      limit,
    } = request.query as any;

    const filters: any = {};
    if (escolaId) filters.escolaId = escolaId;
    if (turmaId) filters.turmaId = turmaId;
    if (etapaId) filters.etapaId = etapaId;
    if (tipo) filters.tipo = tipo;
    if (categoria) filters.categoria = categoria;
    if (destinatarios) filters.destinatarios = destinatarios;
    if (ativo !== undefined) filters.ativo = ativo === "true";
    if (destaque !== undefined) filters.destaque = destaque === "true";

    // Suporte a paginação
    if (page && limit) {
      const result = await comunicadoService.findAllPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.status(200).send(result);
    }

    const comunicados = await comunicadoService.findAll(filters);
    return reply.status(200).send(comunicados);
  });

  // GET /api/comunicados/:id - Busca um comunicado por ID
  app.get("/:id", {
    schema: {
      tags: ["Comunicados"],
      summary: "Buscar comunicado por ID",
      description: "Retorna os detalhes de um comunicado específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do comunicado" },
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
    const comunicado = await comunicadoService.findById(id);
    return reply.status(200).send(comunicado);
  });

  // POST /api/comunicados - Cria um novo comunicado
  app.post("/", {
    schema: {
      tags: ["Comunicados"],
      summary: "Criar comunicado",
      description: "Cria um novo comunicado para pais, alunos ou professores",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["titulo", "mensagem", "tipo", "destinatarios", "autorNome"],
        properties: {
          titulo: {
            type: "string",
            description: "Título do comunicado",
            example: "Suspensão de Aulas - Temporal",
          },
          mensagem: {
            type: "string",
            description: "Conteúdo do comunicado",
            example: "Informamos que as aulas do dia 16/02 estão suspensas devido às fortes chuvas.",
          },
          tipo: {
            type: "string",
            enum: ["INFORMATIVO", "URGENTE", "AVISO", "CONVITE", "ALERTA"],
            description: "Tipo do comunicado",
          },
          categoria: {
            type: "string",
            enum: ["ACADEMICO", "ADMINISTRATIVO", "EVENTOS", "SAUDE", "SEGURANCA", "GERAL"],
            description: "Categoria do comunicado",
          },
          destinatarios: {
            type: "string",
            enum: ["TODOS", "PAIS", "PROFESSORES", "ALUNOS", "FUNCIONARIOS", "DIRETORES"],
            description: "Público-alvo do comunicado",
          },
          autorNome: {
            type: "string",
            description: "Nome do autor",
            example: "Secretaria Municipal de Educação",
          },
          escolaId: {
            type: "string",
            description: "ID da escola (null para comunicado geral da rede)",
          },
          turmaId: {
            type: "string",
            description: "ID da turma (null para comunicado geral da escola)",
          },
          etapaId: {
            type: "string",
            description: "ID da etapa",
          },
          dataPublicacao: {
            type: "string",
            format: "date-time",
            description: "Data de publicação",
          },
          dataExpiracao: {
            type: "string",
            format: "date-time",
            description: "Data de expiração",
          },
          destaque: {
            type: "boolean",
            description: "Marcar como destaque",
            default: false,
          },
          ativo: {
            type: "boolean",
            description: "Comunicado ativo",
            default: true,
          },
          anexoUrl: {
            type: "string",
            description: "URL do anexo",
          },
        },
      },
      response: {
        201: {
          description: "Comunicado criado com sucesso",
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

    // Converter datas string para Date
    if (data.dataPublicacao) {
      data.dataPublicacao = new Date(data.dataPublicacao);
    }
    if (data.dataExpiracao) {
      data.dataExpiracao = new Date(data.dataExpiracao);
    }

    const comunicado = await comunicadoService.create(data);
    return reply.status(201).send(comunicado);
  });

  // PUT /api/comunicados/:id - Atualiza um comunicado
  app.put("/:id", {
    schema: {
      tags: ["Comunicados"],
      summary: "Atualizar comunicado",
      description: "Atualiza os dados de um comunicado",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do comunicado" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          mensagem: { type: "string" },
          tipo: { type: "string", enum: ["INFORMATIVO", "URGENTE", "AVISO", "CONVITE", "ALERTA"] },
          ativo: { type: "boolean" },
          destaque: { type: "boolean" },
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
    const comunicado = await comunicadoService.update(id, data);
    return reply.status(200).send(comunicado);
  });

  // DELETE /api/comunicados/:id - Deleta um comunicado
  app.delete("/:id", {
    schema: {
      tags: ["Comunicados"],
      summary: "Deletar comunicado",
      description: "Remove um comunicado do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do comunicado" },
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
    const result = await comunicadoService.delete(id);
    return reply.status(200).send(result);
  });

  // POST /api/comunicados/:id/marcar-lido - Marca comunicado como lido
  app.post("/:id/marcar-lido", {
    schema: {
      tags: ["Comunicados"],
      summary: "Marcar comunicado como lido",
      description: "Registra que um usuário leu o comunicado",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do comunicado" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string", description: "ID do usuário" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { userId } = request.body as any;

    if (!userId) {
      return reply.status(400).send({
        error: "userId é obrigatório",
      });
    }

    const registro = await comunicadoService.marcarComoLido(id, userId);
    return reply.status(200).send(registro);
  });

  // POST /api/comunicados/:id/confirmar - Marca comunicado como confirmado
  app.post("/:id/confirmar", {
    schema: {
      tags: ["Comunicados"],
      summary: "Confirmar comunicado",
      description: "Registra confirmação de leitura/ciência do comunicado",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do comunicado" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string", description: "ID do usuário" },
        },
      },
      response: {
        200: { type: "object", additionalProperties: true },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { userId } = request.body as any;

    if (!userId) {
      return reply.status(400).send({
        error: "userId é obrigatório",
      });
    }

    const registro = await comunicadoService.confirmar(id, userId);
    return reply.status(200).send(registro);
  });

  // GET /api/comunicados/usuario/:userId - Busca comunicados por usuário
  app.get("/usuario/:userId", {
    schema: {
      tags: ["Comunicados"],
      summary: "Buscar comunicados por usuário",
      description: "Lista comunicados destinados a um usuário específico",
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
            enum: ["NAO_LIDOS", "LIDOS", "TODOS"],
            description: "Filtro de leitura",
            default: "TODOS",
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

    const comunicados = await comunicadoService.findByUser(
      userId,
      filtro as "NAO_LIDOS" | "LIDOS" | "TODOS"
    );
    return reply.status(200).send(comunicados);
  });

  // GET /api/comunicados/relatorios/estatisticas - Estatísticas de comunicados
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Comunicados"],
      summary: "Estatísticas de comunicados",
      description: "Retorna estatísticas gerais ou por escola dos comunicados",
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
            porCategoria: { type: "object" },
            ativos: { type: "number" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await comunicadoService.getEstatisticas(escolaId);
    return reply.status(200).send(estatisticas);
  });
}
