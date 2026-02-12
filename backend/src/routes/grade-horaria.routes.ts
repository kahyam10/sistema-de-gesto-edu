import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { gradeHorariaService } from "../services/grade-horaria.service.js";
import {
  createGradeHorarioSchema,
  updateGradeHorarioSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface GradeHorarioFilters {
  turmaId?: string;
  profissionalId?: string;
}

const isHorarioValido = (inicio: string, fim: string) => {
  if (!inicio || !fim) return false;
  return inicio < fim;
};

export async function gradeHorariaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Relatório de carga horária por profissional
  app.get(
    "/relatorios/carga",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Relatório de carga horária por profissional",
        description: `
Gera um relatório consolidado da carga horária dos profissionais.

**Funcionalidades:**
- Sem filtro: retorna carga horária de todos os profissionais
- Com \`profissionalId\`: retorna carga horária de um profissional específico
- Calcula total de horas semanais por disciplina e turma
- Agrupa informações por profissional

**Permissões:**
- Requer autenticação (Bearer token)
- Útil para gestão pedagógica e controle de carga horária
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional para filtrar carga horária",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Relatório de carga horária gerado com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                profissionalId: { type: "string" },
                profissionalNome: { type: "string" },
                totalHorasSemanais: { type: "number" },
                disciplinas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      disciplina: { type: "string" },
                      horas: { type: "number" },
                      turmas: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
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
      request: FastifyRequest<{ Querystring: { profissionalId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId } = request.query;
        const resumo = await gradeHorariaService.getCargaResumo(profissionalId);
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de carga horária";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Relatório de carga horária por escola
  app.get(
    "/relatorios/escola",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Relatório de carga horária por escola",
        description: `
Gera um relatório consolidado da carga horária organizado por escola.

**Funcionalidades:**
- Retorna a distribuição de carga horária agrupada por escola
- Mostra total de turmas e profissionais por escola
- Útil para gestão de recursos educacionais
- Permite visão macro da alocação de professores

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado para gestores e coordenação SEMEC
        `,
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Relatório por escola gerado com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                escolaId: { type: "string" },
                escolaNome: { type: "string" },
                totalTurmas: { type: "number" },
                totalProfissionais: { type: "number" },
                totalHorasSemanais: { type: "number" },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
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
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const resumo = await gradeHorariaService.getCargaResumoPorEscola();
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório por escola";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Relatório de carga horária por turma
  app.get(
    "/relatorios/turma",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Relatório de carga horária por turma",
        description: `
Gera um relatório consolidado da carga horária organizado por turma.

**Funcionalidades:**
- Retorna a distribuição de carga horária agrupada por turma
- Mostra disciplinas e profissionais alocados em cada turma
- Calcula total de horas semanais por turma
- Útil para balanceamento de grade curricular

**Permissões:**
- Requer autenticação (Bearer token)
- Útil para coordenação pedagógica e diretores
        `,
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Relatório por turma gerado com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                turmaId: { type: "string" },
                turmaNome: { type: "string" },
                escolaNome: { type: "string" },
                totalDisciplinas: { type: "number" },
                totalHorasSemanais: { type: "number" },
                disciplinas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      disciplina: { type: "string" },
                      horas: { type: "number" },
                      profissional: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
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
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const resumo = await gradeHorariaService.getCargaResumoPorTurma();
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório por turma";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Listar grade horária
  app.get(
    "/",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Listar grade horária",
        description: `
Lista todos os horários da grade com filtros opcionais.

**Filtros disponíveis:**
- \`turmaId\`: Filtrar horários de uma turma específica
- \`profissionalId\`: Filtrar horários de um profissional específico
- Sem filtros: retorna todos os horários do sistema

**Informações retornadas:**
- Dia da semana, horário de início e fim
- Disciplina e turma associada
- Profissional responsável (se houver)
- Observações adicionais

**Permissões:**
- Requer autenticação (Bearer token)
- Todos os usuários autenticados podem visualizar
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            turmaId: {
              type: "string",
              description: "Filtrar por turma específica",
              example: "clx1234567890",
            },
            profissionalId: {
              type: "string",
              description: "Filtrar por profissional específico",
              example: "clx0987654321",
            },
          },
        },
        response: {
          200: {
            description: "Lista de horários da grade",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                turmaId: { type: "string" },
                diaSemana: {
                  type: "string",
                  enum: ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"],
                },
                horaInicio: { type: "string", example: "08:00" },
                horaFim: { type: "string", example: "09:00" },
                disciplina: { type: "string" },
                profissionalId: { type: "string" },
                observacoes: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          500: {
            description: "Erro ao listar grade",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: GradeHorarioFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId } = request.query;
        const { profissionalId } = request.query;
        const horarios = await gradeHorariaService.findAll(
          turmaId || profissionalId ? { turmaId, profissionalId } : undefined
        );
        return reply.send(horarios);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar grade horária";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Buscar horário por ID",
        description: `
Retorna os detalhes completos de um horário específico da grade.

**Informações retornadas:**
- Dados completos do horário
- Informações da turma associada
- Dados do profissional (se vinculado)
- Disciplina e observações

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
              description: "ID do horário na grade",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Horário encontrado",
            type: "object",
            properties: {
              id: { type: "string" },
              turmaId: { type: "string" },
              diaSemana: { type: "string" },
              horaInicio: { type: "string" },
              horaFim: { type: "string" },
              disciplina: { type: "string" },
              profissionalId: { type: "string" },
              observacoes: { type: "string" },
              turma: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                  turno: { type: "string" },
                },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          404: {
            description: "Horário não encontrado",
            type: "object",
            properties: {
              error: { type: "string", example: "Horário não encontrado" },
            },
          },
          500: {
            description: "Erro interno do servidor",
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
        const horario = await gradeHorariaService.findById(id);
        if (!horario) {
          return reply.status(404).send({ error: "Horário não encontrado" });
        }
        return reply.send(horario);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar horário";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar horário
  app.post(
    "/",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Criar novo horário na grade",
        description: `
Cria um novo horário na grade horária de uma turma.

**Validações automáticas:**
- Hora inicial deve ser menor que hora final
- Detecta conflitos de horário para o mesmo profissional
- Não permite sobreposição de horários no mesmo dia

**Campos obrigatórios:**
- \`turmaId\`: ID da turma
- \`diaSemana\`: Dia da semana (SEGUNDA a SABADO)
- \`horaInicio\`: Horário de início (formato HH:MM)
- \`horaFim\`: Horário de fim (formato HH:MM)
- \`disciplina\`: Nome da disciplina

**Campos opcionais:**
- \`profissionalId\`: Professor responsável
- \`observacoes\`: Anotações adicionais

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado para coordenadores e diretores
        `,
        security: [{ bearerAuth: [] }],
        body: {
          $ref: "#/components/schemas/CreateGradeHorario",
        },
        response: {
          201: {
            description: "Horário criado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              turmaId: { type: "string" },
              diaSemana: { type: "string" },
              horaInicio: { type: "string" },
              horaFim: { type: "string" },
              disciplina: { type: "string" },
              profissionalId: { type: "string" },
              observacoes: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Horário inválido: hora inicial deve ser menor que hora final",
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          409: {
            description: "Conflito de horário",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Conflito de horário para este profissional",
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createGradeHorarioSchema.parse(request.body);

        if (!isHorarioValido(data.horaInicio, data.horaFim)) {
          return reply.status(400).send({
            error: "Horário inválido: hora inicial deve ser menor que hora final",
          });
        }

        if (data.profissionalId) {
          const conflito = await gradeHorariaService.findAll({
            profissionalId: data.profissionalId,
          });

          const conflitoMesmoDia = conflito.some((item: {
            id: string;
            diaSemana: string;
            horaInicio: string;
            horaFim: string;
          }) => {
            if (item.diaSemana !== data.diaSemana) return false;
            return (
              data.horaInicio < item.horaFim && data.horaFim > item.horaInicio
            );
          });

          if (conflitoMesmoDia) {
            return reply.status(409).send({
              error: "Conflito de horário para este profissional",
            });
          }
        }

        const horario = await gradeHorariaService.create(data);
        return reply.status(201).send(horario);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar horário";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar horário
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Atualizar horário existente",
        description: `
Atualiza um horário existente na grade horária.

**Validações automáticas:**
- Se alterar horários: hora inicial deve ser menor que hora final
- Detecta conflitos com outros horários do mesmo profissional
- Ignora o próprio horário na detecção de conflitos

**Campos editáveis:**
- Todos os campos podem ser atualizados parcialmente
- Apenas os campos enviados serão modificados

**Casos de uso:**
- Alterar horário de uma aula
- Trocar profissional de uma disciplina
- Ajustar observações

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado para coordenadores e diretores
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do horário a ser atualizado",
              example: "clx1234567890",
            },
          },
        },
        body: {
          $ref: "#/components/schemas/UpdateGradeHorario",
        },
        response: {
          200: {
            description: "Horário atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              turmaId: { type: "string" },
              diaSemana: { type: "string" },
              horaInicio: { type: "string" },
              horaFim: { type: "string" },
              disciplina: { type: "string" },
              profissionalId: { type: "string" },
              observacoes: { type: "string" },
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
          409: {
            description: "Conflito de horário",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Conflito de horário para este profissional",
              },
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
        const data = updateGradeHorarioSchema.parse(request.body);

        if (data.horaInicio && data.horaFim && !isHorarioValido(data.horaInicio, data.horaFim)) {
          return reply.status(400).send({
            error: "Horário inválido: hora inicial deve ser menor que hora final",
          });
        }

        if (data.profissionalId && data.diaSemana && data.horaInicio && data.horaFim) {
          const conflito = await gradeHorariaService.findAll({
            profissionalId: data.profissionalId,
          });

          const conflitoMesmoDia = conflito.some((item: {
            id: string;
            diaSemana: string;
            horaInicio: string;
            horaFim: string;
          }) => {
            if (item.id === id) return false;
            if (item.diaSemana !== data.diaSemana) return false;
            return (
              data.horaInicio! < item.horaFim && data.horaFim! > item.horaInicio
            );
          });

          if (conflitoMesmoDia) {
            return reply.status(409).send({
              error: "Conflito de horário para este profissional",
            });
          }
        }

        const horario = await gradeHorariaService.update(id, data);
        return reply.send(horario);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar horário";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar horário
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Grade Horária"],
        summary: "Deletar horário da grade",
        description: `
Remove um horário da grade horária.

**Atenção:**
- Esta operação é irreversível
- Remove permanentemente o horário do banco de dados
- Não afeta registros históricos de frequência ou notas

**Casos de uso:**
- Remover aula cancelada permanentemente
- Corrigir erro de cadastro
- Reorganizar grade horária

**Permissões:**
- Requer autenticação (Bearer token)
- Indicado para coordenadores e diretores
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do horário a ser deletado",
              example: "clx1234567890",
            },
          },
        },
        response: {
          204: {
            description: "Horário deletado com sucesso (sem conteúdo)",
            type: "null",
          },
          400: {
            description: "Erro ao deletar horário",
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
        await gradeHorariaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao deletar horário";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
