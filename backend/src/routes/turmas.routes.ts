import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { turmaService } from "../services/index.js";
import {
  createTurmaSchema,
  updateTurmaSchema,
  addAlunoTurmaSchema,
  addProfessorTurmaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface TurmaFilters {
  escolaId?: string;
  anoLetivo?: string;
  ativo?: string;
  page?: string;
  limit?: string;
}

export async function turmasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Relatório de vagas por escola
  app.get(
    "/relatorios/vagas",
    async (
      request: FastifyRequest<{
        Querystring: { escolaId?: string; anoLetivo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo } = request.query;
        const resumo = await turmaService.getVagasResumo(
          escolaId,
          anoLetivo ? parseInt(anoLetivo) : undefined
        );
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de vagas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Listar todas as turmas
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: TurmaFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo, ativo, page, limit } = request.query;
        const filters: {
          escolaId?: string;
          anoLetivo?: number;
          ativo?: boolean;
        } = {};

        if (escolaId) filters.escolaId = escolaId;
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (ativo !== undefined) filters.ativo = ativo === "true";

        // Suporte a paginação
        if (page && limit) {
          const result = await turmaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const turmas = await turmaService.findAll(filters);
        return reply.send(turmas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar turmas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar turma por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const turma = await turmaService.findById(id);

        if (!turma) {
          return reply.status(404).send({ error: "Turma não encontrada" });
        }

        return reply.send(turma);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar turma";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar estatísticas da turma
  app.get(
    "/:id/estatisticas",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const estatisticas = await turmaService.getEstatisticas(id);

        if (!estatisticas) {
          return reply.status(404).send({ error: "Turma não encontrada" });
        }

        return reply.send(estatisticas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar estatísticas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar turmas por escola
  app.get(
    "/escola/:escolaId",
    async (
      request: FastifyRequest<{
        Params: { escolaId: string };
        Querystring: { anoLetivo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;
        const { anoLetivo } = request.query;
        const turmas = await turmaService.findByEscola(
          escolaId,
          anoLetivo ? parseInt(anoLetivo) : undefined
        );
        return reply.send(turmas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar turmas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar turma
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createTurmaSchema.parse(request.body);
      const turma = await turmaService.create(data);
      return reply.status(201).send(turma);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar turma";
      return reply.status(400).send({ error: message });
    }
  });

  // Atualizar turma
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateTurmaSchema.parse(request.body);
        const turma = await turmaService.update(id, data);
        return reply.send(turma);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar turma
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await turmaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar aluno à turma
  app.post(
    "/:id/alunos",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = addAlunoTurmaSchema.parse(request.body);
        const matricula = await turmaService.addAluno(id, data.matriculaId);
        return reply.status(201).send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar aluno";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover aluno da turma
  app.delete(
    "/:id/alunos/:matriculaId",
    async (
      request: FastifyRequest<{ Params: { id: string; matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, matriculaId } = request.params;
        await turmaService.removeAluno(id, matriculaId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover aluno";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar professor à turma
  app.post(
    "/:id/professores",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = addProfessorTurmaSchema.parse(request.body);
        const professor = await turmaService.addProfessor(
          id,
          data.profissionalId,
          data.tipo,
          data.disciplina
        );
        return reply.status(201).send(professor);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao adicionar professor";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover professor da turma
  app.delete(
    "/:id/professores/:profissionalId",
    async (
      request: FastifyRequest<{
        Params: { id: string; profissionalId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, profissionalId } = request.params;
        await turmaService.removeProfessor(id, profissionalId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover professor";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
