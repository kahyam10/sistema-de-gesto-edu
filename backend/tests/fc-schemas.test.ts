// Frente C — limites e validações dos schemas zod (unidade, sem banco).
import { describe, it, expect } from "vitest";
import {
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
  createFrequenciaSchema,
  registrarFrequenciaTurmaSchema,
  lancarNotasTurmaSchema,
  createMatriculaSchema,
  createEscolaSchema,
  createProfissionalSchema,
  createPhaseSchema,
  createPontoSchema,
  consultaListaSchema,
  decisaoLicencaSchema,
  censoEscolaSchema,
  censoTurmaSchema,
  censoProfissionalSchema,
  paginationSchema,
  MAX_TEXTO_CURTO,
  MAX_TEXTO_LIVRE,
  MAX_ITENS_LOTE,
} from "../src/schemas/index.js";

const avaliacaoBase = {
  nome: "Prova FC",
  tipo: "PROVA",
  data: "2032-03-10",
  bimestre: 1,
  turmaId: "turma-fc",
  disciplinaId: "disc-fc",
};

describe("datas inválidas", () => {
  it("'abc' é rejeitado (antes virava Invalid Date)", () => {
    expect(createAvaliacaoSchema.safeParse({ ...avaliacaoBase, data: "abc" }).success).toBe(false);
    expect(updateAvaliacaoSchema.safeParse({ data: "abc" }).success).toBe(false);
    expect(createFrequenciaSchema.safeParse({ matriculaId: "m", turmaId: "t", data: "abc", status: "PRESENTE" }).success).toBe(false);
    expect(registrarFrequenciaTurmaSchema.safeParse({ turmaId: "t", data: "31/02/xx", presencas: [] }).success).toBe(false);
    expect(consultaListaSchema.safeParse({ dataInicio: "abc" }).success).toBe(false);
  });

  it("data válida continua virando Date", () => {
    const r = createAvaliacaoSchema.parse(avaliacaoBase);
    expect(r.data).toBeInstanceOf(Date);
    expect(r.data.toISOString()).toBe("2032-03-10T00:00:00.000Z");
    const f = createFrequenciaSchema.parse({ matriculaId: "m", turmaId: "t", data: "2032-03-10T10:00:00.000Z", status: "PRESENTE" });
    expect(f.data).toBeInstanceOf(Date);
    const m = createMatriculaSchema.safeParse({});
    expect(m.success).toBe(false);
  });
});

describe("peso / valor máximo da avaliação", () => {
  it("peso 0 e valorMaximo 0 são rejeitados", () => {
    expect(createAvaliacaoSchema.safeParse({ ...avaliacaoBase, peso: 0 }).success).toBe(false);
    expect(createAvaliacaoSchema.safeParse({ ...avaliacaoBase, valorMaximo: 0 }).success).toBe(false);
    expect(updateAvaliacaoSchema.safeParse({ peso: 0 }).success).toBe(false);
    expect(updateAvaliacaoSchema.safeParse({ peso: -1 }).success).toBe(false);
  });
  it("peso positivo e default seguem válidos", () => {
    expect(createAvaliacaoSchema.parse(avaliacaoBase).peso).toBe(1);
    expect(createAvaliacaoSchema.parse({ ...avaliacaoBase, peso: 0.5 }).peso).toBe(0.5);
  });
});

describe("tamanhos máximos", () => {
  const grande = (n: number) => "x".repeat(n);
  it("strings curtas: até 255", () => {
    expect(createEscolaSchema.safeParse({ nome: grande(MAX_TEXTO_CURTO), codigo: "FC-1" }).success).toBe(true);
    expect(createEscolaSchema.safeParse({ nome: grande(MAX_TEXTO_CURTO + 1), codigo: "FC-1" }).success).toBe(false);
    expect(createProfissionalSchema.safeParse({ nome: "P", cpf: "00000001919", tipo: "PROFESSOR", email: `${grande(250)}@a.com` }).success).toBe(false);
  });
  it("textos livres: até 10000", () => {
    const base = { ...avaliacaoBase };
    expect(createAvaliacaoSchema.safeParse({ ...base, observacao: grande(MAX_TEXTO_LIVRE) }).success).toBe(true);
    expect(createAvaliacaoSchema.safeParse({ ...base, observacao: grande(MAX_TEXTO_LIVRE + 1) }).success).toBe(false);
    expect(createPontoSchema.safeParse({ profissionalId: "p", data: "2032-01-01", justificativa: grande(MAX_TEXTO_LIVRE + 1) }).success).toBe(false);
  });
  it("listas: até 1000 itens", () => {
    const presenca = { matriculaId: "m", status: "PRESENTE" };
    expect(registrarFrequenciaTurmaSchema.safeParse({ turmaId: "t", data: "2032-03-10", presencas: Array(MAX_ITENS_LOTE).fill(presenca) }).success).toBe(true);
    expect(registrarFrequenciaTurmaSchema.safeParse({ turmaId: "t", data: "2032-03-10", presencas: Array(MAX_ITENS_LOTE + 1).fill(presenca) }).success).toBe(false);
    expect(lancarNotasTurmaSchema.safeParse({ avaliacaoId: "a", notas: Array(MAX_ITENS_LOTE + 1).fill({ matriculaId: "m", valor: 1 }) }).success).toBe(false);
    expect(createEscolaSchema.safeParse({ nome: "E", codigo: "C", etapasIds: Array(MAX_ITENS_LOTE + 1).fill("e") }).success).toBe(false);
    expect(createPhaseSchema.safeParse({ name: "n", description: "d", monthRange: "m", duration: "d", moduleIds: Array(MAX_ITENS_LOTE + 1).fill("m") }).success).toBe(false);
  });
});

