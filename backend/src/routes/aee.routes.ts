import { FastifyInstance } from "fastify";
import { AEEService } from "../services/aee.service.js";
import { authMiddleware } from "../middleware/auth.js";

const service = new AEEService();

export async function aeeRoutes(app: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  app.addHook("preHandler", authMiddleware);

  // ==================== PEI (PLANO EDUCACIONAL INDIVIDUALIZADO) ====================

  // Listar todos os PEIs
  app.get("/pei", async (request, reply) => {
    const { escolaId, anoLetivo, status } = request.query as any;
    const peis = await service.findAllPEI({
      escolaId,
      anoLetivo: anoLetivo ? parseInt(anoLetivo) : undefined,
      status,
    });
    return reply.send(peis);
  });

  // Buscar PEI por ID
  app.get("/pei/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const pei = await service.findPEIById(id);
    return reply.send(pei);
  });

  // Buscar PEI por matrícula
  app.get("/pei/matricula/:matriculaId", async (request, reply) => {
    const { matriculaId } = request.params as { matriculaId: string };
    const pei = await service.findPEIByMatricula(matriculaId);
    return reply.send(pei);
  });

  // Criar PEI
  app.post("/pei", async (request, reply) => {
    const data = request.body as any;
    const pei = await service.createPEI(data);
    return reply.status(201).send(pei);
  });

  // Atualizar PEI
  app.put("/pei/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const pei = await service.updatePEI(id, data);
    return reply.send(pei);
  });

  // Deletar PEI
  app.delete("/pei/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deletePEI(id);
    return reply.status(204).send();
  });

  // ==================== SALAS DE RECURSOS ====================

  // Listar todas as salas de recursos
  app.get("/salas-recursos", async (request, reply) => {
    const { escolaId, turno } = request.query as any;
    const salas = await service.findAllSalasRecursos({
      escolaId,
      turno,
    });
    return reply.send(salas);
  });

  // Buscar sala de recursos por ID
  app.get("/salas-recursos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sala = await service.findSalaRecursosById(id);
    return reply.send(sala);
  });

  // Criar sala de recursos
  app.post("/salas-recursos", async (request, reply) => {
    const data = request.body as any;
    const sala = await service.createSalaRecursos(data);
    return reply.status(201).send(sala);
  });

  // Atualizar sala de recursos
  app.put("/salas-recursos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const sala = await service.updateSalaRecursos(id, data);
    return reply.send(sala);
  });

  // Deletar sala de recursos
  app.delete("/salas-recursos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteSalaRecursos(id);
    return reply.status(204).send();
  });

  // ==================== ATENDIMENTOS AEE ====================

  // Criar atendimento AEE
  app.post("/atendimentos", async (request, reply) => {
    const data = request.body as any;
    const atendimento = await service.createAtendimento(data);
    return reply.status(201).send(atendimento);
  });

  // Listar atendimentos por PEI
  app.get("/atendimentos/pei/:peiId", async (request, reply) => {
    const { peiId } = request.params as { peiId: string };
    const { mes, ano } = request.query as any;
    const atendimentos = await service.findAtendimentosByPEI(peiId, {
      mes: mes ? parseInt(mes) : undefined,
      ano: ano ? parseInt(ano) : undefined,
    });
    return reply.send(atendimentos);
  });

  // Listar atendimentos por sala de recursos
  app.get("/atendimentos/sala/:salaRecursosId", async (request, reply) => {
    const { salaRecursosId } = request.params as { salaRecursosId: string };
    const { mes, ano } = request.query as any;
    const atendimentos = await service.findAtendimentosBySala(salaRecursosId, {
      mes: mes ? parseInt(mes) : undefined,
      ano: ano ? parseInt(ano) : undefined,
    });
    return reply.send(atendimentos);
  });

  // Atualizar atendimento
  app.put("/atendimentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const atendimento = await service.updateAtendimento(id, data);
    return reply.send(atendimento);
  });

  // Deletar atendimento
  app.delete("/atendimentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteAtendimento(id);
    return reply.status(204).send();
  });

  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  // Obter estatísticas AEE
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await service.getEstatisticasAEE(escolaId);
    return reply.send(estatisticas);
  });
}
