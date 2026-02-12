import { FastifyInstance } from "fastify";
import { AcompanhamentoService } from "../services/acompanhamento.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new AcompanhamentoService();

export async function acompanhamentoRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // Listar todos os acompanhamentos
  app.get("/", async (request, reply) => {
    const { escolaId, tipo, status, profissionalId } = request.query as any;
    const acompanhamentos = await service.findAll({
      escolaId,
      tipo,
      status,
      profissionalId,
    });
    return reply.send(acompanhamentos);
  });

  // Buscar acompanhamento por ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const acompanhamento = await service.findById(id);
    return reply.send(acompanhamento);
  });

  // Buscar acompanhamentos por matrícula
  app.get("/matricula/:matriculaId", async (request, reply) => {
    const { matriculaId } = request.params as { matriculaId: string };
    const acompanhamentos = await service.findByMatricula(matriculaId);
    return reply.send(acompanhamentos);
  });

  // Criar acompanhamento
  app.post("/", async (request, reply) => {
    const data = request.body as any;
    const acompanhamento = await service.create(data);
    return reply.status(201).send(acompanhamento);
  });

  // Atualizar acompanhamento
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const acompanhamento = await service.update(id, data);
    return reply.send(acompanhamento);
  });

  // Deletar acompanhamento
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.delete(id);
    return reply.status(204).send();
  });

  // Registrar evolução
  app.post("/:id/evolucao", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const acompanhamento = await service.registrarEvolucao(id, data);
    return reply.send(acompanhamento);
  });

  // Concluir acompanhamento
  app.post("/:id/concluir", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { resultado } = request.body as { resultado: string };
    const acompanhamento = await service.concluir(id, resultado);
    return reply.send(acompanhamento);
  });

  // Suspender acompanhamento
  app.post("/:id/suspender", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { motivo } = request.body as { motivo: string };
    const acompanhamento = await service.suspender(id, motivo);
    return reply.send(acompanhamento);
  });

  // Reativar acompanhamento
  app.post("/:id/reativar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const acompanhamento = await service.reativar(id);
    return reply.send(acompanhamento);
  });

  // Obter estatísticas
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await service.getEstatisticas(escolaId);
    return reply.send(estatisticas);
  });
}
