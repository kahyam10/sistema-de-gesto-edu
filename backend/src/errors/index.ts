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

// Exporta os códigos de erro para uso direto
export { default as ErrorCodes } from "./error-codes.json" with { type: "json" };
