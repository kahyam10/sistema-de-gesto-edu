import { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatarErroZod } from "../errors/index.js";

// Consulta da trilha de auditoria — leitura restrita a ADMIN/SEMEC (lib/rbac.ts).
// Somente leitura: não existe rota de edição ou exclusão de eventos.
const consultaSchema = z.object({
  acao: z.string().max(60).optional(),
  userId: z.string().max(40).optional(),
  recurso: z.string().max(60).optional(),
  recursoId: z.string().max(40).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function auditoriaRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const q = consultaSchema.parse(request.query);
      const where = {
        acao: q.acao,
        userId: q.userId,
        recurso: q.recurso,
        recursoId: q.recursoId,
        createdAt:
          q.dataInicio || q.dataFim ? { gte: q.dataInicio, lte: q.dataFim } : undefined,
      };
      const [total, eventos] = await prisma.$transaction([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: { user: { select: { id: true, nome: true, email: true } } },
        }),
      ]);
      return reply.send({
        data: eventos,
        pagination: {
          page: q.page,
          limit: q.limit,
          total,
          totalPages: Math.ceil(total / q.limit),
        },
      });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.status(400).send(formatarErroZod(error));
      }
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao consultar auditoria" });
    }
  });
}
