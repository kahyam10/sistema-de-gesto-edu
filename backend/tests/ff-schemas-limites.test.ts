// Frente F: limites de tamanho nos schemas fora de schemas/index.ts.
import { describe, it, expect } from "vitest";
import { createCardapioSchema, createMovimentacaoEstoqueSchema } from "../src/schemas/alimentacao.schemas.js";
import {
  anexoUrlSchema, createComunicadoSchema, listarComunicadosQuerySchema, createNotificacaoSchema,
} from "../src/schemas/comunicacao.schemas.js";
import { createColegiadoSchema, registrarAtaSchema, createChapaGremioSchema } from "../src/schemas/democratica.schemas.js";
import { createVeiculoSchema, createRotaTransporteSchema, createManutencaoSchema } from "../src/schemas/transporte.schemas.js";
import { createPlanoSchema } from "../src/schemas/planejamento.schemas.js";
import { listarPEIQuerySchema, createBuscaAtivaSchema } from "../src/schemas/programas.schemas.js";
import { createAcSchema } from "../src/schemas/rh.schemas.js";

const longo = (n: number) => "a".repeat(n);

describe("strings com teto", () => {
  it("nomes/códigos/ids: 255", () => {
    expect(createVeiculoSchema.safeParse({ placa: "ABC1D23", tipo: "VAN", capacidade: 10, marca: longo(256) }).success).toBe(false);
    expect(createVeiculoSchema.safeParse({ placa: "ABC1D23", tipo: "VAN", capacidade: 10, marca: longo(255) }).success).toBe(true);
    const col = { escolaId: longo(256), dataInicioMandato: "2026-01-01", dataFimMandato: "2027-01-01" };
    expect(createColegiadoSchema.safeParse(col).success).toBe(false);
    expect(createBuscaAtivaSchema.safeParse({ matriculaId: longo(256), motivo: "FALTAS" }).success).toBe(false);
    expect(createNotificacaoSchema.safeParse({ userId: longo(256), titulo: "t", mensagem: "m", tipo: "SISTEMA" }).success).toBe(false);
    const ac = { escolaId: longo(256), area: "GERAL", diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "09:00" };
    expect(createAcSchema.safeParse(ac).success).toBe(false);
    const plano = { turmaId: "t", disciplinaId: "d", bimestre: 1, dataAula: "2026-03-02", titulo: "x", objetivos: "y", atividades: [longo(256)] };
    expect(createPlanoSchema.safeParse(plano).success).toBe(false);
  });

  it("textos livres: 10000", () => {
    const cardapio = { data: "2026-03-02", turno: "MATUTINO", tipoRefeicao: "ALMOCO", descricao: longo(10_001) };
    expect(createCardapioSchema.safeParse(cardapio).success).toBe(false);
    expect(createCardapioSchema.safeParse({ ...cardapio, descricao: longo(10_000) }).success).toBe(true);
    const mov = { itemId: "i", tipo: "PERDA", quantidade: 1, motivo: longo(10_001) };
    expect(createMovimentacaoEstoqueSchema.safeParse(mov).success).toBe(false);
    const rota = { nome: "Rota", codigo: "R1", turno: "MATUTINO", itinerario: longo(10_001) };
    expect(createRotaTransporteSchema.safeParse(rota).success).toBe(false);
    const man = { veiculoId: "v", tipo: "REVISAO", descricao: "Revisão", dataAgendada: "2026-03-02", observacoes: longo(10_001) };
    expect(createManutencaoSchema.safeParse(man).success).toBe(false);
  });

  it("ata: até 50000; listas com teto", () => {
    expect(registrarAtaSchema.safeParse({ ata: longo(50_001) }).success).toBe(false);
    expect(registrarAtaSchema.safeParse({ ata: longo(50_000) }).success).toBe(true);
    const presencas = Array.from({ length: 1001 }, () => ({ nome: "x" }));
    expect(registrarAtaSchema.safeParse({ ata: longo(20), presencas }).success).toBe(false);
    const membros = Array.from({ length: 1001 }, () => ({ nome: "x", cargo: "MEMBRO" }));
    expect(createChapaGremioSchema.safeParse({ nome: "Chapa", numero: 1, membros }).success).toBe(false);
  });
});

describe("paginação alinhada a 100 (as telas pedem no máximo 100)", () => {
  it("comunicação e programas recusam limit > 100", () => {
    expect(listarComunicadosQuerySchema.safeParse({ page: "1", limit: "101" }).success).toBe(false);
    expect(listarComunicadosQuerySchema.safeParse({ page: "1", limit: "100" }).success).toBe(true);
    expect(listarPEIQuerySchema.safeParse({ page: "1", limit: "200" }).success).toBe(false);
  });
});

describe("anexo do comunicado", () => {
  it("só https", () => {
    expect(anexoUrlSchema.safeParse("https://exemplo.gov.br/a.pdf").success).toBe(true);
    for (const v of ["http://exemplo.gov.br/a.pdf", "javascript:alert(1)", "data:text/html,x", "nada"]) {
      expect(anexoUrlSchema.safeParse(v).success).toBe(false);
    }
    expect(anexoUrlSchema.safeParse("").success).toBe(true); // vazio = sem anexo
    const base = { titulo: "t", mensagem: "m", tipo: "AVISO", destinatarios: "PAIS", autorNome: "a" };
    expect(createComunicadoSchema.safeParse({ ...base, anexoUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});
