import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { frequenciaService } from "../services/index.js";
import {
  createFrequenciaSchema,
  updateFrequenciaSchema,
  registrarFrequenciaTurmaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function frequenciaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  // Lista frequências com filtros
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          turmaId?: string;
          matriculaId?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, matriculaId, dataInicio, dataFim, page, limit } = request.query;

        const params: any = {};
        if (turmaId) params.turmaId = turmaId;
        if (matriculaId) params.matriculaId = matriculaId;
        if (dataInicio) params.dataInicio = new Date(dataInicio);
        if (dataFim) params.dataFim = new Date(dataFim);

        if (page && limit) {
          const result = await frequenciaService.listPaginated(params, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const frequencias = await frequenciaService.list(params);
        return reply.send(frequencias);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar frequências";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca frequência por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const frequencia = await frequenciaService.findById(id);

        if (!frequencia) {
          return reply.status(404).send({ error: "Frequência não encontrada" });
        }

        return reply.send(frequencia);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar frequência";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria um registro de frequência
  app.post(
    "/",
    async (
      request: FastifyRequest<{
        Body: {
          matriculaId: string;
          turmaId: string;
          data: string;
          status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
          justificativa?: string;
          observacao?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const body = createFrequenciaSchema.parse(request.body);
        const frequencia = await frequenciaService.create(body);

        return reply.status(201).send(frequencia);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar frequência";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Registra frequência para turma completa
  app.post(
    "/turma",
    async (
      request: FastifyRequest<{
        Body: {
          turmaId: string;
          data: string;
          presencas: Array<{
            matriculaId: string;
            status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
            justificativa?: string;
            observacao?: string;
          }>;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, data, presencas } = registrarFrequenciaTurmaSchema.parse(request.body);
        const resultado = await frequenciaService.registrarTurma({
          turmaId,
          data,
          presencas,
        });

        return reply.status(201).send(resultado);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao registrar frequência da turma";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza um registro de frequência
  app.patch(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          status?: "PRESENTE" | "FALTA" | "JUSTIFICADA";
          justificativa?: string;
          observacao?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateFrequenciaSchema.parse(request.body);
        const frequencia = await frequenciaService.update(id, body);

        return reply.send(frequencia);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar frequência";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove um registro de frequência
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await frequenciaService.delete(id);

        return reply.send({ message: "Frequência removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover frequência";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Calcula estatísticas de frequência
  app.get(
    "/estatisticas/:matriculaId/:turmaId",
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string; turmaId: string };
        Querystring: {
          dataInicio?: string;
          dataFim?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, turmaId } = request.params;
        const { dataInicio, dataFim } = request.query;

        const estatisticas = await frequenciaService.calcularEstatisticas(
          matriculaId,
          turmaId,
          dataInicio ? new Date(dataInicio) : undefined,
          dataFim ? new Date(dataFim) : undefined
        );

        return reply.send(estatisticas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao calcular estatísticas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Lista alunos com baixa frequência
  app.get(
    "/turma/:turmaId/baixa-frequencia",
    async (
      request: FastifyRequest<{
        Params: { turmaId: string };
        Querystring: {
          dataInicio?: string;
          dataFim?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId } = request.params;
        const { dataInicio, dataFim } = request.query;

        const alunos = await frequenciaService.listarAlunosComBaixaFrequencia(
          turmaId,
          dataInicio ? new Date(dataInicio) : undefined,
          dataFim ? new Date(dataFim) : undefined
        );

        return reply.send(alunos);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar alunos com baixa frequência";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca frequência por data específica de uma turma
  app.get(
    "/turma/:turmaId/data/:data",
    async (
      request: FastifyRequest<{
        Params: { turmaId: string; data: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId, data } = request.params;
        const frequencias = await frequenciaService.buscarPorData(
          turmaId,
          new Date(data)
        );

        return reply.send(frequencias);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar frequências por data";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
