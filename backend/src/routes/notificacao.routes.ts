import { FastifyInstance } from "fastify";
import { NotificacaoService } from "../services/notificacao.service";
import { authMiddleware } from "../middleware/auth";

const notificacaoService = new NotificacaoService();

export async function notificacaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/notificacoes - Lista todas as notificações
  app.get("/", async (request, reply) => {
    const { userId, tipo, prioridade, lida } = request.query as any;

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (tipo) filters.tipo = tipo;
    if (prioridade) filters.prioridade = prioridade;
    if (lida !== undefined) filters.lida = lida === "true";

    const notificacoes = await notificacaoService.findAll(filters);
    return reply.status(200).send(notificacoes);
  });

  // GET /api/notificacoes/usuario/:userId - Busca notificações de um usuário
  app.get("/usuario/:userId", async (request, reply) => {
    const { userId } = request.params as any;
    const { filtro } = request.query as any;

    const notificacoes = await notificacaoService.findByUser(
      userId,
      filtro as "NAO_LIDAS" | "LIDAS" | "TODAS"
    );
    return reply.status(200).send(notificacoes);
  });

  // GET /api/notificacoes/:id - Busca uma notificação por ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const notificacao = await notificacaoService.findById(id);
    return reply.status(200).send(notificacao);
  });

  // POST /api/notificacoes - Cria uma nova notificação
  app.post("/", async (request, reply) => {
    const data = request.body as any;
    const notificacao = await notificacaoService.create(data);
    return reply.status(201).send(notificacao);
  });

  // POST /api/notificacoes/bulk - Cria notificações em massa
  app.post("/bulk", async (request, reply) => {
    const data = request.body as any;
    const notificacoes = await notificacaoService.createBulk(data);
    return reply.status(201).send(notificacoes);
  });

  // POST /api/notificacoes/:id/marcar-lida - Marca notificação como lida
  app.post("/:id/marcar-lida", async (request, reply) => {
    const { id } = request.params as any;
    const notificacao = await notificacaoService.marcarComoLida(id);
    return reply.status(200).send(notificacao);
  });

  // POST /api/notificacoes/usuario/:userId/marcar-todas-lidas - Marca todas as notificações como lidas
  app.post("/usuario/:userId/marcar-todas-lidas", async (request, reply) => {
    const { userId } = request.params as any;
    const result = await notificacaoService.marcarTodasComoLidas(userId);
    return reply.status(200).send(result);
  });

  // DELETE /api/notificacoes/:id - Deleta uma notificação
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const result = await notificacaoService.delete(id);
    return reply.status(200).send(result);
  });

  // DELETE /api/notificacoes/usuario/:userId/lidas - Deleta todas as notificações lidas
  app.delete("/usuario/:userId/lidas", async (request, reply) => {
    const { userId } = request.params as any;
    const result = await notificacaoService.deletarLidas(userId);
    return reply.status(200).send(result);
  });

  // GET /api/notificacoes/usuario/:userId/count-nao-lidas - Conta notificações não lidas
  app.get("/usuario/:userId/count-nao-lidas", async (request, reply) => {
    const { userId } = request.params as any;
    const result = await notificacaoService.countNaoLidas(userId);
    return reply.status(200).send(result);
  });

  // GET /api/notificacoes/relatorios/estatisticas - Estatísticas de notificações
  app.get("/relatorios/estatisticas", async (request, reply) => {
    const { userId } = request.query as any;
    const estatisticas = await notificacaoService.getEstatisticas(userId);
    return reply.status(200).send(estatisticas);
  });

  // PUT /api/notificacoes/:id/status-envio - Atualiza status de envio
  app.put("/:id/status-envio", async (request, reply) => {
    const { id } = request.params as any;
    const { canal, enviado } = request.body as any;

    if (!canal || enviado === undefined) {
      return reply.status(400).send({
        error: "canal e enviado são obrigatórios",
      });
    }

    const notificacao = await notificacaoService.atualizarStatusEnvio(
      id,
      canal,
      enviado
    );
    return reply.status(200).send(notificacao);
  });
}
