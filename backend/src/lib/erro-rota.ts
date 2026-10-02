import type { FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";

/**
 * Erro de negócio "simples": instância EXATA de Error (não subclasse), lançado
 * pelos services como `throw new Error("Matrícula X não pertence a esta turma")`.
 * A mensagem foi escrita para o usuário e continua sendo devolvida.
 *
 * Subclasses (erros do Prisma, TypeError, RangeError, erros de libs etc.)
 * NÃO entram aqui: a mensagem delas pode conter detalhes internos (consulta,
 * caminho do arquivo, nomes de tabela).
 */
export function isErroNegocioSimples(error: unknown): error is Error {
  return error instanceof Error && Object.getPrototypeOf(error) === Error.prototype;
}

/**
 * Tratamento único dos `catch` das rotas.
 *
 * - AppError → status e mensagem do próprio erro (como antes);
 * - ZodError → 400 no formato padrão de validação (como antes);
 * - `new Error("mensagem")` simples → `statusNegocio` com a mensagem (como antes);
 * - qualquer outra coisa (Prisma.*Error, TypeError, valores não-Error...) é
 *   relançada para o tratador global (middleware/error-handler.ts), que
 *   registra o erro no log e responde sem expor detalhes internos.
 */
export function responderErroRota(
  error: unknown,
  reply: FastifyReply,
  statusNegocio = 400
): FastifyReply {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  if (error instanceof ZodError) {
    return reply.status(400).send(formatarErroZod(error));
  }
  if (isErroNegocioSimples(error)) {
    return reply.status(statusNegocio).send({ error: error.message });
  }
  throw error;
}
