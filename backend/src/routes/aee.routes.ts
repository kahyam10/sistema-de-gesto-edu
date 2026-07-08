import { FastifyInstance } from "fastify";
import { AEEService } from "../services/aee.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new AEEService();

export async function aeeRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // ==================== PEI (PLANO EDUCACIONAL INDIVIDUALIZADO) ====================

  // Listar todos os PEIs
  app.get("/pei", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Listar Planos Educacionais Individualizados (PEI)",
      description: "Lista todos os PEIs com filtros opcionais por escola, ano letivo e status",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          escolaId: {
            type: "string",
            description: "ID da escola",
          },
          anoLetivo: {
            type: "number",
            description: "Ano letivo",
            example: 2026,
          },
          status: {
            type: "string",
            enum: ["ATIVO", "CONCLUIDO", "SUSPENSO", "CANCELADO"],
            description: "Status do PEI",
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
          description: "Lista de PEIs",
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
    const { escolaId, anoLetivo, status, page, limit } = request.query as any;

    const filters = {
      escolaId,
      anoLetivo: anoLetivo ? parseInt(anoLetivo) : undefined,
      status,
    };

    // Suporte a paginação
    if (page && limit) {
      const result = await service.findAllPEIPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.send(result);
    }

    const peis = await service.findAllPEI(filters);
    return reply.send(peis);
  });

  // Buscar PEI por ID
  app.get("/pei/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Buscar PEI por ID",
      description: "Retorna os detalhes de um PEI específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do PEI" },
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
    const pei = await service.findPEIById(id);
    return reply.send(pei);
  });

  // Buscar PEI por matrícula
  app.get("/pei/matricula/:matriculaId", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Buscar PEI por matrícula",
      description: "Retorna o PEI ativo de um aluno específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          matriculaId: { type: "string", description: "ID da matrícula do aluno" },
        },
        required: ["matriculaId"],
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const { matriculaId } = request.params as { matriculaId: string };
    const pei = await service.findPEIByMatricula(matriculaId);
    return reply.send(pei);
  });

  // Criar PEI
  app.post("/pei", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Criar Plano Educacional Individualizado (PEI)",
      description: "Cria um novo PEI para aluno com necessidades educacionais especiais",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["matriculaId", "deficiencia", "anoLetivo"],
        properties: {
          matriculaId: {
            type: "string",
            description: "ID da matrícula do aluno",
          },
          deficiencia: {
            type: "string",
            enum: ["INTELECTUAL", "VISUAL", "AUDITIVA", "FISICA", "MULTIPLA", "TEA", "OUTRA"],
            description: "Tipo de deficiência",
          },
          anoLetivo: {
            type: "number",
            description: "Ano letivo",
            example: 2026,
          },
          diagnostico: {
            type: "string",
            description: "Descrição do diagnóstico",
          },
          objetivos: {
            type: "string",
            description: "Objetivos do plano",
          },
          estrategias: {
            type: "string",
            description: "Estratégias pedagógicas",
          },
          recursos: {
            type: "string",
            description: "Recursos necessários",
          },
          avaliacoes: {
            type: "string",
            description: "Métodos de avaliação",
          },
          observacoes: {
            type: "string",
            description: "Observações adicionais",
          },
          responsavelId: {
            type: "string",
            description: "ID do profissional responsável",
          },
        },
      },
      response: {
        201: {
          description: "PEI criado com sucesso",
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
    const pei = await service.createPEI(data);
    return reply.status(201).send(pei);
  });

  // Atualizar PEI
  app.put("/pei/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Atualizar PEI",
      description: "Atualiza os dados de um PEI",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do PEI" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          objetivos: { type: "string" },
          estrategias: { type: "string" },
          recursos: { type: "string" },
          avaliacoes: { type: "string" },
          observacoes: { type: "string" },
          status: { type: "string", enum: ["ATIVO", "CONCLUIDO", "SUSPENSO", "CANCELADO"] },
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
    const pei = await service.updatePEI(id, data);
    return reply.send(pei);
  });

  // Deletar PEI
  app.delete("/pei/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Deletar PEI",
      description: "Remove um PEI do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do PEI" },
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
    await service.deletePEI(id);
    return reply.status(204).send();
  });

  // ==================== SALAS DE RECURSOS ====================

  // Listar todas as salas de recursos
  app.get("/salas-recursos", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Listar salas de recursos",
      description: "Lista todas as salas de recursos multifuncionais",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          escolaId: { type: "string", description: "Filtrar por escola" },
          turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO"], description: "Filtrar por turno" },
        },
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { escolaId, turno } = request.query as any;
    const salas = await service.findAllSalasRecursos({
      escolaId,
      turno,
    });
    return reply.send(salas);
  });

  // Buscar sala de recursos por ID
  app.get("/salas-recursos/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Buscar sala de recursos por ID",
      description: "Retorna os detalhes de uma sala de recursos específica",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da sala de recursos" },
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
    const sala = await service.findSalaRecursosById(id);
    return reply.send(sala);
  });

  // Criar sala de recursos
  app.post("/salas-recursos", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Criar sala de recursos",
      description: "Cria uma nova sala de recursos multifuncional",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["escolaId", "nome", "turno"],
        properties: {
          escolaId: { type: "string", description: "ID da escola" },
          nome: { type: "string", description: "Nome da sala" },
          turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO"] },
          capacidade: { type: "number", description: "Capacidade de atendimento" },
          recursos: { type: "string", description: "Recursos disponíveis" },
        },
      },
      response: {
        201: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const sala = await service.createSalaRecursos(data);
    return reply.status(201).send(sala);
  });

  // Atualizar sala de recursos
  app.put("/salas-recursos/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Atualizar sala de recursos",
      description: "Atualiza os dados de uma sala de recursos",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da sala" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          nome: { type: "string" },
          capacidade: { type: "number" },
          recursos: { type: "string" },
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
    const sala = await service.updateSalaRecursos(id, data);
    return reply.send(sala);
  });

  // Deletar sala de recursos
  app.delete("/salas-recursos/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Deletar sala de recursos",
      description: "Remove uma sala de recursos do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da sala" },
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
    await service.deleteSalaRecursos(id);
    return reply.status(204).send();
  });

  // ==================== ATENDIMENTOS AEE ====================

  // Criar atendimento AEE
  app.post("/atendimentos", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Criar atendimento AEE",
      description: "Registra um atendimento na sala de recursos",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["peiId", "salaRecursosId", "data"],
        properties: {
          peiId: { type: "string", description: "ID do PEI" },
          salaRecursosId: { type: "string", description: "ID da sala de recursos" },
          data: { type: "string", format: "date-time", description: "Data do atendimento" },
          atividades: { type: "string", description: "Atividades realizadas" },
          observacoes: { type: "string" },
          presenca: { type: "boolean", default: true },
        },
      },
      response: {
        201: { type: "object", additionalProperties: true },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const atendimento = await service.createAtendimento(data);
    return reply.status(201).send(atendimento);
  });

  // Listar atendimentos por PEI
  app.get("/atendimentos/pei/:peiId", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Listar atendimentos por PEI",
      description: "Lista todos os atendimentos de um PEI específico",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          peiId: { type: "string", description: "ID do PEI" },
        },
        required: ["peiId"],
      },
      querystring: {
        type: "object",
        properties: {
          mes: { type: "number", description: "Filtrar por mês (1-12)" },
          ano: { type: "number", description: "Filtrar por ano" },
        },
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { peiId } = request.params as { peiId: string };
    const { mes, ano } = request.query as any;
    const atendimentos = await service.findAtendimentosByPEI(peiId, {
      mes: mes ? parseInt(mes) : undefined,
      ano: ano ? parseInt(ano) : undefined,
    });
    return reply.send(atendimentos);
  });

  // Listar atendimentos por sala de recursos
  app.get("/atendimentos/sala/:salaRecursosId", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Listar atendimentos por sala",
      description: "Lista todos os atendimentos de uma sala de recursos",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          salaRecursosId: { type: "string", description: "ID da sala de recursos" },
        },
        required: ["salaRecursosId"],
      },
      querystring: {
        type: "object",
        properties: {
          mes: { type: "number", description: "Filtrar por mês (1-12)" },
          ano: { type: "number", description: "Filtrar por ano" },
        },
      },
      response: {
        200: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  }, async (request, reply) => {
    const { salaRecursosId } = request.params as { salaRecursosId: string };
    const { mes, ano } = request.query as any;
    const atendimentos = await service.findAtendimentosBySala(salaRecursosId, {
      mes: mes ? parseInt(mes) : undefined,
      ano: ano ? parseInt(ano) : undefined,
    });
    return reply.send(atendimentos);
  });

  // Atualizar atendimento
  app.put("/atendimentos/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Atualizar atendimento",
      description: "Atualiza os dados de um atendimento",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do atendimento" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          atividades: { type: "string" },
          observacoes: { type: "string" },
          presenca: { type: "boolean" },
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
    const atendimento = await service.updateAtendimento(id, data);
    return reply.send(atendimento);
  });

  // Deletar atendimento
  app.delete("/atendimentos/:id", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Deletar atendimento",
      description: "Remove um atendimento do sistema",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do atendimento" },
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
    await service.deleteAtendimento(id);
    return reply.status(204).send();
  });

  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  // Obter estatísticas AEE
  app.get("/relatorios/estatisticas", {
    schema: {
      tags: ["AEE - Atendimento Educacional Especializado"],
      summary: "Estatísticas AEE",
      description: "Retorna estatísticas gerais ou por escola do Atendimento Educacional Especializado",
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
            totalPEIs: { type: "number" },
            totalSalasRecursos: { type: "number" },
            totalAtendimentos: { type: "number" },
            porDeficiencia: { type: "object" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await service.getEstatisticasAEE(escolaId);
    return reply.send(estatisticas);
  });
}
