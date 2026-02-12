import { FastifyInstance } from "fastify";
import { ReuniaoPaisService } from "../services/reuniao-pais.service";
import { authMiddleware } from "../middleware/auth";

const reuniaoPaisService = new ReuniaoPaisService();

export async function reuniaoPaisRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/reunioes-pais - Lista todas as reuniões
  app.get("/", async (request, reply) => {
    const { escolaId, turmaId, tipo, status, dataInicio, dataFim, page, limit } =
      request.query as any;

    const filters: any = {};
    if (escolaId) filters.escolaId = escolaId;
    if (turmaId) filters.turmaId = turmaId;
    if (tipo) filters.tipo = tipo;
    if (status) filters.status = status;
    if (dataInicio) filters.dataInicio = new Date(dataInicio);
    if (dataFim) filters.dataFim = new Date(dataFim);

    // Suporte a paginação
    if (page && limit) {
      const result = await reuniaoPaisService.findAllPaginated(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return reply.status(200).send(result);
    }

    const reunioes = await reuniaoPaisService.findAll(filters);
    return reply.status(200).send(reunioes);
  });

  // GET /api/reunioes-pais/:id - Busca uma reunião por ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const reuniao = await reuniaoPaisService.findById(id);
    return reply.status(200).send(reuniao);
  });

  // POST /api/reunioes-pais - Cria uma nova reunião
  app.post("/", async (request, reply) => {
    const data = request.body as any;
    const reuniao = await reuniaoPaisService.create(data);
    return reply.status(201).send(reuniao);
  });

  // PUT /api/reunioes-pais/:id - Atualiza uma reunião
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    const reuniao = await reuniaoPaisService.update(id, data);
    return reply.status(200).send(reuniao);
  });

  // DELETE /api/reunioes-pais/:id - Deleta uma reunião
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const result = await reuniaoPaisService.delete(id);
    return reply.status(200).send(result);
  });

  // POST /api/reunioes-pais/presencas - Registra presença em reunião
  app.post("/presencas", async (request, reply) => {
    const data = request.body as any;
    const presenca = await reuniaoPaisService.registrarPresenca(data);
    return reply.status(201).send(presenca);
  });

  // GET /api/reunioes-pais/:reuniaoId/presencas - Lista presenças de uma reunião
  app.get("/:reuniaoId/presencas", async (request, reply) => {
    const { reuniaoId } = request.params as any;
    const presencas = await reuniaoPaisService.findPresencasByReuniao(
      reuniaoId
    );
    return reply.status(200).send(presencas);
  });

  // DELETE /api/reunioes-pais/presencas/:id - Deleta uma presença
  app.delete("/presencas/:id", async (request, reply) => {
    const { id } = request.params as any;
    const result = await reuniaoPaisService.deletePresenca(id);
    return reply.status(200).send(result);
  });

  // GET /api/reunioes-pais/relatorios/estatisticas - Estatísticas de reuniões
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await reuniaoPaisService.getEstatisticas(escolaId);
    return reply.status(200).send(estatisticas);
  });
}
