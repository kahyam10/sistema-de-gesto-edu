import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError, formatarErroZod } from "../errors/index.js";
import { ZodError } from "zod";
import { estoqueService } from "../services/estoque.service.js";
import {
  createItemEstoqueSchema,
  updateItemEstoqueSchema,
  createMovimentacaoEstoqueSchema,
} from "../schemas/alimentacao.schemas.js";
import { authMiddleware } from "../middleware/auth.js";

export async function estoqueRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista itens de estoque (com saldo derivado)
  app.get(
    "/itens",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Listar itens de estoque",
        description: `
Lista itens da despensa com o campo calculado \`saldo\` — SEMPRE derivado das
movimentações (entradas − saídas), nunca armazenado.

**Filtros:** \`escolaId\`, \`categoria\`, \`ativo\`, \`busca\` (nome, case-insensitive).
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: { type: "string" },
            categoria: {
              type: "string",
              enum: ["PERECIVEL", "NAO_PERECIVEL", "HORTIFRUTI", "PROTEINA", "GRAO", "LATICINIO", "OUTRO"],
            },
            ativo: { type: "string", enum: ["true", "false"] },
            busca: { type: "string", description: "Busca por nome do item" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          escolaId?: string;
          categoria?: string;
          ativo?: string;
          busca?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, categoria, ativo, busca } = request.query;

        const filters: NonNullable<Parameters<typeof estoqueService.listItens>[0]> = {};
        if (escolaId) filters.escolaId = escolaId;
        if (categoria) filters.categoria = categoria;
        if (ativo !== undefined) filters.ativo = ativo === "true";
        if (busca) filters.busca = busca;

        const itens = await estoqueService.listItens(filters);
        return reply.send(itens);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar itens de estoque";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca item por ID (saldo + últimas 20 movimentações)
  app.get(
    "/itens/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Obter item de estoque por ID",
        description:
          "Retorna o item com saldo derivado e as últimas 20 movimentações.",
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
        const { id } = request.params;
        const item = await estoqueService.findItemById(id);
        return reply.send(item);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar item de estoque";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria item de estoque
  app.post(
    "/itens",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Criar item de estoque",
        description:
          "Cria um item da despensa. Nome é único por escola. O saldo nasce em zero e só muda via movimentações.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "categoria", "unidadeMedida", "escolaId"],
          properties: {
            nome: { type: "string", example: "Arroz tipo 1" },
            categoria: {
              type: "string",
              enum: ["PERECIVEL", "NAO_PERECIVEL", "HORTIFRUTI", "PROTEINA", "GRAO", "LATICINIO", "OUTRO"],
            },
            unidadeMedida: { type: "string", enum: ["KG", "G", "L", "ML", "UN", "PCT", "CX"] },
            estoqueMinimo: { type: "number", default: 0 },
            escolaId: { type: "string" },
            ativo: { type: "boolean", default: true },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createItemEstoqueSchema.parse(request.body);
        const item = await estoqueService.createItem(body);
        return reply.status(201).send(item);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao criar item de estoque";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza item de estoque
  app.put(
    "/itens/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Atualizar item de estoque",
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
        const { id } = request.params;
        const body = updateItemEstoqueSchema.parse(request.body);
        const item = await estoqueService.updateItem(id, body);
        return reply.send(item);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar item de estoque";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove item de estoque
  app.delete(
    "/itens/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Deletar item de estoque",
        description:
          "Remove o item e, em cascata, toda a sua trilha de movimentações.",
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
        const { id } = request.params;
        await estoqueService.deleteItem(id);
        return reply.send({ message: "Item de estoque deletado com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao deletar item de estoque";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Lista movimentações
  app.get(
    "/movimentacoes",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Listar movimentações de estoque",
        description: `
Lista a trilha de entradas/saídas com filtros e paginação opcional.

**Filtros:** \`itemId\`, \`escolaId\` (via item), \`tipo\`, \`dataInicio\`/\`dataFim\`.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            itemId: { type: "string" },
            escolaId: { type: "string" },
            tipo: {
              type: "string",
              enum: ["ENTRADA", "SAIDA", "PERDA", "AJUSTE_ENTRADA", "AJUSTE_SAIDA"],
            },
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
            page: { type: "string", example: "1" },
            limit: { type: "string", example: "20" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          itemId?: string;
          escolaId?: string;
          tipo?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { itemId, escolaId, tipo, dataInicio, dataFim, page, limit } =
          request.query;

        const filters: NonNullable<Parameters<typeof estoqueService.listMovimentacoesPaginated>[0]> = {};
        if (itemId) filters.itemId = itemId;
        if (escolaId) filters.escolaId = escolaId;
        if (tipo) filters.tipo = tipo;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        if (page && limit) {
          const result = await estoqueService.listMovimentacoesPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const movimentacoes = await estoqueService.listMovimentacoes(filters);
        return reply.send(movimentacoes);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar movimentações";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Registra movimentação
  app.post(
    "/movimentacoes",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Registrar movimentação de estoque",
        description: `
Registra ENTRADA, SAIDA, PERDA, AJUSTE_ENTRADA ou AJUSTE_SAIDA.

**Regras de negócio:**
- Quantidade sempre positiva (o tipo dá o sinal)
- Saída/perda/ajuste de saída checa o saldo derivado DENTRO da transação — saldo insuficiente rejeita com BIZ_025
- Motivo é obrigatório para PERDA e AJUSTE_*
- Correção de erro operacional = movimentação AJUSTE_* (nunca DELETE)
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["itemId", "tipo", "quantidade"],
          properties: {
            itemId: { type: "string" },
            tipo: {
              type: "string",
              enum: ["ENTRADA", "SAIDA", "PERDA", "AJUSTE_ENTRADA", "AJUSTE_SAIDA"],
            },
            quantidade: { type: "number", example: 10 },
            data: { type: "string", format: "date-time" },
            custoUnitario: { type: "number", description: "Preenchido em ENTRADA (prestação de contas PNAE)" },
            fornecedor: { type: "string" },
            notaFiscal: { type: "string" },
            motivo: { type: "string", description: "Obrigatório para PERDA e AJUSTE_*" },
            registradoPor: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createMovimentacaoEstoqueSchema.parse(request.body);
        const movimentacao = await estoqueService.registrarMovimentacao(body);
        return reply.status(201).send(movimentacao);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao registrar movimentação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove movimentação (RBAC: apenas GESTAO — trilha de auditoria)
  app.delete(
    "/movimentacoes/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Deletar movimentação de estoque",
        description:
          "Restrito à GESTAO (trilha de auditoria). Prefira registrar um AJUSTE_* com motivo.",
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
        const { id } = request.params;
        await estoqueService.deleteMovimentacao(id);
        return reply.send({ message: "Movimentação deletada com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao deletar movimentação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Alertas de estoque mínimo
  app.get(
    "/alertas",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Alertas de estoque mínimo",
        description: `
Itens ativos com saldo <= estoqueMinimo, com o saldo derivado das movimentações.

A comparação usa \`<=\` (não \`<\`): item zerado com mínimo 0 também alerta —
despensa vazia deve alertar.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: { escolaId: { type: "string" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const alertas = await estoqueService.alertasEstoqueMinimo(escolaId);
        return reply.send(alertas);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar alertas de estoque";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
