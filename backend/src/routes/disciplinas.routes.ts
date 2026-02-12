import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { disciplinaService } from "../services/index.js";
import {
  createDisciplinaSchema,
  updateDisciplinaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function disciplinasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista disciplinas com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Disciplinas"],
        summary: "Listar disciplinas",
        description: `
Lista todas as disciplinas cadastradas no sistema.

**Filtros disponíveis:**
- \`etapaId\`: Filtrar por etapa de ensino
- \`ativo\`: Filtrar por status (true/false)

**Retorno inclui:**
- Código e nome da disciplina
- Etapa de ensino vinculada
- Carga horária semanal
- Status ativo/inativo
- Ordem de exibição
- Se é obrigatória ou optativa

**Uso:**
Para listar disciplinas disponíveis para uma etapa específica ou todas as disciplinas do sistema.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            etapaId: {
              type: "string",
              description: "Filtrar por ID da etapa",
              example: "clx1234567890",
            },
            ativo: {
              type: "string",
              enum: ["true", "false"],
              description: "Filtrar por status ativo/inativo",
            },
          },
        },
        response: {
          200: {
            description: "Lista de disciplinas",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                nome: { type: "string", example: "Matemática" },
                codigo: { type: "string", example: "MAT" },
                descricao: { type: "string" },
                cargaHorariaSemanal: { type: "integer", example: 5 },
                obrigatoria: { type: "boolean", example: true },
                ativo: { type: "boolean", example: true },
                ordem: { type: "integer", example: 1 },
                etapaId: { type: "string" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          400: {
            description: "Erro ao listar disciplinas",
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { etapaId?: string; ativo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { etapaId, ativo } = request.query;
        const filters: { etapaId?: string; ativo?: boolean } = {};
        if (etapaId) filters.etapaId = etapaId;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        const disciplinas = await disciplinaService.findAll(filters);
        return reply.send(disciplinas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar disciplinas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca disciplina por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Disciplinas"],
        summary: "Obter disciplina por ID",
        description: `
Retorna os detalhes de uma disciplina específica.

**Informações retornadas:**
- Dados completos da disciplina
- Etapa de ensino vinculada
- Carga horária e código
- Status e configurações
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da disciplina",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Disciplina encontrada",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string", example: "Matemática" },
              codigo: { type: "string", example: "MAT" },
              descricao: { type: "string" },
              cargaHorariaSemanal: { type: "integer", example: 5 },
              obrigatoria: { type: "boolean" },
              ativo: { type: "boolean" },
              ordem: { type: "integer" },
              etapa: { type: "object" },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          400: {
            description: "Erro ao buscar disciplina",
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
        const disciplina = await disciplinaService.findById(id);

        if (!disciplina) {
          return reply.status(404).send({ error: "Disciplina não encontrada" });
        }

        return reply.send(disciplina);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca disciplinas por etapa
  app.get(
    "/etapa/:etapaId",
    {
      schema: {
        tags: ["Disciplinas"],
        summary: "Listar disciplinas por etapa",
        description: `
Lista todas as disciplinas de uma etapa de ensino específica.

**Retorno:**
Disciplinas ordenadas por ordem de exibição.

**Uso:**
Para exibir as disciplinas disponíveis ao criar turmas ou lançar notas de uma etapa específica.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["etapaId"],
          properties: {
            etapaId: {
              type: "string",
              description: "ID da etapa de ensino",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Lista de disciplinas da etapa",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                nome: { type: "string" },
                codigo: { type: "string" },
                cargaHorariaSemanal: { type: "integer" },
                obrigatoria: { type: "boolean" },
                ordem: { type: "integer" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          400: {
            description: "Erro ao buscar disciplinas",
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { etapaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { etapaId } = request.params;
        const disciplinas = await disciplinaService.findByEtapa(etapaId);
        return reply.send(disciplinas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar disciplinas por etapa";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria disciplina
  app.post(
    "/",
    {
      schema: {
        tags: ["Disciplinas"],
        summary: "Criar disciplina",
        description: `
Cria uma nova disciplina no sistema.

**Campos obrigatórios:**
- \`nome\`: Nome da disciplina (ex: "Matemática")
- \`codigo\`: Código único da disciplina (ex: "MAT")
- \`etapaId\`: ID da etapa de ensino

**Campos opcionais:**
- \`descricao\`: Descrição da disciplina
- \`cargaHorariaSemanal\`: Horas semanais (padrão: 0)
- \`obrigatoria\`: Se é obrigatória (padrão: true)
- \`ativo\`: Status ativo/inativo (padrão: true)
- \`ordem\`: Ordem de exibição (padrão: 0)

**Regras:**
- Código deve ser único dentro da etapa
- Nome deve ser único dentro da etapa
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "codigo", "etapaId"],
          properties: {
            nome: {
              type: "string",
              minLength: 1,
              description: "Nome da disciplina",
              example: "Matemática",
            },
            codigo: {
              type: "string",
              minLength: 1,
              maxLength: 20,
              description: "Código da disciplina",
              example: "MAT",
            },
            descricao: {
              type: "string",
              description: "Descrição da disciplina",
            },
            cargaHorariaSemanal: {
              type: "integer",
              minimum: 0,
              description: "Carga horária semanal",
              example: 5,
            },
            obrigatoria: {
              type: "boolean",
              default: true,
              description: "Se é obrigatória",
            },
            ativo: {
              type: "boolean",
              default: true,
              description: "Status da disciplina",
            },
            ordem: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Ordem de exibição",
              example: 1,
            },
            etapaId: {
              type: "string",
              description: "ID da etapa de ensino",
              example: "clx1234567890",
            },
          },
        },
        response: {
          201: {
            description: "Disciplina criada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              codigo: { type: "string" },
              etapaId: { type: "string" },
              ativo: { type: "boolean" },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createDisciplinaSchema.parse(request.body);
        const disciplina = await disciplinaService.create(body);
        return reply.status(201).send(disciplina);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza disciplina
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Disciplinas"],
        summary: "Atualizar disciplina",
        description: `
Atualiza os dados de uma disciplina existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os que deseja atualizar.

**Uso comum:**
- Ajustar carga horária
- Alterar ordem de exibição
- Desativar disciplina
- Atualizar descrição
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da disciplina",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            nome: { type: "string", example: "Matemática Aplicada" },
            codigo: { type: "string" },
            descricao: { type: "string" },
            cargaHorariaSemanal: { type: "integer", minimum: 0 },
            obrigatoria: { type: "boolean" },
            ativo: { type: "boolean" },
            ordem: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            description: "Disciplina atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              codigo: { type: "string" },
              ativo: { type: "boolean" },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateDisciplinaSchema.parse(request.body);
        const disciplina = await disciplinaService.update(id, body);
        return reply.send(disciplina);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove disciplina
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Disciplinas"],
        summary: "Deletar disciplina",
        description: `
Remove uma disciplina do sistema.

**⚠️ Atenção:**
- Não é possível deletar disciplinas com avaliações vinculadas
- Não é possível deletar disciplinas com notas lançadas
- Remove permanentemente do banco de dados

**Recomendação:**
Considere desativar (\`ativo: false\`) em vez de deletar para manter histórico.

**Uso:**
- Disciplina cadastrada por engano
- Correção de duplicatas
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da disciplina",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Disciplina removida com sucesso",
            type: "object",
            properties: {
              message: { type: "string", example: "Disciplina removida com sucesso" },
            },
          },
          400: {
            description: "Erro ao remover disciplina (pode ter dependências)",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Não é possível deletar disciplina com avaliações vinculadas",
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await disciplinaService.delete(id);
        return reply.send({ message: "Disciplina removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover disciplina";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
