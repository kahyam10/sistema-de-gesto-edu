import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { frequenciaService } from "../services/index.js";
import {
  createFrequenciaSchema,
  updateFrequenciaSchema,
  registrarFrequenciaTurmaSchema,
  consultaListaSchema,
  dataTextoSchema,
  chamadaDoDiaQuerySchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { profissionalDoUsuario } from "../lib/propriedade-professor.js";

// Campos de um registro de frequência na resposta da lista. Anuláveis como
// ["string","null"]: com "string" o serializador trocaria null por "".
const REGISTRO_FREQUENCIA = {
  type: "object",
  properties: {
    id: { type: "string" },
    matriculaId: { type: "string" },
    turmaId: { type: "string" },
    data: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["PRESENTE", "FALTA", "JUSTIFICADA"] },
    justificativa: { type: ["string", "null"] },
    observacao: { type: ["string", "null"] },
    // Frequência por aula: aula da grade (null = chamada diária ou aula
    // removida da grade), cópia da disciplina/horário e a chave da aula
    gradeHorariaId: { type: ["string", "null"] },
    disciplina: { type: ["string", "null"] },
    horaInicio: { type: ["string", "null"] },
    aulaChave: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    matricula: {
      type: "object",
      properties: {
        id: { type: "string" },
        numeroMatricula: { type: "string" },
        nomeAluno: { type: "string" },
      },
    },
    turma: {
      type: "object",
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
        serie: { type: "object", properties: { nome: { type: "string" } } },
      },
    },
  },
} as const;

export async function frequenciaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  // Lista frequências com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Listar frequências",
        description: `
Lista registros de frequência com suporte a filtros e paginação.

**Filtros disponíveis:**
- \`turmaId\`: Filtrar por turma específica
- \`matriculaId\`: Filtrar por aluno específico
- \`dataInicio\`: Data inicial do período (formato: YYYY-MM-DD)
- \`dataFim\`: Data final do período (formato: YYYY-MM-DD)

**Paginação:**
- Envie \`page\` e \`limit\` para retornar resultado paginado
- Sem paginação: retorna array direto de frequências
- Com paginação: retorna objeto com \`data\` e \`pagination\`

**Retorno inclui:**
- Dados do registro de frequência
- Status (PRESENTE, FALTA, JUSTIFICADA)
- Data do registro
- Justificativa (se houver)
- Informações do aluno e turma
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
            matriculaId: {
              type: "string",
              description: "Filtrar por ID da matrícula",
              example: "clx0987654321",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial do período",
              example: "2026-01-01",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final do período",
              example: "2026-12-31",
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
            description: "Lista de frequências (paginada ou completa)",
            oneOf: [
              {
                type: "array",
                items: REGISTRO_FREQUENCIA,
              },
              {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { type: "object" },
                  },
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
            description: "Erro ao listar frequências",
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
        Querystring: {
          turmaId?: string;
          matriculaId?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, matriculaId } = request.query;
        const consulta = consultaListaSchema.parse(request.query);

        const params: NonNullable<Parameters<typeof frequenciaService.listPaginated>[0]> = {};
        if (turmaId) params.turmaId = turmaId;
        if (matriculaId) params.matriculaId = matriculaId;
        if (consulta.dataInicio) params.dataInicio = consulta.dataInicio;
        if (consulta.dataFim) params.dataFim = consulta.dataFim;

        if (consulta.page && consulta.limit) {
          const result = await frequenciaService.listPaginated(params, {
            page: consulta.page,
            limit: consulta.limit,
          });
          return reply.send(result);
        }

        const frequencias = await frequenciaService.list(params);
        return reply.send(frequencias);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Busca frequência por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Obter frequência por ID",
        description: `
Retorna os detalhes de um registro de frequência específico.

