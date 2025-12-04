import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { profissionalService } from "../services/index.js";
import {
  createProfissionalSchema,
  updateProfissionalSchema,
} from "../schemas/index.js";

interface ProfissionalFilters {
  tipo?: string;
  ativo?: string;
}

export async function profissionaisRoutes(app: FastifyInstance) {
  // Listar todos os profissionais
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: ProfissionalFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { tipo, ativo } = request.query;
        const filters: { tipo?: string; ativo?: boolean } = {};

        if (tipo) filters.tipo = tipo;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        const profissionais = await profissionalService.findAll(filters);
        return reply.send(profissionais);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao listar profissionais";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar profissional por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const profissional = await profissionalService.findById(id);

        if (!profissional) {
          return reply
            .status(404)
            .send({ error: "Profissional não encontrado" });
        }

        return reply.send(profissional);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar profissional";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar profissionais por escola
  app.get(
    "/escola/:escolaId",
    async (
      request: FastifyRequest<{ Params: { escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;
        const profissionais = await profissionalService.findByEscola(escolaId);
        return reply.send(profissionais);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar profissionais";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar profissional
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createProfissionalSchema.parse(request.body);
      const profissional = await profissionalService.create(data);
      return reply.status(201).send(profissional);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar profissional";
      return reply.status(400).send({ error: message });
    }
  });

  // Atualizar profissional
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateProfissionalSchema.parse(request.body);
        const profissional = await profissionalService.update(id, data);
        return reply.send(profissional);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar profissional
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await profissionalService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao deletar profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Vincular profissional a escola
  app.post(
    "/:id/escolas",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { escolaId: string; funcao?: string; cargaHoraria?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { escolaId, funcao, cargaHoraria } = request.body as {
          escolaId: string;
          funcao?: string;
          cargaHoraria?: number;
        };
        const vinculo = await profissionalService.vincularEscola(
          id,
          escolaId,
          funcao,
          cargaHoraria
        );
        return reply.status(201).send(vinculo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao vincular profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Desvincular profissional de escola
  app.delete(
    "/:id/escolas/:escolaId",
    async (
      request: FastifyRequest<{ Params: { id: string; escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, escolaId } = request.params;
        await profissionalService.desvincularEscola(id, escolaId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao desvincular profissional";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== FORMAÇÕES ====================

  // Listar formações de um profissional
  app.get(
    "/:id/formacoes",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const formacoes = await profissionalService.getFormacoes(id);
        return reply.send(formacoes);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar formações";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Adicionar formação
  app.post(
    "/:id/formacoes",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          tipo: string;
          nome: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body as {
          tipo: string;
          nome: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
        const formacao = await profissionalService.addFormacao(id, data);
        return reply.status(201).send(formacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar formação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar formação
  app.put(
    "/:id/formacoes/:formacaoId",
    async (
      request: FastifyRequest<{
        Params: { id: string; formacaoId: string };
        Body: {
          tipo?: string;
          nome?: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { formacaoId } = request.params;
        const data = request.body as {
          tipo?: string;
          nome?: string;
          instituicao?: string;
          anoConclusao?: number;
          cargaHoraria?: number;
          emAndamento?: boolean;
        };
        const formacao = await profissionalService.updateFormacao(
          formacaoId,
          data
        );
        return reply.send(formacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar formação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover formação
  app.delete(
    "/:id/formacoes/:formacaoId",
    async (
      request: FastifyRequest<{ Params: { id: string; formacaoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { formacaoId } = request.params;
        await profissionalService.deleteFormacao(formacaoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover formação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
