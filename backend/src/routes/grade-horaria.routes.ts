import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { gradeHorariaService } from "../services/grade-horaria.service.js";
import {
  createGradeHorarioSchema,
  updateGradeHorarioSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface GradeHorarioFilters {
  turmaId?: string;
  profissionalId?: string;
}

const isHorarioValido = (inicio: string, fim: string) => {
  if (!inicio || !fim) return false;
  return inicio < fim;
};

export async function gradeHorariaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Relatório de carga horária por profissional
  app.get(
    "/relatorios/carga",
    async (
      request: FastifyRequest<{ Querystring: { profissionalId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId } = request.query;
        const resumo = await gradeHorariaService.getCargaResumo(profissionalId);
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de carga horária";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Relatório de carga horária por escola
  app.get(
    "/relatorios/escola",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const resumo = await gradeHorariaService.getCargaResumoPorEscola();
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório por escola";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Relatório de carga horária por turma
  app.get(
    "/relatorios/turma",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const resumo = await gradeHorariaService.getCargaResumoPorTurma();
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório por turma";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Listar grade horária
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: GradeHorarioFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { turmaId } = request.query;
        const { profissionalId } = request.query;
        const horarios = await gradeHorariaService.findAll(
          turmaId || profissionalId ? { turmaId, profissionalId } : undefined
        );
        return reply.send(horarios);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar grade horária";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const horario = await gradeHorariaService.findById(id);
        if (!horario) {
          return reply.status(404).send({ error: "Horário não encontrado" });
        }
        return reply.send(horario);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar horário";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar horário
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createGradeHorarioSchema.parse(request.body);

        if (!isHorarioValido(data.horaInicio, data.horaFim)) {
          return reply.status(400).send({
            error: "Horário inválido: hora inicial deve ser menor que hora final",
          });
        }

        if (data.profissionalId) {
          const conflito = await gradeHorariaService.findAll({
            profissionalId: data.profissionalId,
          });

          const conflitoMesmoDia = conflito.some((item: {
            id: string;
            diaSemana: string;
            horaInicio: string;
            horaFim: string;
          }) => {
            if (item.diaSemana !== data.diaSemana) return false;
            return (
              data.horaInicio < item.horaFim && data.horaFim > item.horaInicio
            );
          });

          if (conflitoMesmoDia) {
            return reply.status(409).send({
              error: "Conflito de horário para este profissional",
            });
          }
        }

        const horario = await gradeHorariaService.create(data);
        return reply.status(201).send(horario);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao criar horário";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar horário
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateGradeHorarioSchema.parse(request.body);

        if (data.horaInicio && data.horaFim && !isHorarioValido(data.horaInicio, data.horaFim)) {
          return reply.status(400).send({
            error: "Horário inválido: hora inicial deve ser menor que hora final",
          });
        }

        if (data.profissionalId && data.diaSemana && data.horaInicio && data.horaFim) {
          const conflito = await gradeHorariaService.findAll({
            profissionalId: data.profissionalId,
          });

          const conflitoMesmoDia = conflito.some((item: {
            id: string;
            diaSemana: string;
            horaInicio: string;
            horaFim: string;
          }) => {
            if (item.id === id) return false;
            if (item.diaSemana !== data.diaSemana) return false;
            return (
              data.horaInicio! < item.horaFim && data.horaFim! > item.horaInicio
            );
          });

          if (conflitoMesmoDia) {
            return reply.status(409).send({
              error: "Conflito de horário para este profissional",
            });
          }
        }

        const horario = await gradeHorariaService.update(id, data);
        return reply.send(horario);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar horário";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar horário
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await gradeHorariaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao deletar horário";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
