import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { matriculaService } from "../services/index.js";
import {
  createMatriculaSchema,
  updateMatriculaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface MatriculaFilters {
  escolaId?: string;
  etapaId?: string;
  turmaId?: string;
  anoLetivo?: string;
  status?: string;
  page?: string;
  limit?: string;
}

export async function matriculasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar todas as matrículas
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: MatriculaFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, etapaId, turmaId, anoLetivo, status, page, limit } = request.query;
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

        if (page && limit) {
          const result = await matriculaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

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

  // Criar matrícula via portal (fila de espera automática)
  app.post(
    "/portal",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createMatriculaSchema.parse(request.body);
        const matricula = await matriculaService.createPortal(data);
        return reply.status(201).send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar matrícula via portal";
        return reply.status(400).send({ error: message });
      }
    }
  );

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

  // Confirmar matrícula em turma
  app.patch(
    "/:id/confirmar",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { turmaId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { turmaId } = request.body as { turmaId: string };
        const matricula = await matriculaService.confirmar(id, turmaId);
        return reply.send(matricula);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao confirmar matrícula";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Relatório de matrículas por escola
  app.get(
    "/relatorio",
    async (
      request: FastifyRequest<{
        Querystring: {
          escolaId?: string;
          anoLetivo?: string;
          formato?: "json" | "csv";
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId, anoLetivo, formato = "json" } = request.query;
        const ano = anoLetivo ? parseInt(anoLetivo) : new Date().getFullYear();

        const matriculas = await matriculaService.findAll({
          escolaId,
          anoLetivo: ano,
        });

        if (formato === "csv") {
          // Gera CSV
          const header =
            "Número,Aluno,Data Nascimento,CPF,Escola,Etapa,Turma,Status,Data Matrícula\n";
          const rows = matriculas
            .map((m) => {
              const turmaDisplay = m.turma
                ? `${m.turma.serie?.nome || ""} - ${m.turma.nome}`
                : "Sem turma";
              return [
                m.numeroMatricula,
                m.nomeAluno,
                new Date(m.dataNascimento).toLocaleDateString("pt-BR"),
                m.cpfAluno || "Não informado",
                m.escola.nome,
                m.etapa.nome,
                turmaDisplay,
                m.status,
                new Date(m.dataMatricula).toLocaleDateString("pt-BR"),
              ].join(",");
            })
            .join("\n");

          const csv = header + rows;

          reply.header("Content-Type", "text/csv; charset=utf-8");
          reply.header(
            "Content-Disposition",
            `attachment; filename="matriculas_${ano}.csv"`
          );
          return reply.send("\uFEFF" + csv); // BOM para UTF-8
        }

        // Retorna JSON com estatísticas
        const stats = await matriculaService.getEstatisticas(ano, escolaId);

        return reply.send({
          matriculas,
          estatisticas: stats,
          total: matriculas.length,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
