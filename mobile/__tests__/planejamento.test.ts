import { habilidadesInvalidas, lerHabilidades, planoEditavel, STATUS_PLANO } from "../src/utils/planejamento";

describe("planos de aula", () => {
  it("lê códigos BNCC separados por vírgula, espaço ou ponto e vírgula, sem repetir", () => {
    expect(lerHabilidades(" ef05ma01, EF05MA02;ef05ma01  EF05MA03 ")).toEqual(["EF05MA01", "EF05MA02", "EF05MA03"]);
    expect(lerHabilidades("")).toEqual([]);
  });

  it("aponta códigos que a API recusaria", () => {
    expect(habilidadesInvalidas(["EF05MA01", "EF-05", "ABC"])).toEqual(["EF-05", "ABC"]);
  });

  it("só rascunho e devolvido são editáveis pelo professor", () => {
    expect(planoEditavel("RASCUNHO")).toBe(true);
    expect(planoEditavel("DEVOLVIDO")).toBe(true);
    expect(planoEditavel("ENVIADO")).toBe(false);
    expect(planoEditavel("APROVADO")).toBe(false);
    expect(STATUS_PLANO.ENVIADO.rotulo).toBe("Aguardando revisão");
  });
});
