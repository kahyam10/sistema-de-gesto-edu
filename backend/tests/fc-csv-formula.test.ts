// Frente C — injeção de fórmula no CSV do Sistema Presença (aberto no Excel).
// Dados 100% fictícios.
import { describe, it, expect } from "vitest";
import { exportacaoPresencaService } from "../src/services/exportacao-presenca.service.js";

const campo = (v: unknown) =>
  (exportacaoPresencaService as unknown as { campo(v: unknown): string }).campo(v);

describe("CSV Sistema Presença: campo()", () => {
  it("neutraliza célula que começa com = + - @ tab ou CR", () => {
    expect(campo('=HYPERLINK("http://exemplo.invalid","x")')).toBe(`'=HYPERLINK("http://exemplo.invalid","x")`);
    expect(campo("+1+1")).toBe("'+1+1");
    expect(campo("-2+3")).toBe("'-2+3");
    expect(campo("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(campo("\t=1+1")).toBe("'=1+1");
    expect(campo("\r=1+1")).toBe("'=1+1");
    // espaço/quebra de linha antes do sinal também não escapa
    expect(campo("  =1+1")).toBe("'=1+1");
    expect(campo("\n=1+1")).toBe("'=1+1");
  });

  it("mantém a troca de | ; CR LF por espaço", () => {
    expect(campo("Escola; Fictícia|FC\r\nNova")).toBe("Escola  Fictícia FC  Nova");
  });

  it("texto comum e vazio ficam como antes", () => {
    expect(campo("Aluno Fictício FC")).toBe("Aluno Fictício FC");
    expect(campo("12345678")).toBe("12345678");
    expect(campo(null)).toBe("");
    expect(campo(undefined)).toBe("");
  });

  it("número negativo legítimo continua numérico (sem apóstrofo)", () => {
    expect(campo(-3)).toBe("-3");
    expect(campo(12.5)).toBe("12.5");
    expect(campo(Number.NaN)).toBe("");
  });
});
