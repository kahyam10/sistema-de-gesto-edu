import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { cardapioService } from "../services/cardapio.service.js";
import {
  createCardapioSchema,
  updateCardapioSchema,
} from "../schemas/alimentacao.schemas.js";
import { authMiddleware } from "../middleware/auth.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { consultaListaSchema } from "../schemas/index.js";

export async function cardapioRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista cardápios com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Listar cardápios",
        description: `
Lista cardápios planejados com filtros e paginação opcional.

**Filtros:** \`escolaId\` (retorna os da escola E os da rede), \`turno\`, \`tipoRefeicao\`, \`dataInicio\`/\`dataFim\`, \`ativo\`.

**Paginação:** envie \`page\` e \`limit\` para o envelope \`{ data, pagination }\`; sem eles retorna array direto.

Cardápio com \`escolaId\` nulo é da rede (publicado pela SEMEC).
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: { type: "string", description: "Filtrar por escola (inclui cardápios da rede)" },
            turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"] },
            tipoRefeicao: {
              type: "string",
              enum: ["CAFE_MANHA", "LANCHE_MANHA", "ALMOCO", "LANCHE_TARDE", "JANTAR", "CEIA"],
            },
            dataInicio: { type: "string", format: "date", example: "2026-02-01" },
            dataFim: { type: "string", format: "date", example: "2026-02-28" },
            ativo: { type: "string", enum: ["true", "false"] },
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
          ativo?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, turno, tipoRefeicao, ativo } = request.query;
        const consulta = consultaListaSchema.parse(request.query);

        const filters: NonNullable<Parameters<typeof cardapioService.findAllPaginated>[0]> = {};
        if (escolaId) filters.escolaId = escolaId;
        if (turno) filters.turno = turno;
        if (tipoRefeicao) filters.tipoRefeicao = tipoRefeicao;
        if (consulta.dataInicio) filters.dataInicio = consulta.dataInicio;
        if (consulta.dataFim) filters.dataFim = consulta.dataFim;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        if (consulta.page && consulta.limit) {
          const result = await cardapioService.findAllPaginated(filters, {
            page: consulta.page,
            limit: consulta.limit,
          });
          return reply.send(result);
        }

        const cardapios = await cardapioService.findAll(filters);
        return reply.send(cardapios);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Busca cardápio por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Obter cardápio por ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", description: "ID do cardápio" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const cardapio = await cardapioService.findById(id);
        return reply.send(cardapio);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Cria cardápio
  app.post(
    "/",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Criar cardápio",
        description: `
Cria um cardápio planejado para escola/data/turno/tipo de refeição.

**Regras de negócio:**
- \`escolaId\` ausente = cardápio da rede (SEMEC)
- Não permite duplicidade de escola + data + turno + tipo de refeição (BIZ_026)
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["data", "turno", "tipoRefeicao", "descricao"],
          properties: {
            data: { type: "string", format: "date", example: "2026-02-12" },
            turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"] },
            tipoRefeicao: {
              type: "string",
              enum: ["CAFE_MANHA", "LANCHE_MANHA", "ALMOCO", "LANCHE_TARDE", "JANTAR", "CEIA"],
            },
            descricao: { type: "string", example: "Arroz, feijão, frango e salada" },
            itens: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alimento: { type: "string", example: "Arroz" },
                  quantidadePorAluno: { type: "number", example: 0.1 },
                  unidade: { type: "string", example: "KG" },
                },
              },
            },
            observacoesNutricionais: { type: "string" },
            escolaId: { type: "string", description: "Ausente = cardápio da rede" },
            ativo: { type: "boolean", default: true },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createCardapioSchema.parse(request.body);
        const cardapio = await cardapioService.create(body);
        return reply.status(201).send(cardapio);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualiza cardápio
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Atualizar cardápio",
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
        const body = updateCardapioSchema.parse(request.body);
        const cardapio = await cardapioService.update(id, body);
        return reply.send(cardapio);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Remove cardápio
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Alimentação Escolar"],
        summary: "Deletar cardápio",
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
        await cardapioService.delete(id);
        return reply.send({ message: "Cardápio deletado com sucesso" });
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
