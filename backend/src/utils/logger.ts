import { AppError } from "../errors/index.js";

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

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Loga mensagem de erro
   */
  error(message: string, error?: Error | AppError, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };

      if (error instanceof AppError) {
        logEntry.error.code = error.code;
        logEntry.error.category = error.category;
      }
    }

    this.log(logEntry);
  }

  /**
   * Loga mensagem de aviso
   */
  warn(message: string, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    this.log(logEntry);
  }

  /**
   * Loga mensagem de informação
   */
  info(message: string, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    this.log(logEntry);
  }

  /**
   * Loga mensagem de debug
   */
  debug(message: string, context?: Record<string, any>) {
    if (!this.isDevelopment) return;

    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    this.log(logEntry);
  }

  /**
   * Método interno para realizar o log
   */
  private log(entry: LogEntry) {
    const output = this.isDevelopment
      ? this.formatDevelopment(entry)
      : this.formatProduction(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.DEBUG:
        console.log(output);
        break;
    }

    // Em produção, você pode enviar para um serviço de logging externo
    // Ex: Sentry, DataDog, CloudWatch, etc.
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Formata log para ambiente de desenvolvimento
   */
  private formatDevelopment(entry: LogEntry): string {
    const parts: string[] = [];

    // Emoji por nível
    const emoji = {
      [LogLevel.ERROR]: "❌",
      [LogLevel.WARN]: "⚠️",
      [LogLevel.INFO]: "ℹ️",
      [LogLevel.DEBUG]: "🔍",
    };

    parts.push(`${emoji[entry.level]} [${entry.timestamp}]`);
    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(entry.message);

    if (entry.error) {
      parts.push(`\n  Code: ${entry.error.code || "N/A"}`);
      parts.push(`\n  Category: ${entry.error.category || "N/A"}`);
      parts.push(`\n  Message: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`\n  Context: ${JSON.stringify(entry.context, null, 2)}`);
    }

    return parts.join(" ");
  }

  /**
   * Formata log para ambiente de produção (JSON)
   */
  private formatProduction(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Envia log para serviço externo (placeholder)
   */
  private sendToExternalService(entry: LogEntry) {
    // TODO: Implementar integração com serviço de logging
    // Exemplos: Sentry, DataDog, CloudWatch, Loggly, etc.
    // if (entry.level === LogLevel.ERROR) {
    //   Sentry.captureException(entry);
    // }
  }
}

export const logger = new Logger();
