import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { avaliacaoService } from "../services/index.js";
import {
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function avaliacoesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista avaliações com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Avaliações"],
        summary: "Listar avaliações",
        description: `
Lista avaliações com suporte a filtros e paginação.

**Filtros disponíveis:**
- \`turmaId\`: Filtrar por turma específica
- \`disciplinaId\`: Filtrar por disciplina
- \`bimestre\`: Filtrar por bimestre (1-4)

**Paginação:**
- Envie \`page\` e \`limit\` para retornar resultado paginado
- Sem paginação: retorna array direto de avaliações
- Com paginação: retorna objeto com \`data\` e \`pagination\`

**Retorno inclui:**
- Dados da avaliação (nome, tipo, data)
- Peso e valor máximo
- Turma e disciplina vinculadas
- Profissional responsável
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            turmaId: {
              type: "string",
              description: "Filtrar por ID da turma",
              example: "clx1234567890",
            },
            disciplinaId: {
              type: "string",
              description: "Filtrar por ID da disciplina",
              example: "clx0987654321",
            },
            bimestre: {
              type: "string",
              description: "Filtrar por bimestre (1-4)",
              example: "1",
            },
            page: {
              type: "string",
              description: "Número da página",
              example: "1",
            },
            limit: {
              type: "string",
              description: "Itens por página",
              example: "20",
            },
          },
        },
        response: {
          200: {
            description: "Lista de avaliações (paginada ou completa)",
            oneOf: [
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nome: { type: "string", example: "Prova Bimestral" },
                    tipo: {
                      type: "string",
                      enum: ["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"],
                    },
                    peso: { type: "number", example: 1.0 },
                    valorMaximo: { type: "number", example: 10.0 },
                    data: { type: "string", format: "date-time" },
                    bimestre: { type: "integer", example: 1 },
                    turmaId: { type: "string" },
                    disciplinaId: { type: "string" },
                  },
                },
              },
              {
                type: "object",
                properties: {
                  data: { type: "array" },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      total: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            ],
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          400: {
            description: "Erro ao listar avaliações",
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          turmaId?: string;
          disciplinaId?: string;
          bimestre?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, disciplinaId, bimestre, page, limit } = request.query;
        const filters: {
          turmaId?: string;
          disciplinaId?: string;
          bimestre?: number;
        } = {};
        if (turmaId) filters.turmaId = turmaId;
        if (disciplinaId) filters.disciplinaId = disciplinaId;
        if (bimestre) filters.bimestre = parseInt(bimestre);

        // Suporte a paginação
        if (page && limit) {
          const result = await avaliacaoService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const avaliacoes = await avaliacaoService.findAll(filters);
        return reply.send(avaliacoes);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar avaliações";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Avaliações"],
        summary: "Obter avaliação por ID",
        description: `
Retorna os detalhes de uma avaliação específica.

**Informações retornadas:**
- Dados completos da avaliação
- Turma e disciplina vinculadas
- Profissional responsável
- Notas lançadas (se houver)
- Estatísticas (média, máxima, mínima)
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da avaliação",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Avaliação encontrada",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string", example: "Prova Bimestral" },
              tipo: { type: "string", example: "PROVA" },
              peso: { type: "number", example: 1.0 },
              valorMaximo: { type: "number", example: 10.0 },
              data: { type: "string", format: "date-time" },
              bimestre: { type: "integer", example: 1 },
              observacao: { type: "string" },
              turma: { type: "object" },
              disciplina: { type: "object" },
            },
          },          404: {
            description: "Não encontrado",
            type: "object",
            properties: {
              error: { type: "string", example: "Recurso não encontrado" },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          400: {
            description: "Erro ao buscar avaliação",
            type: "object",
            properties: { error: { type: "string" } },
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
        const avaliacao = await avaliacaoService.findById(id);

        if (!avaliacao) {
          return reply
            .status(404)
            .send({ error: "Avaliação não encontrada" });
        }

        return reply.send(avaliacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria avaliação
  app.post(
    "/",
    {
      schema: {
        tags: ["Avaliações"],
        summary: "Criar avaliação",
        description: `
Cria uma nova avaliação.

**Campos obrigatórios:**
- \`nome\`: Nome da avaliação (ex: "Prova Bimestral")
- \`tipo\`: PROVA | TRABALHO | ATIVIDADE | PARTICIPACAO | RECUPERACAO
- \`data\`: Data da avaliação (formato: YYYY-MM-DD)
- \`bimestre\`: Bimestre (1-4)
- \`turmaId\`: ID da turma
- \`disciplinaId\`: ID da disciplina

**Campos opcionais:**
- \`peso\`: Peso da avaliação no cálculo da média (padrão: 1.0)
- \`valorMaximo\`: Valor máximo da avaliação (padrão: 10.0)
- \`observacao\`: Observações sobre a avaliação
- \`profissionalId\`: ID do profissional responsável

**Uso:**
Cadastre avaliações antes de lançar notas. A avaliação define como as notas serão calculadas.
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "tipo", "data", "bimestre", "turmaId", "disciplinaId"],
          properties: {
            nome: {
              type: "string",
              minLength: 1,
              description: "Nome da avaliação",
              example: "Prova Bimestral de Matemática",
            },
            tipo: {
              type: "string",
              enum: ["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"],
              description: "Tipo de avaliação",
              example: "PROVA",
            },
            peso: {
              type: "number",
              minimum: 0,
              default: 1.0,
              description: "Peso no cálculo da média",
              example: 1.5,
            },
            valorMaximo: {
              type: "number",
              minimum: 0,
              default: 10.0,
              description: "Valor máximo da avaliação",
              example: 10.0,
            },
            data: {
              type: "string",
              format: "date",
              description: "Data da avaliação",
              example: "2026-03-15",
            },
            bimestre: {
              type: "integer",
              minimum: 1,
              maximum: 4,
              description: "Bimestre",
              example: 1,
            },
            observacao: {
              type: "string",
              description: "Observações",
            },
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
            disciplinaId: {
              type: "string",
              description: "ID da disciplina",
              example: "clx0987654321",
            },
            profissionalId: {
              type: "string",
              description: "ID do profissional responsável",
              example: "clx1122334455",
            },
          },
        },
        response: {
          201: {
            description: "Avaliação criada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              tipo: { type: "string" },
              data: { type: "string", format: "date-time" },
              bimestre: { type: "integer" },
            },
          },          400: {
            description: "Requisição inválida",
            type: "object",
            properties: {
              error: { type: "string", example: "Dados de requisição inválidos" },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createAvaliacaoSchema.parse(request.body);
        const avaliacao = await avaliacaoService.create(body);
        return reply.status(201).send(avaliacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza avaliação
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Avaliações"],
        summary: "Atualizar avaliação",
        description: `
Atualiza os dados de uma avaliação existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os que deseja atualizar.

**Uso comum:**
- Alterar data da avaliação
- Ajustar peso ou valor máximo
- Adicionar observações
- Corrigir informações

**Observação:**
Alterações no peso ou valor máximo afetam o cálculo das médias já lançadas.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da avaliação",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            nome: { type: "string", example: "Prova Bimestral Revisada" },
            tipo: {
              type: "string",
              enum: ["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"],
            },
            peso: { type: "number", minimum: 0 },
            valorMaximo: { type: "number", minimum: 0 },
            data: { type: "string", format: "date" },
            bimestre: { type: "integer", minimum: 1, maximum: 4 },
            observacao: { type: "string" },
            profissionalId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Avaliação atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              tipo: { type: "string" },
              data: { type: "string", format: "date-time" },
              bimestre: { type: "integer" },
            },
          },          400: {
            description: "Requisição inválida",
            type: "object",
            properties: {
              error: { type: "string", example: "Dados de requisição inválidos" },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },          404: {
            description: "Não encontrado",
            type: "object",
            properties: {
              error: { type: "string", example: "Recurso não encontrado" },
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
        const body = updateAvaliacaoSchema.parse(request.body);
        const avaliacao = await avaliacaoService.update(id, body);
        return reply.send(avaliacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove avaliação
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Avaliações"],
        summary: "Deletar avaliação",
        description: `
Remove uma avaliação do sistema.

**⚠️ Atenção:**
- Remove a avaliação e todas as notas vinculadas
- Esta ação não pode ser desfeita
- Afeta o cálculo das médias dos alunos

**Recomendação:**
Certifique-se de que deseja realmente remover a avaliação e suas notas.

**Uso:**
- Avaliação cadastrada por engano
- Avaliação cancelada
- Correção de duplicatas
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da avaliação",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Avaliação removida com sucesso",
            type: "object",
            properties: {
              message: { type: "string", example: "Avaliação removida com sucesso" },
            },
          },
          400: {
            description: "Erro ao remover avaliação",
            type: "object",
            properties: { error: { type: "string" } },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },          404: {
            description: "Não encontrado",
            type: "object",
            properties: {
              error: { type: "string", example: "Recurso não encontrado" },
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
        await avaliacaoService.delete(id);
        return reply.send({ message: "Avaliação removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover avaliação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
