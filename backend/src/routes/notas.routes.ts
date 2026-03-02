import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { notaService } from "../services/index.js";
import {
  createNotaSchema,
  lancarNotasTurmaSchema,
  updateNotaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function notasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista notas com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Notas"],
        summary: "Listar notas",
        description: `
Lista notas com suporte a filtros e paginação.

**Filtros disponíveis:**
- \`turmaId\`: Filtrar por turma específica
- \`disciplina\`: Filtrar por disciplina
- \`matriculaId\`: Filtrar por aluno específico
- \`bimestre\`: Filtrar por bimestre (1-5, sendo 5 recuperação final)

**Paginação:**
- Envie \`page\` e \`limit\` para retornar resultado paginado
- Sem paginação: retorna array direto de notas
- Com paginação: retorna objeto com \`data\` e \`pagination\`

**Retorno inclui:**
- Valor da nota
- Avaliação vinculada
- Dados do aluno e turma
- Disciplina e bimestre
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
            disciplina: {
              type: "string",
              description: "Filtrar por disciplina",
              example: "Matemática",
            },
            matriculaId: {
              type: "string",
              description: "Filtrar por ID da matrícula",
              example: "clx0987654321",
            },
            bimestre: {
              type: "string",
              description: "Filtrar por bimestre (1-5)",
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
            description: "Lista de notas (paginada ou completa)",
            oneOf: [
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    valor: { type: "number", example: 8.5 },
                    matriculaId: { type: "string" },
                    turmaId: { type: "string" },
                    disciplina: { type: "string" },
                    bimestre: { type: "integer" },
                    observacao: { type: "string" },
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
            description: "Erro ao buscar notas",
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
          disciplina?: string;
          matriculaId?: string;
          bimestre?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, disciplina, matriculaId, bimestre, page, limit } = request.query;

        const filters: any = {};
        if (turmaId) filters.turmaId = turmaId;
        if (disciplina) filters.disciplina = disciplina;
        if (matriculaId) filters.matriculaId = matriculaId;
        if (bimestre) filters.bimestre = parseInt(bimestre);

        // Suporte a paginação
        if (page && limit) {
          const result = await notaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const notas = await notaService.findAll(filters);
        return reply.send(notas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar notas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria nota individual (para recuperação, por exemplo)
  app.post(
    "/",
    {
      schema: {
        tags: ["Notas"],
        summary: "Criar nota individual",
        description: `
Cria uma nota individual para um aluno.

**Campos obrigatórios:**
- \`valor\`: Valor da nota (0-10)
- \`matriculaId\`: ID da matrícula
- \`turmaId\`: ID da turma
- \`disciplina\`: Nome da disciplina
- \`bimestre\`: Bimestre (1-5)

**Campos opcionais:**
- \`avaliacaoId\`: ID da avaliação vinculada
- \`observacao\`: Observações sobre a nota

**Uso:**
Ideal para lançar notas de recuperação ou notas avulsas não vinculadas a uma avaliação específica.
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["valor", "matriculaId", "turmaId", "disciplina", "bimestre"],
          properties: {
            valor: {
              type: "number",
              minimum: 0,
              maximum: 10,
              description: "Valor da nota",
              example: 7.5,
            },
            matriculaId: { type: "string", example: "clx1234567890" },
            turmaId: { type: "string", example: "clx0987654321" },
            disciplina: { type: "string", example: "Matemática" },
            bimestre: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              description: "Bimestre (1-4 regulares, 5 = recuperação final)",
              example: 1,
            },
            avaliacaoId: { type: "string", nullable: true },
            observacao: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Nota criada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              valor: { type: "number" },
              matriculaId: { type: "string" },
              disciplina: { type: "string" },
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
        const body = createNotaSchema.parse(request.body);
        const nota = await notaService.create(body);
        return reply.status(201).send(nota);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca nota por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Notas"],
        summary: "Obter nota por ID",
        description: `
Retorna os detalhes de uma nota específica.

**Informações retornadas:**
- Valor da nota
- Dados do aluno e turma
- Disciplina e bimestre
- Avaliação vinculada (se houver)
- Observações
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da nota", example: "clx1234567890" },
          },
        },
        response: {
          200: {
            description: "Nota encontrada",
            type: "object",
            properties: {
              id: { type: "string" },
              valor: { type: "number", example: 8.5 },
              matriculaId: { type: "string" },
              turmaId: { type: "string" },
              disciplina: { type: "string" },
              bimestre: { type: "integer" },
              observacao: { type: "string" },
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
            description: "Erro ao buscar nota",
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
        const nota = await notaService.findById(id);

        if (!nota) {
          return reply.status(404).send({ error: "Nota não encontrada" });
        }

        return reply.send(nota);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Lança notas em lote para uma avaliação
  app.post(
    "/turma",
    {
      schema: {
        tags: ["Notas"],
        summary: "Lançar notas em lote",
        description: `
Lança notas de múltiplos alunos para uma avaliação específica.

**Campos obrigatórios:**
- \`avaliacaoId\`: ID da avaliação
- \`notas\`: Array com notas de cada aluno

**Estrutura de nota:**
- \`matriculaId\`: ID da matrícula
- \`valor\`: Valor da nota (0-10)
- \`observacao\`: Observações (opcional)

**Uso:**
Ideal para lançar notas após correção de provas/trabalhos. Permite registrar todas as notas de uma avaliação de uma só vez.

**Regras:**
- Verifica se avaliação existe
- Não permite notas duplicadas
- Atualiza notas existentes se houver
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["avaliacaoId", "notas"],
          properties: {
            avaliacaoId: {
              type: "string",
              description: "ID da avaliação",
              example: "clx1234567890",
            },
            notas: {
              type: "array",
              description: "Lista de notas dos alunos",
              items: {
                type: "object",
                required: ["matriculaId", "valor"],
                properties: {
                  matriculaId: { type: "string", example: "clx0987654321" },
                  valor: {
                    type: "number",
                    minimum: 0,
                    maximum: 10,
                    example: 8.5,
                  },
                  observacao: { type: "string" },
                },
              },
            },
          },
        },
        response: {
          201: {
            description: "Notas lançadas com sucesso",
            type: "object",
            properties: {
              total: { type: "integer", example: 25 },
              sucesso: { type: "integer", example: 25 },
              erros: { type: "integer", example: 0 },
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
        const body = lancarNotasTurmaSchema.parse(request.body);
        const resultado = await notaService.lancarNotasTurma(body);
        return reply.status(201).send(resultado);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao lançar notas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza nota individual
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Notas"],
        summary: "Atualizar nota",
        description: `
Atualiza uma nota existente.

**Campos atualizáveis:**
- \`valor\`: Novo valor da nota
- \`observacao\`: Observações

**Uso comum:**
- Corrigir nota lançada incorretamente
- Adicionar observações
- Atualizar após revisão
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da nota", example: "clx1234567890" },
          },
        },
        body: {
          type: "object",
          properties: {
            valor: {
              type: "number",
              minimum: 0,
              maximum: 10,
              description: "Novo valor da nota",
            },
            observacao: { type: "string", description: "Observações" },
          },
        },
        response: {
          200: {
            description: "Nota atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              valor: { type: "number" },
              observacao: { type: "string" },
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
        const body = updateNotaSchema.parse(request.body);
        const nota = await notaService.update(id, body);
        return reply.send(nota);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove nota
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Notas"],
        summary: "Deletar nota",
        description: `
Remove uma nota do sistema.

**⚠️ Atenção:**
Remove permanentemente a nota. Esta ação não pode ser desfeita.

**Uso:**
- Nota lançada por engano
- Correção de duplicatas
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da nota", example: "clx1234567890" },
          },
        },
        response: {
          200: {
            description: "Nota removida com sucesso",
            type: "object",
            properties: {
              message: { type: "string", example: "Nota removida com sucesso" },
            },
          },
          400: {
            description: "Erro ao remover nota",
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
        await notaService.delete(id);
        return reply.send({ message: "Nota removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Boletim completo de um aluno
  app.get(
    "/boletim/:matriculaId",
    {
      schema: {
        tags: ["Notas"],
        summary: "Obter boletim do aluno",
        description: `
Retorna o boletim completo de um aluno.

**Informações retornadas:**
- Notas de todas as disciplinas
- Médias por bimestre
- Média final de cada disciplina
- Situação final (aprovado/reprovado)
- Frequência geral

**Filtro opcional:**
- \`turmaId\`: Filtrar por turma específica

**Uso:**
Ideal para gerar boletim escolar digital do aluno.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["matriculaId"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula",
              example: "clx1234567890",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            turmaId: {
              type: "string",
              description: "Filtrar por turma",
              example: "clx0987654321",
            },
          },
        },
        response: {
          200: {
            description: "Boletim do aluno",
            type: "object",
            properties: {
              aluno: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  matricula: { type: "string" },
                },
              },
              disciplinas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nome: { type: "string" },
                    bimestre1: { type: "number" },
                    bimestre2: { type: "number" },
                    bimestre3: { type: "number" },
                    bimestre4: { type: "number" },
                    mediaFinal: { type: "number" },
                    situacao: { type: "string", enum: ["APROVADO", "REPROVADO", "RECUPERACAO"] },
                  },
                },
              },
              frequenciaGeral: { type: "number", example: 92.5 },
              situacaoFinal: { type: "string" },
            },
          },
          400: {
            description: "Erro ao gerar boletim",
            type: "object",
            properties: { error: { type: "string" } },
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
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
        Querystring: { turmaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId } = request.params;
        const { turmaId } = request.query;
        const boletim = await notaService.getBoletim(matriculaId, turmaId);
        return reply.send(boletim);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar boletim";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Média final de um aluno em uma disciplina
  app.get(
    "/media/:matriculaId/:turmaId/:disciplinaId",
    {
      schema: {
        tags: ["Notas"],
        summary: "Calcular média final",
        description: `
Calcula a média final de um aluno em uma disciplina específica.

**Informações retornadas:**
- Média calculada baseada nas notas dos bimestres
- Considera configuração de avaliação (pesos, sistema)

**Uso:**
Para verificar situação do aluno em disciplina específica.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["matriculaId", "turmaId", "disciplinaId"],
          properties: {
            matriculaId: { type: "string", example: "clx1234567890" },
            turmaId: { type: "string", example: "clx0987654321" },
            disciplinaId: { type: "string", example: "clx1122334455" },
          },
        },
        response: {
          200: {
            description: "Média calculada",
            type: "object",
            properties: {
              media: { type: "number", example: 7.8 },
            },
          },
          400: {
            description: "Erro ao calcular média",
            type: "object",
            properties: { error: { type: "string" } },
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
    async (
      request: FastifyRequest<{
        Params: {
          matriculaId: string;
          turmaId: string;
          disciplinaId: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, turmaId, disciplinaId } = request.params;
        const media = await notaService.calcularMediaFinal(
          matriculaId,
          turmaId,
          disciplinaId
        );
        return reply.send({ media });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao calcular média";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Situação final de um aluno em uma disciplina
  app.get(
    "/situacao/:matriculaId/:turmaId/:disciplinaId",
    {
      schema: {
        tags: ["Notas"],
        summary: "Obter situação final",
        description: `
Retorna a situação final de um aluno em uma disciplina.

**Informações retornadas:**
- Situação: APROVADO | REPROVADO | RECUPERACAO
- Média final
- Nota necessária para aprovação (se em recuperação)
- Frequência

**Uso:**
Para verificar se aluno foi aprovado, está em recuperação ou foi reprovado.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["matriculaId", "turmaId", "disciplinaId"],
          properties: {
            matriculaId: { type: "string", example: "clx1234567890" },
            turmaId: { type: "string", example: "clx0987654321" },
            disciplinaId: { type: "string", example: "clx1122334455" },
          },
        },
        response: {
          200: {
            description: "Situação final",
            type: "object",
            properties: {
              situacao: {
                type: "string",
                enum: ["APROVADO", "REPROVADO", "RECUPERACAO"],
                example: "APROVADO",
              },
              mediaFinal: { type: "number", example: 7.8 },
              notaNecessaria: { type: "number", nullable: true },
              frequencia: { type: "number", example: 92.5 },
            },
          },
          400: {
            description: "Erro ao buscar situação",
            type: "object",
            properties: { error: { type: "string" } },
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
    async (
      request: FastifyRequest<{
        Params: {
          matriculaId: string;
          turmaId: string;
          disciplinaId: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, turmaId, disciplinaId } = request.params;
        const situacao = await notaService.getSituacaoFinal(
          matriculaId,
          turmaId,
          disciplinaId
        );
        return reply.send(situacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar situação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
