import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      nome: string;
      role: string;
      escolaId?: string | null;
      /** CSRF da sessão web (só em tokens emitidos para cookie) */
      csrf?: string;
      /** família da sessão (refresh token) */
      sid?: string;
    };
    user: {
      id: string;
      email: string;
      nome: string;
      role: string;
      escolaId?: string | null;
      csrf?: string;
      sid?: string;
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
