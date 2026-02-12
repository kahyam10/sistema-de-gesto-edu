import { FastifyInstance } from "fastify";
import { BuscaAtivaService } from "../services/busca-ativa.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new BuscaAtivaService();

export async function buscaAtivaRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // ==================== BUSCA ATIVA ====================

  // Listar todas as buscas ativas
  app.get("/", async (request, reply) => {
    const { escolaId, status, prioridade, motivo } = request.query as any;
    const buscasAtivas = await service.findAll({
      escolaId,
      status,
      prioridade,
      motivo,
    });
    return reply.send(buscasAtivas);
  });

  // Buscar uma busca ativa por ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const buscaAtiva = await service.findById(id);
    return reply.send(buscaAtiva);
  });

  // Criar nova busca ativa
  app.post("/", async (request, reply) => {
    const data = request.body as any;
    const buscaAtiva = await service.create(data);
    return reply.status(201).send(buscaAtiva);
  });

  // Atualizar busca ativa
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const buscaAtiva = await service.update(id, data);
    return reply.send(buscaAtiva);
  });

  // Deletar busca ativa
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.delete(id);
    return reply.status(204).send();
  });

  // Obter estatísticas
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await service.getEstatisticas(escolaId);
    return reply.send(estatisticas);
  });

  // ==================== VISITAS DOMICILIARES ====================

  // Criar visita domiciliar
  app.post("/visitas", async (request, reply) => {
    const data = request.body as any;
    const visita = await service.createVisita(data);
    return reply.status(201).send(visita);
  });

  // Listar visitas por busca ativa
  app.get("/:buscaAtivaId/visitas", async (request, reply) => {
    const { buscaAtivaId } = request.params as { buscaAtivaId: string };
    const visitas = await service.findVisitasByBuscaAtiva(buscaAtivaId);
    return reply.send(visitas);
  });

  // Atualizar visita
  app.put("/visitas/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const visita = await service.updateVisita(id, data);
    return reply.send(visita);
  });

  // Deletar visita
  app.delete("/visitas/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteVisita(id);
    return reply.status(204).send();
  });

  // ==================== ENCAMINHAMENTOS EXTERNOS ====================

  // Criar encaminhamento externo
  app.post("/encaminhamentos", async (request, reply) => {
    const data = request.body as any;
    const encaminhamento = await service.createEncaminhamento(data);
    return reply.status(201).send(encaminhamento);
  });

  // Listar encaminhamentos por busca ativa
  app.get("/:buscaAtivaId/encaminhamentos", async (request, reply) => {
    const { buscaAtivaId } = request.params as { buscaAtivaId: string };
    const encaminhamentos = await service.findEncaminhamentosByBuscaAtiva(buscaAtivaId);
    return reply.send(encaminhamentos);
  });

  // Atualizar encaminhamento
  app.put("/encaminhamentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const encaminhamento = await service.updateEncaminhamento(id, data);
    return reply.send(encaminhamento);
  });

  // Deletar encaminhamento
  app.delete("/encaminhamentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteEncaminhamento(id);
    return reply.status(204).send();
  });
}
