import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
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
} from "./routes/index.js";
import { calendarioRoutes } from "./routes/calendario.routes.js";

// Types are imported via triple-slash reference in the .d.ts file
// No need to import them here

async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV === "development",
  });

  // Plugins
  await app.register(cors, {
    origin: true, // Em produção, especificar domínios permitidos
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-key-change-in-production",
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
  app.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Não autorizado" });
    }
  });

  // Health check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
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
  app.register(configuracaoAvaliacaoRoutes, { prefix: "/api/configuracao-avaliacao" });
  app.register(avaliacoesRoutes, { prefix: "/api/avaliacoes" });
  app.register(notasRoutes, { prefix: "/api/notas" });
  app.register(pontosRoutes, { prefix: "/api/pontos" });
  app.register(licencasRoutes, { prefix: "/api/licencas" });

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
