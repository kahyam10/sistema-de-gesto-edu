import pino from "pino";
import { AppError } from "../errors/index.js";

const isDevelopment = process.env.NODE_ENV !== "production";

// Logger Pino estruturado
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // Em produção, output JSON puro (ideal para CloudWatch, DataDog, etc.)
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    code?: string;
    message: string;
    stack?: string;
    category?: string;
  };
}

/**
 * Logger wrapper mantendo a API existente mas usando Pino por baixo
 */
class Logger {
  error(
    message: string,
    error?: Error | AppError,
    context?: Record<string, any>,
  ) {
    const extra: Record<string, any> = { ...context };

    if (error) {
      extra.err = {
        message: error.message,
        stack: error.stack,
        ...(error instanceof AppError && {
          code: error.code,
          category: error.category,
        }),
      };
    }

    pinoLogger.error(extra, message);
  }

  warn(message: string, context?: Record<string, any>) {
    pinoLogger.warn(context || {}, message);
  }

  info(message: string, context?: Record<string, any>) {
    pinoLogger.info(context || {}, message);
  }

  debug(message: string, context?: Record<string, any>) {
    pinoLogger.debug(context || {}, message);
  }

  /**
   * Retorna a instância Pino para uso direto (ex: Fastify logger)
   */
  get pino() {
    return pinoLogger;
  }
}

export const logger = new Logger();
