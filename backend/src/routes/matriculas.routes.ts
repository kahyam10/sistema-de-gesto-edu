import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { matriculaService } from "../services/index.js";
import {
  createMatriculaSchema,
  updateMatriculaSchema,
  transferirMatriculaSchema,
  criarAcessoMatriculaSchema,
} from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";
import { anoLetivoObrigatorioQuerySchema, anoLetivoOpcionalQuerySchema } from "../schemas/parametros.schemas.js";

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
        const { escolaId, etapaId, turmaId, status } = request.query;
        const { anoLetivo } = anoLetivoOpcionalQuerySchema.parse(request.query);
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
        if (anoLetivo !== undefined) filters.anoLetivo = anoLetivo;
        if (status) filters.status = status;

        const matriculas = await matriculaService.findAll(filters);
        return reply.send(matriculas);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        const { escolaId } = request.query;
        const { anoLetivo } = anoLetivoOpcionalQuerySchema.parse(request.query);
        const matriculas = await matriculaService.findSemTurma(
          escolaId,
          anoLetivo
        );
        return reply.send(matriculas);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        const { escolaId } = request.query;
        const { anoLetivo } = anoLetivoObrigatorioQuerySchema.parse(request.query);
        const estatisticas = await matriculaService.getEstatisticas(
          anoLetivo,
          escolaId
        );
        return reply.send(estatisticas);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
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
      return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
      }
    }
  );

  // Transferir matrícula
  app.patch(
    "/:id/transferir",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { escolaId, turmaId, motivo } = transferirMatriculaSchema.parse(
          request.body
        );
        const matricula = await matriculaService.transferir(
          id,
          escolaId,
          turmaId,
          motivo
        );
        return reply.send(matricula);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Histórico de transferências da matrícula
  app.get(
    "/:id/transferencias",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const transferencias = await matriculaService.getTransferencias(id);
        return reply.send(transferencias);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // ==================== MÓDULO 3: ACESSOS DO PORTAL (responsáveis) ====================

  // GET /api/matriculas/:id/acessos — vínculos de portal (responsáveis) da matrícula
  app.get(
    "/:id/acessos",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        return reply
          .status(200)
          .send(await matriculaService.listarAcessos(request.params.id));
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // POST /api/matriculas/:id/acessos — cria usuário RESPONSAVEL (se preciso) e vincula
  app.post(
    "/:id/acessos",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = criarAcessoMatriculaSchema.parse(request.body);
        const vinculo = await matriculaService.criarAcesso(
          request.params.id,
          data
        );
        return reply.status(201).send(vinculo);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // DELETE /api/matriculas/:id/acessos/:vinculoId — revoga acesso
  app.delete(
    "/:id/acessos/:vinculoId",
    async (
      request: FastifyRequest<{ Params: { id: string; vinculoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        return reply
          .status(200)
          .send(
            await matriculaService.revogarAcesso(
              request.params.id,
              request.params.vinculoId
            )
          );
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
