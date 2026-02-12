import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { licencaService } from "../services/index.js";
import {
  createLicencaSchema,
  updateLicencaSchema,
  aprovarLicencaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function licencasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista licenças com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Listar licenças e afastamentos",
        description: `
Lista todas as licenças e afastamentos registrados no sistema.

**Tipos de licença:**
- \`MEDICA\`: Licença médica (atestado)
- \`MATERNIDADE\`: Licença maternidade (120-180 dias)
- \`PATERNIDADE\`: Licença paternidade (5-20 dias)
- \`CASAMENTO\`: Licença por casamento (3 dias)
- \`LUTO\`: Licença por luto (8 dias)
- \`FERIAS\`: Férias regulamentares (30 dias)
- \`OUTRAS\`: Outros tipos de afastamento

**Status:**
- \`PENDENTE\`: Aguardando aprovação
- \`APROVADA\`: Aprovada pela gestão
- \`REJEITADA\`: Rejeitada
- \`CANCELADA\`: Cancelada pelo solicitante
- \`ATIVA\`: Licença em andamento
- \`FINALIZADA\`: Licença concluída

**Filtros disponíveis:**
- \`profissionalId\`: Filtrar por profissional
- \`status\`: Filtrar por status
- \`tipo\`: Filtrar por tipo de licença
- \`dataInicio\` / \`dataFim\`: Filtrar por período
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            status: {
              type: "string",
              enum: ["PENDENTE", "APROVADA", "REJEITADA", "CANCELADA", "ATIVA", "FINALIZADA"],
              description: "Status da licença",
            },
            tipo: {
              type: "string",
              enum: ["MEDICA", "MATERNIDADE", "PATERNIDADE", "CASAMENTO", "LUTO", "FERIAS", "OUTRAS"],
              description: "Tipo de licença",
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
            page: { type: "string", example: "1" },
            limit: { type: "string", example: "20" },
          },
        },
        response: {
          200: {
            description: "Lista de licenças",
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    profissionalId: { type: "string" },
                    profissional: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        cargo: { type: "string" },
                      },
                    },
                    tipo: { type: "string", example: "MEDICA" },
                    status: { type: "string", example: "APROVADA" },
                    dataInicio: { type: "string", format: "date" },
                    dataFim: { type: "string", format: "date" },
                    diasAfastamento: { type: "number", example: 3 },
                    motivo: { type: "string" },
                    documentoUrl: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              pagination: { $ref: "#/components/schemas/PaginationMeta" },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          profissionalId?: string;
          status?: string;
          tipo?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId, status, tipo, dataInicio, dataFim, page, limit } =
          request.query;

        const filters: any = {};
        if (profissionalId) filters.profissionalId = profissionalId;
        if (status) filters.status = status;
        if (tipo) filters.tipo = tipo;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        // Suporte a paginação
        if (page && limit) {
          const result = await licencaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const licencas = await licencaService.findAll(filters);
        return reply.send(licencas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar licenças";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria solicitação de licença
  app.post(
    "/",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Solicitar licença ou afastamento",
        description: `
Cria uma nova solicitação de licença ou afastamento.

**Fluxo:**
1. Profissional solicita a licença com documentação
2. Sistema valida se não há conflito de datas
3. Diretor/RH recebe para aprovação
4. Após aprovação, licença se torna ATIVA no período
5. Ao término, status muda para FINALIZADA

**Documentos obrigatórios:**
- Licença médica: atestado médico (PDF/imagem)
- Maternidade: certidão de nascimento ou atestado
- Outras: documento comprobatório quando aplicável

**Validações automáticas:**
- Verifica sobreposição de datas com outras licenças
- Calcula automaticamente dias corridos
- Valida duração máxima por tipo de licença
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["profissionalId", "tipo", "dataInicio", "dataFim", "motivo"],
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            tipo: {
              type: "string",
              enum: ["MEDICA", "MATERNIDADE", "PATERNIDADE", "CASAMENTO", "LUTO", "FERIAS", "OUTRAS"],
              description: "Tipo de licença",
              example: "MEDICA",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data de início da licença",
              example: "2026-02-15",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data de término da licença",
              example: "2026-02-17",
            },
            motivo: {
              type: "string",
              description: "Motivo detalhado da licença",
              example: "Consulta médica especializada",
            },
            documentoUrl: {
              type: "string",
              description: "URL do documento comprobatório (upload prévio)",
              example: "/uploads/atestado-123.pdf",
            },
            observacoes: {
              type: "string",
              description: "Observações adicionais",
            },
          },
        },
        response: {
          201: {
            description: "Licença solicitada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              profissionalId: { type: "string" },
              tipo: { type: "string" },
              status: { type: "string", example: "PENDENTE" },
              dataInicio: { type: "string", format: "date" },
              dataFim: { type: "string", format: "date" },
              diasAfastamento: { type: "number", example: 3 },
              motivo: { type: "string" },
              message: {
                type: "string",
                example: "Licença solicitada. Aguardando aprovação da direção.",
              },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Dados inválidos ou conflito de datas",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Já existe licença aprovada para este período",
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createLicencaSchema.parse(request.body);
        const licenca = await licencaService.create(body);
        return reply.status(201).send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca licença por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Buscar licença por ID",
        description: `
Retorna os detalhes completos de uma licença específica.

**Inclui:**
- Dados do profissional
- Período e duração
- Motivo e documentação
- Status e histórico de aprovação
- Quem aprovou/rejeitou e quando
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da licença" },
          },
        },
        response: {
          200: {
            description: "Dados da licença",
            type: "object",
            properties: {
              id: { type: "string" },
              profissionalId: { type: "string" },
              profissional: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                  cargo: { type: "string" },
                  matricula: { type: "string" },
                },
              },
              tipo: { type: "string" },
              status: { type: "string" },
              dataInicio: { type: "string", format: "date" },
              dataFim: { type: "string", format: "date" },
              diasAfastamento: { type: "number" },
              motivo: { type: "string" },
              documentoUrl: { type: "string", nullable: true },
              observacoes: { type: "string", nullable: true },
              aprovadoPor: { type: "string", nullable: true },
              dataAprovacao: { type: "string", format: "date-time", nullable: true },
              motivoRejeicao: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const licenca = await licencaService.findById(id);

        if (!licenca) {
          return reply.status(404).send({ error: "Licença não encontrada" });
        }

        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza licença (apenas se pendente)
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Atualizar licença pendente",
        description: `
Atualiza uma solicitação de licença.

**Regras:**
- Apenas licenças com status PENDENTE podem ser editadas
- Licenças aprovadas não podem ser alteradas
- Para alterações após aprovação, cancelar e criar nova

**Campos atualizáveis:**
- Datas de início e fim
- Motivo e documentação
- Observações
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da licença" },
          },
        },
        body: {
          type: "object",
          properties: {
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
            motivo: { type: "string" },
            documentoUrl: { type: "string" },
            observacoes: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Licença atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              dataInicio: { type: "string", format: "date" },
              dataFim: { type: "string", format: "date" },
              diasAfastamento: { type: "number" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Erro ao atualizar",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Apenas licenças pendentes podem ser editadas",
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateLicencaSchema.parse(request.body);
        const licenca = await licencaService.update(id, body);
        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Aprova ou rejeita licença
  app.post(
    "/:id/aprovar",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Aprovar ou rejeitar licença",
        description: `
Aprova ou rejeita uma solicitação de licença.

**Permissões:**
- Diretor: pode aprovar licenças da sua escola
- SEMEC/RH: pode aprovar qualquer licença
- Coordenador: pode aprovar licenças curtas (até 3 dias)

**Ao aprovar:**
- Status muda para APROVADA
- Registra quem aprovou e quando
- Notifica o solicitante
- Se data de início for hoje, status vira ATIVA

**Ao rejeitar:**
- Status muda para REJEITADA
- Obrigatório informar motivo da rejeição
- Notifica o solicitante
- Profissional pode editar e reenviar
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da licença" },
          },
        },
        body: {
          type: "object",
          required: ["aprovado"],
          properties: {
            aprovado: {
              type: "boolean",
              description: "true para aprovar, false para rejeitar",
              example: true,
            },
            motivo: {
              type: "string",
              description: "Motivo da rejeição (obrigatório se aprovado=false)",
              example: "Documentação incompleta",
            },
          },
        },
        response: {
          200: {
            description: "Licença processada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              status: {
                type: "string",
                example: "APROVADA",
                enum: ["APROVADA", "REJEITADA"],
              },
              aprovadoPor: { type: "string" },
              dataAprovacao: { type: "string", format: "date-time" },
              motivoRejeicao: { type: "string", nullable: true },
              message: {
                type: "string",
                example: "Licença aprovada com sucesso",
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = aprovarLicencaSchema.parse(request.body);
        const licenca = await licencaService.aprovar(id, body);
        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao processar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cancela licença
  app.post(
    "/:id/cancelar",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Cancelar licença",
        description: `
Cancela uma licença aprovada ou pendente.

**Cenários de uso:**
- Profissional retorna antes do previsto
- Situação que motivou a licença foi resolvida
- Reagendamento necessário

**Regras:**
- Solicitante pode cancelar licenças PENDENTES
- Apenas diretor/RH pode cancelar licenças APROVADAS
- Licenças FINALIZADAS não podem ser canceladas
- Ação é registrada no histórico

**Efeitos:**
- Status muda para CANCELADA
- Profissional volta a estar disponível
- Não conta para histórico de afastamentos
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da licença" },
          },
        },
        response: {
          200: {
            description: "Licença cancelada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string", example: "CANCELADA" },
              message: { type: "string", example: "Licença cancelada com sucesso" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Erro ao cancelar",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Licenças finalizadas não podem ser canceladas",
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const licenca = await licencaService.cancelar(id);
        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao cancelar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove licença
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Remover licença",
        description: `
Remove permanentemente uma licença do sistema.

**Regras rigorosas:**
- Apenas ADMIN e SEMEC podem remover
- Somente licenças com status PENDENTE ou REJEITADA
- Licenças aprovadas ou ativas NÃO podem ser removidas
- Use cancelamento ao invés de remoção quando possível

**Auditoria:**
- Ação é registrada no log de sistema
- Mantém registro de quem removeu

**Importante:**
- Não é possível desfazer esta ação
- Prefira cancelar licenças ao invés de remover
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID da licença" },
          },
        },
        response: {
          200: {
            description: "Licença removida com sucesso",
            type: "object",
            properties: {
              message: { type: "string", example: "Licença removida com sucesso" },
            },
          },
          400: {
            description: "Erro ao remover",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Licenças aprovadas não podem ser removidas",
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await licencaService.delete(id);
        return reply.send({ message: "Licença removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Licenças ativas
  app.get(
    "/status/ativas",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Listar licenças ativas no momento",
        description: `
Retorna todas as licenças que estão ativas no momento atual.

**Critérios:**
- Status: APROVADA ou ATIVA
- Data de início <= hoje
- Data de fim >= hoje

**Uso:**
- Dashboard de RH (profissionais afastados hoje)
- Relatórios de presença
- Planejamento de substituições
- Controle de equipe disponível

**Exemplo de resposta:**
\`\`\`json
[
  {
    "id": "clx123",
    "profissional": {
      "nome": "Maria Silva",
      "cargo": "Professora"
    },
    "tipo": "MATERNIDADE",
    "dataInicio": "2026-01-15",
    "dataFim": "2026-05-15",
    "diasRestantes": 45
  }
]
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de licenças ativas",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                profissionalId: { type: "string" },
                profissional: {
                  type: "object",
                  properties: {
                    nome: { type: "string" },
                    cargo: { type: "string" },
                    matricula: { type: "string" },
                  },
                },
                tipo: { type: "string" },
                dataInicio: { type: "string", format: "date" },
                dataFim: { type: "string", format: "date" },
                diasRestantes: { type: "number" },
                motivo: { type: "string" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const licencas = await licencaService.findLicencasAtivas();
        return reply.send(licencas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar licenças ativas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Relatório por profissional
  app.get(
    "/relatorio/:profissionalId",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Relatório de licenças por profissional",
        description: `
Gera relatório completo de licenças de um profissional.

**Informações incluídas:**
- Todas as licenças (histórico completo)
- Total de dias afastados por ano
- Total de dias por tipo de licença
- Licenças pendentes de aprovação
- Projeção de retorno (licenças ativas)

**Filtros opcionais:**
- \`anoInicio\`: Ano inicial (padrão: 3 anos atrás)
- \`anoFim\`: Ano final (padrão: ano atual)

**Uso:**
- Avaliação de desempenho
- Análise de absenteísmo
- Planejamento de RH
- Relatórios para auditorias

**Formato de saída:**
\`\`\`json
{
  "profissional": {...},
  "periodo": "2023-2026",
  "totalLicencas": 5,
  "totalDiasAfastado": 45,
  "porTipo": {
    "MEDICA": { "quantidade": 3, "dias": 15 },
    "FERIAS": { "quantidade": 2, "dias": 30 }
  },
  "licencas": [...]
}
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["profissionalId"],
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
          },
        },
        querystring: {
          type: "object",
          properties: {
            anoInicio: {
              type: "string",
              description: "Ano inicial do relatório",
              example: "2023",
              pattern: "^[0-9]{4}$",
            },
            anoFim: {
              type: "string",
              description: "Ano final do relatório",
              example: "2026",
              pattern: "^[0-9]{4}$",
            },
          },
        },
        response: {
          200: {
            description: "Relatório de licenças",
            type: "object",
            properties: {
              profissional: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                  cargo: { type: "string" },
                  matricula: { type: "string" },
                },
              },
              periodo: { type: "string", example: "2023-2026" },
              anoInicio: { type: "number", example: 2023 },
              anoFim: { type: "number", example: 2026 },
              totalLicencas: { type: "number", example: 5 },
              totalDiasAfastado: { type: "number", example: 45 },
              porTipo: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    quantidade: { type: "number" },
                    dias: { type: "number" },
                  },
                },
                example: {
                  MEDICA: { quantidade: 3, dias: 15 },
                  FERIAS: { quantidade: 2, dias: 30 },
                },
              },
              porStatus: {
                type: "object",
                additionalProperties: { type: "number" },
                example: {
                  APROVADA: 3,
                  PENDENTE: 1,
                  FINALIZADA: 1,
                },
              },
              licencas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    tipo: { type: "string" },
                    status: { type: "string" },
                    dataInicio: { type: "string", format: "date" },
                    dataFim: { type: "string", format: "date" },
                    diasAfastamento: { type: "number" },
                    motivo: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "Profissional não encontrado",
            type: "object",
            properties: { error: { type: "string" } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { profissionalId: string };
        Querystring: { anoInicio?: string; anoFim?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId } = request.params;
        const { anoInicio, anoFim } = request.query;

        const relatorio = await licencaService.relatorioPorProfissional(
          profissionalId,
          anoInicio ? parseInt(anoInicio) : undefined,
          anoFim ? parseInt(anoFim) : undefined
        );
        return reply.send(relatorio);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
