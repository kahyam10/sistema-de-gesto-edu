import { z } from "zod";

// ==================== EXPORTAÇÃO (EDUCACENSO / SISTEMA PRESENÇA) ====================
// Schemas de querystring dos exportadores oficiais.
// `formato`: "txt"/"csv" (default) responde com download via Content-Disposition;
// "json" responde com a prévia estruturada (conteúdo/pendências ou resumo/linhas).

export const exportacaoEducacensoQuerySchema = z.object({
  anoLetivoId: z.string().min(1, "anoLetivoId é obrigatório"),
  escolaId: z.string().optional(),
  formato: z.enum(["txt", "json"]).optional().default("txt"),
});

export const exportacaoPresencaQuerySchema = z.object({
  anoLetivoId: z.string().min(1, "anoLetivoId é obrigatório"),
  mes: z.coerce
    .number()
    .int()
    .min(1, "Mês deve estar entre 1 e 12")
    .max(12, "Mês deve estar entre 1 e 12"),
  escolaId: z.string().optional(),
  formato: z.enum(["csv", "json"]).optional().default("csv"),
});

export type ExportacaoEducacensoQuery = z.infer<
  typeof exportacaoEducacensoQuerySchema
>;
export type ExportacaoPresencaQuery = z.infer<
  typeof exportacaoPresencaQuerySchema
>;
