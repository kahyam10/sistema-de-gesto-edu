import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { notaService } from "../services/index.js";
import {
  createNotaSchema,
  lancarNotasTurmaSchema,
  updateNotaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function notasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista notas com filtros
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          turmaId?: string;
          disciplina?: string;
          matriculaId?: string;
          bimestre?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, disciplina, matriculaId, bimestre, page, limit } = request.query;

        const filters: any = {};
        if (turmaId) filters.turmaId = turmaId;
        if (disciplina) filters.disciplina = disciplina;
        if (matriculaId) filters.matriculaId = matriculaId;
        if (bimestre) filters.bimestre = parseInt(bimestre);

        // Suporte a paginação
        if (page && limit) {
          const result = await notaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const notas = await notaService.findAll(filters);
        return reply.send(notas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar notas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria nota individual (para recuperação, por exemplo)
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createNotaSchema.parse(request.body);
        const nota = await notaService.create(body);
        return reply.status(201).send(nota);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca nota por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const nota = await notaService.findById(id);

        if (!nota) {
          return reply.status(404).send({ error: "Nota não encontrada" });
        }

        return reply.send(nota);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Lança notas em lote para uma avaliação
  app.post(
    "/turma",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = lancarNotasTurmaSchema.parse(request.body);
        const resultado = await notaService.lancarNotasTurma(body);
        return reply.status(201).send(resultado);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao lançar notas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza nota individual
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateNotaSchema.parse(request.body);
        const nota = await notaService.update(id, body);
        return reply.send(nota);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove nota
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await notaService.delete(id);
        return reply.send({ message: "Nota removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover nota";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Boletim completo de um aluno
  app.get(
    "/boletim/:matriculaId",
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
        Querystring: { turmaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId } = request.params;
        const { turmaId } = request.query;
        const boletim = await notaService.getBoletim(matriculaId, turmaId);
        return reply.send(boletim);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar boletim";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Média final de um aluno em uma disciplina
  app.get(
    "/media/:matriculaId/:turmaId/:disciplinaId",
    async (
      request: FastifyRequest<{
        Params: {
          matriculaId: string;
          turmaId: string;
          disciplinaId: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, turmaId, disciplinaId } = request.params;
        const media = await notaService.calcularMediaFinal(
          matriculaId,
          turmaId,
          disciplinaId
        );
        return reply.send({ media });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao calcular média";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Situação final de um aluno em uma disciplina
  app.get(
    "/situacao/:matriculaId/:turmaId/:disciplinaId",
    async (
      request: FastifyRequest<{
        Params: {
          matriculaId: string;
          turmaId: string;
          disciplinaId: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, turmaId, disciplinaId } = request.params;
        const situacao = await notaService.getSituacaoFinal(
          matriculaId,
          turmaId,
          disciplinaId
        );
        return reply.send(situacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar situação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
