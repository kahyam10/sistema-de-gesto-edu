import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { errorHandler } from "./middleware/error-handler.js";

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
// Módulo 2 — Gestão Pedagógica
import { frequenciaRoutes } from "./routes/frequencia.routes.js";
import { notasRoutes } from "./routes/notas.routes.js";
import { disciplinasRoutes } from "./routes/disciplinas.routes.js";
import { configuracaoAvaliacaoRoutes } from "./routes/configuracao-avaliacao.routes.js";
import { gradeHorariaRoutes } from "./routes/grade-horaria.routes.js";
// Módulo 5 — Programas Especiais
import { buscaAtivaRoutes } from "./routes/busca-ativa.routes.js";
import { aeeRoutes } from "./routes/aee.routes.js";
import { acompanhamentoRoutes } from "./routes/acompanhamento.routes.js";
// Módulo 9 — Comunicação e Eventos
import { comunicadoRoutes } from "./routes/comunicado.routes.js";
import { notificacaoRoutes } from "./routes/notificacao.routes.js";
import { plantaoPedagogicoRoutes } from "./routes/plantao-pedagogico.routes.js";
import { reuniaoPaisRoutes } from "./routes/reuniao-pais.routes.js";
// Módulo 4 — RH
import { pontosRoutes } from "./routes/pontos.routes.js";
import { licencasRoutes } from "./routes/licencas.routes.js";

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
    ajv: {
      customOptions: {
        strict: false, // Permite keywords de documentação como 'example' nos schemas
      },
    },
  });

  // Plugins
  const corsOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: isProd ? corsOrigins! : corsOrigins ?? true,
    credentials: true,
  });

  // Rate limiting global (proteção básica contra abuso/brute-force)
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-key-change-in-production",
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  });

  // Swagger documentation — apenas fora de produção (rotas /docs são públicas)
  if (!isProd) {
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
  }

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
  // Professores lançam frequência, notas e consultam/gerem sua grade
  const PEDAGOGICO = [...OPERACAO, "PROFESSOR"];
  // Ações pessoais (recibos de leitura) valem para qualquer autenticado
  const TODOS = [...PEDAGOGICO, "USER"];

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
    // Pedagógico: professores lançam frequência/notas/avaliações e grade
    {
      pattern: /^\/api\/(frequencia|notas|grade-horaria)(\/|$)/,
      roles: PEDAGOGICO,
    },
    // Programas especiais: busca ativa, AEE e acompanhamento (equipe + professores AEE)
    {
      pattern: /^\/api\/(busca-ativa|aee|acompanhamento)(\/|$)/,
      roles: PEDAGOGICO,
    },
    // Recibos de leitura/confirmação: qualquer usuário autenticado
    {
      pattern:
        /^\/api\/(notificacoes\/([^/]+\/marcar-lida|usuario\/[^/]+\/marcar-todas-lidas)|comunicados\/[^/]+\/confirmar)$/,
      roles: TODOS,
    },
    // Comunicação e eventos: escrita pela equipe pedagógica
    {
      pattern:
        /^\/api\/(comunicados|notificacoes|plantoes-pedagogicos|reunioes-pais)(\/|$)/,
      roles: PEDAGOGICO,
    },
    // Estrutura pedagógica (disciplinas e regras de avaliação) = gestão
    {
      pattern: /^\/api\/(disciplinas|configuracao-avaliacao)(\/|$)/,
      roles: GESTAO,
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
  // Módulo 2 — Gestão Pedagógica
  app.register(frequenciaRoutes, { prefix: "/api/frequencia" });
  app.register(notasRoutes, { prefix: "/api/notas" });
  app.register(disciplinasRoutes, { prefix: "/api/disciplinas" });
  app.register(configuracaoAvaliacaoRoutes, { prefix: "/api/configuracao-avaliacao" });
  app.register(gradeHorariaRoutes, { prefix: "/api/grade-horaria" });
  // Módulo 5 — Programas Especiais
  app.register(buscaAtivaRoutes, { prefix: "/api/busca-ativa" });
  app.register(aeeRoutes, { prefix: "/api/aee" });
  app.register(acompanhamentoRoutes, { prefix: "/api/acompanhamento" });
  // Módulo 9 — Comunicação e Eventos
  app.register(comunicadoRoutes, { prefix: "/api/comunicados" });
  app.register(notificacaoRoutes, { prefix: "/api/notificacoes" });
  app.register(plantaoPedagogicoRoutes, { prefix: "/api/plantoes-pedagogicos" });
  app.register(reuniaoPaisRoutes, { prefix: "/api/reunioes-pais" });
  // Módulo 4 — RH
  app.register(pontosRoutes, { prefix: "/api/pontos" });
  app.register(licencasRoutes, { prefix: "/api/licencas" });

  // Error handler global estruturado (AppError + Zod + Prisma → HTTP corretos)
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
