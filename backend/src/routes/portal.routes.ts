import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError, BusinessError, formatarErroZod } from "../errors/index.js";
import { ZodError } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { portalService } from "../services/portal.service.js";
import { periodoPortalSchema, resumoPortalQuerySchema } from "../schemas/index.js";
import { prisma } from "../lib/prisma.js";

type TokenUser = { id: string; role: string };

/**
 * Módulo 3 — Portais por papel. Identidade SEMPRE derivada de request.user
 * (JWT); nunca de params/query. O escopo do responsável é garantido no
 * service (validarVinculo → PERM_005).
 */
export async function portalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/portal/professor/resumo — turmas, aulas de hoje e pendências do profissional logado
  app.get(
    "/professor/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo do portal do professor",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as TokenUser;
        return reply.status(200).send(await portalService.resumoProfessor(user.id));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao carregar portal do professor";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/portal/meu/alunos — matrículas vinculadas ao usuário logado
  app.get(
    "/meu/alunos",
    {
      schema: {
        tags: ["Portal"],
        summary: "Matrículas (alunos) vinculadas ao usuário logado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as TokenUser;
        return reply.status(200).send(await portalService.alunosDoUsuario(user.id));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao listar alunos vinculados";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/portal/meu/alunos/:matriculaId/boletim — boletim do aluno vinculado (PERM_005)
  app.get(
    "/meu/alunos/:matriculaId/boletim",
    {
      schema: {
        tags: ["Portal"],
        summary: "Boletim de um aluno vinculado ao usuário logado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        return reply
          .status(200)
          .send(await portalService.boletimAluno(user.id, request.params.matriculaId));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao carregar boletim do aluno";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/portal/meu/alunos/:matriculaId/frequencia?dataInicio&dataFim — frequência do aluno vinculado
  app.get(
    "/meu/alunos/:matriculaId/frequencia",
    {
      schema: {
        tags: ["Portal"],
        summary: "Frequência de um aluno vinculado ao usuário logado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
        Querystring: { dataInicio?: string; dataFim?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        const { dataInicio, dataFim } = periodoPortalSchema.parse(request.query);
        return reply
          .status(200)
          .send(
            await portalService.frequenciaAluno(
              user.id,
              request.params.matriculaId,
              dataInicio,
              dataFim
            )
          );
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao carregar frequência do aluno";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/portal/diretor/resumo?anoLetivo — sempre a escola do usuário (GESTAO pode passar ?escolaId)
  app.get(
    "/diretor/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo do portal do diretor (indicadores da escola)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { anoLetivo?: string; escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        const query = resumoPortalQuerySchema.parse(request.query);
        const anoLetivo = query.anoLetivo ?? new Date().getFullYear();
        // GESTAO pode inspecionar qualquer escola; demais papéis usam a própria (lookup no banco, padrão F3)
        const escolaId =
          ["ADMIN", "SEMEC"].includes(user.role) && query.escolaId
            ? query.escolaId
            : (
                await prisma.user.findUnique({
                  where: { id: user.id },
                  select: { escolaId: true },
                })
              )?.escolaId;
        if (!escolaId) throw new BusinessError("BIZ_023");
        return reply.status(200).send(await portalService.resumoEscola(escolaId, anoLetivo));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao carregar portal do diretor";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/portal/coordenacao/resumo?anoLetivo&escolaId — mesmo resumoEscola do diretor
  // (a tela é que muda no frontend)
  app.get(
    "/coordenacao/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo do portal da coordenação (indicadores da escola)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { anoLetivo?: string; escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        const query = resumoPortalQuerySchema.parse(request.query);
        const anoLetivo = query.anoLetivo ?? new Date().getFullYear();
        const escolaId =
          ["ADMIN", "SEMEC"].includes(user.role) && query.escolaId
            ? query.escolaId
            : (
                await prisma.user.findUnique({
                  where: { id: user.id },
                  select: { escolaId: true },
                })
              )?.escolaId;
        if (!escolaId) throw new BusinessError("BIZ_023");
        return reply.status(200).send(await portalService.resumoEscola(escolaId, anoLetivo));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao carregar portal da coordenação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/portal/semec/resumo?anoLetivo — consolidado municipal
  app.get(
    "/semec/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo municipal do portal da SEMEC",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { anoLetivo?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivo } = resumoPortalQuerySchema.parse(request.query);
        return reply
          .status(200)
          .send(await portalService.resumoSemec(anoLetivo ?? new Date().getFullYear()));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error ? error.message : "Erro ao carregar portal da SEMEC";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
