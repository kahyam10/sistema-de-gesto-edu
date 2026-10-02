import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { refeicaoService } from "../services/refeicao.service.js";
import {
  createRegistroRefeicaoSchema,
  updateRegistroRefeicaoSchema,
  relatorioPnaeQuerySchema,
} from "../schemas/alimentacao.schemas.js";
import { authMiddleware } from "../middleware/auth.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { consultaListaSchema } from "../schemas/index.js";

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
        const { escolaId, turno, tipoRefeicao } = request.query;
        const consulta = consultaListaSchema.parse(request.query);

        const filters: NonNullable<Parameters<typeof refeicaoService.findAllPaginated>[0]> = {};
        if (escolaId) filters.escolaId = escolaId;
        if (turno) filters.turno = turno;
        if (tipoRefeicao) filters.tipoRefeicao = tipoRefeicao;
        if (consulta.dataInicio) filters.dataInicio = consulta.dataInicio;
        if (consulta.dataFim) filters.dataFim = consulta.dataFim;

        if (consulta.page && consulta.limit) {
          const result = await refeicaoService.findAllPaginated(filters, {
            page: consulta.page,
            limit: consulta.limit,
          });
          return reply.send(result);
        }

        const refeicoes = await refeicaoService.findAll(filters);
        return reply.send(refeicoes);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
      }
    }
  );
}
