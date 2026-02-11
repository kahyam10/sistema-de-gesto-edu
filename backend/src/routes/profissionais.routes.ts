import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { profissionalService } from "../services/index.js";
import {
  createProfissionalSchema,
  updateProfissionalSchema,
} from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

interface ProfissionalFilters {
  tipo?: string;
  ativo?: string;
  page?: string;
  limit?: string;
}

export async function profissionaisRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Relatório de lotação por escola
  app.get(
    "/relatorios/lotacao",
    async (
      request: FastifyRequest<{ Querystring: { escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const resumo = await profissionalService.getLotacaoResumo(escolaId);
        return reply.send(resumo);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de lotação";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Listar todos os profissionais
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: ProfissionalFilters }>,
      reply: FastifyReply
    ) => {
      try {
        const { tipo, ativo, page, limit } = request.query;
        const filters: { tipo?: string; ativo?: boolean } = {};

        if (tipo) filters.tipo = tipo;
        if (ativo !== undefined) filters.ativo = ativo === "true";

        if (page && limit) {
          const result = await profissionalService.findAllPaginated(filters, {
            page: parseInt(page),
            limit: parseInt(limit),
          });
          return reply.send(result);
        }

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

  // ==================== CERTIFICAÇÕES ====================

  // Listar certificações
  app.get(
    "/:id/certificacoes",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const certificacoes = await profissionalService.getCertificacoes(id);
        return reply.send(certificacoes);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar certificações";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar certificação
  app.post(
    "/:id/certificacoes",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          nome: string;
          instituicao?: string;
          dataEmissao?: string;
          dataValidade?: string;
          cargaHoraria?: number;
          urlCertificado?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const certificacao = await profissionalService.addCertificacao(id, {
          ...data,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
          dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
        });
        return reply.status(201).send(certificacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar certificação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar certificação
  app.put(
    "/:id/certificacoes/:certificacaoId",
    async (
      request: FastifyRequest<{
        Params: { id: string; certificacaoId: string };
        Body: {
          nome?: string;
          instituicao?: string;
          dataEmissao?: string;
          dataValidade?: string;
          cargaHoraria?: number;
          urlCertificado?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { certificacaoId } = request.params;
        const data = request.body;
        const certificacao = await profissionalService.updateCertificacao(certificacaoId, {
          ...data,
          dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
          dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
        });
        return reply.send(certificacao);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar certificação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover certificação
  app.delete(
    "/:id/certificacoes/:certificacaoId",
    async (
      request: FastifyRequest<{ Params: { id: string; certificacaoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { certificacaoId } = request.params;
        await profissionalService.deleteCertificacao(certificacaoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover certificação";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== HISTÓRICO DE CONTRATAÇÕES ====================

  // Listar histórico
  app.get(
    "/:id/historico",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const historico = await profissionalService.getHistoricoContratacoes(id);
        return reply.send(historico);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar evento ao histórico
  app.post(
    "/:id/historico",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          tipo: string;
          descricao: string;
          dataEvento: string;
          cargo?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const evento = await profissionalService.addHistoricoContratacao(id, {
          ...data,
          dataEvento: new Date(data.dataEvento),
        });
        return reply.status(201).send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar evento do histórico
  app.put(
    "/:id/historico/:historicoId",
    async (
      request: FastifyRequest<{
        Params: { id: string; historicoId: string };
        Body: {
          tipo?: string;
          descricao?: string;
          dataEvento?: string;
          cargo?: string;
          observacoes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { historicoId } = request.params;
        const data = request.body;
        const evento = await profissionalService.updateHistoricoContratacao(historicoId, {
          ...data,
          dataEvento: data.dataEvento ? new Date(data.dataEvento) : undefined,
        });
        return reply.send(evento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover evento do histórico
  app.delete(
    "/:id/historico/:historicoId",
    async (
      request: FastifyRequest<{ Params: { id: string; historicoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { historicoId } = request.params;
        await profissionalService.deleteHistoricoContratacao(historicoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover histórico";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== AFASTAMENTOS ====================

  // Listar afastamentos
  app.get(
    "/:id/afastamentos",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { apenasAtivos?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { apenasAtivos } = request.query;
        const afastamentos = await profissionalService.getAfastamentos(
          id,
          apenasAtivos === "true"
        );
        return reply.send(afastamentos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar afastamentos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Adicionar afastamento
  app.post(
    "/:id/afastamentos",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          tipo: string;
          dataInicio: string;
          dataFim?: string;
          motivo?: string;
          observacoes?: string;
          documentoPath?: string;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = request.body;
        const afastamento = await profissionalService.addAfastamento(id, {
          ...data,
          dataInicio: new Date(data.dataInicio),
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.status(201).send(afastamento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao adicionar afastamento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar afastamento
  app.put(
    "/:id/afastamentos/:afastamentoId",
    async (
      request: FastifyRequest<{
        Params: { id: string; afastamentoId: string };
        Body: {
          tipo?: string;
          dataInicio?: string;
          dataFim?: string;
          motivo?: string;
          observacoes?: string;
          documentoPath?: string;
          ativo?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { afastamentoId } = request.params;
        const data = request.body;
        const afastamento = await profissionalService.updateAfastamento(afastamentoId, {
          ...data,
          dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
          dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        });
        return reply.send(afastamento);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar afastamento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Remover afastamento
  app.delete(
    "/:id/afastamentos/:afastamentoId",
    async (
      request: FastifyRequest<{ Params: { id: string; afastamentoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { afastamentoId } = request.params;
        await profissionalService.deleteAfastamento(afastamentoId);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover afastamento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Listar afastamentos ativos (todos os profissionais)
  app.get(
    "/afastamentos/ativos",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const afastamentos = await profissionalService.getAfastamentosAtivos();
        return reply.send(afastamentos);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar afastamentos ativos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // ==================== RELATÓRIOS ====================

  // Relatório de carga horária semanal
  app.get(
    "/relatorios/carga-horaria",
    async (
      request: FastifyRequest<{
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const relatorio = await profissionalService.getCargaHorariaSemanal(escolaId);
        return reply.send(relatorio);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório de carga horária";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Dashboard de alocação
  app.get(
    "/dashboard/alocacao",
    async (
      request: FastifyRequest<{
        Querystring: { escolaId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.query;
        const dashboard = await profissionalService.getDashboardAlocacao(escolaId);
        return reply.send(dashboard);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar dashboard de alocação";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
