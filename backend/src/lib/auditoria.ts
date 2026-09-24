// Trilha de auditoria (LGPD). Nunca lança: falha ao auditar não pode derrubar
// a operação principal — mas é registrada no log do servidor.
// NUNCA passar CPF, NIS, dado de saúde ou conteúdo de documento em "detalhes".
import type { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { logger } from "../utils/logger.js";

export type AcaoAuditoria =
  | "LOGIN_SUCESSO"
  | "LOGIN_FALHA"
  | "LOGOUT"
  | "SESSAO_REUSO_DETECTADO"
  | "DOCUMENTO_DOWNLOAD"
  | "DOCUMENTO_EXCLUSAO"
  | "DOCUMENTOS_EXPURGO"
  | "EXPORTACAO_EDUCACENSO"
  | "EXPORTACAO_PRESENCA";

export interface EventoAuditoria {
  acao: AcaoAuditoria;
  recurso?: string;
  recursoId?: string;
  detalhes?: Prisma.InputJsonObject;
  userId?: string | null;
  userRole?: string | null;
}

export async function auditar(request: FastifyRequest | null, evento: EventoAuditoria) {
  const user = (request?.user ?? null) as { id?: string; role?: string } | null;
  try {
    await prisma.auditLog.create({
      data: {
        acao: evento.acao,
        recurso: evento.recurso,
        recursoId: evento.recursoId,
        detalhes: evento.detalhes,
        userId: evento.userId !== undefined ? evento.userId : user?.id ?? null,
        userRole: evento.userRole !== undefined ? evento.userRole : user?.role ?? null,
        ip: request?.ip,
        userAgent: request?.headers["user-agent"]?.slice(0, 300),
      },
    });
  } catch (err) {
    logger.error(
      "Falha ao gravar trilha de auditoria",
      err instanceof Error ? err : undefined,
      { acao: evento.acao }
    );
  }
}
