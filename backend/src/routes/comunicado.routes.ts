import { FastifyInstance } from "fastify";
import { ComunicadoService } from "../services/comunicado.service";
import { authMiddleware } from "../middleware/auth";
import { NotFoundError, PermissionError } from "../errors/index.js";
import { portalService } from "../services/portal.service.js";
import {
  createComunicadoSchema, escolaQuerySchema, filtroLeituraComunicadoSchema, idParamSchema,
  listarComunicadosQuerySchema, updateComunicadoSchema,
} from "../schemas/comunicacao.schemas.js";

// Quem usa os apps só registra leitura/ciência de comunicado que está entre os
// seus (mesmo filtro da lista do portal). Equipe da escola segue o escopo.
const PAPEIS_DO_PORTAL = new Set(["RESPONSAVEL", "USER", "PROFESSOR"]);
async function garantirDestinatario(user: { id: string; role: string }, comunicadoId: string) {
  if (!PAPEIS_DO_PORTAL.has(user.role)) return;
  if (!(await portalService.comunicadoVisivelPara(user.id, comunicadoId))) throw new NotFoundError("NF_027");
}

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
    const { page, limit, ...filters } = listarComunicadosQuerySchema.parse(request.query);

    // Suporte a paginação
    if (page && limit) {
      const result = await comunicadoService.findAllPaginated(filters, { page, limit }, request.user);
      return reply.status(200).send(result);
    }

    const comunicados = await comunicadoService.findAll(filters, request.user);
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
    const { id } = idParamSchema.parse(request.params);
    const comunicado = await comunicadoService.findById(id, request.user);
    return reply.status(200).send(comunicado);
  });

  // POST /api/comunicados - Cria um novo comunicado
  app.post("/", {
    schema: {
      tags: ["Comunicados"],
      summary: "Criar comunicado",
      description: "Cria um novo comunicado para pais, alunos ou professores",
      security: [{ bearerAuth: [] }],
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
    const data = createComunicadoSchema.parse(request.body);
    const comunicado = await comunicadoService.create(data, request.user);
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
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateComunicadoSchema.parse(request.body);
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
    const { id } = idParamSchema.parse(request.params);
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
      // Sem corpo: o usuário é SEMPRE o da sessão (antes vinha do corpo e
      // qualquer um podia marcar leitura/ciência em nome de outra pessoa)
      response: {
        200: { type: "object", additionalProperties: true },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await garantirDestinatario(request.user, id);
    const registro = await comunicadoService.marcarComoLido(id, request.user.id);
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
      // Sem corpo: o usuário é SEMPRE o da sessão (antes vinha do corpo e
      // qualquer um podia marcar leitura/ciência em nome de outra pessoa)
      response: {
        200: { type: "object", additionalProperties: true },
        400: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await garantirDestinatario(request.user, id);
    const registro = await comunicadoService.confirmar(id, request.user.id);
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
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { filtro } = filtroLeituraComunicadoSchema.parse(request.query);

    // Recibos de leitura são pessoais: só a própria lista, salvo equipe gestora
    const EQUIPE = ["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR", "SECRETARIA"];
    if (userId !== request.user.id && !EQUIPE.includes(request.user.role)) {
      throw new PermissionError("PERM_004");
    }

    const comunicados = await comunicadoService.findByUser(userId, filtro);
    return reply.status(200).send(comunicados);
  });

  // GET /api/comunicados/relatorios/estatisticas - Estatísticas de comunicados
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Comunicados"],
      summary: "Estatísticas de comunicados",
      description: "Retorna estatísticas gerais ou por escola dos comunicados",
      security: [{ bearerAuth: [] }],
      response: {
        // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
      },
    },
  }, async (request, reply) => {
    const { escolaId } = escolaQuerySchema.parse(request.query);
    const estatisticas = await comunicadoService.getEstatisticas(escolaId);
    return reply.status(200).send(estatisticas);
  });
}
