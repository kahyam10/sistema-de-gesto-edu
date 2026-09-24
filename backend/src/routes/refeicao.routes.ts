import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError, formatarErroZod } from "../errors/index.js";
import { ZodError } from "zod";
import { refeicaoService } from "../services/refeicao.service.js";
import {
  createRegistroRefeicaoSchema,
  updateRegistroRefeicaoSchema,
  relatorioPnaeQuerySchema,
} from "../schemas/alimentacao.schemas.js";
import { authMiddleware } from "../middleware/auth.js";

export async function refeicaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista registros de refeição
  app.get(
    "/",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Listar registros de refeição",
        description: `
Lista refeições efetivamente servidas (base do relatório FNDE/PNAE).

**Filtros:** \`escolaId\`, \`turno\`, \`tipoRefeicao\`, \`dataInicio\`/\`dataFim\`.

**Paginação:** envie \`page\` e \`limit\` para o envelope \`{ data, pagination }\`.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: { type: "string" },
            turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"] },
            tipoRefeicao: {
              type: "string",
              enum: ["CAFE_MANHA", "LANCHE_MANHA", "ALMOCO", "LANCHE_TARDE", "JANTAR", "CEIA"],
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
          escolaId?: string;
          turno?: string;
          tipoRefeicao?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, turno, tipoRefeicao, dataInicio, dataFim, page, limit } =
          request.query;

        const filters: any = {};
        if (escolaId) filters.escolaId = escolaId;
        if (turno) filters.turno = turno;
        if (tipoRefeicao) filters.tipoRefeicao = tipoRefeicao;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        if (page && limit) {
          const result = await refeicaoService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const refeicoes = await refeicaoService.findAll(filters);
        return reply.send(refeicoes);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar registros de refeição";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Relatório PNAE (rota estática ANTES de /:id)
  app.get(
    "/relatorio-pnae",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Relatório PNAE",
        description: `
Consolida refeições servidas por escola no período e o custo dos insumos
(ENTRADAS de estoque × custo unitário) para prestação de contas FNDE/PNAE.

**Query obrigatória:** \`dataInicio\` e \`dataFim\`. \`escolaId\` é opcional.

**Retorno:** \`{ periodo, escolas: [{ escolaId, nomeEscola, totalPorTipoRefeicao, totalRefeicoes }], consolidado: { totalRefeicoes, custoTotalInsumos, custoMedioPorRefeicao } }\`
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["dataInicio", "dataFim"],
          properties: {
            dataInicio: { type: "string", format: "date", example: "2026-02-01" },
            dataFim: { type: "string", format: "date", example: "2026-02-28" },
            escolaId: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = relatorioPnaeQuerySchema.parse(request.query);
        const relatorio = await refeicaoService.relatorioPnae(query);
        return reply.send(relatorio);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao gerar relatório PNAE";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca registro por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Obter registro de refeição por ID",
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
        const registro = await refeicaoService.findById(id);
        return reply.send(registro);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao buscar registro de refeição";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria registro de refeição
  app.post(
    "/",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Criar registro de refeição",
        description: `
Registra as refeições servidas em uma escola por dia/turno/tipo.

**Regra:** um registro por escola/data/turno/tipo (unicidade garantida pelo banco).
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["data", "turno", "tipoRefeicao", "quantidadeServida", "escolaId"],
          properties: {
            data: { type: "string", format: "date", example: "2026-02-12" },
            turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"] },
            tipoRefeicao: {
              type: "string",
              enum: ["CAFE_MANHA", "LANCHE_MANHA", "ALMOCO", "LANCHE_TARDE", "JANTAR", "CEIA"],
            },
            quantidadeServida: { type: "integer", example: 120 },
            quantidadePlanejada: { type: "integer", example: 130 },
            observacoes: { type: "string" },
            escolaId: { type: "string" },
            cardapioId: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createRegistroRefeicaoSchema.parse(request.body);
        const registro = await refeicaoService.create(body);
        return reply.status(201).send(registro);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao criar registro de refeição";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza registro de refeição
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Atualizar registro de refeição",
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
        const body = updateRegistroRefeicaoSchema.parse(request.body);
        const registro = await refeicaoService.update(id, body);
        return reply.send(registro);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar registro de refeição";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove registro de refeição
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Deletar registro de refeição",
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
        await refeicaoService.delete(id);
        return reply.send({ message: "Registro de refeição deletado com sucesso" });
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao deletar registro de refeição";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
