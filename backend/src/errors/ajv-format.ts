// Erros de validação do schema JSON das rotas (Fastify/ajv) no MESMO formato
// dos erros zod: { statusCode: 400, error: "VALIDATION", message, issues }.
// Antes as rotas com schema (módulo 9 e outras) devolviam o envelope antigo
// VAL_001 com as mensagens cruas do ajv, em inglês.
import type { IssueValidacao, RespostaErroValidacao } from "./zod-format.js";

export interface ErroAjv {
  instancePath?: string;
  keyword: string;
  params?: Record<string, unknown>;
  message?: string;
}

const ONDE: Record<string, string> = {
  body: "corpo",
  querystring: "parâmetros da URL",
  params: "caminho",
  headers: "cabeçalhos",
};

const TIPOS: Record<string, string> = {
  string: "texto", number: "número", integer: "número inteiro", boolean: "verdadeiro/falso",
  object: "objeto", array: "lista", null: "vazio",
};

const FORMATOS: Record<string, string> = {
  "date-time": "data e hora (ISO 8601)", date: "data (AAAA-MM-DD)", email: "e-mail", uri: "endereço (URL)",
};

function campoDe(e: ErroAjv): string {
  const base = (e.instancePath ?? "").split("/").filter(Boolean).join(".");
  const extra =
    e.keyword === "required" ? e.params?.missingProperty
      : e.keyword === "additionalProperties" ? e.params?.additionalProperty
        : undefined;
  const completo = [base, typeof extra === "string" ? extra : ""].filter(Boolean).join(".");
  return completo || "(geral)";
}

function mensagemDe(e: ErroAjv): string {
  const p = e.params ?? {};
  switch (e.keyword) {
    case "required": return "Campo obrigatório";
    case "type": {
      const t = String(p.type ?? "").split(",").map((x) => TIPOS[x] ?? x).join(" ou ");
      return `Deve ser ${t}`;
    }
    case "enum": {
      const permitidos = Array.isArray(p.allowedValues) ? p.allowedValues.join(", ") : "";
      return permitidos ? `Valor inválido. Use: ${permitidos}` : "Valor inválido";
    }
    case "minLength": return `Deve ter pelo menos ${p.limit} caractere(s)`;
    case "maxLength": return `Deve ter no máximo ${p.limit} caracteres`;
    case "minimum": return `Deve ser maior ou igual a ${p.limit}`;
    case "maximum": return `Deve ser menor ou igual a ${p.limit}`;
    case "exclusiveMinimum": return `Deve ser maior que ${p.limit}`;
    case "exclusiveMaximum": return `Deve ser menor que ${p.limit}`;
    case "minItems": return `Deve ter pelo menos ${p.limit} item(ns)`;
    case "maxItems": return `Deve ter no máximo ${p.limit} itens`;
    case "format": return `Formato inválido: use ${FORMATOS[String(p.format)] ?? p.format}`;
    case "pattern": return "Formato inválido";
    case "additionalProperties": return "Campo não permitido";
    case "const": return "Valor inválido";
    default: return "Valor inválido";
  }
}

export function formatarErroAjv(erros: ErroAjv[], contexto?: string): RespostaErroValidacao {
  const issues: IssueValidacao[] = erros.map((e) => ({ campo: campoDe(e), mensagem: mensagemDe(e) }));
  if (issues.length === 0) issues.push({ campo: "(geral)", mensagem: "Dados de entrada inválidos" });
  const campos = [...new Set(issues.map((i) => i.campo))];
  const onde = contexto && ONDE[contexto] ? ` (${ONDE[contexto]})` : "";
  const message =
    issues.length === 1
      ? issues[0].campo === "(geral)"
        ? `${issues[0].mensagem}${onde}`
        : `${issues[0].campo}: ${issues[0].mensagem}${onde}`
      : `Dados inválidos em ${campos.length} campo(s)${onde}: ${campos.slice(0, 5).join(", ")}${campos.length > 5 ? "…" : ""}`;
  return { statusCode: 400, error: "VALIDATION", message, issues };
}
