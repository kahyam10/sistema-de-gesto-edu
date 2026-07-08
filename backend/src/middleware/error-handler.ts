import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError, DatabaseError, SystemError } from "../errors/index.js";
import { logger } from "../utils/logger.js";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Middleware global de tratamento de erros
 */
export function errorHandler(
  error: Error | FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log do erro
  logger.error("Request error", error, {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });

  // Se for um erro customizado da aplicação
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(error.toJSON());
  }

  // Erro de validação do Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: "VAL_001",
        message: "Dados de entrada inválidos",
        category: "VALIDACAO",
        timestamp: new Date().toISOString(),
        details: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      },
    });
  }

  // Erros do Prisma (Database)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, reply);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.status(400).send({
      error: {
        code: "DB_002",
        message: "Erro de validação no banco de dados",
        category: "BANCO_DADOS",
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const dbError = new DatabaseError("DB_001");
    return reply.status(500).send(dbError.toJSON());
  }

  // Erro de validação do Fastify
  if ((error as FastifyError).validation) {
    return reply.status(400).send({
      error: {
        code: "VAL_001",
        message: "Dados de entrada inválidos",
        category: "VALIDACAO",
        timestamp: new Date().toISOString(),
        details: (error as FastifyError).validation,
      },
    });
  }

  // Erro de autenticação do Fastify
  if ((error as any).statusCode === 401) {
    return reply.status(401).send({
      error: {
        code: "AUTH_002",
        message: "Token de autenticação inválido ou expirado",
        category: "AUTENTICACAO",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erro genérico do Fastify com statusCode
  if ((error as FastifyError).statusCode) {
    return reply.status((error as FastifyError).statusCode!).send({
      error: {
        code: "SYS_001",
        message: error.message || "Erro na requisição",
        category: "SISTEMA",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erro desconhecido/não tratado
  const systemError = new SystemError("SYS_001");
  logger.error("Unhandled error", error, {
    errorName: error.name,
    errorMessage: error.message,
  });

  return reply.status(500).send(systemError.toJSON());
}

/**
 * Trata erros específicos do Prisma
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  reply: FastifyReply
) {
  // P2002: Unique constraint violation
  if (error.code === "P2002") {
    const target = (error.meta?.target as string[]) || [];
    return reply.status(409).send({
      error: {
        code: "DB_003",
        message: "Violação de constraint única no banco de dados",
        category: "BANCO_DADOS",
        timestamp: new Date().toISOString(),
        context: {
          fields: target,
        },
      },
    });
  }

  // P2003: Foreign key constraint violation
  if (error.code === "P2003") {
    return reply.status(409).send({
      error: {
        code: "DB_004",
        message: "Violação de chave estrangeira no banco de dados",
        category: "BANCO_DADOS",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // P2025: Record not found
  if (error.code === "P2025") {
    return reply.status(404).send({
      error: {
        code: "NF_001",
        message: "Recurso não encontrado",
        category: "NAO_ENCONTRADO",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // P2024: Timeout
  if (error.code === "P2024") {
    return reply.status(504).send({
      error: {
        code: "DB_005",
        message: "Timeout ao executar operação no banco de dados",
        category: "BANCO_DADOS",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erro genérico do Prisma
  const dbError = new DatabaseError("DB_002", {
    prismaCode: error.code,
  });
  return reply.status(500).send(dbError.toJSON());
}

/**
 * Valida se um erro é operacional (esperado) ou crítico
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
