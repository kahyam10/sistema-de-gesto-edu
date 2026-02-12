import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { calendarioService } from "../services/calendario.service.js";
import { authMiddleware } from "../middleware/auth.js";

export async function calendarioRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  // ==================== ANO LETIVO ====================

  // Listar todos os anos letivos
  app.get(
    "/anos-letivos",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Listar todos os anos letivos",
        description:
          "Retorna a lista completa de anos letivos cadastrados no sistema, ordenados por ano de forma decrescente.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de anos letivos retornada com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                ano: { type: "number", example: 2026 },
                ativo: { type: "boolean", example: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const anosLetivos = await calendarioService.findAllAnosLetivos();
        return reply.send(anosLetivos);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar anos letivos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar ano letivo ativo
  app.get(
    "/anos-letivos/ativo",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Buscar ano letivo ativo",
        description:
          "Retorna o ano letivo atualmente marcado como ativo no sistema. Apenas um ano letivo pode estar ativo por vez.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Ano letivo ativo encontrado",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              ano: { type: "number", example: 2026 },
              ativo: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Nenhum ano letivo ativo encontrado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const anoLetivo = await calendarioService.findAnoLetivoAtivo();
        if (!anoLetivo) {
          return reply
            .status(404)
            .send({ error: "Nenhum ano letivo ativo encontrado" });
        }
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar ano letivo ativo";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar ano letivo por ID
  app.get(
    "/anos-letivos/:id",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Buscar ano letivo por ID",
        description: "Retorna um ano letivo específico pelo seu identificador único.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
          },
        },
        response: {
          200: {
            description: "Ano letivo encontrado",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              ano: { type: "number", example: 2026 },
              ativo: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Ano letivo não encontrado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const anoLetivo = await calendarioService.findAnoLetivoById(id);
        if (!anoLetivo) {
          return reply.status(404).send({ error: "Ano letivo não encontrado" });
        }
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar ano letivo";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar ano letivo
  app.post(
    "/anos-letivos",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Criar novo ano letivo",
        description:
          "Cria um novo ano letivo no sistema. Se marcado como ativo, desativa automaticamente outros anos letivos ativos.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["ano"],
          properties: {
            ano: {
              type: "number",
              description: "Ano do período letivo",
              example: 2026,
            },
            ativo: {
              type: "boolean",
              description: "Indica se o ano letivo está ativo",
              default: false,
            },
          },
        },
        response: {
          201: {
            description: "Ano letivo criado com sucesso",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              ano: { type: "number", example: 2026 },
              ativo: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          ano: number;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { ano, ativo } = request.body;
        const anoLetivo = await calendarioService.createAnoLetivo({
          ano,
          ativo,
        });
        return reply.status(201).send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar ano letivo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar ano letivo
  app.put(
    "/anos-letivos/:id",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Atualizar ano letivo",
        description:
          "Atualiza as informações de um ano letivo existente. Ao ativar um ano, os demais são desativados automaticamente.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            ano: {
              type: "number",
              description: "Ano do período letivo",
              example: 2026,
            },
            ativo: {
              type: "boolean",
              description: "Indica se o ano letivo está ativo",
            },
          },
        },
        response: {
          200: {
            description: "Ano letivo atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              ano: { type: "number", example: 2026 },
              ativo: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          ano?: number;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { ano, ativo } = request.body;
        const anoLetivo = await calendarioService.updateAnoLetivo(id, {
          ano,
          ativo,
        });
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar ano letivo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar ano letivo
  app.delete(
    "/anos-letivos/:id",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Deletar ano letivo",
        description:
          "Remove permanentemente um ano letivo do sistema. Não é possível deletar anos letivos que possuem eventos vinculados.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
          },
        },
        response: {
          204: {
            description: "Ano letivo deletado com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao deletar (ex: ano letivo possui eventos vinculados)",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await calendarioService.deleteAnoLetivo(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar ano letivo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== EVENTOS ====================

  // Listar eventos de um ano letivo
  app.get(
    "/anos-letivos/:anoLetivoId/eventos",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Listar eventos de um ano letivo",
        description:
          "Retorna todos os eventos cadastrados para um ano letivo específico. Pode ser filtrado por escola.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["anoLetivoId"],
          properties: {
            anoLetivoId: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola para filtrar eventos específicos",
            },
          },
        },
        response: {
          200: {
            description: "Lista de eventos retornada com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                titulo: { type: "string", example: "Reunião Pedagógica" },
                descricao: { type: "string", nullable: true },
                dataInicio: { type: "string", format: "date-time" },
                dataFim: { type: "string", format: "date-time", nullable: true },
                horaInicio: { type: "string", example: "08:00", nullable: true },
                horaFim: { type: "string", example: "12:00", nullable: true },
                tipo: { type: "string", example: "REUNIAO" },
                escopo: { type: "string", example: "REDE", nullable: true },
                recorrente: { type: "boolean" },
                tipoRecorrencia: { type: "string", nullable: true },
                diaRecorrencia: { type: "string", nullable: true },
                cor: { type: "string", example: "#3B82F6", nullable: true },
                reduzDiaLetivo: { type: "boolean" },
                anoLetivoId: { type: "string", format: "uuid" },
                escolaId: { type: "string", format: "uuid", nullable: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId } = request.params;
        const { escolaId } = request.query;
        const eventos = await calendarioService.findEventosByAnoLetivo(
          anoLetivoId,
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar eventos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar eventos por data
  app.get(
    "/anos-letivos/:anoLetivoId/eventos/data/:data",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Buscar eventos por data",
        description:
          "Retorna todos os eventos que ocorrem em uma data específica dentro de um ano letivo.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["anoLetivoId", "data"],
          properties: {
            anoLetivoId: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data para buscar eventos (formato: YYYY-MM-DD)",
              example: "2026-03-15",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola para filtrar eventos",
            },
          },
        },
        response: {
          200: {
            description: "Lista de eventos da data",
            type: "array",
            items: {
              type: "object",
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string; data: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId, data } = request.params;
        const { escolaId } = request.query;
        const eventos = await calendarioService.findEventosByData(
          anoLetivoId,
          new Date(data),
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar eventos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar eventos por mês
  app.get(
    "/anos-letivos/:anoLetivoId/eventos/mes/:ano/:mes",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Buscar eventos por mês",
        description:
          "Retorna todos os eventos que ocorrem em um mês específico de um ano letivo.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["anoLetivoId", "ano", "mes"],
          properties: {
            anoLetivoId: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
            ano: {
              type: "string",
              description: "Ano (formato: YYYY)",
              example: "2026",
            },
            mes: {
              type: "string",
              description: "Mês (1-12)",
              example: "3",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola para filtrar eventos",
            },
          },
        },
        response: {
          200: {
            description: "Lista de eventos do mês",
            type: "array",
            items: {
              type: "object",
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string; ano: string; mes: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId, ano, mes } = request.params;
        const { escolaId } = request.query;
        const eventos = await calendarioService.getEventosPorMes(
          anoLetivoId,
          parseInt(mes),
          parseInt(ano),
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar eventos do mês";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar evento por ID
  app.get(
    "/eventos/:id",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Buscar evento por ID",
        description: "Retorna um evento específico pelo seu identificador único.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do evento",
            },
          },
        },
        response: {
          200: {
            description: "Evento encontrado",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              titulo: { type: "string", example: "Reunião Pedagógica" },
              descricao: { type: "string", nullable: true },
              dataInicio: { type: "string", format: "date-time" },
              dataFim: { type: "string", format: "date-time", nullable: true },
              horaInicio: { type: "string", example: "08:00", nullable: true },
              horaFim: { type: "string", example: "12:00", nullable: true },
              tipo: { type: "string", example: "REUNIAO" },
              escopo: { type: "string", example: "REDE", nullable: true },
              recorrente: { type: "boolean" },
              tipoRecorrencia: { type: "string", nullable: true },
              diaRecorrencia: { type: "string", nullable: true },
              cor: { type: "string", example: "#3B82F6", nullable: true },
              reduzDiaLetivo: { type: "boolean" },
              anoLetivoId: { type: "string", format: "uuid" },
              escolaId: { type: "string", format: "uuid", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Evento não encontrado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const evento = await calendarioService.findEventoById(id);
        if (!evento) {
          return reply.status(404).send({ error: "Evento não encontrado" });
        }
        return reply.send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar evento";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar evento
  app.post(
    "/eventos",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Criar novo evento",
        description:
          "Cria um novo evento no calendário letivo. Eventos podem ser de diversos tipos (feriado, reunião, férias, etc.) e ter escopo de rede ou escola específica.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["titulo", "dataInicio", "tipo", "anoLetivoId"],
          properties: {
            titulo: {
              type: "string",
              description: "Título do evento",
              example: "Reunião Pedagógica",
            },
            descricao: {
              type: "string",
              description: "Descrição detalhada do evento",
              nullable: true,
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data de início do evento",
              example: "2026-03-15",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data de término do evento (para eventos de múltiplos dias)",
              nullable: true,
            },
            horaInicio: {
              type: "string",
              description: "Hora de início (formato: HH:mm)",
              example: "08:00",
              nullable: true,
            },
            horaFim: {
              type: "string",
              description: "Hora de término (formato: HH:mm)",
              example: "12:00",
              nullable: true,
            },
            tipo: {
              type: "string",
              description: "Tipo do evento",
              example: "REUNIAO",
            },
            escopo: {
              type: "string",
              description: "Escopo do evento (REDE ou ESCOLA)",
              example: "REDE",
              nullable: true,
            },
            recorrente: {
              type: "boolean",
              description: "Indica se o evento é recorrente",
              default: false,
            },
            tipoRecorrencia: {
              type: "string",
              description: "Tipo de recorrência (DIARIA, SEMANAL, MENSAL, ANUAL)",
              nullable: true,
            },
            diaRecorrencia: {
              type: "string",
              description: "Dia da recorrência (para eventos semanais/mensais)",
              nullable: true,
            },
            cor: {
              type: "string",
              description: "Cor do evento em formato hexadecimal",
              example: "#3B82F6",
              nullable: true,
            },
            reduzDiaLetivo: {
              type: "boolean",
              description: "Indica se o evento reduz dias letivos",
              default: false,
            },
            anoLetivoId: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola (para eventos de escopo ESCOLA)",
              nullable: true,
            },
          },
        },
        response: {
          201: {
            description: "Evento criado com sucesso",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              titulo: { type: "string" },
              descricao: { type: "string", nullable: true },
              dataInicio: { type: "string", format: "date-time" },
              dataFim: { type: "string", format: "date-time", nullable: true },
              horaInicio: { type: "string", nullable: true },
              horaFim: { type: "string", nullable: true },
              tipo: { type: "string" },
              escopo: { type: "string", nullable: true },
              recorrente: { type: "boolean" },
              tipoRecorrencia: { type: "string", nullable: true },
              diaRecorrencia: { type: "string", nullable: true },
              cor: { type: "string", nullable: true },
              reduzDiaLetivo: { type: "boolean" },
              anoLetivoId: { type: "string", format: "uuid" },
              escolaId: { type: "string", format: "uuid", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          titulo: string;
          descricao?: string;
          dataInicio: string;
          dataFim?: string;
          horaInicio?: string;
          horaFim?: string;
          tipo: string;
          escopo?: string;
          recorrente?: boolean;
          tipoRecorrencia?: string;
          diaRecorrencia?: string;
          cor?: string;
          reduzDiaLetivo?: boolean;
          anoLetivoId: string;
          escolaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const data = request.body;
        const evento = await calendarioService.createEvento({
          ...data,
          dataInicio: new Date(data.dataInicio),
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.status(201).send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar evento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar evento
  app.put(
    "/eventos/:id",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Atualizar evento",
        description:
          "Atualiza as informações de um evento existente no calendário letivo.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do evento",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            titulo: {
              type: "string",
              description: "Título do evento",
            },
            descricao: {
              type: "string",
              description: "Descrição do evento",
              nullable: true,
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data de início",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data de término",
              nullable: true,
            },
            horaInicio: {
              type: "string",
              description: "Hora de início",
              nullable: true,
            },
            horaFim: {
              type: "string",
              description: "Hora de término",
              nullable: true,
            },
            tipo: {
              type: "string",
              description: "Tipo do evento",
            },
            escopo: {
              type: "string",
              description: "Escopo do evento",
              nullable: true,
            },
            recorrente: {
              type: "boolean",
              description: "Indica se é recorrente",
            },
            tipoRecorrencia: {
              type: "string",
              description: "Tipo de recorrência",
              nullable: true,
            },
            diaRecorrencia: {
              type: "string",
              description: "Dia da recorrência",
              nullable: true,
            },
            cor: {
              type: "string",
              description: "Cor do evento",
              nullable: true,
            },
            reduzDiaLetivo: {
              type: "boolean",
              description: "Indica se reduz dias letivos",
            },
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola",
              nullable: true,
            },
          },
        },
        response: {
          200: {
            description: "Evento atualizado com sucesso",
            type: "object",
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          titulo?: string;
          descricao?: string;
          dataInicio?: string;
          dataFim?: string;
          horaInicio?: string;
          horaFim?: string;
          tipo?: string;
          escopo?: string;
          recorrente?: boolean;
          tipoRecorrencia?: string;
          diaRecorrencia?: string;
          cor?: string;
          reduzDiaLetivo?: boolean;
          escolaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const evento = await calendarioService.updateEvento(id, {
          ...data,
          dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar evento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar evento
  app.delete(
    "/eventos/:id",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Deletar evento",
        description:
          "Remove permanentemente um evento do calendário letivo.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do evento",
            },
          },
        },
        response: {
          204: {
            description: "Evento deletado com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao deletar evento",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await calendarioService.deleteEvento(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar evento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== ESTATÍSTICAS ====================

  // Calcular dias letivos
  app.get(
    "/anos-letivos/:anoLetivoId/estatisticas",
    {
      schema: {
        tags: ["Calendário Letivo"],
        summary: "Calcular estatísticas do calendário letivo",
        description:
          "Retorna estatísticas completas do calendário letivo, incluindo total de dias letivos, dias úteis, eventos por tipo, e contagem de dias que reduzem o calendário letivo.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["anoLetivoId"],
          properties: {
            anoLetivoId: {
              type: "string",
              format: "uuid",
              description: "ID do ano letivo",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola para estatísticas específicas",
            },
          },
        },
        response: {
          200: {
            description: "Estatísticas calculadas com sucesso",
            type: "object",
            properties: {
              totalDiasLetivos: {
                type: "number",
                description: "Total de dias letivos no ano",
                example: 200,
              },
              totalDiasUteis: {
                type: "number",
                description: "Total de dias úteis no ano",
                example: 252,
              },
              totalEventos: {
                type: "number",
                description: "Total de eventos cadastrados",
                example: 45,
              },
              eventosPorTipo: {
                type: "object",
                description: "Contagem de eventos por tipo",
                additionalProperties: { type: "number" },
              },
              diasQueReduzem: {
                type: "number",
                description: "Dias que reduzem o calendário letivo",
                example: 15,
              },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId } = request.params;
        const { escolaId } = request.query;
        const estatisticas = await calendarioService.calcularDiasLetivos(
          anoLetivoId,
          escolaId
        );
        return reply.send(estatisticas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao calcular estatísticas";
        return reply.status(500).send({ error: message });
      }
    }
  );
}
