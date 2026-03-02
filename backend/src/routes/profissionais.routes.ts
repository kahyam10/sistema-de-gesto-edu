import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { profissionalService } from "../services/index.js";
import {
  createProfissionalSchema,
  updateProfissionalSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface ProfissionalFilters {
  tipo?: string;
  ativo?: string;
  page?: string;
  limit?: string;
}

export async function profissionaisRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Relatório de lotação por escola
  app.get(
    "/relatorios/lotacao",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Relatório de lotação por escola",
        description: `
Gera um relatório detalhado de lotação de profissionais por escola.

**Informações retornadas:**
- Total de profissionais por tipo (PROFESSOR, AUXILIAR, COORDENADOR, DIRETOR)
- Distribuição de profissionais por escola
- Carga horária total alocada
- Profissionais sem lotação definida

**Filtros disponíveis:**
- \`escolaId\`: Filtrar por escola específica (opcional)

**Uso:**
Ideal para planejamento de recursos humanos e análise de distribuição de profissionais.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola para filtrar",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Relatório de lotação gerado com sucesso",
            type: "object",
            properties: {
              porEscola: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    escolaId: { type: "string" },
                    escolaNome: { type: "string" },
                    totalProfessores: { type: "integer" },
                    totalAuxiliares: { type: "integer" },
                    totalCoordenadores: { type: "integer" },
                    totalDiretores: { type: "integer" },
                    cargaHorariaTotal: { type: "number" },
                  },
                },
              },
              semLotacao: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nome: { type: "string" },
                    tipo: { type: "string" },
                  },
                },
              },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao gerar relatório",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const resumo = await profissionalService.getLotacaoResumo(escolaId);
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de lotação";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Listar todos os profissionais
  app.get(
    "/",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar profissionais",
        description: `
Lista todos os profissionais do sistema com suporte a filtros e paginação.

**Filtros disponíveis:**
- \`tipo\`: Filtrar por tipo (PROFESSOR | AUXILIAR | COORDENADOR | DIRETOR)
- \`ativo\`: Filtrar por status (true/false)

**Paginação:**
- Envie \`page\` e \`limit\` para retornar resultado paginado
- Sem paginação: retorna array direto de profissionais
- Com paginação: retorna objeto com \`data\` e \`pagination\`

**Retorno inclui:**
- Dados do profissional (nome, CPF, email, telefone)
- Tipo e formação
- Escolas vinculadas
- Status ativo/inativo
- Total de turmas atribuídas
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            tipo: {
              type: "string",
              enum: ["PROFESSOR", "AUXILIAR", "COORDENADOR", "DIRETOR"],
              description: "Filtrar por tipo de profissional",
              example: "PROFESSOR",
            },
            ativo: {
              type: "string",
              enum: ["true", "false"],
              description: "Filtrar por status ativo/inativo",
            },
            page: {
              type: "string",
              description: "Número da página (inicia em 1)",
              example: "1",
            },
            limit: {
              type: "string",
              description: "Itens por página (1-100)",
              example: "20",
            },
          },
        },
        response: {
          200: {
            description: "Lista de profissionais (paginada ou completa)",
            oneOf: [
              {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },
              {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: true,
                    },
                  },
                  pagination: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
                additionalProperties: true,
              },
            ],
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao listar profissionais",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: ProfissionalFilters }>,
      reply: FastifyReply
    ) => {
      const { tipo, ativo, page, limit } = request.query;
      const filters: { tipo?: string; ativo?: boolean } = {};

      if (tipo) filters.tipo = tipo;
      if (ativo !== undefined) filters.ativo = ativo === "true";

      if (page && limit) {
        const result = await profissionalService.findAllPaginated(filters, {
          page: parseInt(page),
          limit: parseInt(limit),
        });
        return reply.send(result);
      }

      const profissionais = await profissionalService.findAll(filters);
      return reply.send(profissionais);
    }
  );

  // Buscar profissional por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Obter profissional por ID",
        description: `
Retorna os detalhes completos de um profissional específico.

**Informações retornadas:**
- Dados pessoais e profissionais
- Escolas vinculadas com função e carga horária
- Formações acadêmicas
- Certificações
- Histórico de contratações
- Afastamentos (licenças, férias, etc.)
- Turmas atribuídas
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Profissional encontrado",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string", example: "Maria Silva" },
              cpf: { type: "string", example: "123.456.789-00" },
              email: { type: "string", example: "maria@escola.com" },
              telefone: { type: "string", example: "(73) 99999-9999" },
              tipo: { type: "string", example: "PROFESSOR" },
              formacao: { type: "string", example: "Pedagogia" },
              especialidade: { type: "string", example: "Educação Infantil" },
              matricula: { type: "string" },
              ativo: { type: "boolean" },
              escolas: { type: "array" },
              formacoes: { type: "array" },
              certificacoes: { type: "array" },
              historicoContratacoes: { type: "array" },
              afastamentos: { type: "array" },
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
          500: {
            description: "Erro ao buscar profissional",
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
        const profissional = await profissionalService.findById(id);

        if (!profissional) {
          return reply
            .status(404)
            .send({ error: "Profissional não encontrado" });
        }

        return reply.send(profissional);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar profissional";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar profissionais por escola
  app.get(
    "/escola/:escolaId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar profissionais por escola",
        description: `
Lista todos os profissionais vinculados a uma escola específica.

**Retorno inclui:**
- Dados básicos do profissional
- Função na escola
- Carga horária semanal
- Turmas atribuídas

**Uso:**
Ideal para visualizar o quadro de funcionários de uma escola.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["escolaId"],
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Lista de profissionais da escola",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                nome: { type: "string" },
                tipo: { type: "string" },
                email: { type: "string" },
                telefone: { type: "string" },
                funcao: { type: "string" },
                cargaHoraria: { type: "number" },
              },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao buscar profissionais",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;
        const profissionais = await profissionalService.findByEscola(escolaId);
        return reply.send(profissionais);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar profissionais";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar profissional
  app.post(
    "/",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Criar novo profissional",
        description: `
Cria um novo profissional no sistema.

**Campos obrigatórios:**
- \`nome\`: Nome completo
- \`cpf\`: CPF válido (único no sistema)
- \`tipo\`: PROFESSOR | AUXILIAR | COORDENADOR | DIRETOR

**Campos opcionais:**
- \`email\`: Email para contato
- \`telefone\`: Telefone de contato
- \`formacao\`: Formação acadêmica
- \`especialidade\`: Área de especialização
- \`matricula\`: Número de matrícula funcional
- \`ativo\`: Status (padrão: true)
- \`escolasIds\`: Array de IDs das escolas para vincular

**Regras de negócio:**
- CPF deve ser único
- Email deve ser válido (se fornecido)
- Se \`escolasIds\` for fornecido, vincula automaticamente às escolas
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "cpf", "tipo"],
          properties: {
            nome: {
              type: "string",
              minLength: 1,
              description: "Nome completo do profissional",
              example: "Maria Silva Santos",
            },
            cpf: {
              type: "string",
              minLength: 11,
              description: "CPF (deve ser único)",
              example: "12345678900",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email para contato",
              example: "maria.silva@escola.com",
            },
            telefone: {
              type: "string",
              description: "Telefone de contato",
              example: "(73) 99999-9999",
            },
            tipo: {
              type: "string",
              enum: ["PROFESSOR", "AUXILIAR", "COORDENADOR", "DIRETOR"],
              description: "Tipo de profissional",
              example: "PROFESSOR",
            },
            formacao: {
              type: "string",
              description: "Formação acadêmica principal",
              example: "Licenciatura em Pedagogia",
            },
            especialidade: {
              type: "string",
              description: "Área de especialização",
              example: "Educação Infantil",
            },
            matricula: {
              type: "string",
              description: "Número de matrícula funcional",
              example: "PROF-2026-001",
            },
            ativo: {
              type: "boolean",
              default: true,
              description: "Status do profissional",
            },
            escolasIds: {
              type: "array",
              items: { type: "string" },
              description: "IDs das escolas para vincular",
              example: ["clx1234567890"],
            },
          },
        },
        response: {
          201: {
            description: "Profissional criado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              cpf: { type: "string" },
              email: { type: "string" },
              tipo: { type: "string" },
              ativo: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
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
        const data = createProfissionalSchema.parse(request.body);
        const profissional = await profissionalService.create(data);
        return reply.status(201).send(profissional);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar profissional
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Atualizar profissional",
        description: `
Atualiza os dados de um profissional existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os campos que deseja atualizar.

**Validações:**
- CPF deve permanecer único se alterado
- Email deve ser válido
- Não é possível alterar vínculos com escolas por este endpoint (use endpoints específicos)

**Observação:**
Para gerenciar formações, certificações ou histórico, use os endpoints específicos.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            nome: { type: "string", example: "Maria Silva Santos" },
            cpf: { type: "string", example: "12345678900" },
            email: { type: "string", format: "email" },
            telefone: { type: "string" },
            tipo: {
              type: "string",
              enum: ["PROFESSOR", "AUXILIAR", "COORDENADOR", "DIRETOR"],
            },
            formacao: { type: "string" },
            especialidade: { type: "string" },
            matricula: { type: "string" },
            ativo: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Profissional atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              cpf: { type: "string" },
              email: { type: "string" },
              tipo: { type: "string" },
              ativo: { type: "boolean" },
              updatedAt: { type: "string", format: "date-time" },
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
        const data = updateProfissionalSchema.parse(request.body);
        const profissional = await profissionalService.update(id, data);
        return reply.send(profissional);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar profissional
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Deletar profissional",
        description: `
Remove um profissional do sistema.

**⚠️ Atenção:**
- Não é possível deletar profissionais com turmas atribuídas
- Não é possível deletar profissionais com registros de frequência
- Remove todos os vínculos com escolas

**Recomendação:**
Em vez de deletar, considere desativar o profissional (\`ativo: false\`).

**Efeitos:**
- Remove formações, certificações e histórico vinculados
- Remove permanentemente do banco de dados
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        response: {
          204: {
            description: "Profissional deletado com sucesso",
            type: "null",
          },
          400: {
            description: "Não é possível deletar (possui dependências)",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Não é possível deletar profissional com turmas atribuídas",
              },
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
        await profissionalService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao deletar profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Vincular profissional a escola
  app.post(
    "/:id/escolas",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Vincular profissional a escola",
        description: `
Cria um vínculo entre profissional e escola.

**Campos opcionais:**
- \`funcao\`: Função específica na escola (ex: "Professor de Matemática")
- \`cargaHoraria\`: Carga horária semanal na escola

**Regras de negócio:**
- Um profissional pode estar vinculado a múltiplas escolas
- O mesmo profissional não pode ser vinculado duas vezes à mesma escola

**Uso:**
Use este endpoint para alocar profissionais em escolas.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["escolaId"],
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola",
              example: "clx0987654321",
            },
            funcao: {
              type: "string",
              description: "Função na escola",
              example: "Professor de Matemática",
            },
            cargaHoraria: {
              type: "number",
              description: "Carga horária semanal",
              example: 40,
              minimum: 0,
            },
          },
        },
        response: {
          201: {
            description: "Vínculo criado com sucesso",
            type: "object",
            properties: {
              escolaId: { type: "string" },
              profissionalId: { type: "string" },
              funcao: { type: "string" },
              cargaHoraria: { type: "number" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Erro ao vincular (já vinculado ou dados inválidos)",
            type: "object",
            properties: {
              error: { type: "string" },
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
      request: FastifyRequest<{
        Params: { id: string };
        Body: { escolaId: string; funcao?: string; cargaHoraria?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { escolaId, funcao, cargaHoraria } = request.body as {
          escolaId: string;
          funcao?: string;
          cargaHoraria?: number;
        };
        const vinculo = await profissionalService.vincularEscola(
          id,
          escolaId,
          funcao,
          cargaHoraria
        );
        return reply.status(201).send(vinculo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao vincular profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Desvincular profissional de escola
  app.delete(
    "/:id/escolas/:escolaId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Desvincular profissional de escola",
        description: `
Remove o vínculo entre profissional e escola.

**Efeitos:**
- Remove a lotação do profissional na escola
- Não afeta outros vínculos do profissional
- Não remove o profissional do sistema

**Uso:**
Use para transferências ou término de lotação.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "escolaId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            escolaId: {
              type: "string",
              description: "ID da escola",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Vínculo removido com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao desvincular",
            type: "object",
            properties: {
              error: { type: "string" },
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
      request: FastifyRequest<{ Params: { id: string; escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, escolaId } = request.params;
        await profissionalService.desvincularEscola(id, escolaId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao desvincular profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== FORMAÇÕES ====================

  // Listar formações de um profissional
  app.get(
    "/:id/formacoes",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar formações do profissional",
        description: `
Retorna todas as formações acadêmicas de um profissional.

**Informações retornadas:**
- Tipo de formação (GRADUACAO, POS_GRADUACAO, MESTRADO, DOUTORADO, CURSO_TECNICO, etc.)
- Nome do curso
- Instituição de ensino
- Ano de conclusão
- Carga horária
- Status (em andamento ou concluído)

**Ordenação:**
Formações são ordenadas por ano de conclusão (mais recente primeiro).
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Lista de formações",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                tipo: { type: "string", example: "GRADUACAO" },
                nome: { type: "string", example: "Licenciatura em Pedagogia" },
                instituicao: { type: "string", example: "UFRB" },
                anoConclusao: { type: "integer", example: 2020 },
                cargaHoraria: { type: "integer", example: 3200 },
                emAndamento: { type: "boolean", example: false },
              },
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
          500: {
            description: "Erro ao listar formações",
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
        const formacoes = await profissionalService.getFormacoes(id);
        return reply.send(formacoes);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar formações";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Adicionar formação
  app.post(
    "/:id/formacoes",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Adicionar formação acadêmica",
        description: `
Adiciona uma nova formação acadêmica ao currículo do profissional.

**Campos obrigatórios:**
- \`tipo\`: Tipo de formação
- \`nome\`: Nome do curso/formação

**Campos opcionais:**
- \`instituicao\`: Nome da instituição de ensino
- \`anoConclusao\`: Ano de conclusão (não informar se em andamento)
- \`cargaHoraria\`: Carga horária total em horas
- \`emAndamento\`: Se a formação ainda está em curso (padrão: false)

**Tipos de formação:**
ENSINO_MEDIO, TECNICO, GRADUACAO, POS_GRADUACAO, ESPECIALIZACAO, MESTRADO, DOUTORADO, CURSO_COMPLEMENTAR
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["tipo", "nome"],
          properties: {
            tipo: {
              type: "string",
              description: "Tipo de formação",
              example: "GRADUACAO",
            },
            nome: {
              type: "string",
              description: "Nome do curso",
              example: "Licenciatura em Pedagogia",
            },
            instituicao: {
              type: "string",
              description: "Instituição de ensino",
              example: "Universidade Federal do Recôncavo da Bahia",
            },
            anoConclusao: {
              type: "integer",
              description: "Ano de conclusão",
              example: 2020,
              minimum: 1950,
            },
            cargaHoraria: {
              type: "integer",
              description: "Carga horária total",
              example: 3200,
              minimum: 0,
            },
            emAndamento: {
              type: "boolean",
              description: "Formação em andamento",
              default: false,
            },
          },
        },
        response: {
          201: {
            description: "Formação adicionada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              tipo: { type: "string" },
              nome: { type: "string" },
              instituicao: { type: "string" },
              anoConclusao: { type: "integer" },
              cargaHoraria: { type: "integer" },
              emAndamento: { type: "boolean" },
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
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          tipo: string;
          nome: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body as {
          tipo: string;
          nome: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
        const formacao = await profissionalService.addFormacao(id, data);
        return reply.status(201).send(formacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar formação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar formação
  app.put(
    "/:id/formacoes/:formacaoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Atualizar formação acadêmica",
        description: `
Atualiza os dados de uma formação acadêmica existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os campos que deseja atualizar.

**Uso comum:**
- Atualizar formação de "em andamento" para concluída
- Corrigir informações cadastradas
- Adicionar carga horária ou instituição
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "formacaoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            formacaoId: {
              type: "string",
              description: "ID da formação",
              example: "clx0987654321",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            tipo: { type: "string" },
            nome: { type: "string" },
            instituicao: { type: "string" },
            anoConclusao: { type: "integer", minimum: 1950 },
            cargaHoraria: { type: "integer", minimum: 0 },
            emAndamento: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Formação atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              tipo: { type: "string" },
              nome: { type: "string" },
              instituicao: { type: "string" },
              anoConclusao: { type: "integer" },
              emAndamento: { type: "boolean" },
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
      request: FastifyRequest<{
        Params: { id: string; formacaoId: string };
        Body: {
          tipo?: string;
          nome?: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { formacaoId } = request.params;
        const data = request.body as {
          tipo?: string;
          nome?: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
        const formacao = await profissionalService.updateFormacao(
          formacaoId,
          data
        );
        return reply.send(formacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar formação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover formação
  app.delete(
    "/:id/formacoes/:formacaoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Remover formação acadêmica",
        description: `
Remove uma formação acadêmica do currículo do profissional.

**Efeito:**
Remove permanentemente a formação do banco de dados.

**Uso:**
Para correção de dados duplicados ou cadastros incorretos.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "formacaoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            formacaoId: {
              type: "string",
              description: "ID da formação",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Formação removida com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao remover formação",
            type: "object",
            properties: {
              error: { type: "string" },
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
      request: FastifyRequest<{ Params: { id: string; formacaoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { formacaoId } = request.params;
        await profissionalService.deleteFormacao(formacaoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover formação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== CERTIFICAÇÕES ====================

  // Listar certificações
  app.get(
    "/:id/certificacoes",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar certificações do profissional",
        description: `
Retorna todas as certificações e cursos complementares do profissional.

**Informações retornadas:**
- Nome da certificação/curso
- Instituição emissora
- Datas de emissão e validade
- Carga horária
- URL do certificado digital (se disponível)
- Observações

**Uso:**
Para verificar cursos de capacitação, certificações profissionais e formação continuada.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Lista de certificações",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                nome: { type: "string", example: "Curso de LIBRAS Básico" },
                instituicao: { type: "string", example: "SEMED Ibirapitanga" },
                dataEmissao: { type: "string", format: "date" },
                dataValidade: { type: "string", format: "date" },
                cargaHoraria: { type: "integer", example: 40 },
                urlCertificado: { type: "string" },
                observacoes: { type: "string" },
              },
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
          500: {
            description: "Erro ao buscar certificações",
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
        const certificacoes = await profissionalService.getCertificacoes(id);
        return reply.send(certificacoes);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar certificações";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar certificação
  app.post(
    "/:id/certificacoes",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Adicionar certificação",
        description: `
Adiciona uma nova certificação ou curso ao currículo do profissional.

**Campo obrigatório:**
- \`nome\`: Nome da certificação/curso

**Campos opcionais:**
- \`instituicao\`: Instituição emissora
- \`dataEmissao\`: Data de emissão (formato: YYYY-MM-DD)
- \`dataValidade\`: Data de validade (formato: YYYY-MM-DD)
- \`cargaHoraria\`: Carga horária total
- \`urlCertificado\`: Link para certificado digital
- \`observacoes\`: Observações adicionais

**Exemplos de uso:**
- Cursos de capacitação
- Workshops e seminários
- Certificações profissionais
- Formação continuada
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["nome"],
          properties: {
            nome: {
              type: "string",
              description: "Nome da certificação",
              example: "Curso de LIBRAS Básico",
            },
            instituicao: {
              type: "string",
              description: "Instituição emissora",
              example: "SEMED Ibirapitanga",
            },
            dataEmissao: {
              type: "string",
              format: "date",
              description: "Data de emissão",
              example: "2026-01-15",
            },
            dataValidade: {
              type: "string",
              format: "date",
              description: "Data de validade (se aplicável)",
              example: "2028-01-15",
            },
            cargaHoraria: {
              type: "integer",
              description: "Carga horária total",
              example: 40,
              minimum: 0,
            },
            urlCertificado: {
              type: "string",
              format: "uri",
              description: "URL do certificado digital",
              example: "https://certificados.exemplo.com/abc123",
            },
            observacoes: {
              type: "string",
              description: "Observações adicionais",
            },
          },
        },
        response: {
          201: {
            description: "Certificação adicionada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              instituicao: { type: "string" },
              dataEmissao: { type: "string", format: "date-time" },
              dataValidade: { type: "string", format: "date-time" },
              cargaHoraria: { type: "integer" },
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
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          nome: string;
          instituicao?: string;
          dataEmissao?: string;
          dataValidade?: string;
          cargaHoraria?: number;
          urlCertificado?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const certificacao = await profissionalService.addCertificacao(id, {
          ...data,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
          dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
        });
        return reply.status(201).send(certificacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar certificação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar certificação
  app.put(
    "/:id/certificacoes/:certificacaoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Atualizar certificação",
        description: `
Atualiza os dados de uma certificação existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os que deseja atualizar.

**Uso comum:**
- Adicionar URL do certificado digital
- Atualizar data de validade
- Corrigir informações cadastradas
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "certificacaoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            certificacaoId: {
              type: "string",
              description: "ID da certificação",
              example: "clx0987654321",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            nome: { type: "string" },
            instituicao: { type: "string" },
            dataEmissao: { type: "string", format: "date" },
            dataValidade: { type: "string", format: "date" },
            cargaHoraria: { type: "integer", minimum: 0 },
            urlCertificado: { type: "string", format: "uri" },
            observacoes: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Certificação atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              instituicao: { type: "string" },
              dataEmissao: { type: "string", format: "date-time" },
              dataValidade: { type: "string", format: "date-time" },
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
      request: FastifyRequest<{
        Params: { id: string; certificacaoId: string };
        Body: {
          nome?: string;
          instituicao?: string;
          dataEmissao?: string;
          dataValidade?: string;
          cargaHoraria?: number;
          urlCertificado?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { certificacaoId } = request.params;
        const data = request.body;
        const certificacao = await profissionalService.updateCertificacao(certificacaoId, {
          ...data,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
          dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
        });
        return reply.send(certificacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar certificação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover certificação
  app.delete(
    "/:id/certificacoes/:certificacaoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Remover certificação",
        description: `
Remove uma certificação do currículo do profissional.

**Efeito:**
Remove permanentemente a certificação do banco de dados.

**Uso:**
Para correção de dados duplicados ou cadastros incorretos.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "certificacaoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            certificacaoId: {
              type: "string",
              description: "ID da certificação",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Certificação removida com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao remover certificação",
            type: "object",
            properties: {
              error: { type: "string" },
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
      request: FastifyRequest<{ Params: { id: string; certificacaoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { certificacaoId } = request.params;
        await profissionalService.deleteCertificacao(certificacaoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover certificação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== HISTÓRICO DE CONTRATAÇÕES ====================

  // Listar histórico
  app.get(
    "/:id/historico",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar histórico de contratações",
        description: `
Retorna o histórico profissional do colaborador.

**Informações retornadas:**
- Tipo de evento (ADMISSAO, PROMOCAO, TRANSFERENCIA, DESLIGAMENTO, etc.)
- Descrição do evento
- Data do evento
- Cargo ocupado
- Observações

**Ordenação:**
Eventos são ordenados cronologicamente (mais recente primeiro).

**Uso:**
Para consultar trajetória profissional e mudanças de cargo/lotação.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Lista de eventos do histórico",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                tipo: { type: "string", example: "ADMISSAO" },
                descricao: { type: "string", example: "Admissão como Professor" },
                dataEvento: { type: "string", format: "date" },
                cargo: { type: "string", example: "Professor" },
                observacoes: { type: "string" },
              },
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
          500: {
            description: "Erro ao buscar histórico",
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
        const historico = await profissionalService.getHistoricoContratacoes(id);
        return reply.send(historico);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar evento ao histórico
  app.post(
    "/:id/historico",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Adicionar evento ao histórico",
        description: `
Registra um novo evento no histórico profissional.

**Campos obrigatórios:**
- \`tipo\`: Tipo de evento
- \`descricao\`: Descrição do evento
- \`dataEvento\`: Data em que ocorreu (formato: YYYY-MM-DD)

**Campos opcionais:**
- \`cargo\`: Cargo relacionado ao evento
- \`observacoes\`: Informações adicionais

**Tipos de evento:**
ADMISSAO, PROMOCAO, TRANSFERENCIA, DESLIGAMENTO, READMISSAO, MUDANCA_CARGO, APOSENTADORIA
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["tipo", "descricao", "dataEvento"],
          properties: {
            tipo: {
              type: "string",
              description: "Tipo de evento",
              example: "ADMISSAO",
            },
            descricao: {
              type: "string",
              description: "Descrição detalhada",
              example: "Admissão como Professor de Matemática",
            },
            dataEvento: {
              type: "string",
              format: "date",
              description: "Data do evento",
              example: "2026-02-01",
            },
            cargo: {
              type: "string",
              description: "Cargo relacionado",
              example: "Professor",
            },
            observacoes: {
              type: "string",
              description: "Observações adicionais",
            },
          },
        },
        response: {
          201: {
            description: "Evento adicionado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              tipo: { type: "string" },
              descricao: { type: "string" },
              dataEvento: { type: "string", format: "date-time" },
              cargo: { type: "string" },
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
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          tipo: string;
          descricao: string;
          dataEvento: string;
          cargo?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const evento = await profissionalService.addHistoricoContratacao(id, {
          ...data,
          dataEvento: new Date(data.dataEvento),
        });
        return reply.status(201).send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar evento do histórico
  app.put(
    "/:id/historico/:historicoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Atualizar evento do histórico",
        description: `
Atualiza os dados de um evento no histórico profissional.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os que deseja atualizar.

**Uso comum:**
- Corrigir datas ou descrições
- Adicionar informações complementares
- Atualizar cargo relacionado
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "historicoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            historicoId: {
              type: "string",
              description: "ID do evento",
              example: "clx0987654321",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            tipo: { type: "string" },
            descricao: { type: "string" },
            dataEvento: { type: "string", format: "date" },
            cargo: { type: "string" },
            observacoes: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Evento atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              tipo: { type: "string" },
              descricao: { type: "string" },
              dataEvento: { type: "string", format: "date-time" },
              cargo: { type: "string" },
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
      request: FastifyRequest<{
        Params: { id: string; historicoId: string };
        Body: {
          tipo?: string;
          descricao?: string;
          dataEvento?: string;
          cargo?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { historicoId } = request.params;
        const data = request.body;
        const evento = await profissionalService.updateHistoricoContratacao(historicoId, {
          ...data,
          dataEvento: data.dataEvento ? new Date(data.dataEvento) : undefined,
        });
        return reply.send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover evento do histórico
  app.delete(
    "/:id/historico/:historicoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Remover evento do histórico",
        description: `
Remove um evento do histórico profissional.

**Efeito:**
Remove permanentemente o evento do banco de dados.

**Uso:**
Para correção de dados duplicados ou registros incorretos.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "historicoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            historicoId: {
              type: "string",
              description: "ID do evento",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Evento removido com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao remover evento",
            type: "object",
            properties: {
              error: { type: "string" },
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
      request: FastifyRequest<{ Params: { id: string; historicoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { historicoId } = request.params;
        await profissionalService.deleteHistoricoContratacao(historicoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== AFASTAMENTOS ====================

  // Listar afastamentos
  app.get(
    "/:id/afastamentos",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar afastamentos do profissional",
        description: `
Retorna todos os afastamentos de um profissional.

**Informações retornadas:**
- Tipo de afastamento (LICENCA_MEDICA, FERIAS, ATESTADO, etc.)
- Datas de início e fim
- Motivo e observações
- Documento comprobatório (path)
- Status (ativo/inativo)

**Filtros:**
- \`apenasAtivos\`: Se true, retorna apenas afastamentos em andamento

**Tipos de afastamento:**
LICENCA_MEDICA, LICENCA_MATERNIDADE, LICENCA_PATERNIDADE, FERIAS, ATESTADO, FALTA_JUSTIFICADA, SUSPENSAO
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            apenasAtivos: {
              type: "string",
              enum: ["true", "false"],
              description: "Retornar apenas afastamentos ativos",
              example: "true",
            },
          },
        },
        response: {
          200: {
            description: "Lista de afastamentos",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                tipo: { type: "string", example: "LICENCA_MEDICA" },
                dataInicio: { type: "string", format: "date" },
                dataFim: { type: "string", format: "date" },
                motivo: { type: "string" },
                observacoes: { type: "string" },
                documentoPath: { type: "string" },
                ativo: { type: "boolean" },
              },
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
          500: {
            description: "Erro ao buscar afastamentos",
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
        Querystring: { apenasAtivos?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { apenasAtivos } = request.query;
        const afastamentos = await profissionalService.getAfastamentos(
          id,
          apenasAtivos === "true"
        );
        return reply.send(afastamentos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar afastamentos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar afastamento
  app.post(
    "/:id/afastamentos",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Adicionar afastamento",
        description: `
Registra um novo afastamento do profissional.

**Campos obrigatórios:**
- \`tipo\`: Tipo de afastamento
- \`dataInicio\`: Data de início (formato: YYYY-MM-DD)

**Campos opcionais:**
- \`dataFim\`: Data de término (se não informado, afastamento fica em aberto)
- \`motivo\`: Motivo do afastamento
- \`observacoes\`: Observações adicionais
- \`documentoPath\`: Caminho do documento comprobatório
- \`ativo\`: Status (padrão: true)

**Regras de negócio:**
- \`dataFim\` deve ser posterior a \`dataInicio\`
- Afastamentos sem \`dataFim\` são considerados em andamento
- Campo \`ativo\` é atualizado automaticamente ao informar \`dataFim\`
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["tipo", "dataInicio"],
          properties: {
            tipo: {
              type: "string",
              description: "Tipo de afastamento",
              example: "LICENCA_MEDICA",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data de início",
              example: "2026-02-10",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data de término (opcional)",
              example: "2026-02-20",
            },
            motivo: {
              type: "string",
              description: "Motivo do afastamento",
              example: "Atestado médico",
            },
            observacoes: {
              type: "string",
              description: "Observações adicionais",
            },
            documentoPath: {
              type: "string",
              description: "Caminho do documento",
              example: "/uploads/atestados/doc123.pdf",
            },
            ativo: {
              type: "boolean",
              description: "Status do afastamento",
              default: true,
            },
          },
        },
        response: {
          201: {
            description: "Afastamento adicionado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              tipo: { type: "string" },
              dataInicio: { type: "string", format: "date-time" },
              dataFim: { type: "string", format: "date-time" },
              ativo: { type: "boolean" },
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
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          tipo: string;
          dataInicio: string;
          dataFim?: string;
          motivo?: string;
          observacoes?: string;
          documentoPath?: string;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const afastamento = await profissionalService.addAfastamento(id, {
          ...data,
          dataInicio: new Date(data.dataInicio),
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.status(201).send(afastamento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar afastamento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar afastamento
  app.put(
    "/:id/afastamentos/:afastamentoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Atualizar afastamento",
        description: `
Atualiza os dados de um afastamento existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os que deseja atualizar.

**Uso comum:**
- Informar data de retorno (\`dataFim\`)
- Adicionar documento comprobatório
- Encerrar afastamento (\`ativo: false\`)
- Corrigir informações
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "afastamentoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            afastamentoId: {
              type: "string",
              description: "ID do afastamento",
              example: "clx0987654321",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            tipo: { type: "string" },
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
            motivo: { type: "string" },
            observacoes: { type: "string" },
            documentoPath: { type: "string" },
            ativo: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Afastamento atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              tipo: { type: "string" },
              dataInicio: { type: "string", format: "date-time" },
              dataFim: { type: "string", format: "date-time" },
              ativo: { type: "boolean" },
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
      request: FastifyRequest<{
        Params: { id: string; afastamentoId: string };
        Body: {
          tipo?: string;
          dataInicio?: string;
          dataFim?: string;
          motivo?: string;
          observacoes?: string;
          documentoPath?: string;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { afastamentoId } = request.params;
        const data = request.body;
        const afastamento = await profissionalService.updateAfastamento(afastamentoId, {
          ...data,
          dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.send(afastamento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar afastamento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover afastamento
  app.delete(
    "/:id/afastamentos/:afastamentoId",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Remover afastamento",
        description: `
Remove um registro de afastamento.

**Efeito:**
Remove permanentemente o afastamento do banco de dados.

**Observação:**
Considere desativar (\`ativo: false\`) em vez de deletar para manter histórico.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "afastamentoId"],
          properties: {
            id: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            afastamentoId: {
              type: "string",
              description: "ID do afastamento",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Afastamento removido com sucesso",
            type: "null",
          },
          400: {
            description: "Erro ao remover afastamento",
            type: "object",
            properties: {
              error: { type: "string" },
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
      request: FastifyRequest<{ Params: { id: string; afastamentoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { afastamentoId } = request.params;
        await profissionalService.deleteAfastamento(afastamentoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover afastamento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Listar afastamentos ativos (todos os profissionais)
  app.get(
    "/afastamentos/ativos",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Listar todos os afastamentos ativos",
        description: `
Retorna todos os afastamentos em andamento de todos os profissionais.

**Informações retornadas:**
- Dados do profissional afastado
- Tipo de afastamento
- Data de início e previsão de término
- Motivo
- Dias de afastamento

**Uso:**
Ideal para visualizar profissionais ausentes no momento e planejar substituições.

**Ordenação:**
Afastamentos ordenados por data de início (mais recentes primeiro).
        `,
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de afastamentos ativos",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                tipo: { type: "string" },
                dataInicio: { type: "string", format: "date" },
                dataFim: { type: "string", format: "date" },
                motivo: { type: "string" },
                profissional: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nome: { type: "string" },
                    tipo: { type: "string" },
                  },
                },
              },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao buscar afastamentos",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const afastamentos = await profissionalService.getAfastamentosAtivos();
        return reply.send(afastamentos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar afastamentos ativos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== RELATÓRIOS ====================

  // Relatório de carga horária semanal
  app.get(
    "/relatorios/carga-horaria",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Relatório de carga horária semanal",
        description: `
Gera relatório detalhado de carga horária dos profissionais.

**Informações retornadas:**
- Total de horas atribuídas por profissional
- Distribuição de carga horária por escola
- Profissionais com sobrecarga (acima de 40h)
- Profissionais com capacidade ociosa
- Média de carga horária

**Filtros disponíveis:**
- \`escolaId\`: Filtrar por escola específica

**Uso:**
Para planejamento de recursos humanos e verificação de cumprimento de carga horária contratual.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola para filtrar",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Relatório de carga horária gerado com sucesso",
            type: "object",
            properties: {
              profissionais: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nome: { type: "string" },
                    tipo: { type: "string" },
                    cargaHorariaTotal: { type: "number", example: 40 },
                    escolas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          escolaNome: { type: "string" },
                          cargaHoraria: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
              resumo: {
                type: "object",
                properties: {
                  totalProfissionais: { type: "integer" },
                  cargaHorariaMedia: { type: "number" },
                  profissionaisSobrecarga: { type: "integer" },
                  profissionaisOciosos: { type: "integer" },
                },
              },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao gerar relatório",
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
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const relatorio = await profissionalService.getCargaHorariaSemanal(escolaId);
        return reply.send(relatorio);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de carga horária";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Dashboard de alocação
  app.get(
    "/dashboard/alocacao",
    {
      schema: {
        tags: ["Profissionais"],
        summary: "Dashboard de alocação de profissionais",
        description: `
Gera dashboard com visão geral da alocação de profissionais.

**Informações retornadas:**
- Total de profissionais por tipo
- Profissionais ativos vs inativos
- Distribuição por escola
- Turmas sem professor atribuído
- Taxa de ocupação de profissionais
- Afastamentos em andamento
- Profissionais sem lotação definida

**Filtros disponíveis:**
- \`escolaId\`: Filtrar por escola específica

**Uso:**
Dashboard executivo para gestão de recursos humanos e tomada de decisões estratégicas.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola para filtrar",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Dashboard gerado com sucesso",
            type: "object",
            properties: {
              totais: {
                type: "object",
                properties: {
                  professores: { type: "integer", example: 45 },
                  auxiliares: { type: "integer", example: 12 },
                  coordenadores: { type: "integer", example: 5 },
                  diretores: { type: "integer", example: 8 },
                  ativos: { type: "integer", example: 65 },
                  inativos: { type: "integer", example: 5 },
                },
              },
              alocacao: {
                type: "object",
                properties: {
                  comLotacao: { type: "integer" },
                  semLotacao: { type: "integer" },
                  taxaAlocacao: { type: "number", example: 92.5 },
                },
              },
              afastamentos: {
                type: "object",
                properties: {
                  total: { type: "integer" },
                  porTipo: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tipo: { type: "string" },
                        quantidade: { type: "integer" },
                      },
                    },
                  },
                },
              },
              turmasSemProfessor: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    turmaId: { type: "string" },
                    turmaNome: { type: "string" },
                    escolaNome: { type: "string" },
                  },
                },
              },
            },
          },          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao gerar dashboard",
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
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const dashboard = await profissionalService.getDashboardAlocacao(escolaId);
        return reply.send(dashboard);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar dashboard de alocação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
