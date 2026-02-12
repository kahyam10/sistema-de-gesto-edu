import { toast } from "sonner";

/**
 * Mapeamento de códigos de erro para mensagens amigáveis
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: "Dados inválidos. Por favor, verifique as informações e tente novamente.",
  401: "Sessão expirada. Por favor, faça login novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "Recurso não encontrado.",
  409: "Conflito: Este registro já existe ou está em uso.",
  422: "Dados inválidos. Verifique os campos obrigatórios.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
  503: "Serviço temporariamente indisponível. Tente novamente em alguns instantes.",
};

/**
 * Mensagens específicas por contexto/operação
 */
export const OPERATION_MESSAGES = {
  // Criar
  create: {
    success: "Registro criado com sucesso!",
    error: "Erro ao criar registro.",
  },
  // Atualizar
  update: {
    success: "Registro atualizado com sucesso!",
    error: "Erro ao atualizar registro.",
  },
  // Deletar
  delete: {
    success: "Registro excluído com sucesso!",
    error: "Erro ao excluir registro.",
  },
  // Buscar
  fetch: {
    error: "Erro ao carregar dados.",
  },
  // Login/Auth
  login: {
    success: "Login realizado com sucesso!",
    error: "Email ou senha incorretos.",
  },
  logout: {
    success: "Logout realizado com sucesso!",
  },
  // Importar/Exportar
  export: {
    success: "Dados exportados com sucesso!",
    error: "Erro ao exportar dados.",
  },
  import: {
    success: "Dados importados com sucesso!",
    error: "Erro ao importar dados.",
  },
  // Upload
  upload: {
    success: "Arquivo enviado com sucesso!",
    error: "Erro ao enviar arquivo.",
  },
};

/**
 * Interface para erros de API
 */
export interface ApiError {
  status?: number;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>; // Para erros de validação
}

/**
 * Extrai mensagem de erro de diferentes formatos de resposta
 */
function extractErrorMessage(error: unknown): string {
  if (!error) return "Erro desconhecido";

  // Se for um objeto com propriedade message
  if (typeof error === "object" && "message" in error) {
    return (error as ApiError).message || "Erro desconhecido";
  }

  // Se for um objeto com propriedade error
  if (typeof error === "object" && "error" in error) {
    return (error as ApiError).error || "Erro desconhecido";
  }

  // Se for string
  if (typeof error === "string") {
    return error;
  }

  return "Erro desconhecido";
}

/**
 * Trata erros de API e exibe mensagens apropriadas via toast
 */
export function handleApiError(error: unknown, context?: string): void {
  let message: string;
  let status: number | undefined;

  // Extrai status code se disponível
  if (typeof error === "object" && error !== null && "status" in error) {
    status = (error as ApiError).status;
  }

  // Usa mensagem específica por status code
  if (status && ERROR_MESSAGES[status]) {
    message = ERROR_MESSAGES[status];
  } else {
    // Extrai mensagem customizada do erro
    message = extractErrorMessage(error);
  }

  // Adiciona contexto se fornecido
  if (context) {
    message = `${context}: ${message}`;
  }

  // Exibe toast de erro
  toast.error(message, {
    duration: 5000,
    closeButton: true,
  });

  // Log para debugging (apenas em desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", {
      status,
      message,
      error,
      context,
    });
  }
}

/**
 * Trata erros de validação (múltiplos campos)
 */
export function handleValidationErrors(errors: Record<string, string[]>): void {
  const messages = Object.entries(errors)
    .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(", ")}`)
    .join("\n");

  toast.error("Erros de validação", {
    description: messages,
    duration: 7000,
    closeButton: true,
  });
}

/**
 * Exibe mensagem de sucesso padronizada
 */
export function showSuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Hook personalizado para tratamento de erros em mutations
 */
export function useErrorHandler() {
  return {
    handleError: handleApiError,
    handleValidation: handleValidationErrors,
    showSuccess,
  };
}

/**
 * Wrapper para erros de operações CRUD
 */
export const crudErrorHandler = {
  create: {
    onSuccess: () => showSuccess(OPERATION_MESSAGES.create.success),
    onError: (error: unknown) =>
      handleApiError(error, OPERATION_MESSAGES.create.error),
  },
  update: {
    onSuccess: () => showSuccess(OPERATION_MESSAGES.update.success),
    onError: (error: unknown) =>
      handleApiError(error, OPERATION_MESSAGES.update.error),
  },
  delete: {
    onSuccess: () => showSuccess(OPERATION_MESSAGES.delete.success),
    onError: (error: unknown) =>
      handleApiError(error, OPERATION_MESSAGES.delete.error),
  },
  fetch: {
    onError: (error: unknown) =>
      handleApiError(error, OPERATION_MESSAGES.fetch.error),
  },
};
