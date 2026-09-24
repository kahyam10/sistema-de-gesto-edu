import { ZodError } from "zod";

export interface IssueValidacao {
  campo: string;
  mensagem: string;
}

export interface RespostaErroValidacao {
  statusCode: 400;
  error: "VALIDATION";
  message: string;
  issues: IssueValidacao[];
}

/** path zod → dot-notation amigável: ["presencas", 2, "status"] → "presencas.2.status" */
function caminhoAmigavel(path: (string | number)[]): string {
  if (path.length === 0) return "(geral)";
  return path.map(String).join(".");
}

/**
 * Formata um ZodError na resposta 400 padrão da API:
 * { statusCode: 400, error: "VALIDATION", message, issues: [{ campo, mensagem }] }
 * As mensagens já chegam em PT-BR via errorMapPtBr (lib/zod-pt-br.ts) ou
 * mensagem customizada do próprio schema.
 */
export function formatarErroZod(error: ZodError): RespostaErroValidacao {
  const issues: IssueValidacao[] = error.issues.map((issue) => ({
    campo: caminhoAmigavel(issue.path),
    mensagem: issue.message,
  }));

  const campos = [...new Set(issues.map((i) => i.campo))];
  const message =
    issues.length === 1
      ? issues[0].campo === "(geral)"
        ? issues[0].mensagem
        : `${issues[0].campo}: ${issues[0].mensagem}`
      : `Dados inválidos em ${campos.length} campo(s): ${campos.slice(0, 5).join(", ")}${campos.length > 5 ? "…" : ""}`;

  return { statusCode: 400, error: "VALIDATION", message, issues };
}
