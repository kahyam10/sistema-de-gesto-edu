import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { join } from "path";

import {
  authRoutes,
  seriesRoutes,
  etapasRoutes,
  escolasRoutes,
  turmasRoutes,
  matriculasRoutes,
  profissionaisRoutes,
  modulesRoutes,
  phaseRoutes,
  salasRoutes,
  gradeHorariaRoutes,
  uploadRoutes,
  frequenciaRoutes,
  disciplinasRoutes,
  configuracaoAvaliacaoRoutes,
  avaliacoesRoutes,
  notasRoutes,
  pontosRoutes,
  licencasRoutes,
  buscaAtivaRoutes,
  aeeRoutes,
  acompanhamentoRoutes,
  plantaoPedagogicoRoutes,
  reuniaoPaisRoutes,
  comunicadoRoutes,
  notificacaoRoutes,
  observabilityRoutes,
} from "./routes/index.js";
import { calendarioRoutes } from "./routes/calendario.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logger } from "./utils/logger.js";
import {
  observabilityPlugin,
  collectSystemMetrics,
} from "./middleware/observability.js";
import { prisma } from "./lib/prisma.js";
import { refreshTokenService } from "./services/refresh-token.service.js";

// Types are imported via triple-slash reference in the .d.ts file
// No need to import them here

