import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { estoqueService } from "../src/services/estoque.service.js";
import { cardapioService } from "../src/services/cardapio.service.js";
import { refeicaoService } from "../src/services/refeicao.service.js";

let escola: { id: string };
let itemArroz: { id: string };

describe("Alimentação Escolar (M6)", () => {
  beforeAll(async () => {
    // Ordem FK-segura: filhos antes de pais
    await prisma.movimentacaoEstoque.deleteMany();
    await prisma.registroRefeicao.deleteMany();
    await prisma.itemEstoque.deleteMany();
    await prisma.cardapio.deleteMany();

    escola = await prisma.escola.create({
      data: { nome: "Escola Alimentação Teste", codigo: "TESTE-ALIM-A" },
    });

    itemArroz = await estoqueService.createItem({
      nome: "Arroz tipo 1",
      categoria: "GRAO",
      unidadeMedida: "KG",
      estoqueMinimo: 2,
      escolaId: escola.id,
      ativo: true,
    });
  });

  it("deriva o saldo corretamente após ENTRADA, SAIDA e PERDA", async () => {
    await estoqueService.registrarMovimentacao({
      itemId: itemArroz.id,
      tipo: "ENTRADA",
      quantidade: 10,
      fornecedor: "Cooperativa Agrícola",
      notaFiscal: "NF-001",
    });
    expect(await estoqueService.calcularSaldo(itemArroz.id)).toBe(10);

    await estoqueService.registrarMovimentacao({
      itemId: itemArroz.id,
      tipo: "SAIDA",
      quantidade: 4,
      registradoPor: "Merendeira Teste",
    });
    expect(await estoqueService.calcularSaldo(itemArroz.id)).toBe(6);

    await estoqueService.registrarMovimentacao({
      itemId: itemArroz.id,
      tipo: "PERDA",
      quantidade: 1.5,
      motivo: "Pacote danificado no transporte",
    });
    expect(await estoqueService.calcularSaldo(itemArroz.id)).toBe(4.5);

    // O saldo também aparece derivado na listagem de itens
    const itens = await estoqueService.listItens({ escolaId: escola.id });
    const arroz = itens.find((i) => i.id === itemArroz.id);
    expect(arroz?.saldo).toBe(4.5);
  });

  it("rejeita SAIDA maior que o saldo com BIZ_025 (Saldo insuficiente)", async () => {
    await expect(
      estoqueService.registrarMovimentacao({
        itemId: itemArroz.id,
        tipo: "SAIDA",
        quantidade: 100,
      })
    ).rejects.toMatchObject({
      code: "BIZ_025",
      message: expect.stringContaining("Saldo insuficiente"),
    });

    // A movimentação rejeitada não pode alterar o saldo derivado
    expect(await estoqueService.calcularSaldo(itemArroz.id)).toBe(4.5);
  });

  it("rejeita cardápio duplicado (mesma escola/data/turno/tipo) com BIZ_026", async () => {
    const base = {
      data: new Date("2026-03-02"),
      turno: "MATUTINO" as const,
      tipoRefeicao: "ALMOCO" as const,
      descricao: "Arroz, feijão, frango e salada",
      escolaId: escola.id,
      ativo: true,
    };

    const cardapio = await cardapioService.create(base);
    expect(cardapio.escolaId).toBe(escola.id);

    await expect(
      cardapioService.create({ ...base, descricao: "Outro prato qualquer" })
    ).rejects.toMatchObject({ code: "BIZ_026" });
  });

  it("consolida refeições e custo de insumos no relatório PNAE", async () => {
    await refeicaoService.create({
      data: new Date("2026-03-02"),
      turno: "MATUTINO",
      tipoRefeicao: "ALMOCO",
      quantidadeServida: 100,
      escolaId: escola.id,
    });
    await refeicaoService.create({
      data: new Date("2026-03-03"),
      turno: "VESPERTINO",
      tipoRefeicao: "LANCHE_TARDE",
      quantidadeServida: 50,
      escolaId: escola.id,
    });

    // ENTRADA com custo unitário no período do relatório: 10 × 2.5 = 25
    await estoqueService.registrarMovimentacao({
      itemId: itemArroz.id,
      tipo: "ENTRADA",
      quantidade: 10,
      custoUnitario: 2.5,
      data: new Date("2026-03-02"),
      fornecedor: "Cooperativa Agrícola",
    });

    const relatorio = await refeicaoService.relatorioPnae({
      dataInicio: new Date("2026-03-01"),
      dataFim: new Date("2026-03-31"),
      escolaId: escola.id,
    });

    expect(relatorio.consolidado.totalRefeicoes).toBe(150);
    expect(relatorio.consolidado.custoTotalInsumos).toBe(25);
    expect(relatorio.consolidado.custoMedioPorRefeicao).toBeCloseTo(25 / 150);

    expect(relatorio.escolas).toHaveLength(1);
    expect(relatorio.escolas[0].escolaId).toBe(escola.id);
    expect(relatorio.escolas[0].totalRefeicoes).toBe(150);
    expect(relatorio.escolas[0].totalPorTipoRefeicao).toEqual({
      ALMOCO: 100,
      LANCHE_TARDE: 50,
    });
  });
});
