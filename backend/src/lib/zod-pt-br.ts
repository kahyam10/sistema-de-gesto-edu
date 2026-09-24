import { z } from "zod";

const TIPOS_PT: Record<string, string> = {
  string: "texto",
  number: "número",
  integer: "número inteiro",
  boolean: "booleano",
  date: "data",
  array: "lista",
  object: "objeto",
  bigint: "número",
};

/**
 * ErrorMap global em PT-BR (zod v3). Mensagens customizadas definidas nos
 * schemas (ex.: z.string().min(1, "Nome é obrigatório")) continuam vencendo.
 */
export const errorMapPtBr: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "Campo obrigatório" };
      }
      return {
        message: `Tipo inválido: esperado ${TIPOS_PT[issue.expected] ?? issue.expected}`,
      };

    case z.ZodIssueCode.invalid_enum_value:
      return {
        message: `Valor inválido. Opções aceitas: ${issue.options.join(", ")}`,
      };

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "E-mail inválido" };
      if (issue.validation === "url") return { message: "URL inválida" };
      if (issue.validation === "uuid" || issue.validation === "cuid") {
        return { message: "Identificador inválido" };
      }
      if (issue.validation === "datetime") {
        return { message: "Data/hora inválida" };
      }
      if (issue.validation === "regex") return { message: "Formato inválido" };
      return { message: "Texto em formato inválido" };

    case z.ZodIssueCode.too_small: {
      const min = Number(issue.minimum);
      if (issue.type === "string") {
        if (min <= 1) return { message: "Campo obrigatório" };
        return { message: `Deve ter no mínimo ${min} caracteres` };
      }
      if (issue.type === "number" || issue.type === "bigint") {
        return {
          message: issue.inclusive
            ? `Deve ser maior ou igual a ${min}`
            : `Deve ser maior que ${min}`,
        };
      }
      if (issue.type === "array" || issue.type === "set") {
        return { message: `Informe pelo menos ${min} item(ns)` };
      }
      if (issue.type === "date") {
        return {
          message: `Data deve ser a partir de ${new Date(min).toLocaleDateString("pt-BR")}`,
        };
      }
      return { message: "Valor abaixo do mínimo permitido" };
    }

    case z.ZodIssueCode.too_big: {
      const max = Number(issue.maximum);
      if (issue.type === "string") {
        return { message: `Deve ter no máximo ${max} caracteres` };
      }
      if (issue.type === "number" || issue.type === "bigint") {
        return {
          message: issue.inclusive
            ? `Deve ser menor ou igual a ${max}`
            : `Deve ser menor que ${max}`,
        };
      }
      if (issue.type === "array" || issue.type === "set") {
        return { message: `Informe no máximo ${max} item(ns)` };
      }
      if (issue.type === "date") {
        return {
          message: `Data deve ser até ${new Date(max).toLocaleDateString("pt-BR")}`,
        };
      }
      return { message: "Valor acima do máximo permitido" };
    }

    case z.ZodIssueCode.invalid_date:
      return { message: "Data inválida" };

    case z.ZodIssueCode.not_multiple_of:
      return { message: `Deve ser múltiplo de ${issue.multipleOf}` };

    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campos não reconhecidos: ${issue.keys.join(", ")}` };

    case z.ZodIssueCode.invalid_union:
    case z.ZodIssueCode.invalid_union_discriminator:
      return { message: "Valor não corresponde a nenhum formato aceito" };

    case z.ZodIssueCode.invalid_literal:
      return { message: "Valor inválido" };

    case z.ZodIssueCode.not_finite:
      return { message: "Número inválido" };

    default:
      // custom (.refine com mensagem própria) e demais casos
      return { message: ctx.defaultError };
  }
};

/** Instala o map global. Chamar UMA vez no boot (server.ts) e no setup dos testes. */
export function configurarZodPtBr(): void {
  z.setErrorMap(errorMapPtBr);
}
