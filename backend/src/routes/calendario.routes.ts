import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { calendarioService } from "../services/calendario.service.js";
import {
  createAnoLetivoSchema,
  updateAnoLetivoSchema,
  createEventoRecorrenteSchema,
  updateEventoRecorrenteSchema,
  dataTextoSchema,
} from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function calendarioRoutes(app: FastifyInstance) {
  // ==================== ANO LETIVO ====================

  // Listar todos os anos letivos
  app.get(
    "/anos-letivos",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const anosLetivos = await calendarioService.findAllAnosLetivos();
        return reply.send(anosLetivos);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar ano letivo
  app.post(
    "/anos-letivos",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { ano, ativo } = createAnoLetivoSchema.parse(request.body);
        const anoLetivo = await calendarioService.createAnoLetivo({
          ano,
          ativo,
        });
        return reply.status(201).send(anoLetivo);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualizar ano letivo
  app.put(
    "/anos-letivos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { ano, ativo } = updateAnoLetivoSchema.parse(request.body);
        const anoLetivo = await calendarioService.updateAnoLetivo(id, {
          ano,
          ativo,
        });
        return reply.send(anoLetivo);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply, 500);
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
          dataTextoSchema.parse(data),
          escolaId
        );
        return reply.send(eventos);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
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
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar evento
  app.post(
    "/eventos",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createEventoRecorrenteSchema.parse(request.body);
        const evento = await calendarioService.createEvento(data);
        return reply.status(201).send(evento);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualizar evento
  app.put(
    "/eventos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateEventoRecorrenteSchema.parse(request.body);
        const evento = await calendarioService.updateEvento(id, data);
        return reply.send(evento);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply);
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
        return responderErroRota(error, reply, 500);
      }
    }
  );
}