**Informações retornadas:**
- ID do registro
- Matrícula e turma vinculadas
- Data da frequência
- Status (PRESENTE, FALTA, JUSTIFICADA)
- Justificativa e observações
- Dados do aluno
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do registro de frequência",
              example: "clx1234567890",
            },
          },
        },
        response: {
          // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          404: {
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
            description: "Erro ao buscar frequência",
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
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const frequencia = await frequenciaService.findById(id);

        if (!frequencia) {
          return reply.status(404).send({ error: "Frequência não encontrada" });
        }

        return reply.send(frequencia);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Cria um registro de frequência
  app.post(
    "/",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Criar registro de frequência",
        description: `
Cria um novo registro de frequência para um aluno.

**Campos obrigatórios:**
- \`matriculaId\`: ID da matrícula do aluno
- \`turmaId\`: ID da turma
- \`data\`: Data da frequência (formato: YYYY-MM-DD)
- \`status\`: PRESENTE | FALTA | JUSTIFICADA

**Campos opcionais:**
- \`justificativa\`: Justificativa para falta justificada
- \`observacao\`: Observações adicionais

**Regras de negócio:**
- Não permite registrar frequência duplicada (mesma matrícula, turma e data)
- Status JUSTIFICADA requer justificativa
- Data não pode ser futura
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["matriculaId", "turmaId", "data", "status"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula",
              example: "clx1234567890",
            },
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx0987654321",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data da frequência",
              example: "2026-02-12",
            },
            status: {
              type: "string",
              enum: ["PRESENTE", "FALTA", "JUSTIFICADA"],
              description: "Status da frequência",
              example: "PRESENTE",
            },
            justificativa: {
              type: "string",
              description: "Justificativa para falta",
              example: "Atestado médico",
            },
            observacao: {
              type: "string",
              description: "Observações adicionais",
            },
            gradeHorariaId: {
              type: "string",
              description: "Aula da grade (obrigatória se a turma tem aulas no dia da semana)",
            },
          },
        },
        response: {
          // 201 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
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
    async (
      request: FastifyRequest<{
        Body: {
          matriculaId: string;
          turmaId: string;
          data: string;
          status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
          justificativa?: string;
          observacao?: string;
          gradeHorariaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const body = createFrequenciaSchema.parse(request.body);
        const frequencia = await frequenciaService.create(body);

        return reply.status(201).send(frequencia);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Registra frequência para turma completa
  app.post(
    "/turma",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Registrar frequência da turma completa",
        description: `
Registra frequência de múltiplos alunos de uma turma de uma só vez.

**Campos obrigatórios:**
- \`turmaId\`: ID da turma
- \`data\`: Data da frequência (formato: YYYY-MM-DD)
- \`presencas\`: Array com presença de cada aluno

**Estrutura de presença:**
- \`matriculaId\`: ID da matrícula do aluno
- \`status\`: PRESENTE | FALTA | JUSTIFICADA
- \`justificativa\`: Justificativa (opcional)
- \`observacao\`: Observações (opcional)

**Frequência por aula:**
- Turma com aulas na grade no dia da semana: informe \`gradeHorariaId\` (a aula); cada aula tem a própria chamada
- Turma sem grade no dia (ex.: Educação Infantil): chamada diária, sem \`gradeHorariaId\`
- Misturar é recusado (400). Professor só lança aulas em que é o professor da grade (ou sem professor definido)

**Uso:**
Permite registrar todos os alunos de uma vez.

**Regras:**
- Não permite registros duplicados
- Atualiza registros existentes se houver
- Retorna resumo com total de presentes, faltas e justificadas
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["turmaId", "data", "presencas"],
          properties: {
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data da frequência",
              example: "2026-02-12",
            },
            gradeHorariaId: {
              type: "string",
              description: "Aula da grade (obrigatória se a turma tem aulas no dia da semana)",
            },
            presencas: {
              type: "array",
              description: "Lista de presença dos alunos",
              items: {
                type: "object",
                required: ["matriculaId", "status"],
                properties: {
                  matriculaId: {
                    type: "string",
                    example: "clx0987654321",
                  },
                  status: {
                    type: "string",
                    enum: ["PRESENTE", "FALTA", "JUSTIFICADA"],
                    example: "PRESENTE",
                  },
                  justificativa: { type: "string" },
                  observacao: { type: "string" },
                },
              },
            },
          },
        },
        response: {
          // 201 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
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
    async (
      request: FastifyRequest<{
        Body: {
          turmaId: string;
          data: string;
          gradeHorariaId?: string;
          presencas: Array<{
            matriculaId: string;
            status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
            justificativa?: string;
            observacao?: string;
          }>;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, data, gradeHorariaId, presencas } = registrarFrequenciaTurmaSchema.parse(request.body);
        const resultado = await frequenciaService.registrarTurma({
          turmaId,
          data,
          gradeHorariaId,
          presencas,
        });

        return reply.status(201).send(resultado);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualiza um registro de frequência
  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Atualizar registro de frequência",
        description: `
Atualiza um registro de frequência existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os que deseja atualizar.

**Uso comum:**
- Corrigir status de presença
- Adicionar/atualizar justificativa
- Incluir observações

**Validação:**
- Status JUSTIFICADA requer justificativa
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do registro de frequência",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["PRESENTE", "FALTA", "JUSTIFICADA"],
              description: "Novo status",
            },
            justificativa: {
              type: "string",
              description: "Justificativa",
            },
            observacao: {
              type: "string",
              description: "Observações",
            },
          },
        },
        response: {
          // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
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
          status?: "PRESENTE" | "FALTA" | "JUSTIFICADA";
          justificativa?: string;
          observacao?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateFrequenciaSchema.parse(request.body);
        const frequencia = await frequenciaService.update(id, body);

        return reply.send(frequencia);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Remove um registro de frequência
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Deletar registro de frequência",
        description: `
Remove um registro de frequência do sistema.

**⚠️ Atenção:**
Remove permanentemente o registro. Esta ação não pode ser desfeita.

**Recomendação:**
Considere atualizar o status em vez de deletar para manter histórico.

**Uso:**
- Correção de registro duplicado
- Registro criado por engano
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do registro de frequência",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Frequência removida com sucesso",
            type: "object",
            properties: {
              message: { type: "string", example: "Frequência removida com sucesso" },
            },
          },
          400: {
            description: "Erro ao remover frequência",
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
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await frequenciaService.delete(id);

        return reply.send({ message: "Frequência removida com sucesso" });
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Calcula estatísticas de frequência
  app.get(
    "/estatisticas/:matriculaId/:turmaId",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Calcular estatísticas de frequência",
        description: `
Calcula estatísticas de frequência de um aluno em uma turma.

**Informações retornadas:**
- Total de aulas no período
- Presenças, faltas e faltas justificadas
- Percentual de frequência
- Percentual de faltas
- Status (aprovado/reprovado por frequência)

**Filtros opcionais:**
- \`dataInicio\`: Data inicial (formato: YYYY-MM-DD)
- \`dataFim\`: Data final (formato: YYYY-MM-DD)

**Observação:**
Sem filtros de data, considera todo o ano letivo.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["matriculaId", "turmaId"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula",
              example: "clx1234567890",
            },
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx0987654321",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial",
              example: "2026-01-01",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final",
              example: "2026-12-31",
            },
          },
        },
        response: {
          // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
            description: "Erro ao calcular estatísticas",
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
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string; turmaId: string };
        Querystring: {
          dataInicio?: string;
          dataFim?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, turmaId } = request.params;
        const consulta = consultaListaSchema.parse(request.query);

        const estatisticas = await frequenciaService.calcularEstatisticas(
          matriculaId,
          turmaId,
          consulta.dataInicio,
          consulta.dataFim
        );

        return reply.send(estatisticas);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Lista alunos com baixa frequência
  app.get(
    "/turma/:turmaId/baixa-frequencia",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Listar alunos com baixa frequência",
        description: `
Identifica alunos de uma turma com frequência abaixo do mínimo exigido (75%).

**Informações retornadas:**
- Dados do aluno
- Percentual de frequência
- Total de faltas
- Status de risco

**Filtros opcionais:**
- \`dataInicio\`: Data inicial do período
- \`dataFim\`: Data final do período

**Uso:**
Ideal para identificar alunos em risco de reprovação por frequência e acionar intervenções pedagógicas.

**Ordenação:**
Alunos ordenados por percentual de frequência (menor primeiro).
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["turmaId"],
          properties: {
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial",
              example: "2026-01-01",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final",
              example: "2026-12-31",
            },
          },
        },
        response: {
          // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
            description: "Erro ao listar alunos",
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
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { turmaId: string };
        Querystring: {
          dataInicio?: string;
          dataFim?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId } = request.params;
        const consulta = consultaListaSchema.parse(request.query);

        const alunos = await frequenciaService.listarAlunosComBaixaFrequencia(
          turmaId,
          consulta.dataInicio,
          consulta.dataFim
        );

        return reply.send(alunos);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Resumo de frequência de todos os alunos da turma
  app.get(
    "/turma/:turmaId/resumo",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Resumo de frequência da turma",
        description: `
Gera resumo consolidado de frequência de todos os alunos da turma.

**Informações retornadas:**
- Lista com estatísticas de cada aluno
- Média de frequência da turma
- Total de alunos com baixa frequência
- Comparativo geral

**Filtros opcionais:**
- \`dataInicio\`: Data inicial do período
- \`dataFim\`: Data final do período

**Uso:**
Ideal para relatórios gerenciais e acompanhamento da turma como um todo.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["turmaId"],
          properties: {
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial",
              example: "2026-01-01",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final",
              example: "2026-12-31",
            },
          },
        },
        response: {
          // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
            description: "Erro ao gerar resumo",
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
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { turmaId: string };
        Querystring: {
          dataInicio?: string;
          dataFim?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId } = request.params;
        const consulta = consultaListaSchema.parse(request.query);

        const resumo = await frequenciaService.getResumoTurma(
          turmaId,
          consulta.dataInicio,
          consulta.dataFim
        );

        return reply.send(resumo);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Busca frequência por data específica de uma turma
  app.get(
    "/turma/:turmaId/data/:data",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Buscar frequência por data",
        description: `
Retorna todos os registros de frequência de uma turma em uma data específica.

**Informações retornadas:**
- Lista completa de frequências do dia
- Dados de cada aluno
- Status de cada registro
- Justificativas (se houver)

**Frequência por aula:** cada registro traz \`gradeHorariaId\`, \`disciplina\`,
\`horaInicio\` e \`aulaChave\` (id da aula ou "DIA" na chamada diária).
Filtre uma aula com \`?aulaChave=<id da aula>\` (ou \`DIA\`).

**Uso:**
Ideal para visualizar o registro de chamada de um dia específico.
Permite verificar se a frequência já foi registrada para aquela data.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["turmaId", "data"],
          properties: {
            turmaId: {
              type: "string",
              description: "ID da turma",
              example: "clx1234567890",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data da frequência (formato: YYYY-MM-DD)",
              example: "2026-02-12",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            aulaChave: {
              type: "string",
              description: "Só a chamada desta aula (id da aula da grade) ou \"DIA\" (chamada diária)",
            },
          },
        },
        response: {
          // 200 sem schema: o antigo não batia com a resposta e o serializador descartava campos
          400: {
            description: "Erro ao buscar frequências",
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
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { turmaId: string; data: string };
        Querystring: { aulaChave?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, data } = request.params;
        const { aulaChave } = chamadaDoDiaQuerySchema.parse(request.query);
        const frequencias = await frequenciaService.buscarPorData(
          turmaId,
          dataTextoSchema.parse(data),
          aulaChave
        );

        return reply.send(frequencias);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Aulas da grade da turma no dia (frequência por aula)
  app.get(
    "/turma/:turmaId/aulas/:data",
    {
      schema: {
        tags: ["Frequência"],
        summary: "Aulas do dia da turma para a chamada",
        description: `
Lista as aulas da grade da turma no dia da semana da data, com o andamento da
chamada de cada uma.

- \`modo\`: "AULA" (a turma tem grade nesse dia: chamada por aula) ou "DIA"
  (sem grade nesse dia: chamada diária)
- Para PROFESSOR, lista só as aulas dele e as sem professor definido na grade
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["turmaId", "data"],
          properties: {
            turmaId: { type: "string", description: "ID da turma" },
            data: { type: "string", format: "date", description: "Data (AAAA-MM-DD)", example: "2026-02-12" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: { type: "string" },
              diaSemana: { type: "string" },
              modo: { type: "string", enum: ["AULA", "DIA"] },
              aulas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    gradeHorariaId: { type: "string" },
                    disciplina: { type: "string" },
                    horaInicio: { type: "string" },
                    horaFim: { type: "string" },
                    profissional: {
                      anyOf: [
                        { type: "null" },
                        { type: "object", properties: { id: { type: "string" }, nome: { type: "string" } } },
                      ],
                    },
                    totalRegistros: { type: "integer" },
                    registradaEm: { type: ["string", "null"], format: "date-time" },
                  },
                },
              },
              chamadaDiaria: {
                type: "object",
                properties: {
                  totalRegistros: { type: "integer" },
                  registradaEm: { type: ["string", "null"], format: "date-time" },
                },
              },
            },
          },
          400: { description: "Requisição inválida", type: "object", properties: { error: { type: "string" } } },
          401: { description: "Não autorizado", type: "object", properties: { error: { type: "string" } } },
          404: { description: "Turma não encontrada", type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { turmaId: string; data: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, data } = request.params;
        // Professor vê só as próprias aulas (e as sem professor na grade)
        const profissionalId =
          request.user?.role === "PROFESSOR"
            ? (await profissionalDoUsuario(request.user.id)) ?? ""
            : undefined;
        const resultado = await frequenciaService.aulasDoDia(
          turmaId,
          dataTextoSchema.parse(data),
          profissionalId
        );
        return reply.send(resultado);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
