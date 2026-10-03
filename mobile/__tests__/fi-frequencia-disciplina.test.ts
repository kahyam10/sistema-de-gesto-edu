// Frente I — frequência por disciplina no boletim do responsável (só exibição).
import { textoFrequenciaDisciplina } from "../src/utils/medias";

describe("textoFrequenciaDisciplina", () => {
  it("mostra o percentual da disciplina vindo da API", () => {
    expect(textoFrequenciaDisciplina({ frequencia: { totalAulas: 4, presencas: 3, faltas: 1, percentualPresenca: 75 } })).toBe("Freq. 75%");
    expect(textoFrequenciaDisciplina({ frequencia: { totalAulas: 2, presencas: 1, faltas: 1, percentualPresenca: 50 } })).toBe("Freq. 50%");
  });
  it("sem aula registrada (null), campo ausente ou zero aulas: travessão, nunca 0%", () => {
    expect(textoFrequenciaDisciplina({ frequencia: null })).toBe("Freq. —");
    expect(textoFrequenciaDisciplina({})).toBe("Freq. —");
    expect(textoFrequenciaDisciplina({ frequencia: { totalAulas: 0, presencas: 0, faltas: 0, percentualPresenca: 0 } })).toBe("Freq. —");
  });
});