async function buildApp() {
  const app = Fastify({
    logger: logger.pino,
    ajv: {
      customOptions: {
        strict: false, // Permite keywords como 'example'
      },
    },
  });

  // Plugins
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:3001"];

  await app.register(cors, {
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Rate limiting global
  await app.register(rateLimit, {
    max: 100, // máximo de requisições
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message:
        "Limite de requisições excedido. Tente novamente em alguns instantes.",
    }),
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-key-change-in-production",
    sign: {
      expiresIn: "15m", // Access token expira em 15 minutos
    },
  });

  // Multipart para upload de arquivos
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Servir arquivos estáticos (uploads)
  await app.register(fastifyStatic, {
    root: join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  // Servir arquivos públicos (CSS do Swagger, etc)
  await app.register(fastifyStatic, {
    root: join(process.cwd(), "public"),
    prefix: "/public/",
    decorateReply: false,
  });

  // Sistema de observabilidade (deve vir antes das rotas)
  await app.register(observabilityPlugin);

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Sistema de Gestão Educacional API",
        description: `
# 📚 Sistema de Gestão Educacional - Ibirapitanga/BA

API completa para gerenciamento de instituições educacionais da rede municipal de Ibirapitanga-BA.

## 🎯 Funcionalidades Principais

### Gestão Acadêmica
- **Matrículas**: Cadastro e gerenciamento de alunos
- **Turmas**: Organização de turmas por escola, série e turno
- **Profissionais**: Gestão de professores, coordenadores e funcionários
- **Escolas**: Cadastro e infraestrutura das unidades escolares

### Gestão Pedagógica
- **Grade Horária**: Planejamento de aulas e disciplinas
- **Frequência**: Registro e controle de presença
- **Avaliações**: Sistema de notas e boletim digital
- **Calendário Letivo**: Eventos e períodos letivos

### Programas Especiais
- **Busca Ativa**: Acompanhamento de alunos fora da escola
- **Educação Especial (AEE)**: Planos educacionais individualizados
- **Acompanhamento**: Monitoramento de alunos com necessidades específicas

### Recursos Humanos
- **Ponto Eletrônico**: Controle de jornada de trabalho
- **Licenças**: Gestão de afastamentos e licenças
- **Plantões Pedagógicos**: Atendimento e reuniões

### Comunicação
- **Comunicados**: Avisos para comunidade escolar
- **Notificações**: Alertas em tempo real
- **Reuniões de Pais**: Agendamento e controle de presença

### Observabilidade
- **Monitoramento**: Métricas e logs em tempo real
- **Performance**: Análise de rotas e tempo de resposta
- **Erros**: Rastreamento e resolução de problemas

## 🔐 Autenticação

Esta API utiliza autenticação JWT (Bearer Token). Para acessar endpoints protegidos:

1. Faça login no endpoint \`/api/auth/login\`
2. Utilize o token retornado no header \`Authorization: Bearer <token>\`
3. O token expira após o período configurado

## 📊 Paginação

Endpoints de listagem suportam paginação opcional via query parameters:
- \`page\`: Número da página (padrão: 1)
- \`limit\`: Itens por página (padrão: 20, máx: 100)

Resposta paginada:
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
\`\`\`

## 🏷️ Convenções

- **Datas**: ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ)
- **IDs**: CUID (ex: clx1234567890)
- **Status HTTP**:
  - 200: Sucesso
  - 201: Criado
  - 204: Sem conteúdo (delete)
  - 400: Dados inválidos
  - 401: Não autenticado
  - 403: Sem permissão
  - 404: Não encontrado
  - 500: Erro interno

## 📝 Suporte

- **Município**: Prefeitura Municipal de Ibirapitanga/BA
- **Secretaria**: SEMEC - Secretaria Municipal de Educação
- **Ambiente**: ${process.env.NODE_ENV || "development"}
        `,
        version: "1.0.0",
        contact: {
          name: "Suporte SEMEC Ibirapitanga",
          email: "ti@ibirapitanga.ba.gov.br",
        },
        license: {
          name: "Proprietary",
          url: "https://ibirapitanga.ba.gov.br",
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: "Servidor de Desenvolvimento",
        },
        {
          url: "https://api-educacao.ibirapitanga.ba.gov.br",
          description: "Servidor de Produção",
        },
      ],
      tags: [
        { name: "Autenticação", description: "Endpoints de login e registro" },
        { name: "Escolas", description: "Gestão de unidades escolares" },
        { name: "Etapas e Séries", description: "Estrutura curricular" },
        { name: "Turmas", description: "Organização de turmas" },
        { name: "Matrículas", description: "Cadastro de alunos" },
        { name: "Profissionais", description: "Gestão de funcionários" },
        { name: "Grade Horária", description: "Planejamento de aulas" },
        {
          name: "Disciplinas",
          description: "Matérias e componentes curriculares",
        },
        { name: "Frequência", description: "Controle de presença" },
        { name: "Avaliações", description: "Sistema de notas" },
        { name: "Calendário", description: "Eventos e períodos letivos" },
        { name: "Salas", description: "Infraestrutura escolar" },
        { name: "Recursos Humanos", description: "Ponto, licenças e plantões" },
        {
          name: "Programas Especiais",
          description: "Busca Ativa, AEE e Acompanhamento",
        },
        {
          name: "Comunicação",
          description: "Comunicados, notificações e reuniões",
        },
        { name: "Upload", description: "Envio de documentos e arquivos" },
        { name: "Observabilidade", description: "Monitoramento e métricas" },
        { name: "Módulos", description: "Sistema de módulos e fases" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Token JWT obtido no endpoint /api/auth/login",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: {
                type: "string",
                description: "Mensagem de erro",
              },
              code: {
                type: "string",
                description: "Código do erro",
              },
              details: {
                type: "object",
                description: "Detalhes adicionais do erro",
              },
            },
          },
          PaginationMeta: {
            type: "object",
            properties: {
              page: { type: "number", example: 1 },
              limit: { type: "number", example: 20 },
              total: { type: "number", example: 156 },
              totalPages: { type: "number", example: 8 },
            },
          },
        },
        responses: {
          Unauthorized: {
            description: "Não autenticado - Token inválido ou ausente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          Forbidden: {
            description: "Sem permissão para acessar este recurso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          NotFound: {
            description: "Recurso não encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          BadRequest: {
            description: "Dados de entrada inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      defaultModelRendering: "model",
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    theme: {
      title: "Sistema de Gestão Educacional - API Docs",
      favicon: [
        {
          filename: "favicon.ico",
          rel: "icon",
          sizes: "32x32",
          type: "image/x-icon",
          content: Buffer.from(""),
        },
      ],
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    transformSpecification: (swaggerObject, _request, _reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Decorator para autenticação
  app.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Não autorizado" });
    }
  });

  // Health check completo
  app.get("/health", async () => {
    let dbStatus = "ok";
    let dbLatency = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = "error";
    }

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    return {
      status: dbStatus === "ok" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      version: process.env.APP_VERSION || "1.0.0",
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      },
      node: process.version,
    };
  });

  // Rotas
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(seriesRoutes, { prefix: "/api/series" });
  app.register(etapasRoutes, { prefix: "/api/etapas" });
  app.register(escolasRoutes, { prefix: "/api/escolas" });
  app.register(turmasRoutes, { prefix: "/api/turmas" });
  app.register(matriculasRoutes, { prefix: "/api/matriculas" });
  app.register(profissionaisRoutes, { prefix: "/api/profissionais" });
  app.register(modulesRoutes, { prefix: "/api/modules" });
  app.register(phaseRoutes);
  app.register(salasRoutes);
  app.register(calendarioRoutes, { prefix: "/api/calendario" });
  app.register(gradeHorariaRoutes, { prefix: "/api/grade-horaria" });
  app.register(uploadRoutes, { prefix: "/api/upload" });
  app.register(frequenciaRoutes, { prefix: "/api/frequencia" });
  app.register(disciplinasRoutes, { prefix: "/api/disciplinas" });
  app.register(configuracaoAvaliacaoRoutes, {
    prefix: "/api/configuracao-avaliacao",
  });
  app.register(avaliacoesRoutes, { prefix: "/api/avaliacoes" });
  app.register(notasRoutes, { prefix: "/api/notas" });
  app.register(pontosRoutes, { prefix: "/api/pontos" });
  app.register(licencasRoutes, { prefix: "/api/licencas" });
  app.register(buscaAtivaRoutes, { prefix: "/api/busca-ativa" });
  app.register(aeeRoutes, { prefix: "/api/aee" });
  app.register(acompanhamentoRoutes, { prefix: "/api/acompanhamento" });
  app.register(plantaoPedagogicoRoutes, {
    prefix: "/api/plantoes-pedagogicos",
  });
  app.register(reuniaoPaisRoutes, { prefix: "/api/reunioes-pais" });
  app.register(comunicadoRoutes, { prefix: "/api/comunicados" });
  app.register(notificacaoRoutes, { prefix: "/api/notificacoes" });
  app.register(observabilityRoutes, { prefix: "/api/observability" });

  // Error handler global com sistema estruturado
  app.setErrorHandler(errorHandler);

  return app;
}

// Start server
async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || "3333");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });

    logger.info("Servidor iniciado com sucesso", {
      port,
      host,
      environment: process.env.NODE_ENV || "development",
    });

    // Coletar métricas do sistema a cada minuto
    setInterval(() => {
      collectSystemMetrics().catch((err) => {
        logger.error("Erro ao coletar métricas do sistema", err as Error);
      });
    }, 60 * 1000);

    // Limpar refresh tokens expirados a cada 6 horas
    setInterval(
      () => {
        refreshTokenService.cleanupExpiredTokens().catch((err) => {
          logger.error("Erro ao limpar tokens expirados", err as Error);
        });
      },
      6 * 60 * 60 * 1000,
    );

    // Coleta inicial
    await collectSystemMetrics();

    console.log(`
    🚀 Servidor rodando em http://localhost:${port}
    📚 Documentação: http://localhost:${port}/docs
    🏥 Health check: http://localhost:${port}/health
    📊 Observabilidade: http://localhost:${port}/api/observability/overview
    `);
  } catch (err) {
    logger.error("Falha ao iniciar servidor", err as Error);
    process.exit(1);
  }
}

start();
