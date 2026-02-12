import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

/**
 * Extrai módulo da rota
 * Ex: /api/matriculas -> MATRICULAS
 */
function extractModule(path: string): string | null {
  const match = path.match(/\/api\/([^\/]+)/);
  if (match) {
    return match[1].toUpperCase().replace(/-/g, "_");
  }
  return null;
}

/**
 * Determina severidade do erro baseado no status code
 */
function getErrorSeverity(statusCode: number): string {
  if (statusCode >= 500) return "HIGH";
  if (statusCode >= 400) return "MEDIUM";
  return "LOW";
}

/**
 * Middleware de observabilidade
 * Coleta métricas de cada requisição
 */
export async function observabilityPlugin(app: FastifyInstance) {
  // Hook que executa antes de cada request
  app.addHook("onRequest", async (request, reply) => {
    // Armazena timestamp de início
    (request as any).startTime = Date.now();
  });

  // Hook que executa após cada response
  app.addHook("onResponse", async (request, reply) => {
    try {
      const startTime = (request as any).startTime as number;
      const duration = Date.now() - startTime;
      const path = request.url.split("?")[0]; // Remove query string
      const query = request.url.includes("?")
        ? request.url.split("?")[1]
        : null;
      const module = extractModule(path);

      // Extrai informações do usuário (se autenticado)
      let userId: string | undefined;
      let userEmail: string | undefined;
      let userRole: string | undefined;

      try {
        const user = (request as any).user;
        if (user) {
          userId = user.id;
          userEmail = user.email;
          userRole = user.role;
        }
      } catch {
        // Usuário não autenticado
      }

      // Ignora rotas de health check e docs
      if (
        path === "/health" ||
        path.startsWith("/docs") ||
        path.startsWith("/uploads")
      ) {
        return;
      }

      // Registra log da requisição (async, não bloqueia resposta)
      setImmediate(async () => {
        try {
          await prisma.requestLog.create({
            data: {
              method: request.method,
              path,
              query,
              statusCode: reply.statusCode,
              duration,
              timestamp: new Date(),
              userId,
              userEmail,
              userRole,
              ip: request.ip,
              userAgent: request.headers["user-agent"],
              module,
            },
          });

          // Atualiza métricas agregadas (assíncrono)
          await updateRouteMetrics(
            request.method,
            path,
            module,
            duration,
            reply.statusCode
          );

          // Se for erro, registra erro específico
          if (reply.statusCode >= 400) {
            await logError(
              request,
              reply,
              path,
              module,
              userId,
              reply.statusCode
            );
          }
        } catch (error) {
          // Erro no logging não deve quebrar a aplicação
          console.error("[Observability] Error logging request:", error);
        }
      });
    } catch (error) {
      // Falha crítica no observability não deve quebrar a request
      console.error("[Observability] Critical error:", error);
    }
  });
}

/**
 * Atualiza métricas agregadas por rota
 */
async function updateRouteMetrics(
  method: string,
  path: string,
  module: string | null,
  duration: number,
  statusCode: number
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSuccess = statusCode >= 200 && statusCode < 400;
  const is4xx = statusCode >= 400 && statusCode < 500;
  const is5xx = statusCode >= 500;

  // Busca métrica existente do dia
  const existing = await prisma.routeMetrics.findUnique({
    where: {
      method_path_date: {
        method,
        path,
        date: today,
      },
    },
  });

  if (existing) {
    // Atualiza métrica existente
    const newTotal = existing.totalRequests + 1;
    const newAvg =
      (existing.avgDuration * existing.totalRequests + duration) / newTotal;

    await prisma.routeMetrics.update({
      where: { id: existing.id },
      data: {
        totalRequests: newTotal,
        successCount: existing.successCount + (isSuccess ? 1 : 0),
        errorCount: existing.errorCount + (isSuccess ? 0 : 1),
        error4xxCount: existing.error4xxCount + (is4xx ? 1 : 0),
        error5xxCount: existing.error5xxCount + (is5xx ? 1 : 0),
        avgDuration: newAvg,
        minDuration: Math.min(existing.minDuration, duration),
        maxDuration: Math.max(existing.maxDuration, duration),
      },
    });
  } else {
    // Cria nova métrica
    await prisma.routeMetrics.create({
      data: {
        method,
        path,
        module,
        date: today,
        totalRequests: 1,
        successCount: isSuccess ? 1 : 0,
        errorCount: isSuccess ? 0 : 1,
        error4xxCount: is4xx ? 1 : 0,
        error5xxCount: is5xx ? 1 : 0,
        avgDuration: duration,
        minDuration: duration,
        maxDuration: duration,
      },
    });
  }
}

/**
 * Registra erro específico
 */
async function logError(
  request: FastifyRequest,
  reply: FastifyReply,
  path: string,
  module: string | null,
  userId: string | undefined,
  statusCode: number
) {
  const severity = getErrorSeverity(statusCode);
  const message = `${request.method} ${path} - ${statusCode}`;

  // Busca erro similar existente
  const existing = await prisma.errorLog.findFirst({
    where: {
      message,
      module,
      resolved: false,
    },
  });

  if (existing) {
    // Incrementa contador de erro existente
    await prisma.errorLog.update({
      where: { id: existing.id },
      data: {
        count: existing.count + 1,
        lastSeen: new Date(),
      },
    });
  } else {
    // Cria novo registro de erro
    await prisma.errorLog.create({
      data: {
        type: statusCode >= 500 ? "API_ERROR" : "CLIENT_ERROR",
        severity,
        module,
        message,
        path,
        method: request.method,
        userId,
      },
    });
  }
}

/**
 * Coleta métricas do sistema
 * Deve ser chamado periodicamente (ex: a cada minuto)
 */
export async function collectSystemMetrics() {
  const uptime = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

  // Calcula requests por minuto (última hora)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentRequests = await prisma.requestLog.count({
    where: {
      timestamp: {
        gte: oneMinuteAgo,
      },
    },
  });

  // Calcula tempo médio de resposta (última hora)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentMetrics = await prisma.requestLog.aggregate({
    where: {
      timestamp: {
        gte: oneHourAgo,
      },
    },
    _avg: {
      duration: true,
    },
  });

  // Calcula taxa de erro (última hora)
  const totalRecent = await prisma.requestLog.count({
    where: {
      timestamp: {
        gte: oneHourAgo,
      },
    },
  });

  const errorsRecent = await prisma.requestLog.count({
    where: {
      timestamp: {
        gte: oneHourAgo,
      },
      statusCode: {
        gte: 400,
      },
    },
  });

  const errorRate = totalRecent > 0 ? (errorsRecent / totalRecent) * 100 : 0;

  // Determina status do sistema
  let status = "HEALTHY";
  if (errorRate > 10 || memoryUsage > 1000) {
    status = "DEGRADED";
  }
  if (errorRate > 50 || memoryUsage > 2000) {
    status = "DOWN";
  }

  // Salva métricas
  await prisma.systemMetrics.create({
    data: {
      uptime,
      memoryUsage,
      cpuUsage: 0, // TODO: Implementar coleta de CPU
      dbConnections: 0, // TODO: Implementar contagem de conexões
      dbQueryTime: 0, // TODO: Implementar tempo de query
      requestsPerMin: recentRequests,
      avgResponseTime: recentMetrics._avg.duration || 0,
      errorRate,
      status,
    },
  });

  return status;
}
