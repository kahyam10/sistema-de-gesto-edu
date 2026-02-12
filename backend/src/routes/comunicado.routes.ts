import { FastifyInstance } from "fastify";
import { ComunicadoService } from "../services/comunicado.service";
import { authMiddleware } from "../middleware/auth";

const comunicadoService = new ComunicadoService();

export async function comunicadoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/comunicados - Lista todos os comunicados
  app.get("/", async (request, reply) => {
    const {
      escolaId,
      turmaId,
      etapaId,
      tipo,
      categoria,
      destinatarios,
      ativo,
      destaque,
    } = request.query as any;

    const filters: any = {};
    if (escolaId) filters.escolaId = escolaId;
    if (turmaId) filters.turmaId = turmaId;
    if (etapaId) filters.etapaId = etapaId;
    if (tipo) filters.tipo = tipo;
    if (categoria) filters.categoria = categoria;
    if (destinatarios) filters.destinatarios = destinatarios;
    if (ativo !== undefined) filters.ativo = ativo === "true";
    if (destaque !== undefined) filters.destaque = destaque === "true";

    const comunicados = await comunicadoService.findAll(filters);
    return reply.status(200).send(comunicados);
  });

  // GET /api/comunicados/:id - Busca um comunicado por ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const comunicado = await comunicadoService.findById(id);
    return reply.status(200).send(comunicado);
  });

  // POST /api/comunicados - Cria um novo comunicado
  app.post("/", async (request, reply) => {
    const data = request.body as any;
    const comunicado = await comunicadoService.create(data);
    return reply.status(201).send(comunicado);
  });

  // PUT /api/comunicados/:id - Atualiza um comunicado
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    const comunicado = await comunicadoService.update(id, data);
    return reply.status(200).send(comunicado);
  });

  // DELETE /api/comunicados/:id - Deleta um comunicado
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const result = await comunicadoService.delete(id);
    return reply.status(200).send(result);
  });

  // POST /api/comunicados/:id/marcar-lido - Marca comunicado como lido
  app.post("/:id/marcar-lido", async (request, reply) => {
    const { id } = request.params as any;
    const { userId } = request.body as any;

    if (!userId) {
      return reply.status(400).send({
        error: "userId é obrigatório",
      });
    }

    const registro = await comunicadoService.marcarComoLido(id, userId);
    return reply.status(200).send(registro);
  });

  // POST /api/comunicados/:id/confirmar - Marca comunicado como confirmado
  app.post("/:id/confirmar", async (request, reply) => {
    const { id } = request.params as any;
    const { userId } = request.body as any;

    if (!userId) {
      return reply.status(400).send({
        error: "userId é obrigatório",
      });
    }

    const registro = await comunicadoService.confirmar(id, userId);
    return reply.status(200).send(registro);
  });

  // GET /api/comunicados/usuario/:userId - Busca comunicados por usuário
  app.get("/usuario/:userId", async (request, reply) => {
    const { userId } = request.params as any;
    const { filtro } = request.query as any;

    const comunicados = await comunicadoService.findByUser(
      userId,
      filtro as "NAO_LIDOS" | "LIDOS" | "TODOS"
    );
    return reply.status(200).send(comunicados);
  });

  // GET /api/comunicados/relatorios/estatisticas - Estatísticas de comunicados
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { escolaId } = request.query as any;
    const estatisticas = await comunicadoService.getEstatisticas(escolaId);
    return reply.status(200).send(estatisticas);
  });
}
