import type { Boletim, FrequenciaAluno } from "../src/api/types";
import {
  descricaoAula, mediaDaDisciplina, mediaGeralDoAluno, ordenarRegistros, rotuloMedia, textoMedia,
} from "../src/utils/medias";

const disc = (id: string, mediaFinal: number | null, situacao: Boletim["situacaoGeral"], bims: Array<number | null> = []) => ({
  disciplinaId: id,
  disciplinaNome: `Disciplina ${id}`,
  bimestres: bims.map((media, i) => ({ bimestre: i + 1, media })),
  mediaFinal,
  situacao,
});

const boletim = (disciplinas: Boletim["disciplinas"], situacaoGeral: Boletim["situacaoGeral"]): Boletim => ({
  matricula: { id: "m1", nomeAluno: "Aluno Fictício", numeroMatricula: "2026-0001" },
  turma: { id: "t1", nome: "A", serie: "5º ano" },
  disciplinas,
  frequencia: { percentualPresenca: 100, totalAulas: 0, presencas: 0, faltas: 0, abaixoDoLimite: false },
  situacaoGeral,
});

describe("médias do responsável (fonte: API)", () => {
  it("mediaFinal null não é recalculada pelos bimestres: mostra —", () => {
    // Antes o app fazia média dos bimestres quando mediaFinal vinha null
    const d = disc("a", null, "EM_CURSO", [8, null, null, null]);
    const m = mediaDaDisciplina(d);
    expect(m.valor).toBeNull();
    expect(m.parcial).toBe(false);
    expect(textoMedia(m)).toBe("Média —");
  });

  it("média em curso é rotulada parcial; fechada não", () => {
    expect(textoMedia(mediaDaDisciplina(disc("a", 7.5, "EM_CURSO")))).toBe("Média parcial 7,5");
    expect(textoMedia(mediaDaDisciplina(disc("a", 8, "APROVADO")))).toBe("Média 8,0");
  });

  it("média geral = média das mediaFinal da API, sem contar null como 0", () => {
    const b = boletim([disc("a", 8, "APROVADO"), disc("b", null, "EM_CURSO"), disc("c", 6, "EM_CURSO")], "EM_CURSO");
    expect(mediaGeralDoAluno(b)).toEqual({ valor: 7, parcial: true });
    expect(rotuloMedia(mediaGeralDoAluno(b), "Média geral")).toBe("Média geral parcial");
  });

  it("sem nenhuma média: valor null, sem rótulo parcial", () => {
    const b = boletim([disc("a", null, "EM_CURSO")], "EM_CURSO");
    expect(mediaGeralDoAluno(b)).toEqual({ valor: null, parcial: false });
    expect(rotuloMedia(mediaGeralDoAluno(b))).toBe("Média");
  });

  it("ano fechado: não é parcial", () => {
    const b = boletim([disc("a", 8, "APROVADO"), disc("b", 7, "APROVADO")], "APROVADO");
    expect(mediaGeralDoAluno(b)).toEqual({ valor: 7.5, parcial: false });
  });
});

describe("frequência por aula", () => {
  type R = FrequenciaAluno["registros"][number];
  const r = (id: string, data: string, horaInicio: string | null, disciplina: string | null): R =>
    ({ id, data, status: "PRESENTE", horaInicio, disciplina });

  it("vários registros no mesmo dia: dia mais recente primeiro, aula mais tarde primeiro", () => {
    const ordem = ordenarRegistros([
      r("1", "2026-09-28T00:00:00.000Z", "07:30", "Português"),
      r("2", "2026-09-29T00:00:00.000Z", "07:30", "Matemática"),
      r("3", "2026-09-29T00:00:00.000Z", "09:10", "Ciências"),
      r("4", "2026-09-29T00:00:00.000Z", null, null),
    ]).map((x) => x.id);
    expect(ordem).toEqual(["3", "2", "4", "1"]);
  });

  it("descrição mostra hora e disciplina quando existem", () => {
    expect(descricaoAula({ horaInicio: "07:30", disciplina: "Matemática" })).toBe("07:30 · Matemática");
    expect(descricaoAula({ horaInicio: "07:30", disciplina: null })).toBe("07:30");
    expect(descricaoAula({ horaInicio: null, disciplina: "Artes" })).toBe("Artes");
    expect(descricaoAula({ horaInicio: null, disciplina: null })).toBeNull();
    expect(descricaoAula({})).toBeNull();
  });
});
