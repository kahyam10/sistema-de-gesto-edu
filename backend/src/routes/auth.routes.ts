import { FastifyInstance } from "fastify";
import { authService } from "../services/index.js";
import { registerSchema, loginSchema } from "../schemas/index.js";

export async function authRoutes(app: FastifyInstance) {
  // Registro de usuário
  app.post("/register", async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);
      const user = await authService.register(data);

      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      });

      return reply.status(201).send({ user, token });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao registrar usuário";
      return reply.status(400).send({ error: message });
    }
  });

  // Login
  app.post("/login", async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);
      const user = await authService.login(data);

      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
      });

      return reply.send({ user, token });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao fazer login";
      return reply.status(401).send({ error: message });
    }
  });

  // Obter usuário logado
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userPayload = request.user as { id: string };
      const user = await authService.getUserById(userPayload.id);

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      return reply.send(user);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao buscar usuário";
      return reply.status(500).send({ error: message });
    }
  });
}
