import { z } from "zod";
import { MAX_TEXTO_CURTO } from "./index.js";

// ==================== MÓDULO 2: Planejamento pedagógico ====================

const semVazio = (v: unknown) => (v === "" || v === null ? undefined : v);
const id = (msg: string) => z.string().max(MAX_TEXTO_CURTO).trim().min(1, msg);
const idOpcional = z.preprocess(semVazio, z.string().max(MAX_TEXTO_CURTO).trim().min(1).optional());
/** Texto opcional na criação ("" = ausente). */
const texto = (max: number) => z.preprocess(semVazio, z.string().trim().min(1).max(max).optional());
/** Texto opcional na atualização: "" ou null limpam o campo; ausente mantém. */
const textoLimpavel = (max: number) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullable().optional());
const bimestre = z.coerce.number().int().min(1, "Bimestre de 1 a 4").max(4, "Bimestre de 1 a 4");
const anoLetivo = z.coerce.number().int().min(2000).max(2100);
const booleano = z.preprocess(
  (v) => (v === "true" ? true : v === "false" ? false : semVazio(v)),
  z.boolean().optional()
);

/**
 * Códigos de habilidade da BNCC digitados pelo usuário (ex.: formato EF05MA01).
 * Só normaliza e confere o formato alfanumérico; a existência do código na
 * BNCC NÃO é verificada (a lista oficial não está embutida no sistema).
 */
export const habilidadesBnccSchema = z
  .array(
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{4,15}$/, "Código BNCC inválido: use só letras e números (ex.: EF05MA01)")
  )
  .max(30, "No máximo 30 habilidades")
  .transform((xs) => [...new Set(xs)]);

export const statusPlanoEnum = z.enum(["RASCUNHO", "ENVIADO", "APROVADO", "DEVOLVIDO"]);
export const tipoAtividadeEnum = z.enum([
  "EXERCICIO", "LEITURA", "PRODUCAO_TEXTO", "PROJETO", "JOGO", "EXPERIMENTO", "OUTRO",
]);

// ---------- Conteúdo programático ----------
export const createConteudoSchema = z.object({
  anoLetivo,
  bimestre,
  serieId: id("Série é obrigatória"),
  disciplinaId: id("Disciplina é obrigatória"),
  // Ausente = conteúdo da rede (só SEMEC/ADMIN; o escopo recusa para a escola)
  escolaId: idOpcional,
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  descricao: texto(4000),
  habilidadesBncc: habilidadesBnccSchema.default([]),
  ordem: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateConteudoSchema = z.object({
  bimestre: bimestre.optional(),
  titulo: z.string().trim().min(1).max(200).optional(),
  descricao: textoLimpavel(4000),
  habilidadesBncc: habilidadesBnccSchema.optional(),
  ordem: z.coerce.number().int().min(0).max(999).optional(),
  ativo: z.boolean().optional(),
});

export const listarConteudosQuerySchema = z.object({
  anoLetivo: z.preprocess(semVazio, anoLetivo.optional()),
  bimestre: z.preprocess(semVazio, bimestre.optional()),
  serieId: idOpcional,
  disciplinaId: idOpcional,
  escolaId: idOpcional,
  // com escolaId: inclui também os conteúdos da rede (padrão: sim)
  incluirRede: booleano,
  ativo: booleano,
});

// ---------- Banco de atividades ----------
export const createAtividadeSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  tipo: tipoAtividadeEnum,
  descricao: z.string().trim().min(1, "Descreva a atividade").max(8000),
  disciplinaId: id("Disciplina é obrigatória"),
  serieId: idOpcional,
  // Ausente = banco da rede (só SEMEC/ADMIN)
  escolaId: idOpcional,
  habilidadesBncc: habilidadesBnccSchema.default([]),
});

export const updateAtividadeSchema = z.object({
  titulo: z.string().trim().min(1).max(200).optional(),
  tipo: tipoAtividadeEnum.optional(),
  descricao: z.string().trim().min(1).max(8000).optional(),
  serieId: z.preprocess((v) => (v === "" ? null : v), z.string().max(MAX_TEXTO_CURTO).trim().min(1).nullable().optional()),
  habilidadesBncc: habilidadesBnccSchema.optional(),
  ativo: z.boolean().optional(),
});

export const listarAtividadesQuerySchema = z.object({
  disciplinaId: idOpcional,
  serieId: idOpcional,
  escolaId: idOpcional,
  tipo: z.preprocess(semVazio, tipoAtividadeEnum.optional()),
  busca: texto(100),
  habilidade: z.preprocess(semVazio, z.string().trim().toUpperCase().max(15).optional()),
  minhas: booleano,
  ativo: booleano,
});

// ---------- Plano de aula ----------
const dataAula = z.coerce.date({ errorMap: () => ({ message: "Data da aula inválida" }) });

export const createPlanoSchema = z.object({
  turmaId: id("Turma é obrigatória"),
  disciplinaId: id("Disciplina é obrigatória"),
  bimestre,
  dataAula,
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  objetivos: z.string().trim().min(1, "Informe os objetivos").max(4000),
  desenvolvimento: texto(8000),
  recursos: texto(2000),
  avaliacao: texto(4000),
  habilidadesBncc: habilidadesBnccSchema.default([]),
  conteudoProgramaticoId: idOpcional,
  atividades: z.array(z.string().max(MAX_TEXTO_CURTO).trim().min(1)).max(20).default([]),
});

export const updatePlanoSchema = z.object({
  bimestre: bimestre.optional(),
  dataAula: dataAula.optional(),
  titulo: z.string().trim().min(1).max(200).optional(),
  objetivos: z.string().trim().min(1).max(4000).optional(),
  desenvolvimento: textoLimpavel(8000),
  recursos: textoLimpavel(2000),
  avaliacao: textoLimpavel(4000),
  habilidadesBncc: habilidadesBnccSchema.optional(),
  conteudoProgramaticoId: z.preprocess((v) => (v === "" ? null : v), z.string().max(MAX_TEXTO_CURTO).trim().min(1).nullable().optional()),
  atividades: z.array(z.string().max(MAX_TEXTO_CURTO).trim().min(1)).max(20).optional(),
});

export const revisarPlanoSchema = z.object({
  decisao: z.enum(["APROVADO", "DEVOLVIDO"]),
  parecer: texto(4000),
});

export const listarPlanosQuerySchema = z.object({
  turmaId: idOpcional,
  disciplinaId: idOpcional,
  escolaId: idOpcional,
  bimestre: z.preprocess(semVazio, bimestre.optional()),
  status: z.preprocess(semVazio, statusPlanoEnum.optional()),
  meus: booleano,
  de: z.preprocess(semVazio, z.coerce.date().optional()),
  ate: z.preprocess(semVazio, z.coerce.date().optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const coberturaQuerySchema = z.object({
  turmaId: id("Turma é obrigatória"),
  disciplinaId: idOpcional,
  bimestre: z.preprocess(semVazio, bimestre.optional()),
});

export type CreateConteudoInput = z.infer<typeof createConteudoSchema>;
export type UpdateConteudoInput = z.infer<typeof updateConteudoSchema>;
export type CreateAtividadeInput = z.infer<typeof createAtividadeSchema>;
export type UpdateAtividadeInput = z.infer<typeof updateAtividadeSchema>;
export type CreatePlanoInput = z.infer<typeof createPlanoSchema>;
export type UpdatePlanoInput = z.infer<typeof updatePlanoSchema>;
export type RevisarPlanoInput = z.infer<typeof revisarPlanoSchema>;
export type ListarPlanosQuery = z.infer<typeof listarPlanosQuerySchema>;
