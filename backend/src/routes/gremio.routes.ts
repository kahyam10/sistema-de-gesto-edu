import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { gremioService } from "../services/gremio.service.js";
import {
  createGremioSchema,
  updateGremioSchema,
  createChapaGremioSchema,
  updateChapaGremioSchema,
  apurarEleicaoSchema,
  createAtividadeGremioSchema,
  updateAtividadeGremioSchema,
} from "../schemas/democratica.schemas.js";
import { authMiddleware } from "../middleware/auth.js";

export async function gremioRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista grêmios
  app.get(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Listar grêmios estudantis",
        description:
          "Lista os grêmios estudantis com filtros por escola, ano letivo e status (EM_ELEICAO, ATIVO, INATIVO).",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: { type: "string" },
            anoLetivo: { type: "string", example: "2026" },
            status: { type: "string", enum: ["EM_ELEICAO", "ATIVO", "INATIVO"] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { escolaId?: string; anoLetivo?: string; status?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo, status } = request.query;

        const filters: any = {};
        if (escolaId) filters.escolaId = escolaId;
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (status) filters.status = status;

        const gremios = await gremioService.findAll(filters);
        return reply.send(gremios);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar grêmios";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca grêmio por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Buscar grêmio por ID",
        description: "Retorna o grêmio com chapas (por número) e atividades.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const gremio = await gremioService.findById(request.params.id);
        return reply.send(gremio);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar grêmio";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria grêmio
  app.post(
    "/",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Criar grêmio estudantil",
        description:
          "Cria um grêmio estudantil. Só pode existir um grêmio por escola por ano letivo.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "escolaId", "anoLetivo"],
          properties: {
            nome: { type: "string", example: "Grêmio Estudantil Paulo Freire" },
            escolaId: { type: "string" },
            anoLetivo: { type: "number", example: 2026 },
            status: {
              type: "string",
              enum: ["EM_ELEICAO", "ATIVO", "INATIVO"],
              default: "EM_ELEICAO",
            },
            dataFundacao: { type: "string", format: "date" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createGremioSchema.parse(request.body);
        const gremio = await gremioService.create(body);
        return reply.status(201).send(gremio);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao criar grêmio";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza grêmio
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar grêmio estudantil",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = updateGremioSchema.parse(request.body);
        const gremio = await gremioService.update(request.params.id, body);
        return reply.send(gremio);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar grêmio";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove grêmio
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover grêmio estudantil",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await gremioService.delete(request.params.id);
        return reply.send({ message: "Grêmio deletado com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao remover grêmio";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adiciona chapa
  app.post(
    "/:id/chapas",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Adicionar chapa ao grêmio",
        description:
          "Cadastra uma chapa concorrente com número único dentro do grêmio e composição de membros.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["nome", "numero"],
          properties: {
            nome: { type: "string", example: "Chapa Juventude Ativa" },
            numero: { type: "number", example: 1 },
            membros: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  matriculaId: { type: "string" },
                  cargo: {
                    type: "string",
                    enum: ["PRESIDENTE", "VICE", "SECRETARIO", "TESOUREIRO", "MEMBRO"],
                  },
                },
              },
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
        const body = createChapaGremioSchema.parse(request.body);
        const chapa = await gremioService.addChapa(request.params.id, body);
        return reply.status(201).send(chapa);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar chapa";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza chapa
  app.put(
    "/chapas/:chapaId",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar chapa do grêmio",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["chapaId"],
          properties: { chapaId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { chapaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = updateChapaGremioSchema.parse(request.body);
        const chapa = await gremioService.updateChapa(
          request.params.chapaId,
          body
        );
        return reply.send(chapa);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar chapa";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove chapa
  app.delete(
    "/chapas/:chapaId",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover chapa do grêmio",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["chapaId"],
          properties: { chapaId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { chapaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await gremioService.deleteChapa(request.params.chapaId);
        return reply.send({ message: "Chapa deletada com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao remover chapa";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Apura eleição
  app.post(
    "/:id/apurar-eleicao",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Apurar eleição do grêmio",
        description:
          "Grava os votos de cada chapa, marca a mais votada como eleita e ativa o grêmio. Operação única: falha se o grêmio já possui chapa eleita.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["resultados"],
          properties: {
            resultados: {
              type: "array",
              items: {
                type: "object",
                required: ["chapaId", "votosRecebidos"],
                properties: {
                  chapaId: { type: "string" },
                  votosRecebidos: { type: "number", example: 70 },
                },
              },
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
        const body = apurarEleicaoSchema.parse(request.body);
        const gremio = await gremioService.apurarEleicao(
          request.params.id,
          body
        );
        return reply.send(gremio);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao apurar eleição";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adiciona atividade
  app.post(
    "/:id/atividades",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Adicionar atividade ao grêmio",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["titulo", "tipo", "dataInicio"],
          properties: {
            titulo: { type: "string" },
            tipo: {
              type: "string",
              enum: ["PROJETO", "EVENTO", "CAMPANHA", "REUNIAO", "OUTRA"],
            },
            descricao: { type: "string" },
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
            status: {
              type: "string",
              enum: ["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"],
              default: "PLANEJADA",
            },
            resultado: { type: "string" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = createAtividadeGremioSchema.parse(request.body);
        const atividade = await gremioService.addAtividade(
          request.params.id,
          body
        );
        return reply.status(201).send(atividade);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar atividade";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza atividade
  app.put(
    "/atividades/:atividadeId",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Atualizar atividade do grêmio",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["atividadeId"],
          properties: { atividadeId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { atividadeId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = updateAtividadeGremioSchema.parse(request.body);
        const atividade = await gremioService.updateAtividade(
          request.params.atividadeId,
          body
        );
        return reply.send(atividade);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar atividade";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove atividade
  app.delete(
    "/atividades/:atividadeId",
    {
      schema: {
        tags: ["Gestão Democrática"],
        summary: "Remover atividade do grêmio",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["atividadeId"],
          properties: { atividadeId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { atividadeId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await gremioService.deleteAtividade(request.params.atividadeId);
        return reply.send({ message: "Atividade deletada com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao remover atividade";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
