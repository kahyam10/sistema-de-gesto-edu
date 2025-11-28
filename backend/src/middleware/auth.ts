import { FastifyReply, FastifyRequest } from "fastify";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Não autorizado" });
  }
}

export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const user = request.user as { role: string };

    if (user.role !== "ADMIN" && user.role !== "SEMEC") {
      return reply.status(403).send({ error: "Acesso negado" });
    }
  } catch (err) {
    reply.status(401).send({ error: "Não autorizado" });
  }
}

export async function diretorMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const user = request.user as { role: string };

    if (!["ADMIN", "SEMEC", "DIRETOR"].includes(user.role)) {
      return reply.status(403).send({ error: "Acesso negado" });
    }
  } catch (err) {
    reply.status(401).send({ error: "Não autorizado" });
  }
}
