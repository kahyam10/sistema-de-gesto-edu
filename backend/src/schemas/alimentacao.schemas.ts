import { z } from "zod";

// ==================== MÓDULO 6: ALIMENTAÇÃO ESCOLAR (schemas) ====================

// ==================== CARDÁPIO ====================
export const turnoEnum = z.enum(["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"]);
export const tipoRefeicaoEnum = z.enum([
  "CAFE_MANHA", "LANCHE_MANHA", "ALMOCO", "LANCHE_TARDE", "JANTAR", "CEIA",
]);

export const createCardapioSchema = z.object({
  data: z.coerce.date(),
  turno: turnoEnum,
  tipoRefeicao: tipoRefeicaoEnum,
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  itens: z
    .array(z.object({
      alimento: z.string().min(1),
      quantidadePorAluno: z.number().positive().optional(),
      unidade: z.string().optional(),
    }))
    .optional(),
  observacoesNutricionais: z.string().optional(),
  escolaId: z.string().optional(), // ausente = cardápio da rede
  ativo: z.boolean().default(true),
});
export const updateCardapioSchema = createCardapioSchema.partial();

// ==================== ESTOQUE ====================
export const createItemEstoqueSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  categoria: z.enum(["PERECIVEL", "NAO_PERECIVEL", "HORTIFRUTI", "PROTEINA", "GRAO", "LATICINIO", "OUTRO"]),
  unidadeMedida: z.enum(["KG", "G", "L", "ML", "UN", "PCT", "CX"]),
  estoqueMinimo: z.number().min(0).default(0),
  escolaId: z.string().min(1, "Escola é obrigatória"),
  ativo: z.boolean().default(true),
});
export const updateItemEstoqueSchema = createItemEstoqueSchema.partial().omit({ escolaId: true });

export const createMovimentacaoEstoqueSchema = z
  .object({
    itemId: z.string().min(1, "Item é obrigatório"),
    tipo: z.enum(["ENTRADA", "SAIDA", "PERDA", "AJUSTE_ENTRADA", "AJUSTE_SAIDA"]),
    quantidade: z.number().positive("Quantidade deve ser maior que zero"),
    data: z.coerce.date().optional(),
    custoUnitario: z.number().min(0).optional(),
    fornecedor: z.string().optional(),
    notaFiscal: z.string().optional(),
    motivo: z.string().optional(),
    registradoPor: z.string().optional(),
  })
  .refine(
    (d) => !["PERDA", "AJUSTE_ENTRADA", "AJUSTE_SAIDA"].includes(d.tipo) || !!d.motivo,
    { message: "Motivo é obrigatório para perdas e ajustes", path: ["motivo"] }
  );

// ==================== REGISTRO DE REFEIÇÕES ====================
export const createRegistroRefeicaoSchema = z.object({
  data: z.coerce.date(),
  turno: turnoEnum,
  tipoRefeicao: tipoRefeicaoEnum,
  quantidadeServida: z.number().int().min(0),
  quantidadePlanejada: z.number().int().min(0).optional(),
  observacoes: z.string().optional(),
  escolaId: z.string().min(1, "Escola é obrigatória"),
  cardapioId: z.string().optional(),
});
export const updateRegistroRefeicaoSchema = createRegistroRefeicaoSchema.partial();

export const relatorioPnaeQuerySchema = z.object({
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  escolaId: z.string().optional(),
});

// Tipos exportados do módulo 6
export type CreateCardapioInput = z.infer<typeof createCardapioSchema>;
export type UpdateCardapioInput = z.infer<typeof updateCardapioSchema>;
export type CreateItemEstoqueInput = z.infer<typeof createItemEstoqueSchema>;
export type UpdateItemEstoqueInput = z.infer<typeof updateItemEstoqueSchema>;
export type CreateMovimentacaoEstoqueInput = z.infer<typeof createMovimentacaoEstoqueSchema>;
export type CreateRegistroRefeicaoInput = z.infer<typeof createRegistroRefeicaoSchema>;
export type UpdateRegistroRefeicaoInput = z.infer<typeof updateRegistroRefeicaoSchema>;
export type RelatorioPnaeQuery = z.infer<typeof relatorioPnaeQuerySchema>;
