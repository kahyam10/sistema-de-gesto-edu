import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { turmaService } from "../services/index.js";
import {
  createTurmaSchema,
  updateTurmaSchema,
  addAlunoTurmaSchema,
  addProfessorTurmaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface TurmaFilters {
  escolaId?: string;
  anoLetivo?: string;
  ativo?: string;
  page?: string;
  limit?: string;
}

export async function turmasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Relatório de vagas por escola
  app.get(
    "/relatorios/vagas",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Relatório de vagas por escola",
        description: `
Gera um relatório completo de vagas disponíveis por escola.

**Informações retornadas:**
- Total de vagas por escola
- Vagas ocupadas e disponíveis
- Vagas para PCD
- Turmas com vagas esgotadas
- Taxa de ocupação

**Filtros disponíveis:**
- \`escolaId\`: Filtrar por escola específica
- \`anoLetivo\`: Filtrar por ano letivo (default: ano atual)

**Observações:**
- Útil para planejamento de matrículas
- Identifica escolas com capacidade crítica
- Separa vagas regulares de vagas PCD
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
            anoLetivo: {
              type: "string",
              description: "Ano letivo (ex: 2026)",
              example: "2026",
            },
          },
        },
        response: {
          200: {
            description: "Relatório de vagas gerado com sucesso",
            type: "object",
            properties: {
              porEscola: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    escolaId: { type: "string" },
                    escolaNome: { type: "string" },
                    totalVagas: { type: "integer" },
                    vagasOcupadas: { type: "integer" },
                    vagasDisponiveis: { type: "integer" },
                    vagasPCD: { type: "integer" },
                    taxaOcupacao: { type: "number" },
                  },
                },
              },
              resumo: {
                type: "object",
                properties: {
                  totalVagas: { type: "integer" },
                  totalOcupadas: { type: "integer" },
                  totalDisponiveis: { type: "integer" },
                  taxaOcupacaoGeral: { type: "number" },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
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
        Querystring: { escolaId?: string; anoLetivo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo } = request.query;
        const resumo = await turmaService.getVagasResumo(
          escolaId,
          anoLetivo ? parseInt(anoLetivo) : undefined
        );
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de vagas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Listar todas as turmas
  app.get(
    "/",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Listar turmas",
        description: `
Lista todas as turmas do sistema com suporte a filtros e paginação.

**Filtros disponíveis:**
- \`escolaId\`: Filtrar por escola específica
- \`anoLetivo\`: Filtrar por ano letivo
- \`ativo\`: Filtrar por status (true/false)

**Paginação:**
- Envie \`page\` e \`limit\` para retornar resultado paginado
- Sem paginação: retorna array direto de turmas
- Com paginação: retorna objeto com \`data\` e \`pagination\`

**Retorno inclui:**
- Dados da turma (nome, turno, ano letivo)
- Informações da escola vinculada
- Informações da série/etapa
- Total de alunos matriculados
- Capacidade e vagas disponíveis
- Lista de professores
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "Filtrar por ID da escola",
              example: "clx1234567890",
            },
            anoLetivo: {
              type: "string",
              description: "Filtrar por ano letivo",
              example: "2026",
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
            description: "Lista de turmas (paginada ou completa)",
            oneOf: [
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nome: { type: "string" },
                    turno: { type: "string", enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"] },
                    anoLetivo: { type: "integer" },
                    capacidadeMaxima: { type: "integer" },
                    limitePCD: { type: "integer" },
                    ativo: { type: "boolean" },
                    escola: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        nome: { type: "string" },
                      },
                    },
                    serie: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        nome: { type: "string" },
                      },
                    },
                    _count: {
                      type: "object",
                      properties: {
                        matriculas: { type: "integer" },
                      },
                    },
                  },
                },
              },
              {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { type: "object" },
                  },
                  pagination: {
                    $ref: "#/components/schemas/PaginationMeta",
                  },
                },
              },
            ],
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: {
            description: "Erro ao listar turmas",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: TurmaFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo, ativo, page, limit } = request.query;
        const filters: {
          escolaId?: string;
          anoLetivo?: number;
          ativo?: boolean;
        } = {};

        if (escolaId) filters.escolaId = escolaId;
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (ativo !== undefined) filters.ativo = ativo === "true";

        // Suporte a paginação
        if (page && limit) {
          const result = await turmaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const turmas = await turmaService.findAll(filters);
        return reply.send(turmas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar turmas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar turma por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Obter turma por ID",
        description: `
Retorna os detalhes completos de uma turma específica.

**Informações retornadas:**
- Dados básicos da turma
- Escola vinculada (nome, endereço, contato)
- Série/etapa vinculada
- Lista completa de alunos matriculados
- Lista de professores e auxiliares
- Estatísticas (total alunos, vagas disponíveis, taxa ocupação)

**Uso:**
Use este endpoint para exibir detalhes completos de uma turma, incluindo alunos e professores.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Turma encontrada",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string", example: "5º Ano A" },
              turno: { type: "string", example: "MATUTINO" },
              anoLetivo: { type: "integer", example: 2026 },
              capacidadeMaxima: { type: "integer", example: 25 },
              limitePCD: { type: "integer", example: 3 },
              ativo: { type: "boolean" },
              escola: { type: "object" },
              serie: { type: "object" },
              matriculas: { type: "array" },
              professores: { type: "array" },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: {
            description: "Erro ao buscar turma",
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
        const turma = await turmaService.findById(id);

        if (!turma) {
          return reply.status(404).send({ error: "Turma não encontrada" });
        }

        return reply.send(turma);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar turma";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar estatísticas da turma
  app.get(
    "/:id/estatisticas",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Obter estatísticas da turma",
        description: `
Retorna estatísticas detalhadas sobre uma turma específica.

**Estatísticas incluem:**
- Total de alunos matriculados
- Distribuição por gênero (masculino/feminino)
- Quantidade de alunos PCD
- Idade média dos alunos
- Vagas disponíveis vs ocupadas
- Taxa de ocupação (%)
- Frequência média da turma
- Desempenho acadêmico médio

**Uso:**
Ideal para dashboards e relatórios gerenciais.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Estatísticas da turma",
            type: "object",
            properties: {
              totalAlunos: { type: "integer", example: 22 },
              capacidadeMaxima: { type: "integer", example: 25 },
              vagasDisponiveis: { type: "integer", example: 3 },
              taxaOcupacao: { type: "number", example: 88.0 },
              distribuicaoGenero: {
                type: "object",
                properties: {
                  masculino: { type: "integer" },
                  feminino: { type: "integer" },
                },
              },
              alunosPCD: { type: "integer" },
              idadeMedia: { type: "number" },
              frequenciaMedia: { type: "number" },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: {
            description: "Erro ao buscar estatísticas",
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
        const estatisticas = await turmaService.getEstatisticas(id);

        if (!estatisticas) {
          return reply.status(404).send({ error: "Turma não encontrada" });
        }

        return reply.send(estatisticas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar estatísticas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar turmas por escola
  app.get(
    "/escola/:escolaId",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Listar turmas por escola",
        description: `
Lista todas as turmas de uma escola específica.

**Filtros disponíveis:**
- \`anoLetivo\`: Filtrar por ano letivo (opcional)

**Uso:**
Use este endpoint para exibir todas as turmas de uma escola na interface de gestão escolar.

**Ordenação:**
Turmas são ordenadas por série e nome automaticamente.
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
        querystring: {
          type: "object",
          properties: {
            anoLetivo: {
              type: "string",
              description: "Filtrar por ano letivo",
              example: "2026",
            },
          },
        },
        response: {
          200: {
            description: "Lista de turmas da escola",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                nome: { type: "string" },
                turno: { type: "string" },
                anoLetivo: { type: "integer" },
                serie: { type: "object" },
                _count: {
                  type: "object",
                  properties: {
                    matriculas: { type: "integer" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: {
            description: "Erro ao buscar turmas",
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
        Params: { escolaId: string };
        Querystring: { anoLetivo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;
        const { anoLetivo } = request.query;
        const turmas = await turmaService.findByEscola(
          escolaId,
          anoLetivo ? parseInt(anoLetivo) : undefined
        );
        return reply.send(turmas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar turmas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar turma
  app.post("/", {
    schema: {
      tags: ["Turmas"],
      summary: "Criar nova turma",
      description: `
Cria uma nova turma no sistema.

**Campos obrigatórios:**
- \`nome\`: Nome da turma (ex: "5º Ano A")
- \`turno\`: MATUTINO | VESPERTINO | NOTURNO | INTEGRAL
- \`anoLetivo\`: Ano letivo (ex: 2026)
- \`escolaId\`: ID da escola
- \`serieId\`: ID da série/etapa

**Campos opcionais:**
- \`capacidadeMaxima\`: Limite de alunos (padrão: 25)
- \`limitePCD\`: Vagas reservadas para PCD (padrão: 3)
- \`ativo\`: Status ativo/inativo (padrão: true)

**Regras de negócio:**
- O nome deve ser único dentro da escola para o mesmo ano letivo
- Capacidade máxima deve ser positiva
- Limite PCD não pode exceder capacidade máxima
        `,
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["nome", "turno", "anoLetivo", "escolaId", "serieId"],
        properties: {
          nome: {
            type: "string",
            minLength: 1,
            description: "Nome da turma",
            example: "5º Ano A",
          },
          turno: {
            type: "string",
            enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"],
            description: "Turno da turma",
            example: "MATUTINO",
          },
          anoLetivo: {
            type: "integer",
            minimum: 2020,
            maximum: 2100,
            description: "Ano letivo",
            example: 2026,
          },
          capacidadeMaxima: {
            type: "integer",
            minimum: 1,
            default: 25,
            description: "Capacidade máxima de alunos",
            example: 25,
          },
          limitePCD: {
            type: "integer",
            minimum: 0,
            default: 3,
            description: "Vagas reservadas para PCD",
            example: 3,
          },
          escolaId: {
            type: "string",
            description: "ID da escola",
            example: "clx1234567890",
          },
          serieId: {
            type: "string",
            description: "ID da série/etapa",
            example: "clx0987654321",
          },
          ativo: {
            type: "boolean",
            default: true,
            description: "Status da turma",
            example: true,
          },
        },
      },
      response: {
        201: {
          description: "Turma criada com sucesso",
          type: "object",
          properties: {
            id: { type: "string" },
            nome: { type: "string" },
            turno: { type: "string" },
            anoLetivo: { type: "integer" },
            capacidadeMaxima: { type: "integer" },
            limitePCD: { type: "integer" },
            ativo: { type: "boolean" },
            escolaId: { type: "string" },
            serieId: { type: "string" },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createTurmaSchema.parse(request.body);
      const turma = await turmaService.create(data);
      return reply.status(201).send(turma);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar turma";
      return reply.status(400).send({ error: message });
    }
  });

  // Atualizar turma
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Atualizar turma",
        description: `
Atualiza os dados de uma turma existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os campos que deseja atualizar.

**Validações:**
- Se alterar capacidade, não pode ser menor que o número atual de alunos
- Limite PCD não pode exceder nova capacidade
- Nome deve permanecer único na escola

**Observação:**
Para adicionar/remover alunos ou professores, use os endpoints específicos.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            nome: { type: "string", example: "5º Ano B" },
            turno: {
              type: "string",
              enum: ["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"],
            },
            anoLetivo: { type: "integer", minimum: 2020, maximum: 2100 },
            capacidadeMaxima: { type: "integer", minimum: 1 },
            limitePCD: { type: "integer", minimum: 0 },
            escolaId: { type: "string" },
            serieId: { type: "string" },
            ativo: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Turma atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              turno: { type: "string" },
              anoLetivo: { type: "integer" },
              capacidadeMaxima: { type: "integer" },
              limitePCD: { type: "integer" },
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
        const data = updateTurmaSchema.parse(request.body);
        const turma = await turmaService.update(id, data);
        return reply.send(turma);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar turma
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Deletar turma",
        description: `
Remove uma turma do sistema.

**⚠️ Atenção:**
- Não é possível deletar turmas com alunos matriculados
- Não é possível deletar turmas com registros de frequência
- Não é possível deletar turmas com notas lançadas

**Recomendação:**
Em vez de deletar, considere desativar a turma (campo \`ativo: false\`).

**Efeitos:**
- Remove todos os vínculos com professores
- Remove a turma permanentemente do banco de dados
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        response: {
          204: {
            description: "Turma deletada com sucesso",
          },
          400: {
            description: "Não é possível deletar (possui dependências)",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Não é possível deletar turma com alunos matriculados",
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
        await turmaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar aluno à turma
  app.post(
    "/:id/alunos",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Adicionar aluno à turma",
        description: `
Vincula um aluno (matrícula) a uma turma.

**Validações:**
- A matrícula deve existir e estar ativa
- A turma não pode estar com vagas esgotadas
- O aluno não pode estar em outra turma do mesmo ano letivo
- Se aluno é PCD, verifica limite de vagas PCD

**Efeitos:**
- Atualiza o campo \`turmaId\` da matrícula
- Incrementa contador de alunos da turma
- Registra histórico de movimentação
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["matriculaId"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula do aluno",
              example: "clx0987654321",
            },
          },
        },
        response: {
          201: {
            description: "Aluno adicionado à turma com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              turmaId: { type: "string" },
              aluno: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  dataNascimento: { type: "string" },
                },
              },
            },
          },
          400: {
            description: "Erro de validação",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Turma sem vagas disponíveis",
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
        const data = addAlunoTurmaSchema.parse(request.body);
        const matricula = await turmaService.addAluno(id, data.matriculaId);
        return reply.status(201).send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar aluno";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover aluno da turma
  app.delete(
    "/:id/alunos/:matriculaId",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Remover aluno da turma",
        description: `
Remove o vínculo de um aluno com a turma.

**Uso:**
- Transferência de aluno para outra turma
- Correção de matrícula incorreta
- Remanejamento de turmas

**Efeitos:**
- Remove o campo \`turmaId\` da matrícula
- Decrementa contador de alunos da turma
- Libera vaga para novos alunos

**Observação:**
O aluno não é excluído do sistema, apenas desvinculado da turma.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "matriculaId"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
            matriculaId: {
              type: "string",
              description: "ID da matrícula",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Aluno removido da turma com sucesso",
          },
          400: {
            description: "Erro ao remover aluno",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, matriculaId } = request.params;
        await turmaService.removeAluno(id, matriculaId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover aluno";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar professor à turma
  app.post(
    "/:id/professores",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Adicionar professor à turma",
        description: `
Vincula um professor ou auxiliar a uma turma.

**Tipos de vínculo:**
- \`PROFESSOR\`: Professor regente da turma
- \`AUXILIAR\`: Professor auxiliar ou estagiário

**Campos opcionais:**
- \`disciplina\`: Nome da disciplina (para professores específicos)

**Validações:**
- O profissional deve existir no sistema
- O profissional deve ter cargo compatível (PROFESSOR ou AUXILIAR)
- Não é possível adicionar o mesmo profissional duas vezes na mesma turma

**Uso:**
- Atribuição de professores no início do ano letivo
- Substituição de professores
- Adição de professores auxiliares
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          required: ["profissionalId", "tipo"],
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional",
              example: "clx0987654321",
            },
            tipo: {
              type: "string",
              enum: ["PROFESSOR", "AUXILIAR"],
              description: "Tipo de vínculo",
              example: "PROFESSOR",
            },
            disciplina: {
              type: "string",
              description: "Nome da disciplina (opcional)",
              example: "Matemática",
            },
          },
        },
        response: {
          201: {
            description: "Professor adicionado à turma com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              profissionalId: { type: "string" },
              turmaId: { type: "string" },
              tipo: { type: "string" },
              disciplina: { type: "string" },
              profissional: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  cargo: { type: "string" },
                },
              },
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
        const data = addProfessorTurmaSchema.parse(request.body);
        const professor = await turmaService.addProfessor(
          id,
          data.profissionalId,
          data.tipo,
          data.disciplina
        );
        return reply.status(201).send(professor);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao adicionar professor";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover professor da turma
  app.delete(
    "/:id/professores/:profissionalId",
    {
      schema: {
        tags: ["Turmas"],
        summary: "Remover professor da turma",
        description: `
Remove o vínculo de um professor com a turma.

**Uso:**
- Substituição de professor
- Fim de contrato temporário
- Remanejamento de professores

**Efeitos:**
- Remove o vínculo ProfessorTurma
- Não afeta outros dados do profissional
- Não afeta turma ou alunos

**Observação:**
O professor não é excluído do sistema, apenas desvinculado da turma específica.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "profissionalId"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
            profissionalId: {
              type: "string",
              description: "ID do profissional",
              example: "clx0987654321",
            },
          },
        },
        response: {
          204: {
            description: "Professor removido da turma com sucesso",
          },
          400: {
            description: "Erro ao remover professor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string; profissionalId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, profissionalId } = request.params;
        await turmaService.removeProfessor(id, profissionalId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover professor";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
