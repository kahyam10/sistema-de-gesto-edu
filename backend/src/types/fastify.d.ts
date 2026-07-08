import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      nome: string;
      role: string;
      escolaId?: string | null;
    };
    user: {
      id: string;
      email: string;
      nome: string;
      role: string;
      escolaId?: string | null;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
