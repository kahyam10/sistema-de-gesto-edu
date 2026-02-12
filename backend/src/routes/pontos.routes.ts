import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { pontoService } from "../services/index.js";
import {
  createPontoSchema,
  updatePontoSchema,
  registrarPontoSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function pontosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Lista pontos com filtros
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          profissionalId?: string;
          escolaId?: string;
          dataInicio?: string;
          dataFim?: string;
          tipoRegistro?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId, escolaId, dataInicio, dataFim, tipoRegistro } =
          request.query;

        const filters: any = {};
        if (profissionalId) filters.profissionalId = profissionalId;
        if (escolaId) filters.escolaId = escolaId;
        if (tipoRegistro) filters.tipoRegistro = tipoRegistro;
        if (dataInicio) filters.dataInicio = new Date(dataInicio);
        if (dataFim) filters.dataFim = new Date(dataFim);

        const pontos = await pontoService.findAll(filters);
        return reply.send(pontos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar pontos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Cria ponto manual (admin)
  app.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createPontoSchema.parse(request.body);
        const ponto = await pontoService.create(body);
        return reply.status(201).send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Registra ponto (entrada/saída)
  app.post(
    "/registrar",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = registrarPontoSchema.parse(request.body);
        const ponto = await pontoService.registrarPonto(body);
        return reply.status(201).send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao registrar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Busca ponto por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const ponto = await pontoService.findById(id);

        if (!ponto) {
          return reply.status(404).send({ error: "Ponto não encontrado" });
        }

        return reply.send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualiza ponto
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const body = updatePontoSchema.parse(request.body);
        const ponto = await pontoService.update(id, body);
        return reply.send(ponto);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remove ponto
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await pontoService.delete(id);
        return reply.send({ message: "Ponto removido com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover ponto";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Relatório mensal de um profissional
  app.get(
    "/relatorio/:profissionalId/:mes/:ano",
    async (
      request: FastifyRequest<{
        Params: { profissionalId: string; mes: string; ano: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { profissionalId, mes, ano } = request.params;
        const relatorio = await pontoService.relatorioMensal(
          profissionalId,
          parseInt(mes),
          parseInt(ano)
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
