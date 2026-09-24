import { FastifyReply, FastifyRequest } from "fastify";

// O guard global (app.ts) autentica toda rota /api — por cookie ou Bearer — e
// preenche request.user antes destes preHandlers. Aqui só se checa o papel.

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({ error: "Não autorizado" });
  }
}

function exigirPapel(papeis: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Não autorizado" });
    }
    if (!papeis.includes(request.user.role)) {
      return reply.status(403).send({ error: "Acesso negado" });
    }
  };
}

export const adminMiddleware = exigirPapel(["ADMIN", "SEMEC"]);
export const diretorMiddleware = exigirPapel(["ADMIN", "SEMEC", "DIRETOR"]);
