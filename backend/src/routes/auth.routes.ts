import { FastifyInstance } from "fastify";
import { AppError } from "../errors/index.js";
import { ZodError } from "zod";
import { authService } from "../services/index.js";
import { registerSchema, loginSchema } from "../schemas/index.js";
import { adminMiddleware } from "../middleware/auth.js";

export async function authRoutes(app: FastifyInstance) {
  // Registro de usuário — restrito a ADMIN/SEMEC (o schema aceita role,
  // então registro público permitiria criar contas ADMIN)
  app.post("/register", { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);
      const user = await authService.register(data);

      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        escolaId: user.escola?.id ?? null,
      });

      return reply.status(201).send({ user, token });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
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
        escolaId: user.escolaId ?? null,
      });

      return reply.send({ user, token });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
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
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof ZodError) {
        return reply
          .status(400)
          .send({ error: error.issues[0]?.message ?? "Dados inválidos" });
      }
      const message =
        error instanceof Error ? error.message : "Erro ao buscar usuário";
      return reply.status(500).send({ error: message });
    }
  });
}
