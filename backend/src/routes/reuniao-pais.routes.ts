import { FastifyInstance } from "fastify";
import { ReuniaoPaisService } from "../services/reuniao-pais.service";
import { authMiddleware } from "../middleware/auth";

const reuniaoPaisService = new ReuniaoPaisService();

export async function reuniaoPaisRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/reunioes-pais - Lista todas as reuniões
  app.get("/", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Listar reuniões de pais e responsáveis",
      description: "Lista todas as reuniões de pais com filtros opcionais por escola, turma, tipo, status e período",
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
          tipo: {
            type: "string",
            enum: ["BIMESTRAL", "TRIMESTRAL", "EXTRAORDINARIA", "CONSELHO_PARTICIPATIVO"],
            description: "Tipo da reunião",
          },
          status: {
            type: "string",
            enum: ["AGENDADA", "REALIZADA", "CANCELADA"],
            description: "Status da reunião",
          },
          dataInicio: {
            type: "string",
            format: "date",
            description: "Data inicial do período (YYYY-MM-DD)",
          },
          dataFim: {
            type: "string",
            format: "date",
            description: "Data final do período (YYYY-MM-DD)",
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
          description: "Lista de reuniões",
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
    const { escolaId, turmaId, tipo, status, dataInicio, dataFim, page, limit } =
      request.query as any;

    const filters: any = {};
    if (escolaId) filters.escolaId = escolaId;
    if (turmaId) filters.turmaId = turmaId;
    if (tipo) filters.tipo = tipo;
    if (status) filters.status = status;
    if (dataInicio) filters.dataInicio = new Date(dataInicio);
    if (dataFim) filters.dataFim = new Date(dataFim);

    // Suporte a paginação
    if (page && limit) {
      const result = await reuniaoPaisService.findAllPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.status(200).send(result);
    }

    const reunioes = await reuniaoPaisService.findAll(filters);
    return reply.status(200).send(reunioes);
  });

  // GET /api/reunioes-pais/:id - Busca uma reunião por ID
  app.get("/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Buscar reunião por ID",
      description: "Retorna os detalhes de uma reunião específica",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da reunião" },
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
    const reuniao = await reuniaoPaisService.findById(id);
    return reply.status(200).send(reuniao);
  });

  // POST /api/reunioes-pais - Cria uma nova reunião
  app.post("/", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Criar reunião de pais",
      description: "Agenda uma nova reunião de pais e responsáveis",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["titulo", "data", "horario", "tipo", "escolaId"],
        properties: {
          titulo: {
            type: "string",
            description: "Título da reunião",
            example: "Reunião Bimestral - 1º Bimestre",
          },
          data: {
            type: "string",
            format: "date-time",
            description: "Data e hora da reunião",
            example: "2026-03-15T19:00:00Z",
          },
          horario: {
            type: "string",
            description: "Horário da reunião",
            example: "19:00",
          },
          duracao: {
            type: "number",
            description: "Duração em minutos",
            example: 120,
          },
          tipo: {
            type: "string",
            enum: ["BIMESTRAL", "TRIMESTRAL", "EXTRAORDINARIA", "CONSELHO_PARTICIPATIVO"],
            description: "Tipo da reunião",
          },
          escolaId: {
            type: "string",
            description: "ID da escola (null para reunião geral da rede)",
          },
          turmaId: {
            type: "string",
            description: "ID da turma (null para reunião geral da escola)",
          },
          local: {
            type: "string",
            description: "Local da reunião",
            example: "Auditório",
          },
          finalidade: {
            type: "string",
            description: "Finalidade da reunião",
          },
          pauta: {
            type: "string",
            description: "Pauta da reunião",
          },
        },
      },
      response: {
        201: {
          description: "Reunião criada com sucesso",
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

    // Converter data string para Date
    if (data.data) {
      data.data = new Date(data.data);
    }

    const reuniao = await reuniaoPaisService.create(data);
    return reply.status(201).send(reuniao);
  });

  // PUT /api/reunioes-pais/:id - Atualiza uma reunião
  app.put("/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Atualizar reunião",
      description: "Atualiza os dados de uma reunião de pais",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da reunião" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          data: { type: "string", format: "date-time" },
          horario: { type: "string" },
          local: { type: "string" },
          status: { type: "string", enum: ["AGENDADA", "REALIZADA", "CANCELADA"] },
          pauta: { type: "string" },
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
    const reuniao = await reuniaoPaisService.update(id, data);
    return reply.status(200).send(reuniao);
  });

  // DELETE /api/reunioes-pais/:id - Deleta uma reunião
  app.delete("/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Deletar reunião",
      description: "Remove uma reunião de pais do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da reunião" },
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
    const result = await reuniaoPaisService.delete(id);
    return reply.status(200).send(result);
  });

  // POST /api/reunioes-pais/presencas - Registra presença em reunião
  app.post("/presencas", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Registrar presença",
      description: "Registra a presença de um responsável em uma reunião",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["reuniaoId", "responsavelNome"],
        properties: {
          reuniaoId: { type: "string", description: "ID da reunião" },
          responsavelNome: { type: "string", description: "Nome do responsável" },
          alunoMatriculaId: { type: "string", description: "ID da matrícula do aluno (opcional)" },
          observacoes: { type: "string" },
        },
      },
      response: {
        201: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const presenca = await reuniaoPaisService.registrarPresenca(data);
    return reply.status(201).send(presenca);
  });

  // GET /api/reunioes-pais/:reuniaoId/presencas - Lista presenças de uma reunião
  app.get("/:reuniaoId/presencas", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Listar presenças de uma reunião",
      description: "Lista todos os responsáveis que compareceram a uma reunião",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          reuniaoId: { type: "string", description: "ID da reunião" },
        },
        required: ["reuniaoId"],
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { reuniaoId } = request.params as any;
    const presencas = await reuniaoPaisService.findPresencasByReuniao(
      reuniaoId
    );
    return reply.status(200).send(presencas);
  });

  // DELETE /api/reunioes-pais/presencas/:id - Deleta uma presença
  app.delete("/presencas/:id", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Deletar presença",
      description: "Remove o registro de presença de um responsável",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da presença" },
        },
        required: ["id"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await reuniaoPaisService.deletePresenca(id);
    return reply.status(200).send(result);
  });

  // GET /api/reunioes-pais/relatorios/estatisticas - Estatísticas de reuniões
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["Reuniões de Pais"],
      summary: "Estatísticas de reuniões",
      description: "Retorna estatísticas gerais ou por escola das reuniões de pais",
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
            porStatus: { type: "object" },
            mediaPresencas: { type: "number" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await reuniaoPaisService.getEstatisticas(escolaId);
    return reply.status(200).send(estatisticas);
  });
}
