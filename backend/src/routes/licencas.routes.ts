import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { licencaService } from "../services/index.js";
import {
  createLicencaSchema,
  updateLicencaSchema,
  aprovarLicencaSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function licencasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista licenças com filtros
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          profissionalId?: string;
          status?: string;
          tipo?: string;
          dataInicio?: string;
          dataFim?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId, status, tipo, dataInicio, dataFim, page, limit } =
          request.query;

        const filters: any = {};
        if (profissionalId) filters.profissionalId = profissionalId;
        if (status) filters.status = status;
        if (tipo) filters.tipo = tipo;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        // Suporte a paginação
        if (page && limit) {
          const result = await licencaService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

        const licencas = await licencaService.findAll(filters);
        return reply.send(licencas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar licenças";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria solicitação de licença
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createLicencaSchema.parse(request.body);
        const licenca = await licencaService.create(body);
        return reply.status(201).send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca licença por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const licenca = await licencaService.findById(id);

        if (!licenca) {
          return reply.status(404).send({ error: "Licença não encontrada" });
        }

        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza licença (apenas se pendente)
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updateLicencaSchema.parse(request.body);
        const licenca = await licencaService.update(id, body);
        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Aprova ou rejeita licença
  app.post(
    "/:id/aprovar",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = aprovarLicencaSchema.parse(request.body);
        const licenca = await licencaService.aprovar(id, body);
        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao processar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cancela licença
  app.post(
    "/:id/cancelar",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const licenca = await licencaService.cancelar(id);
        return reply.send(licenca);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao cancelar licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove licença
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await licencaService.delete(id);
        return reply.send({ message: "Licença removida com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover licença";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Licenças ativas
  app.get(
    "/status/ativas",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const licencas = await licencaService.findLicencasAtivas();
        return reply.send(licencas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar licenças ativas";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Relatório por profissional
  app.get(
    "/relatorio/:profissionalId",
    async (
      request: FastifyRequest<{
        Params: { profissionalId: string };
        Querystring: { anoInicio?: string; anoFim?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId } = request.params;
        const { anoInicio, anoFim } = request.query;

        const relatorio = await licencaService.relatorioPorProfissional(
          profissionalId,
          anoInicio ? parseInt(anoInicio) : undefined,
          anoFim ? parseInt(anoFim) : undefined
        );
        return reply.send(relatorio);
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
