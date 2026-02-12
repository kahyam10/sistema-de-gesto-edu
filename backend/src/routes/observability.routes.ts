import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

export async function observabilityRoutes(app: FastifyInstance) {
  // Apenas ADMIN pode acessar métricas
  app.addHook("preHandler", authMiddleware);
  app.addHook("preHandler", async (request, reply) => {
    const user = (request as any).user;
    if (user?.role !== "ADMIN") {
      return reply.status(403).send({ error: "Acesso negado" });
    }
  });

  /**
   * GET /api/observability/overview
   * Visão geral do sistema
   */
  app.get("/overview", async (request, reply) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total de requisições (24h)
    const totalRequests24h = await prisma.requestLog.count({
      where: { timestamp: { gte: oneDayAgo } },
    });

    // Erros (24h)
    const errors24h = await prisma.requestLog.count({
      where: {
        timestamp: { gte: oneDayAgo },
        statusCode: { gte: 400 },
      },
    });

    // Taxa de erro
    const errorRate =
      totalRequests24h > 0 ? (errors24h / totalRequests24h) * 100 : 0;

    // Tempo médio de resposta (24h)
    const avgResponse = await prisma.requestLog.aggregate({
      where: { timestamp: { gte: oneDayAgo } },
      _avg: { duration: true },
    });

    // Top 10 rotas mais acessadas (7 dias)
    const topRoutes = await prisma.routeMetrics.groupBy({
      by: ["path", "method"],
      where: { date: { gte: oneWeekAgo } },
      _sum: { totalRequests: true },
      orderBy: { _sum: { totalRequests: "desc" } },
      take: 10,
    });

    // Erros ativos (não resolvidos)
    const activeErrors = await prisma.errorLog.count({
      where: { resolved: false },
    });

    // Erros críticos (não resolvidos)
    const criticalErrors = await prisma.errorLog.count({
      where: { resolved: false, severity: "HIGH" },
    });

    // Última métrica do sistema
    const lastSystemMetric = await prisma.systemMetrics.findFirst({
      orderBy: { timestamp: "desc" },
    });

    return reply.send({
      summary: {
        totalRequests24h,
        errors24h,
        errorRate: errorRate.toFixed(2),
        avgResponseTime: avgResponse._avg.duration?.toFixed(2) || 0,
        activeErrors,
        criticalErrors,
      },
      system: lastSystemMetric || null,
      topRoutes: topRoutes.map((r) => ({
        route: `${r.method} ${r.path}`,
        requests: r._sum.totalRequests,
      })),
    });
  });

  /**
   * GET /api/observability/routes
   * Métricas por rota
   */
  app.get(
    "/routes",
    async (
      request: FastifyRequest<{
        Querystring: {
          days?: string;
          module?: string;
          limit?: string;
        };
      }>,
      reply
    ) => {
      const days = parseInt(request.query.days || "7");
      const module = request.query.module;
      const limit = parseInt(request.query.limit || "50");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const metrics = await prisma.routeMetrics.findMany({
        where: {
          date: { gte: startDate },
          ...(module && { module }),
        },
        orderBy: [
          { date: "desc" },
          { totalRequests: "desc" },
        ],
        take: limit,
      });

      // Agrupa por rota
      const grouped = metrics.reduce((acc, metric) => {
        const key = `${metric.method} ${metric.path}`;
        if (!acc[key]) {
          acc[key] = {
            route: key,
            module: metric.module,
            totalRequests: 0,
            successCount: 0,
            errorCount: 0,
            error4xxCount: 0,
            error5xxCount: 0,
            avgDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
          };
        }

        acc[key].totalRequests += metric.totalRequests;
        acc[key].successCount += metric.successCount;
        acc[key].errorCount += metric.errorCount;
        acc[key].error4xxCount += metric.error4xxCount;
        acc[key].error5xxCount += metric.error5xxCount;
        acc[key].avgDuration =
          (acc[key].avgDuration * (acc[key].totalRequests - metric.totalRequests) +
            metric.avgDuration * metric.totalRequests) /
          acc[key].totalRequests;
        acc[key].minDuration = Math.min(acc[key].minDuration, metric.minDuration);
        acc[key].maxDuration = Math.max(acc[key].maxDuration, metric.maxDuration);

        return acc;
      }, {} as Record<string, any>);

      return reply.send(Object.values(grouped));
    }
  );

  /**
   * GET /api/observability/errors
   * Lista de erros
   */
  app.get(
    "/errors",
    async (
      request: FastifyRequest<{
        Querystring: {
          resolved?: string;
          severity?: string;
          module?: string;
          limit?: string;
        };
      }>,
      reply
    ) => {
      const resolved = request.query.resolved === "true";
      const severity = request.query.severity;
      const module = request.query.module;
      const limit = parseInt(request.query.limit || "100");

      const errors = await prisma.errorLog.findMany({
        where: {
          resolved,
          ...(severity && { severity }),
          ...(module && { module }),
        },
        orderBy: [
          { severity: "desc" },
          { lastSeen: "desc" },
        ],
        take: limit,
      });

      return reply.send(errors);
    }
  );

  /**
   * PUT /api/observability/errors/:id/resolve
   * Marca erro como resolvido
   */
  app.put("/errors/:id/resolve", async (request: any, reply) => {
    const { id } = request.params;
    const { notes } = request.body || {};
    const user = request.user;

    const error = await prisma.errorLog.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: user.id,
        notes,
      },
    });

    return reply.send(error);
  });

  /**
   * GET /api/observability/logs
   * Logs de requisições
   */
  app.get(
    "/logs",
    async (
      request: FastifyRequest<{
        Querystring: {
          hours?: string;
          method?: string;
          module?: string;
          statusCode?: string;
          limit?: string;
        };
      }>,
      reply
    ) => {
      const hours = parseInt(request.query.hours || "24");
      const method = request.query.method;
      const module = request.query.module;
      const statusCode = request.query.statusCode
        ? parseInt(request.query.statusCode)
        : undefined;
      const limit = parseInt(request.query.limit || "1000");

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const logs = await prisma.requestLog.findMany({
        where: {
          timestamp: { gte: startTime },
          ...(method && { method }),
          ...(module && { module }),
          ...(statusCode && { statusCode }),
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return reply.send(logs);
    }
  );

  /**
   * GET /api/observability/timeline
   * Série temporal de métricas
   */
  app.get(
    "/timeline",
    async (
      request: FastifyRequest<{
        Querystring: {
          days?: string;
        };
      }>,
      reply
    ) => {
      const days = parseInt(request.query.days || "7");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const metrics = await prisma.routeMetrics.findMany({
        where: { date: { gte: startDate } },
      });

      // Agrupa por dia
      const timeline = metrics.reduce((acc, metric) => {
        const dateKey = metric.date.toISOString().split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            totalRequests: 0,
            successCount: 0,
            errorCount: 0,
            error4xxCount: 0,
            error5xxCount: 0,
            avgDuration: 0,
          };
        }

        acc[dateKey].totalRequests += metric.totalRequests;
        acc[dateKey].successCount += metric.successCount;
        acc[dateKey].errorCount += metric.errorCount;
        acc[dateKey].error4xxCount += metric.error4xxCount;
        acc[dateKey].error5xxCount += metric.error5xxCount;

        // Recalcula média ponderada
        const oldTotal =
          acc[dateKey].totalRequests - metric.totalRequests;
        const oldAvg = acc[dateKey].avgDuration;
        acc[dateKey].avgDuration =
          (oldAvg * oldTotal + metric.avgDuration * metric.totalRequests) /
          acc[dateKey].totalRequests;

        return acc;
      }, {} as Record<string, any>);

      return reply.send(Object.values(timeline).sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
      ));
    }
  );

  /**
   * GET /api/observability/modules
   * Estatísticas por módulo
   */
  app.get("/modules", async (request, reply) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const modules = await prisma.requestLog.groupBy({
      by: ["module"],
      where: {
        timestamp: { gte: oneDayAgo },
        module: { not: null },
      },
      _count: { id: true },
      _avg: { duration: true },
    });

    // Erros por módulo
    const errors = await prisma.requestLog.groupBy({
      by: ["module"],
      where: {
        timestamp: { gte: oneDayAgo },
        statusCode: { gte: 400 },
        module: { not: null },
      },
      _count: { id: true },
    });

    const errorMap = new Map(errors.map((e) => [e.module, e._count.id]));

    const result = modules.map((m) => ({
      module: m.module,
      requests: m._count.id,
      errors: errorMap.get(m.module) || 0,
      errorRate: m._count.id > 0 ? ((errorMap.get(m.module) || 0) / m._count.id) * 100 : 0,
      avgDuration: m._avg.duration?.toFixed(2) || 0,
    }));

    return reply.send(result);
  });

  /**
   * DELETE /api/observability/logs
   * Limpa logs antigos (mais de 30 dias)
   */
  app.delete("/logs/cleanup", async (request, reply) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.requestLog.deleteMany({
      where: {
        timestamp: { lt: thirtyDaysAgo },
      },
    });

    return reply.send({ deleted: deleted.count });
  });
}
