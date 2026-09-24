import { describe, it, expect, beforeAll } from "vitest";
import { z } from "zod";
import { formatarErroZod } from "../src/errors/zod-format.js";
import { configurarZodPtBr } from "../src/lib/zod-pt-br.js";
import { createMatriculaSchema } from "../src/schemas/index.js";

// Testes puros (sem banco): formatação central de erros zod em PT-BR

beforeAll(() => {
  configurarZodPtBr();
});

function capturar(fn: () => unknown): z.ZodError {
  try {
    fn();
  } catch (error) {
    if (error instanceof z.ZodError) return error;
    throw error;
  }
  throw new Error("esperava ZodError");
}

describe("formatarErroZod", () => {
  it("formata campo obrigatório ausente do createMatriculaSchema em PT-BR", () => {
    const err = capturar(() => createMatriculaSchema.parse({}));
    const resposta = formatarErroZod(err);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.error).toBe("VALIDATION");
    expect(resposta.issues.length).toBeGreaterThan(0);
    const nomeAluno = resposta.issues.find((i) => i.campo === "nomeAluno");
    expect(nomeAluno).toBeDefined();
    expect(nomeAluno!.mensagem).toBe("Campo obrigatório");
  });

  it("traduz enum inválido com as opções aceitas", () => {
    const schema = z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]);
    const err = capturar(() => schema.parse("X"));
    const resposta = formatarErroZod(err);

    expect(resposta.message).toContain(
      "Valor inválido. Opções aceitas: PRESENTE, FALTA, JUSTIFICADA"
    );
  });

  it("usa dot-notation para paths aninhados (arrays)", () => {
    const schema = z.object({
      presencas: z.array(
        z.object({ status: z.enum(["PRESENTE", "FALTA"]) })
      ),
    });
    const err = capturar(() =>
      schema.parse({
        presencas: [{ status: "PRESENTE" }, { status: "PRESENTE" }, { status: "Z" }],
      })
    );
    const resposta = formatarErroZod(err);

    expect(resposta.issues[0].campo).toBe("presencas.2.status");
  });

  it("resume múltiplos erros em uma mensagem agregada", () => {
    const schema = z.object({
      nome: z.string(),
      idade: z.number(),
      email: z.string().email(),
    });
    const err = capturar(() => schema.parse({ email: "nao-eh-email" }));
    const resposta = formatarErroZod(err);

    expect(resposta.issues.length).toBe(3);
    expect(resposta.message).toMatch(/Dados inválidos em 3 campo\(s\)/);
  });

  it("preserva mensagens customizadas do schema", () => {
    const schema = z.object({ nome: z.string().min(1, "Nome é obrigatório") });
    const err = capturar(() => schema.parse({ nome: "" }));
    const resposta = formatarErroZod(err);

    expect(resposta.issues[0].mensagem).toBe("Nome é obrigatório");
    expect(resposta.message).toBe("nome: Nome é obrigatório");
  });

  it("traduz data inválida de z.coerce.date()", () => {
    const schema = z.object({ data: z.coerce.date() });
    const err = capturar(() => schema.parse({ data: "abc" }));
    const resposta = formatarErroZod(err);

    expect(resposta.issues[0].mensagem).toBe("Data inválida");
  });
});
