import errorCodes from "./error-codes.json" with { type: "json" };

export interface ErrorDetail {
  code: string;
  message: string;
  statusCode: number;
  category: string;
}

export interface ErrorContext {
  [key: string]: any;
}

/**
 * Classe base para erros da aplicação
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly category: string;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    errorCode: string,
    context?: ErrorContext,
    isOperational: boolean = true
  ) {
    const errorDetail = AppError.getErrorDetail(errorCode);
    super(errorDetail.message);

    this.code = errorDetail.code;
    this.statusCode = errorDetail.statusCode;
    this.category = errorDetail.category;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Busca detalhes do erro pelo código
   */
  private static getErrorDetail(code: string): ErrorDetail {
    // Procura o erro em todas as categorias
    for (const category of Object.values(errorCodes)) {
      const categoryObj = category as Record<string, any>;
      if (categoryObj[code]) {
        return categoryObj[code] as ErrorDetail;
      }
    }

    // Se não encontrar, retorna erro genérico
    return {
      code: "SYS_001",
      message: "Erro interno do servidor",
      statusCode: 500,
      category: "SISTEMA",
    };
  }

  /**
   * Retorna objeto JSON com informações do erro
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        category: this.category,
        timestamp: this.timestamp,
        ...(this.context && { context: this.context }),
      },
    };
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(code: string = "AUTH_001", context?: ErrorContext) {
    super(code, context);
  }
}

/**
 * Erro de permissão
 */
export class PermissionError extends AppError {
  constructor(code: string = "PERM_001", context?: ErrorContext) {
    super(code, context);
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends AppError {
  constructor(code: string = "VAL_001", context?: ErrorContext) {
    super(code, context);
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(code: string = "NF_001", context?: ErrorContext) {
    super(code, context);
  }
}

/**
 * Erro de regra de negócio
 */
export class BusinessError extends AppError {
  constructor(code: string, context?: ErrorContext) {
    super(code, context);
  }
}

/**
 * Erro de banco de dados
 */
export class DatabaseError extends AppError {
  constructor(code: string = "DB_001", context?: ErrorContext) {
    super(code, context, false); // Não operacional por padrão
  }
}

/**
 * Erro de arquivo
 */
export class FileError extends AppError {
  constructor(code: string, context?: ErrorContext) {
    super(code, context);
  }
}

/**
 * Erro de serviço externo
 */
export class ExternalServiceError extends AppError {
  constructor(code: string = "EXT_001", context?: ErrorContext) {
    super(code, context, false); // Não operacional por padrão
  }
}

/**
 * Erro de sistema
 */
export class SystemError extends AppError {
  constructor(code: string = "SYS_001", context?: ErrorContext) {
    super(code, context, false); // Não operacional por padrão
  }
}
