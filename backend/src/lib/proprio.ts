// Recursos pessoais (notificações, recibos de leitura): só o próprio usuário
// — ou a gestão da rede — acessa. Evita IDOR por :userId na URL.
import type { FastifyRequest } from "fastify";
import { PermissionError } from "../errors/index.js";
import { GESTAO } from "./rbac.js";

type UsuarioSessao = { id: string; role: string };

export function podeVerDeOutro(user: UsuarioSessao): boolean {
  return GESTAO.includes(user.role);
}

/** 403 PERM_004 se `userId` não é o da sessão (exceto gestão da rede). */
export function garantirProprio(request: FastifyRequest, userId: string): void {
  const user = request.user as UsuarioSessao;
  if (user.id !== userId && !podeVerDeOutro(user)) throw new PermissionError("PERM_004");
}
