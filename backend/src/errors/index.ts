export {
  AppError,
  AuthenticationError,
  PermissionError,
  ValidationError,
  NotFoundError,
  BusinessError,
  DatabaseError,
  FileError,
  ExternalServiceError,
  SystemError,
  ErrorContext,
} from "./AppError.js";

export { formatarErroZod } from "./zod-format.js";
export { formatarErroAjv } from "./ajv-format.js";
export type { RespostaErroValidacao, IssueValidacao } from "./zod-format.js";

// Exporta os códigos de erro para uso direto
export { default as ErrorCodes } from "./error-codes.json";
