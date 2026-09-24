import { z } from "zod";

// ==================== MÓDULO 8: GESTÃO DEMOCRÁTICA (schemas) ====================

export const segmentoDemocraticoEnum = z.enum([
  "PROFESSOR",
  "PAI_RESPONSAVEL",
  "ALUNO",
  "FUNCIONARIO",
  "COMUNIDADE",
  "DIRECAO",
]);

// ==================== COLEGIADO ESCOLAR ====================
export const createColegiadoSchema = z
  .object({
    nome: z.string().min(3).default("Colegiado Escolar"),
    escolaId: z.string().min(1, "Escola é obrigatória"),
    dataInicioMandato: z.coerce.date(),
    dataFimMandato: z.coerce.date(),
    ativo: z.boolean().default(true),
  })
  .refine((d) => d.dataFimMandato > d.dataInicioMandato, {
    message: "Fim do mandato deve ser posterior ao início",
    path: ["dataFimMandato"],
  });
export const updateColegiadoSchema = z.object({
  nome: z.string().min(3).optional(),
  dataInicioMandato: z.coerce.date().optional(),
  dataFimMandato: z.coerce.date().optional(),
  ativo: z.boolean().optional(),
});

export const createMembroColegiadoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  segmento: segmentoDemocraticoEnum,
  cargo: z
    .enum([
      "PRESIDENTE",
      "VICE_PRESIDENTE",
      "SECRETARIO",
      "TESOUREIRO",
      "TITULAR",
      "SUPLENTE",
    ])
    .default("TITULAR"),
  profissionalId: z.string().optional(),
  matriculaId: z.string().optional(),
  ativo: z.boolean().default(true),
});
export const updateMembroColegiadoSchema = createMembroColegiadoSchema.partial();

// ==================== GRÊMIO ESTUDANTIL ====================
export const createGremioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  escolaId: z.string().min(1, "Escola é obrigatória"),
  anoLetivo: z.number().int().min(2020).max(2100),
  status: z.enum(["EM_ELEICAO", "ATIVO", "INATIVO"]).default("EM_ELEICAO"),
  dataFundacao: z.coerce.date().optional(),
});
export const updateGremioSchema = createGremioSchema.partial().omit({ escolaId: true });

export const createChapaGremioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  numero: z.number().int().positive(),
  membros: z
    .array(
      z.object({
        nome: z.string().min(1),
        matriculaId: z.string().optional(),
        cargo: z.enum(["PRESIDENTE", "VICE", "SECRETARIO", "TESOUREIRO", "MEMBRO"]),
      })
    )
    .optional(),
});
export const updateChapaGremioSchema = createChapaGremioSchema.partial();

export const apurarEleicaoSchema = z.object({
  resultados: z
    .array(
      z.object({
        chapaId: z.string().min(1),
        votosRecebidos: z.number().int().min(0),
      })
    )
    .min(1, "Informe ao menos uma chapa"),
});

export const createAtividadeGremioSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  tipo: z.enum(["PROJETO", "EVENTO", "CAMPANHA", "REUNIAO", "OUTRA"]),
  descricao: z.string().optional(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date().optional(),
  status: z
    .enum(["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"])
    .default("PLANEJADA"),
  resultado: z.string().optional(),
});
export const updateAtividadeGremioSchema = createAtividadeGremioSchema.partial();

// ==================== LÍDERES DE TURMA ====================
export const createLiderTurmaSchema = z.object({
  turmaId: z.string().min(1, "Turma é obrigatória"),
  matriculaId: z.string().min(1, "Matrícula é obrigatória"),
  anoLetivo: z.number().int().min(2020).max(2100),
  tipo: z.enum(["LIDER", "VICE_LIDER"]),
  formaEscolha: z.enum(["ELEICAO", "INDICACAO", "VOLUNTARIO"]).default("ELEICAO"),
  dataEscolha: z.coerce.date().optional(),
});
export const updateLiderTurmaSchema = z.object({
  formaEscolha: z.enum(["ELEICAO", "INDICACAO", "VOLUNTARIO"]).optional(),
  dataEscolha: z.coerce.date().optional(),
  ativo: z.boolean().optional(),
});

// ==================== REUNIÕES DEMOCRÁTICAS ====================
export const createReuniaoDemocraticaSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  orgao: z.enum(["COLEGIADO", "GREMIO", "ASSEMBLEIA_GERAL", "OUTRO"]),
  data: z.coerce.date(),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  local: z.string().optional(),
  pauta: z
    .array(z.object({ item: z.string().min(1), descricao: z.string().optional() }))
    .optional(),
  escolaId: z.string().min(1, "Escola é obrigatória"),
  colegiadoId: z.string().optional(),
});
export const updateReuniaoDemocraticaSchema = createReuniaoDemocraticaSchema.partial();

export const registrarAtaSchema = z.object({
  ata: z.string().min(10, "Ata deve ter no mínimo 10 caracteres"),
  decisoes: z
    .array(
      z.object({
        descricao: z.string().min(1),
        votosFavor: z.number().int().min(0).optional(),
        votosContra: z.number().int().min(0).optional(),
        abstencoes: z.number().int().min(0).optional(),
      })
    )
    .optional(),
  presencas: z
    .array(
      z.object({
        nome: z.string().min(1),
        segmento: segmentoDemocraticoEnum.optional(),
        presente: z.boolean().default(true),
      })
    )
    .optional(),
});

// Tipos exportados do módulo 8
export type CreateColegiadoInput = z.infer<typeof createColegiadoSchema>;
export type UpdateColegiadoInput = z.infer<typeof updateColegiadoSchema>;
export type CreateMembroColegiadoInput = z.infer<typeof createMembroColegiadoSchema>;
export type UpdateMembroColegiadoInput = z.infer<typeof updateMembroColegiadoSchema>;
export type CreateGremioInput = z.infer<typeof createGremioSchema>;
export type UpdateGremioInput = z.infer<typeof updateGremioSchema>;
export type CreateChapaGremioInput = z.infer<typeof createChapaGremioSchema>;
export type UpdateChapaGremioInput = z.infer<typeof updateChapaGremioSchema>;
export type ApurarEleicaoInput = z.infer<typeof apurarEleicaoSchema>;
export type CreateAtividadeGremioInput = z.infer<typeof createAtividadeGremioSchema>;
export type UpdateAtividadeGremioInput = z.infer<typeof updateAtividadeGremioSchema>;
export type CreateLiderTurmaInput = z.infer<typeof createLiderTurmaSchema>;
export type UpdateLiderTurmaInput = z.infer<typeof updateLiderTurmaSchema>;
export type CreateReuniaoDemocraticaInput = z.infer<typeof createReuniaoDemocraticaSchema>;
export type UpdateReuniaoDemocraticaInput = z.infer<typeof updateReuniaoDemocraticaSchema>;
export type RegistrarAtaInput = z.infer<typeof registrarAtaSchema>;
