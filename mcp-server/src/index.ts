#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";

// Configuração da API
const API_BASE_URL = process.env.API_URL || "http://localhost:3333";
const API_TOKEN = process.env.API_TOKEN || "";

// Cliente HTTP configurado
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
  },
  timeout: 30000,
});

// Servidor MCP
const server = new Server(
  {
    name: "sistema-gestao-educacional",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ==================== TOOLS ====================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Matrículas
      {
        name: "listar_matriculas",
        description:
          "Lista todas as matrículas com filtros opcionais. Retorna informações de alunos matriculados no sistema.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola para filtrar",
            },
            turmaId: {
              type: "string",
              description: "ID da turma para filtrar",
            },
            anoLetivo: {
              type: "number",
              description: "Ano letivo (ex: 2026)",
            },
            status: {
              type: "string",
              enum: ["ATIVA", "TRANSFERIDA", "CANCELADA", "CONCLUIDA"],
              description: "Status da matrícula",
            },
            page: {
              type: "number",
              description: "Número da página (paginação)",
            },
            limit: {
              type: "number",
              description: "Itens por página (máx: 100)",
            },
          },
        },
      },
      {
        name: "criar_matricula",
        description:
          "Cria uma nova matrícula de aluno no sistema. Requer dados completos do aluno e responsável.",
        inputSchema: {
          type: "object",
          required: [
            "nomeAluno",
            "dataNascimento",
            "escolaId",
            "serieId",
            "anoLetivo",
          ],
          properties: {
            nomeAluno: {
              type: "string",
              description: "Nome completo do aluno",
            },
            dataNascimento: {
              type: "string",
              format: "date",
              description: "Data de nascimento (YYYY-MM-DD)",
            },
            cpfAluno: {
              type: "string",
              description: "CPF do aluno (opcional)",
            },
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            serieId: {
              type: "string",
              description: "ID da série/ano",
            },
            anoLetivo: {
              type: "number",
              description: "Ano letivo",
            },
            nomeResponsavel: {
              type: "string",
              description: "Nome do responsável",
            },
            cpfResponsavel: {
              type: "string",
              description: "CPF do responsável",
            },
            telefoneResponsavel: {
              type: "string",
              description: "Telefone do responsável",
            },
            possuiDeficiencia: {
              type: "boolean",
              description: "Aluno possui deficiência?",
            },
            tipoDeficiencia: {
              type: "string",
              description: "Tipo de deficiência (se houver)",
            },
          },
        },
      },
      {
        name: "obter_matricula",
        description:
          "Obtém detalhes completos de uma matrícula específica pelo ID.",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da matrícula",
            },
          },
        },
      },

      // Turmas
      {
        name: "listar_turmas",
        description:
          "Lista todas as turmas do sistema com filtros opcionais. Inclui informações de escola, série e quantidade de alunos.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            anoLetivo: {
              type: "number",
              description: "Ano letivo",
            },
            ativo: {
              type: "boolean",
              description: "Filtrar apenas turmas ativas",
            },
            page: {
              type: "number",
              description: "Número da página",
            },
            limit: {
              type: "number",
              description: "Itens por página",
            },
          },
        },
      },
      {
        name: "obter_turma",
        description:
          "Obtém detalhes completos de uma turma, incluindo lista de alunos e professores.",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
            },
          },
        },
      },
      {
        name: "estatisticas_turma",
        description:
          "Obtém estatísticas de uma turma: total de alunos, PCD, vagas disponíveis, taxa de ocupação.",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da turma",
            },
          },
        },
      },

      // Escolas
      {
        name: "listar_escolas",
        description:
          "Lista todas as escolas da rede municipal com informações de infraestrutura.",
        inputSchema: {
          type: "object",
          properties: {
            ativo: {
              type: "boolean",
              description: "Filtrar apenas escolas ativas",
            },
          },
        },
      },
      {
        name: "obter_escola",
        description:
          "Obtém detalhes completos de uma escola, incluindo infraestrutura, salas e estatísticas.",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da escola",
            },
          },
        },
      },

      // Profissionais
      {
        name: "listar_profissionais",
        description:
          "Lista todos os profissionais da educação (professores, coordenadores, etc).",
        inputSchema: {
          type: "object",
          properties: {
            tipo: {
              type: "string",
              enum: [
                "PROFESSOR",
                "COORDENADOR",
                "DIRETOR",
                "VICE_DIRETOR",
                "SECRETARIO",
                "AUXILIAR",
                "MERENDEIRA",
                "SERVICOS_GERAIS",
              ],
              description: "Tipo de profissional",
            },
            ativo: {
              type: "boolean",
              description: "Filtrar apenas ativos",
            },
          },
        },
      },

      // Frequência
      {
        name: "registrar_frequencia",
        description:
          "Registra a frequência (presença/falta) de alunos em uma data específica.",
        inputSchema: {
          type: "object",
          required: ["turmaId", "data", "registros"],
          properties: {
            turmaId: {
              type: "string",
              description: "ID da turma",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data da aula (YYYY-MM-DD)",
            },
            disciplina: {
              type: "string",
              description: "Disciplina da aula",
            },
            registros: {
              type: "array",
              description: "Lista de presenças",
              items: {
                type: "object",
                required: ["matriculaId", "presente"],
                properties: {
                  matriculaId: {
                    type: "string",
                    description: "ID da matrícula do aluno",
                  },
                  presente: {
                    type: "boolean",
                    description: "Aluno presente?",
                  },
                  justificativa: {
                    type: "string",
                    description: "Justificativa de falta (opcional)",
                  },
                },
              },
            },
          },
        },
      },
      {
        name: "consultar_frequencia",
        description:
          "Consulta a frequência de uma turma em um período específico.",
        inputSchema: {
          type: "object",
          required: ["turmaId"],
          properties: {
            turmaId: {
              type: "string",
              description: "ID da turma",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial do período",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final do período",
            },
          },
        },
      },

      // Notas
      {
        name: "lancar_notas",
        description:
          "Lança as notas de uma avaliação para uma turma inteira.",
        inputSchema: {
          type: "object",
          required: ["avaliacaoId", "notas"],
          properties: {
            avaliacaoId: {
              type: "string",
              description: "ID da avaliação",
            },
            notas: {
              type: "array",
              description: "Lista de notas dos alunos",
              items: {
                type: "object",
                required: ["matriculaId", "valor"],
                properties: {
                  matriculaId: {
                    type: "string",
                    description: "ID da matrícula",
                  },
                  valor: {
                    type: "number",
                    description: "Nota obtida",
                  },
                  observacao: {
                    type: "string",
                    description: "Observações (opcional)",
                  },
                },
              },
            },
          },
        },
      },
      {
        name: "consultar_boletim",
        description:
          "Consulta o boletim completo de um aluno com todas as notas e médias.",
        inputSchema: {
          type: "object",
          required: ["matriculaId"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula do aluno",
            },
            turmaId: {
              type: "string",
              description: "ID da turma (opcional)",
            },
          },
        },
      },

      // Calendário
      {
        name: "listar_eventos_calendario",
        description:
          "Lista eventos do calendário letivo em um período específico.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            anoLetivo: {
              type: "number",
              description: "Ano letivo",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final",
            },
            tipo: {
              type: "string",
              enum: [
                "AULA",
                "FERIADO",
                "REUNIAO",
                "EVENTO",
                "RECESSO",
                "FERIAS",
              ],
              description: "Tipo de evento",
            },
          },
        },
      },

      // Comunicados
      {
        name: "criar_comunicado",
        description:
          "Cria um novo comunicado para a comunidade escolar.",
        inputSchema: {
          type: "object",
          required: ["titulo", "mensagem", "tipo", "destinatarios", "autorNome"],
          properties: {
            titulo: {
              type: "string",
              description: "Título do comunicado",
            },
            mensagem: {
              type: "string",
              description: "Conteúdo completo do comunicado",
            },
            tipo: {
              type: "string",
              enum: ["INFORMATIVO", "URGENTE", "AVISO", "CONVITE", "ALERTA"],
              description: "Tipo do comunicado",
            },
            categoria: {
              type: "string",
              enum: ["ACADEMICO", "ADMINISTRATIVO", "EVENTO", "SAUDE", "TRANSPORTE", "ALIMENTACAO", "GERAL"],
              description: "Categoria do comunicado (opcional)",
            },
            escolaId: {
              type: "string",
              description: "ID da escola (opcional - se null, é comunicado da SEMEC)",
            },
            turmaId: {
              type: "string",
              description: "ID da turma (opcional)",
            },
            destinatarios: {
              type: "string",
              enum: ["TODOS", "PAIS", "PROFESSORES", "FUNCIONARIOS", "ALUNOS"],
              description: "Destinatários do comunicado",
            },
            autorNome: {
              type: "string",
              description: "Nome do autor/setor que criou o comunicado",
            },
            dataExpiracao: {
              type: "string",
              format: "date",
              description: "Data de expiração (opcional)",
            },
            destaque: {
              type: "boolean",
              description: "Se deve ser destacado (opcional)",
            },
          },
        },
      },
      {
        name: "listar_comunicados",
        description: "Lista comunicados ativos do sistema.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "Filtrar por escola",
            },
            turmaId: {
              type: "string",
              description: "Filtrar por turma",
            },
            tipo: {
              type: "string",
              description: "Filtrar por tipo",
            },
            categoria: {
              type: "string",
              description: "Filtrar por categoria",
            },
            destinatarios: {
              type: "string",
              description: "Filtrar por destinatários",
            },
          },
        },
      },

      // Busca Ativa
      {
        name: "criar_busca_ativa",
        description:
          "Cria um novo caso de busca ativa para aluno evadido ou em risco de evasão.",
        inputSchema: {
          type: "object",
          required: ["matriculaId", "motivo", "responsavelId"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula do aluno",
            },
            motivo: {
              type: "string",
              enum: ["EVASAO", "INFREQUENCIA", "RISCO_ABANDONO", "TRANSFERENCIA_NAO_CONFIRMADA"],
              description: "Motivo da busca ativa",
            },
            descricao: {
              type: "string",
              description: "Descrição detalhada do caso",
            },
            responsavelId: {
              type: "string",
              description: "ID do profissional responsável",
            },
            prioridade: {
              type: "string",
              enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
              description: "Prioridade do caso",
            },
          },
        },
      },
      {
        name: "listar_busca_ativa",
        description: "Lista casos de busca ativa com filtros opcionais.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "Filtrar por escola",
            },
            status: {
              type: "string",
              enum: ["ATIVA", "EM_ACOMPANHAMENTO", "RESOLVIDA", "CANCELADA"],
              description: "Filtrar por status",
            },
            prioridade: {
              type: "string",
              description: "Filtrar por prioridade",
            },
            matriculaId: {
              type: "string",
              description: "Filtrar por matrícula",
            },
          },
        },
      },

      // AEE (Atendimento Educacional Especializado)
      {
        name: "criar_pei",
        description:
          "Cria um Plano Educacional Individualizado (PEI) para aluno com deficiência.",
        inputSchema: {
          type: "object",
          required: ["matriculaId", "deficiencia", "anoLetivo", "objetivosGerais"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula do aluno",
            },
            anoLetivo: {
              type: "number",
              description: "Ano letivo do PEI",
            },
            deficiencia: {
              type: "string",
              enum: ["INTELECTUAL", "VISUAL", "AUDITIVA", "FISICA", "MULTIPLA", "TEA", "OUTRA"],
              description: "Tipo de deficiência",
            },
            objetivosGerais: {
              type: "string",
              description: "Objetivos gerais do plano",
            },
            objetivosEspecificos: {
              type: "string",
              description: "Objetivos específicos (opcional)",
            },
            estrategias: {
              type: "string",
              description: "Estratégias pedagógicas (opcional)",
            },
            recursos: {
              type: "string",
              description: "Recursos necessários (opcional)",
            },
            avaliacoes: {
              type: "string",
              description: "Formas de avaliação (opcional)",
            },
          },
        },
      },
      {
        name: "listar_pei",
        description: "Lista Planos Educacionais Individualizados (PEI).",
        inputSchema: {
          type: "object",
          properties: {
            matriculaId: {
              type: "string",
              description: "Filtrar por matrícula",
            },
            anoLetivo: {
              type: "number",
              description: "Filtrar por ano letivo",
            },
            ativo: {
              type: "boolean",
              description: "Filtrar apenas ativos",
            },
          },
        },
      },

      // Acompanhamento Pedagógico
      {
        name: "criar_acompanhamento",
        description:
          "Cria um acompanhamento pedagógico individualizado para um aluno.",
        inputSchema: {
          type: "object",
          required: ["matriculaId", "tipo", "motivo", "profissionalId", "escolaId"],
          properties: {
            matriculaId: {
              type: "string",
              description: "ID da matrícula do aluno",
            },
            tipo: {
              type: "string",
              enum: ["APRENDIZAGEM", "COMPORTAMENTO", "FREQUENCIA", "EMOCIONAL", "FAMILIAR"],
              description: "Tipo de acompanhamento",
            },
            motivo: {
              type: "string",
              description: "Motivo/descrição do acompanhamento",
            },
            profissionalId: {
              type: "string",
              description: "ID do profissional responsável",
            },
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            objetivos: {
              type: "string",
              description: "Objetivos do acompanhamento (opcional)",
            },
            estrategias: {
              type: "string",
              description: "Estratégias a serem utilizadas (opcional)",
            },
          },
        },
      },
      {
        name: "listar_acompanhamentos",
        description: "Lista acompanhamentos pedagógicos.",
        inputSchema: {
          type: "object",
          properties: {
            matriculaId: {
              type: "string",
              description: "Filtrar por matrícula",
            },
            escolaId: {
              type: "string",
              description: "Filtrar por escola",
            },
            tipo: {
              type: "string",
              description: "Filtrar por tipo",
            },
            ativo: {
              type: "boolean",
              description: "Filtrar apenas ativos",
            },
          },
        },
      },

      // Plantão Pedagógico
      {
        name: "criar_plantao_pedagogico",
        description:
          "Cria um plantão pedagógico para atendimento de pais e alunos.",
        inputSchema: {
          type: "object",
          required: ["escolaId", "data", "tipo", "horarioInicio", "horarioFim"],
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data do plantão (YYYY-MM-DD)",
            },
            tipo: {
              type: "string",
              enum: ["INDIVIDUAL", "COLETIVO", "POR_TURMA"],
              description: "Tipo de plantão",
            },
            horarioInicio: {
              type: "string",
              description: "Horário de início (ex: 14:00)",
            },
            horarioFim: {
              type: "string",
              description: "Horário de término (ex: 18:00)",
            },
            turmaId: {
              type: "string",
              description: "ID da turma (se for por turma)",
            },
            local: {
              type: "string",
              description: "Local do plantão (opcional)",
            },
            observacoes: {
              type: "string",
              description: "Observações adicionais (opcional)",
            },
          },
        },
      },
      {
        name: "listar_plantoes_pedagogicos",
        description: "Lista plantões pedagógicos agendados.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "Filtrar por escola",
            },
            turmaId: {
              type: "string",
              description: "Filtrar por turma",
            },
            tipo: {
              type: "string",
              description: "Filtrar por tipo",
            },
            dataInicio: {
              type: "string",
              format: "date",
              description: "Data inicial",
            },
            dataFim: {
              type: "string",
              format: "date",
              description: "Data final",
            },
          },
        },
      },

      // Reuniões de Pais
      {
        name: "criar_reuniao_pais",
        description:
          "Cria uma reunião de pais e responsáveis.",
        inputSchema: {
          type: "object",
          required: ["escolaId", "titulo", "data", "horario", "tipo"],
          properties: {
            escolaId: {
              type: "string",
              description: "ID da escola",
            },
            turmaId: {
              type: "string",
              description: "ID da turma (opcional - se null, é reunião geral)",
            },
            titulo: {
              type: "string",
              description: "Título da reunião",
            },
            descricao: {
              type: "string",
              description: "Descrição da reunião (opcional)",
            },
            data: {
              type: "string",
              format: "date",
              description: "Data da reunião (YYYY-MM-DD)",
            },
            horario: {
              type: "string",
              description: "Horário de início (ex: 19:00)",
            },
            duracao: {
              type: "number",
              description: "Duração em minutos (opcional)",
            },
            tipo: {
              type: "string",
              enum: ["BIMESTRAL", "TRIMESTRAL", "EXTRAORDINARIA", "CONSELHO_PARTICIPATIVO"],
              description: "Tipo de reunião",
            },
            finalidade: {
              type: "string",
              description: "Finalidade/assuntos principais (opcional)",
            },
            local: {
              type: "string",
              description: "Local da reunião (opcional)",
            },
          },
        },
      },
      {
        name: "listar_reunioes_pais",
        description: "Lista reuniões de pais agendadas.",
        inputSchema: {
          type: "object",
          properties: {
            escolaId: {
              type: "string",
              description: "Filtrar por escola",
            },
            turmaId: {
              type: "string",
              description: "Filtrar por turma",
            },
            tipo: {
              type: "string",
              description: "Filtrar por tipo",
            },
            status: {
              type: "string",
              enum: ["AGENDADA", "REALIZADA", "CANCELADA"],
              description: "Filtrar por status",
            },
          },
        },
      },

      // Notificações
      {
        name: "criar_notificacao",
        description:
          "Cria uma notificação para um usuário do sistema.",
        inputSchema: {
          type: "object",
          required: ["userId", "titulo", "mensagem", "tipo"],
          properties: {
            userId: {
              type: "string",
              description: "ID do usuário destinatário",
            },
            titulo: {
              type: "string",
              description: "Título da notificação",
            },
            mensagem: {
              type: "string",
              description: "Mensagem da notificação",
            },
            tipo: {
              type: "string",
              enum: ["SISTEMA", "ACADEMICO", "FINANCEIRO", "COMUNICADO", "LEMBRETE", "URGENTE"],
              description: "Tipo da notificação",
            },
            prioridade: {
              type: "string",
              enum: ["BAIXA", "NORMAL", "ALTA", "URGENTE"],
              description: "Prioridade (opcional, padrão: NORMAL)",
            },
            canais: {
              type: "array",
              items: {
                type: "string",
                enum: ["APP", "EMAIL", "SMS", "PUSH"],
              },
              description: "Canais de envio (opcional, padrão: ['APP'])",
            },
          },
        },
      },
      {
        name: "listar_notificacoes",
        description: "Lista notificações de um usuário.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "Filtrar por usuário",
            },
            tipo: {
              type: "string",
              description: "Filtrar por tipo",
            },
            lida: {
              type: "boolean",
              description: "Filtrar por status de leitura",
            },
          },
        },
      },

      // Observabilidade
      {
        name: "consultar_metricas_sistema",
        description:
          "Consulta métricas de observabilidade do sistema (requisições, erros, performance).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "listar_erros_sistema",
        description:
          "Lista erros não resolvidos do sistema para debug e monitoramento.",
        inputSchema: {
          type: "object",
          properties: {
            modulo: {
              type: "string",
              description: "Filtrar por módulo",
            },
            severidade: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              description: "Filtrar por severidade",
            },
          },
        },
      },
    ],
  };
});