describe("paginação", () => {
  it("page/limit opcionais, com teto", () => {
    expect(consultaListaSchema.parse({})).toEqual({});
    expect(consultaListaSchema.parse({ page: "", limit: "" })).toEqual({});
    expect(consultaListaSchema.parse({ page: "2", limit: "100" })).toMatchObject({ page: 2, limit: 100 });
    expect(consultaListaSchema.safeParse({ page: "0", limit: "10" }).success).toBe(false);
    expect(consultaListaSchema.safeParse({ page: "1", limit: "1000000" }).success).toBe(false);
    expect(consultaListaSchema.safeParse({ page: "abc", limit: "10" }).success).toBe(false);
    expect(paginationSchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});

describe("decisão de licença", () => {
  it("rejeitar exige motivo (nos dois formatos)", () => {
    expect(decisaoLicencaSchema.safeParse({ aprovado: false }).success).toBe(false);
    expect(decisaoLicencaSchema.safeParse({ aprovado: false, motivo: "   " }).success).toBe(false);
    expect(decisaoLicencaSchema.safeParse({ status: "REJEITADA" }).success).toBe(false);
    expect(decisaoLicencaSchema.parse({ aprovado: false, motivo: "Documento ilegível" })).toEqual({ aprovado: false, motivo: "Documento ilegível" });
    expect(decisaoLicencaSchema.parse({ status: "REJEITADA", justificativaRejeicao: "Fora do prazo", aprovadaPor: "x" })).toEqual({
      aprovado: false,
      motivo: "Fora do prazo",
    });
  });
  it("motivo tem máximo; decisão é obrigatória e coerente", () => {
    expect(decisaoLicencaSchema.safeParse({ aprovado: false, motivo: "x".repeat(MAX_TEXTO_LIVRE + 1) }).success).toBe(false);
    expect(decisaoLicencaSchema.safeParse({}).success).toBe(false);
    expect(decisaoLicencaSchema.safeParse({ aprovado: true, status: "REJEITADA", motivo: "m" }).success).toBe(false);
    expect(decisaoLicencaSchema.parse({ aprovado: true, motivo: "ignorado" })).toEqual({ aprovado: true, motivo: null });
    expect(decisaoLicencaSchema.parse({ status: "APROVADA", aprovadaPor: "x" })).toEqual({ aprovado: true, motivo: null });
  });
});

describe("questionários do censo (dadosCenso)", () => {
  it("descarta chaves desconhecidas e aceita o formulário", () => {
    const r = censoEscolaSchema.parse({
      codigoEscola: "29000000",
      situacaoFuncionamento: "Em atividade",
      localizacao: "Urbana",
      dependenciasFisicas: ["Biblioteca"],
      profissionais: { "Auxiliar de secretaria": "2" },
      campoInventado: "x",
      __proto__x: { a: 1 },
    });
    expect(r).toEqual({
      codigoEscola: "29000000",
      situacaoFuncionamento: "Em atividade",
      localizacao: "Urbana",
      dependenciasFisicas: ["Biblioteca"],
      profissionais: { "Auxiliar de secretaria": "2" },
    });
    expect(censoEscolaSchema.parse(null)).toBeNull();
  });
  it("valida tipos, opções e tamanhos", () => {
    expect(censoEscolaSchema.safeParse({ localizacao: "Marte" }).success).toBe(false);
    expect(censoEscolaSchema.safeParse({ codigoEscola: "x".repeat(256) }).success).toBe(false);
    expect(censoEscolaSchema.safeParse({ dependenciasFisicas: "Biblioteca" }).success).toBe(false);
    expect(censoEscolaSchema.safeParse({ dependenciasFisicas: Array(201).fill("a") }).success).toBe(false);
    expect(censoEscolaSchema.safeParse([1, 2]).success).toBe(false);
    expect(censoTurmaSchema.safeParse({ diasSemana: { segunda: { ativo: "sim" } } }).success).toBe(false);
    expect(censoTurmaSchema.parse({ diasSemana: { segunda: { ativo: true, horaInicial: "07:00", horaFinal: "11:00", extra: 1 } } })).toEqual({
      diasSemana: { segunda: { ativo: true, horaInicial: "07:00", horaFinal: "11:00" } },
    });
    expect(censoProfissionalSchema.safeParse({ possuiDeficiencia: "true" }).success).toBe(false);
    expect(censoProfissionalSchema.parse({ cursosSuperiores: [{ curso: "Pedagogia", x: 1 }] })).toEqual({ cursosSuperiores: [{ curso: "Pedagogia" }] });
  });
});
