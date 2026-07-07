import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import {
  authRoutes,
  seriesRoutes,
  niveisEnsinoRoutes,
  etapasRoutes,
  tiposEducacaoRoutes,
  escolasRoutes,
  turmasRoutes,
  matriculasRoutes,
  profissionaisRoutes,
  modulesRoutes,
  phaseRoutes,
  salasRoutes,
} from "./routes/index.js";
import { calendarioRoutes } from "./routes/calendario.routes.js";

// Types are imported via triple-slash reference in the .d.ts file
// No need to import them here

async function buildApp() {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET é obrigatório em produção");
  }
  if (isProd && !process.env.CORS_ORIGIN) {
    throw new Error("CORS_ORIGIN é obrigatório em produção");
  }

  const app = Fastify({
    logger: process.env.NODE_ENV === "development",
  });

  // Plugins
  const corsOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: isProd ? corsOrigins! : corsOrigins ?? true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-key-change-in-production",
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Sistema de Gestão Educacional API",
        description:
          "API para o Sistema de Gestão Educacional de Ibirapitanga-BA",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: "Servidor de desenvolvimento",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  // Decorator para autenticação
  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ error: "Não autorizado" });
      }
    }
  );

  // Guard global: toda rota /api exige JWT, exceto login.
  // Leituras (GET) são liberadas a qualquer usuário autenticado;
  // escritas seguem a tabela de regras abaixo (primeira que casar vence).
  const PUBLIC_API = new Set(["/api/auth/login"]);
  const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  const GESTAO = ["ADMIN", "SEMEC"];
  const OPERACAO = ["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR", "SECRETARIA"];

  const REGRAS_ESCRITA: Array<{
    pattern: RegExp;
    methods?: string[];
    roles: string[];
  }> = [
    // Vínculos operacionais: aluno/professor em turma, escolas/formações de profissional
    {
      pattern:
        /^\/api\/(turmas\/[^/]+\/(alunos|professores)|profissionais\/[^/]+\/(escolas|formacoes))(\/|$)/,
      roles: OPERACAO,
    },
    // Questionários do censo
    {
      pattern: /^\/api\/(escolas|turmas|profissionais)\/[^/]+\/censo$/,
      roles: OPERACAO,
    },
    // Salas (infraestrutura gerida pela própria escola)
    {
      pattern: /^\/api\/(salas|escolas\/[^/]+\/salas)(\/|$)/,
      roles: OPERACAO,
    },
    // Estrutura da rede e planejamento do projeto
    {
      pattern:
        /^\/api\/(tipos-educacao|etapas|niveis-ensino|series|modules|phases|calendario)(\/|$)/,
      roles: GESTAO,
    },
    // Criação/exclusão de escolas
    { pattern: /^\/api\/escolas(\/|$)/, methods: ["POST", "DELETE"], roles: GESTAO },
    // Exclusão de qualquer outro recurso
    { pattern: /^\/api\//, methods: ["DELETE"], roles: GESTAO },
    // Demais escritas (matrículas, turmas, profissionais, update de escola)
    { pattern: /^\/api\//, roles: OPERACAO },
  ];

  app.addHook("onRequest", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";
    if (!url.startsWith("/api") || PUBLIC_API.has(url)) return;

    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!WRITE_METHODS.has(request.method)) return;

    const regra = REGRAS_ESCRITA.find(
      (r) =>
        r.pattern.test(url) &&
        (r.methods === undefined || r.methods.includes(request.method))
    );
    if (regra) {
      const user = request.user as { role: string };
      if (!regra.roles.includes(user.role)) {
        return reply.status(403).send({ error: "Acesso negado" });
      }
    }
  });

  // Health check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Rotas
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(tiposEducacaoRoutes, { prefix: "/api/tipos-educacao" });
  app.register(etapasRoutes, { prefix: "/api/etapas" });
  app.register(niveisEnsinoRoutes, { prefix: "/api/niveis-ensino" });
  app.register(seriesRoutes, { prefix: "/api/series" });
  app.register(escolasRoutes, { prefix: "/api/escolas" });
  app.register(turmasRoutes, { prefix: "/api/turmas" });
  app.register(matriculasRoutes, { prefix: "/api/matriculas" });
  app.register(profissionaisRoutes, { prefix: "/api/profissionais" });
  app.register(modulesRoutes, { prefix: "/api/modules" });
  app.register(phaseRoutes, { prefix: "/api/phases" });
  app.register(salasRoutes); // sem prefix: usa dois caminhos-base distintos (ver salas.routes.ts)
  app.register(calendarioRoutes, { prefix: "/api/calendario" });

  // Error handler global
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: "Erro de validação",
        details: error.validation,
      });
    }

    return reply.status(error.statusCode || 500).send({
      error: error.message || "Erro interno do servidor",
    });
  });

  return app;
}

// Start server
async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || "3333");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });

    console.log(`
    🚀 Servidor rodando em http://localhost:${port}
    📚 Documentação: http://localhost:${port}/docs
    🏥 Health check: http://localhost:${port}/health
    `);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
