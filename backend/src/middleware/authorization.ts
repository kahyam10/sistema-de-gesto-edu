import { FastifyRequest, FastifyReply } from "fastify";
import { UserRole, hasPermission, hasModulePermission, Permission } from "../types/roles.js";

export interface AuthorizedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    nome: string;
    role: UserRole;
    escolaId?: string;
    profissionalId?: string;
    matriculaId?: string;
  };
}

/**
 * Middleware que verifica se o usuário tem permissão baseada no role mínimo exigido
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authReq = request as AuthorizedRequest;

    if (!authReq.user) {
      return reply.status(401).send({ error: "Não autenticado" });
    }

    const userRole = authReq.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        error: "Acesso negado",
        message: `Seu perfil (${userRole}) não tem permissão para acessar este recurso`,
      });
    }
  };
}

/**
 * Middleware que verifica se o usuário tem permissão para um módulo específico
 */
export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authReq = request as AuthorizedRequest;

    if (!authReq.user) {
      return reply.status(401).send({ error: "Não autenticado" });
    }

    const userRole = authReq.user.role as UserRole;

    if (!hasModulePermission(userRole, permission)) {
      return reply.status(403).send({
        error: "Acesso negado",
        message: `Seu perfil não tem permissão para: ${permission}`,
      });
    }
  };
}

/**
 * Middleware que verifica se o usuário está acessando apenas seus próprios dados
 * ou se tem permissão administrativa
 */
export function requireOwnershipOrAdmin(getOwnerId: (request: FastifyRequest) => string | null) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authReq = request as AuthorizedRequest;

    if (!authReq.user) {
      return reply.status(401).send({ error: "Não autenticado" });
    }

    const userRole = authReq.user.role as UserRole;

    // Admin e SEMEC podem acessar tudo
    if (userRole === UserRole.ADMIN || userRole === UserRole.SEMEC) {
      return;
    }

    const ownerId = getOwnerId(request);
    const userId = authReq.user.id;

    // Verifica se é o próprio usuário ou se está vinculado ao recurso
    const isOwner =
      ownerId === userId ||
      ownerId === authReq.user.profissionalId ||
      ownerId === authReq.user.matriculaId;

    if (!isOwner) {
      return reply.status(403).send({
        error: "Acesso negado",
        message: "Você só pode acessar seus próprios dados",
      });
    }
  };
}

/**
 * Middleware que verifica se o usuário pertence à mesma escola do recurso
 */
export function requireSameSchool(getEscolaId: (request: FastifyRequest) => Promise<string | null>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authReq = request as AuthorizedRequest;

    if (!authReq.user) {
      return reply.status(401).send({ error: "Não autenticado" });
    }

    const userRole = authReq.user.role as UserRole;

    // Admin e SEMEC podem acessar todas as escolas
    if (userRole === UserRole.ADMIN || userRole === UserRole.SEMEC) {
      return;
    }

    const userEscolaId = authReq.user.escolaId;
    const resourceEscolaId = await getEscolaId(request);

    if (!userEscolaId || userEscolaId !== resourceEscolaId) {
      return reply.status(403).send({
        error: "Acesso negado",
        message: "Você só pode acessar dados da sua escola",
      });
    }
  };
}