// ==================== TOOL HANDLERS ====================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Matrículas
      case "listar_matriculas": {
        const response = await apiClient.get("/api/matriculas", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "criar_matricula": {
        const response = await apiClient.post("/api/matriculas", args);
        return {
          content: [
            {
              type: "text",
              text: `Matrícula criada com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "obter_matricula": {
        const { id } = args as { id: string };
        const response = await apiClient.get(`/api/matriculas/${id}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Turmas
      case "listar_turmas": {
        const response = await apiClient.get("/api/turmas", { params: args });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "obter_turma": {
        const { id } = args as { id: string };
        const response = await apiClient.get(`/api/turmas/${id}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "estatisticas_turma": {
        const { id } = args as { id: string };
        const response = await apiClient.get(`/api/turmas/${id}/estatisticas`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Escolas
      case "listar_escolas": {
        const response = await apiClient.get("/api/escolas", { params: args });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "obter_escola": {
        const { id } = args as { id: string };
        const response = await apiClient.get(`/api/escolas/${id}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Profissionais
      case "listar_profissionais": {
        const response = await apiClient.get("/api/profissionais", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Frequência
      case "registrar_frequencia": {
        const response = await apiClient.post("/api/frequencia", args);
        return {
          content: [
            {
              type: "text",
              text: `Frequência registrada com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "consultar_frequencia": {
        const response = await apiClient.get("/api/frequencia", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Notas
      case "lancar_notas": {
        const response = await apiClient.post("/api/notas/turma", args);
        return {
          content: [
            {
              type: "text",
              text: `Notas lançadas com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "consultar_boletim": {
        const { matriculaId, turmaId } = args as {
          matriculaId: string;
          turmaId?: string;
        };
        const params = turmaId ? `?turmaId=${turmaId}` : "";
        const response = await apiClient.get(
          `/api/notas/boletim/${matriculaId}${params}`
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Calendário
      case "listar_eventos_calendario": {
        const response = await apiClient.get("/api/calendario", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Comunicados
      case "criar_comunicado": {
        const response = await apiClient.post("/api/comunicados", args);
        return {
          content: [
            {
              type: "text",
              text: `Comunicado criado com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_comunicados": {
        const response = await apiClient.get("/api/comunicados", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Busca Ativa
      case "criar_busca_ativa": {
        const response = await apiClient.post("/api/busca-ativa", args);
        return {
          content: [
            {
              type: "text",
              text: `Caso de busca ativa criado com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_busca_ativa": {
        const response = await apiClient.get("/api/busca-ativa", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // AEE/PEI
      case "criar_pei": {
        const response = await apiClient.post("/api/aee/pei", args);
        return {
          content: [
            {
              type: "text",
              text: `PEI criado com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_pei": {
        const response = await apiClient.get("/api/aee/pei", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Acompanhamento Pedagógico
      case "criar_acompanhamento": {
        const response = await apiClient.post("/api/acompanhamento", args);
        return {
          content: [
            {
              type: "text",
              text: `Acompanhamento criado com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_acompanhamentos": {
        const response = await apiClient.get("/api/acompanhamento", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Plantão Pedagógico
      case "criar_plantao_pedagogico": {
        const response = await apiClient.post("/api/plantoes-pedagogicos", args);
        return {
          content: [
            {
              type: "text",
              text: `Plantão pedagógico criado com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_plantoes_pedagogicos": {
        const response = await apiClient.get("/api/plantoes-pedagogicos", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Reuniões de Pais
      case "criar_reuniao_pais": {
        const response = await apiClient.post("/api/reunioes-pais", args);
        return {
          content: [
            {
              type: "text",
              text: `Reunião de pais criada com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_reunioes_pais": {
        const response = await apiClient.get("/api/reunioes-pais", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Notificações
      case "criar_notificacao": {
        const response = await apiClient.post("/api/notificacoes", args);
        return {
          content: [
            {
              type: "text",
              text: `Notificação criada com sucesso!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case "listar_notificacoes": {
        const response = await apiClient.get("/api/notificacoes", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      // Observabilidade
      case "consultar_metricas_sistema": {
        const response = await apiClient.get("/api/observability/overview");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "listar_erros_sistema": {
        const response = await apiClient.get("/api/observability/errors", {
          params: args,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Erro desconhecido";
    return {
      content: [
        {
          type: "text",
          text: `Erro ao executar ${name}:\n${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// ==================== RESOURCES ====================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "gestao://estatisticas/geral",
        name: "Estatísticas Gerais",
        description:
          "Estatísticas gerais do sistema: total de escolas, alunos, turmas, profissionais",
        mimeType: "application/json",
      },
      {
        uri: "gestao://escolas/lista",
        name: "Lista de Escolas",
        description: "Lista completa de todas as escolas da rede municipal",
        mimeType: "application/json",
      },
      {
        uri: "gestao://turmas/resumo",
        name: "Resumo de Turmas",
        description:
          "Resumo de todas as turmas com informações de vagas e ocupação",
        mimeType: "application/json",
      },
      {
        uri: "gestao://sistema/health",
        name: "Health Check",
        description: "Status de saúde do sistema e conectividade da API",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case "gestao://estatisticas/geral": {
        const [escolas, turmas, matriculas, profissionais] = await Promise.all([
          apiClient.get("/api/escolas"),
          apiClient.get("/api/turmas"),
          apiClient.get("/api/matriculas"),
          apiClient.get("/api/profissionais"),
        ]);

        const stats = {
          totalEscolas: escolas.data.length,
          totalTurmas: turmas.data.length,
          totalMatriculas: matriculas.data.length,
          totalProfissionais: profissionais.data.length,
          dataAtualizacao: new Date().toISOString(),
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "gestao://escolas/lista": {
        const response = await apiClient.get("/api/escolas");
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "gestao://turmas/resumo": {
        const response = await apiClient.get("/api/turmas");
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "gestao://sistema/health": {
        const response = await apiClient.get("/health");
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  ...response.data,
                  apiUrl: API_BASE_URL,
                  authenticated: !!API_TOKEN,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Resource não encontrado: ${uri}`);
    }
  } catch (error: any) {
    throw new Error(`Erro ao ler resource ${uri}: ${error.message}`);
  }
});

// ==================== START SERVER ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server Sistema de Gestão Educacional iniciado!");
  console.error(`Conectado à API: ${API_BASE_URL}`);
  console.error(
    `Autenticação: ${API_TOKEN ? "Configurada ✓" : "Não configurada ✗"}`
  );
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
