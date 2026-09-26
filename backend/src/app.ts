import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { errorHandler } from "./middleware/error-handler.js";
import { prisma } from "./lib/prisma.js";
import { configurarZodPtBr } from "./lib/zod-pt-br.js";
import { PUBLIC_API, WRITE_METHODS, autorizar } from "./lib/rbac.js";
import { COOKIE_ACCESS, HEADER_CSRF, csrfConfere } from "./lib/sessao.js";
import { contextoAcesso, contextoAtual } from "./lib/contexto.js";
import { calcularEscopo } from "./lib/escopo-usuario.js";
import { minimizarParaProfessor } from "./lib/minimizacao.js";
import {
  RECURSOS_DO_PROFESSOR,
  professorLecionaNaTurma,
  profissionalDoUsuario,
  turmaAlvo,
} from "./lib/propriedade-professor.js";

// Mensagens de validação zod em PT-BR (antes de qualquer parse)
configurarZodPtBr();

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
// Documentos da matrícula (upload de arquivos)
import { documentosMatriculaRoutes } from "./routes/documentos-matricula.routes.js";
// Módulo 3 — Portais por papel
import { portalRoutes } from "./routes/portal.routes.js";
// Módulo 6 — Alimentação Escolar
import { cardapioRoutes } from "./routes/cardapio.routes.js";
import { estoqueRoutes } from "./routes/estoque.routes.js";
import { refeicaoRoutes } from "./routes/refeicao.routes.js";
// Módulo 7 — Transporte Escolar
import { veiculoRoutes } from "./routes/veiculo.routes.js";
import { motoristaRoutes } from "./routes/motorista.routes.js";
import { rotaTransporteRoutes } from "./routes/rota-transporte.routes.js";
import { manutencaoRoutes } from "./routes/manutencao.routes.js";
// Módulo 8 — Gestão Democrática
import { colegiadoRoutes } from "./routes/colegiado.routes.js";
import { gremioRoutes } from "./routes/gremio.routes.js";
import { liderTurmaRoutes } from "./routes/lider-turma.routes.js";
import { reuniaoDemocraticaRoutes } from "./routes/reuniao-democratica.routes.js";
// Exportadores oficiais (Educacenso / Sistema Presença)
import { exportacaoRoutes } from "./routes/exportacao.routes.js";
// Trilha de auditoria (LGPD)
import { auditoriaRoutes } from "./routes/auditoria.routes.js";
// Avaliações (provas/trabalhos) — usadas no lançamento de notas
import { avaliacoesRoutes } from "./routes/avaliacoes.routes.js";

