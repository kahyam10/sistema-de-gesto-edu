import { FastifyInstance } from "fastify";
import { PlantaoPedagogicoService } from "../services/plantao-pedagogico.service";
import { authMiddleware } from "../middleware/auth";

const plantaoPedagogicoService = new PlantaoPedagogicoService();

export async function plantaoPedagogicoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/plantoes-pedagogicos - Lista todos os plantões
  app.get("/", async (request, reply) => {
    const { escolaId, turmaId, tipo, dataInicio, dataFim, ativo } =
      request.query as any;

    const filters: any = {};
    if (escolaId) filters.escolaId = escolaId;
    if (turmaId) filters.turmaId = turmaId;
    if (tipo) filters.tipo = tipo;
    if (ativo !== undefined) filters.ativo = ativo === "true";
    if (dataInicio) filters.dataInicio = new Date(dataInicio);
    if (dataFim) filters.dataFim = new Date(dataFim);

    const plantoes = await plantaoPedagogicoService.findAll(filters);
    return reply.status(200).send(plantoes);
  });

  // GET /api/plantoes-pedagogicos/:id - Busca um plantão por ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const plantao = await plantaoPedagogicoService.findById(id);
    return reply.status(200).send(plantao);
  });

  // POST /api/plantoes-pedagogicos - Cria um novo plantão
  app.post("/", async (request, reply) => {
    const data = request.body as any;
    const plantao = await plantaoPedagogicoService.create(data);
    return reply.status(201).send(plantao);
  });

  // PUT /api/plantoes-pedagogicos/:id - Atualiza um plantão
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    const plantao = await plantaoPedagogicoService.update(id, data);
    return reply.status(200).send(plantao);
  });

  // DELETE /api/plantoes-pedagogicos/:id - Deleta um plantão
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const result = await plantaoPedagogicoService.delete(id);
    return reply.status(200).send(result);
  });

  // GET /api/plantoes-pedagogicos/escola/:escolaId/periodo - Busca plantões por escola e período
  app.get("/escola/:escolaId/periodo", async (request, reply) => {
    const { escolaId } = request.params as any;
    const { dataInicio, dataFim } = request.query as any;

    if (!dataInicio || !dataFim) {
      return reply.status(400).send({
        error: "dataInicio e dataFim são obrigatórios",
      });
    }

    const plantoes = await plantaoPedagogicoService.findByEscolaAndPeriodo(
      escolaId,
      new Date(dataInicio),
      new Date(dataFim)
    );
    return reply.status(200).send(plantoes);
  });

  // GET /api/plantoes-pedagogicos/relatorios/estatisticas - Estatísticas de plantões
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await plantaoPedagogicoService.getEstatisticas(
      escolaId
    );
    return reply.status(200).send(estatisticas);
  });
}
