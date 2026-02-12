import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { pontoService } from "../services/index.js";
import {
  createPontoSchema,
  updatePontoSchema,
  registrarPontoSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function pontosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista pontos com filtros
  app.get(
    "/",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Listar registros de ponto",
        description: `
Lista todos os registros de ponto eletrônico do sistema.

**Filtros disponíveis:**
- \`profissionalId\`: Filtrar por profissional específico
- \`escolaId\`: Filtrar por escola
- \`dataInicio\`: Data inicial do período (formato: YYYY-MM-DD)
- \`dataFim\`: Data final do período (formato: YYYY-MM-DD)
- \`tipoRegistro\`: Tipo de registro (ENTRADA, SAIDA, FALTA, ATESTADO)

**Paginação:**
- Adicione \`page\` e \`limit\` para ativar paginação
- Exemplo: \`?page=1&limit=20\`

**Permissões:**
- Professores/funcionários: visualizam apenas os próprios registros
- Diretores: visualizam registros da sua escola
- SEMEC/Admin: visualizam todos os registros
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
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial (YYYY-MM-DD)",
              example: "2026-02-01",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final (YYYY-MM-DD)",
              example: "2026-02-28",
            },
            tipoRegistro: {
              type: "string",
              enum: ["ENTRADA", "SAIDA", "FALTA", "ATESTADO"],
              description: "Tipo de registro",
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
            description: "Lista de registros de ponto",
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    profissionalId: { type: "string" },
                    escolaId: { type: "string" },
                    data: { type: "string", format: "date-time" },
                    tipoRegistro: { type: "string", example: "ENTRADA" },
                    horario: { type: "string", example: "08:00" },
                    localizacao: { type: "string", nullable: true },
                    observacoes: { type: "string", nullable: true },
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
          escolaId?: string;
          dataInicio?: string;
          dataFim?: string;
          tipoRegistro?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId, escolaId, dataInicio, dataFim, tipoRegistro, page, limit } =
          request.query;

        const filters: any = {};
        if (profissionalId) filters.profissionalId = profissionalId;
        if (escolaId) filters.escolaId = escolaId;
        if (tipoRegistro) filters.tipoRegistro = tipoRegistro;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        // Suporte a paginação
        if (page && limit) {
          const result = await pontoService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const pontos = await pontoService.findAll(filters);
        return reply.send(pontos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar pontos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria ponto manual (admin)
  app.post(
    "/",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Criar registro de ponto manual",
        description: `
Cria um registro de ponto manual (uso administrativo).

**Uso:**
- Correções de registros incorretos
- Lançamentos retroativos aprovados
- Ajustes administrativos

**Permissões:**
- Apenas ADMIN e SEMEC podem criar registros manuais
- Diretores podem criar para sua escola com aprovação

**Diferença de /registrar:**
- Este endpoint cria registros completos manualmente
- \`/registrar\` é usado para registro em tempo real (entrada/saída)
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["profissionalId", "escolaId", "data", "tipoRegistro", "horario"],
          properties: {
            profissionalId: { type: "string", example: "clx1234567890" },
            escolaId: { type: "string", example: "clx0987654321" },
            data: {
              type: "string",
              format: "date",
              example: "2026-02-12",
            },
            tipoRegistro: {
              type: "string",
              enum: ["ENTRADA", "SAIDA", "FALTA", "ATESTADO"],
              example: "ENTRADA",
            },
            horario: { type: "string", example: "08:00" },
            localizacao: { type: "string", nullable: true },
            observacoes: { type: "string", nullable: true },
          },
        },
        response: {
          201: {
            description: "Ponto criado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              profissionalId: { type: "string" },
              escolaId: { type: "string" },
              data: { type: "string", format: "date-time" },
              tipoRegistro: { type: "string" },
              horario: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createPontoSchema.parse(request.body);
        const ponto = await pontoService.create(body);
        return reply.status(201).send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Registra ponto (entrada/saída)
  app.post(
    "/registrar",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Registrar ponto (entrada/saída)",
        description: `
Registra entrada ou saída do profissional em tempo real.

**Fluxo de uso:**
1. Profissional chega na escola → registra ENTRADA
2. Profissional sai da escola → registra SAIDA
3. Sistema calcula automaticamente a jornada

**Validações automáticas:**
- Não permite entrada duplicada no mesmo dia
- Valida se já existe entrada antes de registrar saída
- Registra localização (GPS) se disponível
- Calcula horas trabalhadas

**Diferença de POST /:**
- Este endpoint é para registro em tempo real
- POST / é para lançamentos manuais administrativos
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["profissionalId", "escolaId", "tipoRegistro"],
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional que está registrando ponto",
              example: "clx1234567890",
            },
            escolaId: {
              type: "string",
              description: "ID da escola onde está registrando",
              example: "clx0987654321",
            },
            tipoRegistro: {
              type: "string",
              enum: ["ENTRADA", "SAIDA"],
              description: "Tipo de registro (entrada ou saída)",
              example: "ENTRADA",
            },
            localizacao: {
              type: "string",
              description: "Coordenadas GPS (opcional)",
              example: "lat: -14.123, lng: -39.456",
            },
          },
        },
        response: {
          201: {
            description: "Ponto registrado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              profissionalId: { type: "string" },
              escolaId: { type: "string" },
              data: { type: "string", format: "date-time" },
              tipoRegistro: { type: "string" },
              horario: { type: "string", example: "08:15" },
              localizacao: { type: "string", nullable: true },
              message: {
                type: "string",
                example: "Entrada registrada às 08:15",
              },
            },
          },
          400: {
            description: "Erro de validação",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Já existe entrada registrada hoje",
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = registrarPontoSchema.parse(request.body);
        const ponto = await pontoService.registrarPonto(body);
        return reply.status(201).send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao registrar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca ponto por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Buscar registro de ponto por ID",
        description: `
Retorna os detalhes completos de um registro de ponto específico.

**Inclui:**
- Dados do profissional
- Escola vinculada
- Horários de entrada/saída
- Localização (se disponível)
- Observações e justificativas
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID do registro de ponto",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Dados do registro de ponto",
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
                },
              },
              escolaId: { type: "string" },
              escola: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                  codigo: { type: "string" },
                },
              },
              data: { type: "string", format: "date-time" },
              tipoRegistro: { type: "string" },
              horario: { type: "string" },
              localizacao: { type: "string", nullable: true },
              observacoes: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
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
        const ponto = await pontoService.findById(id);

        if (!ponto) {
          return reply.status(404).send({ error: "Ponto não encontrado" });
        }

        return reply.send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza ponto
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Atualizar registro de ponto",
        description: `
Atualiza um registro de ponto existente.

**Campos atualizáveis:**
- Horário de entrada/saída
- Observações
- Localização
- Justificativas

**Permissões:**
- Profissional: pode adicionar observações aos próprios registros
- Diretor/Coordenador: pode ajustar registros da escola
- SEMEC/Admin: acesso total

**Auditoria:**
- Todas as alterações são registradas no log
- Mantém histórico de quem alterou e quando
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID do registro de ponto" },
          },
        },
        body: {
          type: "object",
          properties: {
            horario: { type: "string", example: "08:30" },
            localizacao: { type: "string", nullable: true },
            observacoes: {
              type: "string",
              example: "Ajuste aprovado pela direção",
            },
          },
        },
        response: {
          200: {
            description: "Ponto atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              horario: { type: "string" },
              observacoes: { type: "string" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          400: { $ref: "#/components/responses/BadRequest" },
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
        const body = updatePontoSchema.parse(request.body);
        const ponto = await pontoService.update(id, body);
        return reply.send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove ponto
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Remover registro de ponto",
        description: `
Remove um registro de ponto do sistema.

**Regras:**
- Apenas ADMIN e SEMEC podem remover registros
- Registros com mais de 30 dias não podem ser removidos
- Ação é registrada no log de auditoria

**Alternativa:**
- Para correções, use PUT /:id ao invés de deletar
- Registros incorretos devem ser corrigidos, não deletados
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "ID do registro de ponto" },
          },
        },
        response: {
          200: {
            description: "Ponto removido com sucesso",
            type: "object",
            properties: {
              message: { type: "string", example: "Ponto removido com sucesso" },
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
        await pontoService.delete(id);
        return reply.send({ message: "Ponto removido com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Relatório mensal de um profissional
  app.get(
    "/relatorio/:profissionalId/:mes/:ano",
    {
      schema: {
        tags: ["Recursos Humanos"],
        summary: "Relatório mensal de ponto",
        description: `
Gera relatório completo de ponto de um profissional em um mês específico.

**Informações incluídas:**
- Total de dias trabalhados
- Total de horas (entrada + saída)
- Faltas e justificativas
- Atrasos e saídas antecipadas
- Carga horária esperada vs realizada
- Percentual de frequência

**Formato de saída:**
\`\`\`json
{
  "profissional": {...},
  "periodo": "Fevereiro/2026",
  "diasTrabalhados": 20,
  "totalHoras": "160:00",
  "registros": [...],
  "estatisticas": {
    "presencas": 20,
    "faltas": 0,
    "atrasos": 2,
    "percentualFrequencia": 100
  }
}
\`\`\`

**Uso:**
- Folha de pagamento
- Controle de frequência
- Relatórios para RH
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["profissionalId", "mes", "ano"],
          properties: {
            profissionalId: {
              type: "string",
              description: "ID do profissional",
              example: "clx1234567890",
            },
            mes: {
              type: "string",
              description: "Mês (1-12)",
              example: "2",
              pattern: "^([1-9]|1[0-2])$",
            },
            ano: {
              type: "string",
              description: "Ano (YYYY)",
              example: "2026",
              pattern: "^[0-9]{4}$",
            },
          },
        },
        response: {
          200: {
            description: "Relatório mensal de ponto",
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
              periodo: { type: "string", example: "Fevereiro/2026" },
              mes: { type: "number", example: 2 },
              ano: { type: "number", example: 2026 },
              diasTrabalhados: { type: "number", example: 20 },
              totalHoras: { type: "string", example: "160:00" },
              cargaHorariaEsperada: { type: "string", example: "160:00" },
              registros: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    data: { type: "string", format: "date" },
                    entrada: { type: "string", example: "08:00" },
                    saida: { type: "string", example: "17:00" },
                    totalHoras: { type: "string", example: "08:00" },
                    observacoes: { type: "string", nullable: true },
                  },
                },
              },
              estatisticas: {
                type: "object",
                properties: {
                  presencas: { type: "number", example: 20 },
                  faltas: { type: "number", example: 0 },
                  atrasos: { type: "number", example: 2 },
                  percentualFrequencia: { type: "number", example: 100 },
                },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
          401: { $ref: "#/components/responses/Unauthorized" },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { profissionalId: string; mes: string; ano: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId, mes, ano } = request.params;
        const relatorio = await pontoService.relatorioMensal(
          profissionalId,
          parseInt(mes),
          parseInt(ano)
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
