import { useState, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { getZodErrorMessages } from "@/lib/validations";

/**
 * Hook para validação de formulários com Zod
 * Funciona com state manual (useState) sem precisar refatorar para React Hook Form
 */
export function useFormValidation<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Valida o formulário completo
   * Retorna true se válido, false se inválido
   */
  const validate = useCallback(
    (data: unknown): data is z.infer<T> => {
      try {
        schema.parse(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = getZodErrorMessages(error);
          setErrors(fieldErrors);

          // Exibe toast com o primeiro erro
          const firstError = Object.values(fieldErrors)[0];
          if (firstError) {
            toast.error("Erro de validação", {
              description: firstError,
              duration: 4000,
            });
          }
        }
        return false;
      }
    },
    [schema]
  );

  /**
   * Valida um campo específico
   */
  const validateField = useCallback(
    (fieldName: string, value: unknown) => {
      try {
        // Tenta validar apenas o campo específico
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: error.errors[0].message,
          }));
        }
      }
    },
    [schema]
  );

  /**
   * Limpa todos os erros
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Limpa erro de um campo específico
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Obtém erro de um campo específico
   */
  const getFieldError = useCallback(
    (fieldName: string) => {
      return errors[fieldName];
    },
    [errors]
  );

  /**
   * Verifica se há erros
   */
  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasErrors,
  };
}

/**
 * Componente de erro para exibir abaixo dos campos
 */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <p className="text-sm font-medium text-destructive mt-1">
      {error}
    </p>
  );
}