export async function buildApp() {
  const isProd = process.env.NODE_ENV === "production";

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET é obrigatório (mínimo 32 caracteres) — defina no .env");
  }
  if (isProd && !process.env.CORS_ORIGIN) {
    throw new Error("CORS_ORIGIN é obrigatório em produção");
  }

  const app = Fastify({
    logger: process.env.NODE_ENV === "development",
    // Atrás do proxy do Coolify o IP real vem no X-Forwarded-For. Sem isso o
    // rate limit enxergaria todos os usuários como um único IP (o do proxy).
    // TRUST_PROXY = número de proxies confiáveis à frente da API (ex.: 1).
    trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false,
    ajv: {
      customOptions: {
        strict: false, // Permite keywords de documentação como 'example' nos schemas
      },
    },
  });

  // Contexto de acesso por requisição (AsyncLocalStorage). Precisa ser o
  // PRIMEIRO hook e no estilo callback: tudo o que roda depois (outros hooks,
  // handler, services, Prisma) herda o mesmo contexto.
  app.addHook("onRequest", (_request, _reply, done) => {
    contextoAcesso.run({ cache: new Map() }, done);
  });

  // Plugins
  const corsOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cors, {
    // Com cookies de sessão, refletir qualquer origem deixaria sites de
    // terceiros lerem respostas autenticadas: fora de produção o padrão é o dashboard local.
    origin: isProd ? corsOrigins! : corsOrigins ?? ["http://localhost:3050"],
    credentials: true,
    // Nome de arquivo dos downloads (exportadores/documentos) visível cross-origin
    exposedHeaders: ["Content-Disposition"],
  });

  // Rate limiting global (proteção básica contra abuso/brute-force)
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
  });

  // Upload multipart (documentos da matrícula): 10MB, 1 arquivo por request
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret: jwtSecret,
    sign: {
      // Tokens curtos; a sessão web se renova via /api/auth/refresh (lib/sessao.ts)
      expiresIn: `${Number(process.env.ACCESS_TOKEN_MINUTOS ?? 15)}m`,
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
            url: `http://localhost:${process.env.PORT || 3051}`,
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

  // O guard global (abaixo) já autentica toda rota /api e preenche request.user;
  // este decorator só garante que a rota não seja usada sem usuário.
  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.status(401).send({ error: "Não autorizado" });
      }
    }
  );

  // Guard global: toda rota /api exige JWT, exceto login.
  // Tabelas e decisão de autorização em lib/rbac.ts (função pura testável);
  // apenas a checagem de propriedade do DIRETOR (consulta o banco) fica aqui.
  app.addHook("onRequest", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";
    if (!url.startsWith("/api") || PUBLIC_API.has(url)) return;

    // Duas formas de autenticar:
    // - cookie httpOnly (dashboard web) → escritas exigem o header X-CSRF-Token
    // - Authorization: Bearer (app mobile/integrações) → sem CSRF: o navegador
    //   nunca anexa esse header sozinho, então não há requisição forjada
    let viaCookie = false;
    try {
      if (request.headers.authorization?.startsWith("Bearer ")) {
        await request.jwtVerify();
      } else {
        const token = request.cookies[COOKIE_ACCESS];
        if (!token) {
          return reply.status(401).send({ error: "Não autorizado" });
        }
        request.user = app.jwt.verify(token);
        viaCookie = true;
      }
    } catch {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    const userToken = request.user;

    // Escopo de dados: direção/coordenação/secretaria → própria escola;
    // professor → próprias turmas. Aplicado pela extensão do Prisma (lib/escopo.ts).
    const ctx = contextoAtual();
    if (ctx) {
      ctx.papel = userToken.role;
      ctx.escopo = await calcularEscopo(userToken);
    }

    if (
      viaCookie &&
      WRITE_METHODS.has(request.method) &&
      !csrfConfere(userToken.csrf, request.headers[HEADER_CSRF])
    ) {
      return reply
        .status(403)
        .send({ error: "Token CSRF ausente ou inválido", code: "CSRF" });
    }

    // Propriedade: DIRETOR só escreve na PRÓPRIA escola
    // (cobre /api/escolas/:id, /api/escolas/:id/censo e /api/escolas/:id/salas*)
    if (WRITE_METHODS.has(request.method) && userToken.role === "DIRETOR") {
      const escolaMatch = url.match(/^\/api\/escolas\/([^/]+)/);
      if (escolaMatch) {
        const usuario = await prisma.user.findUnique({
          where: { id: userToken.id },
          select: { escolaId: true },
        });
        if (!usuario?.escolaId || usuario.escolaId !== escolaMatch[1]) {
          return reply
            .status(403)
            .send({ error: "Diretores só podem alterar a própria escola" });
        }
      }
    }

    if (autorizar(url, request.method, userToken) === "NEGADO") {
      return reply.status(403).send({ error: "Acesso negado" });
    }
  });

  // Propriedade da turma para PROFESSOR (precisa do corpo já parseado → preHandler).
  // Só lança frequência/notas/avaliações/grade nas turmas em que leciona.
  app.addHook("preHandler", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";
    if (request.user?.role !== "PROFESSOR") return;
    if (!WRITE_METHODS.has(request.method) || !RECURSOS_DO_PROFESSOR.test(url)) return;

    const profissionalId = await profissionalDoUsuario(request.user.id);
    const body = (request.body ?? undefined) as Record<string, unknown> | undefined;
    const turmaId = await turmaAlvo(url, request.method, body);
    if (!profissionalId || !turmaId || !(await professorLecionaNaTurma(profissionalId, turmaId))) {
      return reply
        .status(403)
        .send({ error: "Professores só podem lançar dados nas próprias turmas", code: "PERM_TURMA" });
    }
    // Avaliação criada pelo professor é sempre dele (ignora profissionalId do corpo)
    if (url === "/api/avaliacoes" && request.method === "POST" && body) {
      body.profissionalId = profissionalId;
    }
  });

  // Minimização na resposta: professor não recebe CPF, NIS, endereço etc.
  app.addHook("preSerialization", async (request, _reply, payload) => {
    if (request.user?.role === "PROFESSOR" && payload && typeof payload === "object") {
      return minimizarParaProfessor(payload);
    }
    return payload;
  });

  // Health check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Rotas
  // Respostas de ERRO têm um formato único, montado pelo errorHandler
  // ({ statusCode, error, message, issues } ou o envelope de AppError). Os
  // schemas 4xx/5xx antigos declaravam só { error: string } e o serializador
  // descartava (ou corrompia) o resto. Aqui eles viram "objeto livre",
  // mantendo a descrição para a documentação.
  app.addHook("onRoute", (rota) => {
    const resposta = rota.schema?.response as Record<string, { description?: string }> | undefined;
    if (!resposta) return;
    for (const status of Object.keys(resposta)) {
      if (/^[45]/.test(status)) {
        resposta[status] = { description: resposta[status]?.description, type: "object", additionalProperties: true } as never;
      }
    }
  });

  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(tiposEducacaoRoutes, { prefix: "/api/tipos-educacao" });
  app.register(etapasRoutes, { prefix: "/api/etapas" });
  app.register(niveisEnsinoRoutes, { prefix: "/api/niveis-ensino" });
  app.register(seriesRoutes, { prefix: "/api/series" });
  app.register(escolasRoutes, { prefix: "/api/escolas" });
  app.register(turmasRoutes, { prefix: "/api/turmas" });
  app.register(matriculasRoutes, { prefix: "/api/matriculas" });
  // Documentos da matrícula (upload) — mesmo prefixo de matrículas
  app.register(documentosMatriculaRoutes, { prefix: "/api/matriculas" });
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
  // Módulo 3 — Portais por papel
  app.register(portalRoutes, { prefix: "/api/portal" });
  // Módulo 6 — Alimentação Escolar
  app.register(cardapioRoutes, { prefix: "/api/cardapios" });
  app.register(estoqueRoutes, { prefix: "/api/estoque" });
  app.register(refeicaoRoutes, { prefix: "/api/refeicoes" });
  // Módulo 7 — Transporte Escolar
  app.register(veiculoRoutes, { prefix: "/api/veiculos" });
  app.register(motoristaRoutes, { prefix: "/api/motoristas" });
  app.register(rotaTransporteRoutes, { prefix: "/api/rotas-transporte" });
  app.register(manutencaoRoutes, { prefix: "/api/manutencoes" });
  // Módulo 8 — Gestão Democrática
  app.register(colegiadoRoutes, { prefix: "/api/colegiados" });
  app.register(gremioRoutes, { prefix: "/api/gremios" });
  app.register(liderTurmaRoutes, { prefix: "/api/lideres-turma" });
  app.register(reuniaoDemocraticaRoutes, { prefix: "/api/reunioes-democraticas" });
  // Exportadores oficiais (Educacenso / Sistema Presença)
  app.register(exportacaoRoutes, { prefix: "/api/exportacao" });
  // Trilha de auditoria (somente leitura, GESTAO)
  app.register(auditoriaRoutes, { prefix: "/api/auditoria" });
  app.register(avaliacoesRoutes, { prefix: "/api/avaliacoes" });

  // Error handler global estruturado (AppError + Zod + Prisma → HTTP corretos)
  app.setErrorHandler(errorHandler);

  return app;
}
