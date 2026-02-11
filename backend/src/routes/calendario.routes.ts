import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { calendarioService } from "../services/calendario.service.js";
import { authMiddleware } from "../middleware/auth.js";

export async function calendarioRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  // ==================== ANO LETIVO ====================

  // Listar todos os anos letivos
  app.get(
    "/anos-letivos",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const anosLetivos = await calendarioService.findAllAnosLetivos();
        return reply.send(anosLetivos);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar anos letivos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar ano letivo ativo
  app.get(
    "/anos-letivos/ativo",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const anoLetivo = await calendarioService.findAnoLetivoAtivo();
        if (!anoLetivo) {
          return reply
            .status(404)
            .send({ error: "Nenhum ano letivo ativo encontrado" });
        }
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar ano letivo ativo";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar ano letivo por ID
  app.get(
    "/anos-letivos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const anoLetivo = await calendarioService.findAnoLetivoById(id);
        if (!anoLetivo) {
          return reply.status(404).send({ error: "Ano letivo não encontrado" });
        }
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar ano letivo";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar ano letivo
  app.post(
    "/anos-letivos",
    async (
      request: FastifyRequest<{
        Body: {
          ano: number;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { ano, ativo } = request.body;
        const anoLetivo = await calendarioService.createAnoLetivo({
          ano,
          ativo,
        });
        return reply.status(201).send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar ano letivo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar ano letivo
  app.put(
    "/anos-letivos/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          ano?: number;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { ano, ativo } = request.body;
        const anoLetivo = await calendarioService.updateAnoLetivo(id, {
          ano,
          ativo,
        });
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar ano letivo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar ano letivo
  app.delete(
    "/anos-letivos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await calendarioService.deleteAnoLetivo(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar ano letivo";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== EVENTOS ====================

  // Listar eventos de um ano letivo
  app.get(
    "/anos-letivos/:anoLetivoId/eventos",
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId } = request.params;
        const { escolaId } = request.query;
        const eventos = await calendarioService.findEventosByAnoLetivo(
          anoLetivoId,
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar eventos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar eventos por data
  app.get(
    "/anos-letivos/:anoLetivoId/eventos/data/:data",
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string; data: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId, data } = request.params;
        const { escolaId } = request.query;
        const eventos = await calendarioService.findEventosByData(
          anoLetivoId,
          new Date(data),
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar eventos";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar eventos por mês
  app.get(
    "/anos-letivos/:anoLetivoId/eventos/mes/:ano/:mes",
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string; ano: string; mes: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId, ano, mes } = request.params;
        const { escolaId } = request.query;
        const eventos = await calendarioService.getEventosPorMes(
          anoLetivoId,
          parseInt(mes),
          parseInt(ano),
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar eventos do mês";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar evento por ID
  app.get(
    "/eventos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const evento = await calendarioService.findEventoById(id);
        if (!evento) {
          return reply.status(404).send({ error: "Evento não encontrado" });
        }
        return reply.send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar evento";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar evento
  app.post(
    "/eventos",
    async (
      request: FastifyRequest<{
        Body: {
          titulo: string;
          descricao?: string;
          dataInicio: string;
          dataFim?: string;
          horaInicio?: string;
          horaFim?: string;
          tipo: string;
          escopo?: string;
          recorrente?: boolean;
          tipoRecorrencia?: string;
          diaRecorrencia?: string;
          cor?: string;
          reduzDiaLetivo?: boolean;
          anoLetivoId: string;
          escolaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const data = request.body;
        const evento = await calendarioService.createEvento({
          ...data,
          dataInicio: new Date(data.dataInicio),
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.status(201).send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar evento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar evento
  app.put(
    "/eventos/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          titulo?: string;
          descricao?: string;
          dataInicio?: string;
          dataFim?: string;
          horaInicio?: string;
          horaFim?: string;
          tipo?: string;
          escopo?: string;
          recorrente?: boolean;
          tipoRecorrencia?: string;
          diaRecorrencia?: string;
          cor?: string;
          reduzDiaLetivo?: boolean;
          escolaId?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const evento = await calendarioService.updateEvento(id, {
          ...data,
          dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar evento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar evento
  app.delete(
    "/eventos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await calendarioService.deleteEvento(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar evento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== ESTATÍSTICAS ====================

  // Calcular dias letivos
  app.get(
    "/anos-letivos/:anoLetivoId/estatisticas",
    async (
      request: FastifyRequest<{
        Params: { anoLetivoId: string };
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivoId } = request.params;
        const { escolaId } = request.query;
        const estatisticas = await calendarioService.calcularDiasLetivos(
          anoLetivoId,
          escolaId
        );
        return reply.send(estatisticas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao calcular estatísticas";
        return reply.status(500).send({ error: message });
      }
    }
  );
}
