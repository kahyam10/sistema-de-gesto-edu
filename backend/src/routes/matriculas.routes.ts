import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { matriculaService } from "../services/index.js";
import {
  createMatriculaSchema,
  updateMatriculaSchema,
} from "../schemas/index.js";

interface MatriculaFilters {
  escolaId?: string;
  etapaId?: string;
  turmaId?: string;
  anoLetivo?: string;
  status?: string;
}

export async function matriculasRoutes(app: FastifyInstance) {
  // Listar todas as matrículas
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: MatriculaFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, etapaId, turmaId, anoLetivo, status } = request.query;
        const filters: {
          escolaId?: string;
          etapaId?: string;
          turmaId?: string;
          anoLetivo?: number;
          status?: string;
        } = {};

        if (escolaId) filters.escolaId = escolaId;
        if (etapaId) filters.etapaId = etapaId;
        if (turmaId) filters.turmaId = turmaId;
        if (anoLetivo) filters.anoLetivo = parseInt(anoLetivo);
        if (status) filters.status = status;

        const matriculas = await matriculaService.findAll(filters);
        return reply.send(matriculas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar matrículas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar alunos sem turma
  app.get(
    "/sem-turma",
    async (
      request: FastifyRequest<{
        Querystring: { escolaId?: string; anoLetivo?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo } = request.query;
        const matriculas = await matriculaService.findSemTurma(
          escolaId,
          anoLetivo ? parseInt(anoLetivo) : undefined
        );
        return reply.send(matriculas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar matrículas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar estatísticas
  app.get(
    "/estatisticas",
    async (
      request: FastifyRequest<{
        Querystring: { anoLetivo: string; escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivo, escolaId } = request.query;
        const estatisticas = await matriculaService.getEstatisticas(
          parseInt(anoLetivo),
          escolaId
        );
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

  // Buscar matrícula por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const matricula = await matriculaService.findById(id);

        if (!matricula) {
          return reply.status(404).send({ error: "Matrícula não encontrada" });
        }

        return reply.send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar matrícula";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar matrícula por número
  app.get(
    "/numero/:numero",
    async (
      request: FastifyRequest<{ Params: { numero: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { numero } = request.params;
        const matricula = await matriculaService.findByNumero(numero);

        if (!matricula) {
          return reply.status(404).send({ error: "Matrícula não encontrada" });
        }

        return reply.send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar matrícula";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar matrícula
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createMatriculaSchema.parse(request.body);
      const matricula = await matriculaService.create(data);
      return reply.status(201).send(matricula);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar matrícula";
      return reply.status(400).send({ error: message });
    }
  });

  // Atualizar matrícula
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateMatriculaSchema.parse(request.body);
        const matricula = await matriculaService.update(id, data);
        return reply.send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar matrícula";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar matrícula
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await matriculaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar matrícula";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cancelar matrícula
  app.patch(
    "/:id/cancelar",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const matricula = await matriculaService.cancelar(id);
        return reply.send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao cancelar matrícula";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Transferir matrícula
  app.patch(
    "/:id/transferir",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { escolaId: string; turmaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { escolaId, turmaId } = request.body as {
          escolaId: string;
          turmaId?: string;
        };
        const matricula = await matriculaService.transferir(
          id,
          escolaId,
          turmaId
        );
        return reply.send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao transferir matrícula";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
