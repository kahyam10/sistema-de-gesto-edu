import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { configuracaoAvaliacaoService } from "../services/index.js";
import {
  createConfiguracaoAvaliacaoSchema,
  updateConfiguracaoAvaliacaoSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function configuracaoAvaliacaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista configurações
  app.get(
    "/",
    {
      schema: {
        tags: ["Configuração de Avaliações"],
        summary: "Listar configurações de avaliação",
        description: `
Lista todas as configurações de avaliação do sistema com filtros opcionais.

**Filtros disponíveis:**
- \`anoLetivo\`: Filtrar por ano letivo específico
- \`escolaId\`: Filtrar configurações de uma escola
- \`etapaId\`: Filtrar por etapa de ensino

**Informações retornadas:**
- Sistema de avaliação (NOTA ou CONCEITO)
- Número de períodos (bimestres/trimestres)
- Média mínima para aprovação
- Percentual de frequência mínima
- Configurações de recuperação

**Casos de uso:**
- Visualizar regras de avaliação por escola/etapa
- Consultar critérios de aprovação
- Gerenciar configurações pedagógicas

**Permissões:**
- Requer autenticação (Bearer token)
- Todos os usuários autenticados podem visualizar
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            anoLetivo: {
              type: "string",
              description: "Ano letivo para filtrar",
              example: "2026",
            },
            escolaId: {
              type: "string",
              description: "ID da escola",
              example: "clx1234567890",
            },
            etapaId: {
              type: "string",
              description: "ID da etapa de ensino",
              example: "clx0987654321",
            },
          },
        },
        response: {
          200: {
            description: "Lista de configurações de avaliação",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                anoLetivo: { type: "number", example: 2026 },
                sistemaAvaliacao: {
                  type: "string",
                  enum: ["NOTA", "CONCEITO"],
                  example: "NOTA",
                },
                numeroPeriodos: {
                  type: "number",
                  example: 4,
                  description: "Número de bimestres/trimestres",
                },
                mediaMinima: {
                  type: "number",
                  example: 6.0,
                  description: "Média mínima para aprovação",
                },
                percentualFrequenciaMinima: {
                  type: "number",
                  example: 75,
                  description: "Frequência mínima em %",
                },
                recuperacaoParalela: { type: "boolean" },
                recuperacaoFinal: { type: "boolean" },
                escolaId: { type: "string" },
                etapaId: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
          400: {
            description: "Erro ao listar configurações",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          anoLetivo?: string;
          escolaId?: string;
          etapaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivo, escolaId, etapaId } = request.query;
        const filters: {
          anoLetivo?: number;
          escolaId?: string;
          etapaId?: string;
        } = {};
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (escolaId) filters.escolaId = escolaId;
        if (etapaId) filters.etapaId = etapaId;

        const configs = await configuracaoAvaliacaoService.findAll(filters);
        return reply.send(configs);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar configurações";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Configuração de Avaliações"],
        summary: "Buscar configuração por ID",
        description: `
Retorna os detalhes completos de uma configuração de avaliação específica.

**Informações retornadas:**
- Sistema de avaliação adotado
- Critérios de aprovação e frequência
- Configurações de recuperação
- Vínculos com escola e etapa

**Casos de uso:**
- Consultar configuração específica
- Verificar regras de avaliação
- Visualizar detalhes completos

**Permissões:**
- Requer autenticação (Bearer token)
- Todos os usuários autenticados podem visualizar
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da configuração",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Configuração encontrada",
            type: "object",
            properties: {
              id: { type: "string" },
              anoLetivo: { type: "number" },
              sistemaAvaliacao: { type: "string", enum: ["NOTA", "CONCEITO"] },
              numeroPeriodos: { type: "number" },
              mediaMinima: { type: "number" },
              percentualFrequenciaMinima: { type: "number" },
              recuperacaoParalela: { type: "boolean" },
              recuperacaoFinal: { type: "boolean" },
              escolaId: { type: "string" },
              etapaId: { type: "string" },
              escola: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                },
              },
              etapa: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Erro ao buscar configuração",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          404: {
            description: "Configuração não encontrada",
            type: "object",
            properties: {
              error: { type: "string", example: "Configuração não encontrada" },
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
        const config = await configuracaoAvaliacaoService.findById(id);

        if (!config) {
          return reply
            .status(404)
            .send({ error: "Configuração não encontrada" });
        }

        return reply.send(config);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria configuração
  app.post(
    "/",
    {
      schema: {
        tags: ["Configuração de Avaliações"],
        summary: "Criar nova configuração de avaliação",
        description: `
Cria uma nova configuração de avaliação para um ano letivo.

**Campos obrigatórios:**
- \`anoLetivo\`: Ano letivo (ex: 2026)
- \`sistemaAvaliacao\`: NOTA ou CONCEITO
- \`numeroPeriodos\`: Quantidade de períodos (1-6)
- \`mediaMinima\`: Nota/conceito mínimo para aprovação (0-10)
- \`percentualFrequenciaMinima\`: Frequência mínima em % (0-100)

**Campos opcionais:**
- \`recuperacaoParalela\`: Permite recuperação durante o ano (padrão: false)
- \`recuperacaoFinal\`: Permite recuperação final (padrão: true)
- \`escolaId\`: Aplicar apenas a uma escola específica
- \`etapaId\`: Aplicar apenas a uma etapa específica

**Exemplos de uso:**
- Configuração municipal: sem escolaId/etapaId (aplica a todas)
- Configuração por escola: com escolaId
- Configuração por etapa: com etapaId
- Configuração específica: com escolaId e etapaId

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado para gestores SEMEC e coordenadores pedagógicos
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: [
            "anoLetivo",
            "sistemaAvaliacao",
            "numeroPeriodos",
            "mediaMinima",
            "percentualFrequenciaMinima",
          ],
          properties: {
            anoLetivo: {
              type: "number",
              minimum: 2020,
              maximum: 2100,
              example: 2026,
              description: "Ano letivo",
            },
            sistemaAvaliacao: {
              type: "string",
              enum: ["NOTA", "CONCEITO"],
              default: "NOTA",
              description: "Sistema de avaliação adotado",
            },
            numeroPeriodos: {
              type: "number",
              minimum: 1,
              maximum: 6,
              default: 4,
              example: 4,
              description: "Número de bimestres/trimestres",
            },
            mediaMinima: {
              type: "number",
              minimum: 0,
              maximum: 10,
              default: 6.0,
              example: 6.0,
              description: "Média mínima para aprovação",
            },
            percentualFrequenciaMinima: {
              type: "number",
              minimum: 0,
              maximum: 100,
              default: 75,
              example: 75,
              description: "Percentual mínimo de frequência",
            },
            recuperacaoParalela: {
              type: "boolean",
              default: false,
              description: "Permite recuperação paralela",
            },
            recuperacaoFinal: {
              type: "boolean",
              default: true,
              description: "Permite recuperação final",
            },
            escolaId: {
              type: "string",
              description: "ID da escola (opcional)",
              example: "clx1234567890",
            },
            etapaId: {
              type: "string",
              description: "ID da etapa (opcional)",
              example: "clx0987654321",
            },
          },
        },
        response: {
          201: {
            description: "Configuração criada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              anoLetivo: { type: "number" },
              sistemaAvaliacao: { type: "string" },
              numeroPeriodos: { type: "number" },
              mediaMinima: { type: "number" },
              percentualFrequenciaMinima: { type: "number" },
              recuperacaoParalela: { type: "boolean" },
              recuperacaoFinal: { type: "boolean" },
              escolaId: { type: "string" },
              etapaId: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createConfiguracaoAvaliacaoSchema.parse(request.body);
        const config = await configuracaoAvaliacaoService.create(body);
        return reply.status(201).send(config);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza configuração
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Configuração de Avaliações"],
        summary: "Atualizar configuração existente",
        description: `
Atualiza uma configuração de avaliação existente.

**Campos editáveis:**
- Todos os campos podem ser atualizados parcialmente
- Apenas os campos enviados serão modificados
- Sistema de avaliação pode ser alterado
- Critérios de aprovação podem ser ajustados

**Casos de uso:**
- Ajustar média mínima para aprovação
- Alterar percentual de frequência
- Habilitar/desabilitar recuperação paralela
- Modificar número de períodos

**Atenção:**
- Alterações afetam o ano letivo configurado
- Mudanças impactam todas as avaliações do período
- Recomenda-se fazer no início do ano letivo

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado para gestores SEMEC e coordenadores pedagógicos
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da configuração a ser atualizada",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            anoLetivo: {
              type: "number",
              minimum: 2020,
              maximum: 2100,
              example: 2026,
            },
            sistemaAvaliacao: {
              type: "string",
              enum: ["NOTA", "CONCEITO"],
            },
            numeroPeriodos: {
              type: "number",
              minimum: 1,
              maximum: 6,
            },
            mediaMinima: {
              type: "number",
              minimum: 0,
              maximum: 10,
            },
            percentualFrequenciaMinima: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            recuperacaoParalela: {
              type: "boolean",
            },
            recuperacaoFinal: {
              type: "boolean",
            },
            escolaId: {
              type: "string",
            },
            etapaId: {
              type: "string",
            },
          },
        },
        response: {
          200: {
            description: "Configuração atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              anoLetivo: { type: "number" },
              sistemaAvaliacao: { type: "string" },
              numeroPeriodos: { type: "number" },
              mediaMinima: { type: "number" },
              percentualFrequenciaMinima: { type: "number" },
              recuperacaoParalela: { type: "boolean" },
              recuperacaoFinal: { type: "boolean" },
              escolaId: { type: "string" },
              etapaId: { type: "string" },
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
          401: {
            $ref: "#/components/responses/Unauthorized",
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
        const body = updateConfiguracaoAvaliacaoSchema.parse(request.body);
        const config = await configuracaoAvaliacaoService.update(id, body);
        return reply.send(config);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove configuração
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Configuração de Avaliações"],
        summary: "Remover configuração de avaliação",
        description: `
Remove uma configuração de avaliação do sistema.

**Atenção:**
- Esta operação é irreversível
- Remove a configuração permanentemente
- Não afeta avaliações e notas já lançadas
- Use com cuidado durante o ano letivo

**Casos de uso:**
- Remover configuração criada por engano
- Limpar configurações de anos anteriores
- Corrigir duplicidades

**Recomendação:**
- Evite remover configurações em uso
- Prefira desativar ou ajustar em vez de deletar
- Faça backup antes de operações críticas

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado apenas para gestores SEMEC
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da configuração a ser removida",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Configuração removida com sucesso",
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "Configuração removida com sucesso",
              },
            },
          },
          400: {
            description: "Erro ao remover configuração",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
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
        await configuracaoAvaliacaoService.delete(id);
        return reply.send({ message: "Configuração removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover configuração";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
