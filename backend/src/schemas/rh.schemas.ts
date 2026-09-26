import { z } from "zod";
import { DIAS_SEMANA_UTEIS } from "../lib/horarios.js";

// ==================== MÓDULO 4: AC e quadro de lotação ====================

const semVazio = (v: unknown) => (v === "" || v === null ? undefined : v);
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:MM)");
const idOpcional = z.preprocess(semVazio, z.string().trim().min(1).optional());
const texto = (max: number) => z.preprocess(semVazio, z.string().trim().min(1).max(max).optional());

export const areaAcEnum = z.enum([
  "LINGUAGENS", "MATEMATICA", "CIENCIAS_NATUREZA", "CIENCIAS_HUMANAS", "ENSINO_RELIGIOSO",
  "ANOS_INICIAIS", "EDUCACAO_INFANTIL", "AEE", "GERAL",
]);
export const diaSemanaEnum = z.enum(DIAS_SEMANA_UTEIS);

const camposAc = {
  area: areaAcEnum,
  titulo: texto(150),
  diaSemana: diaSemanaEnum,
  horaInicio: hora,
  horaFim: hora,
  local: texto(150),
  coordenadorId: idOpcional,
  observacoes: texto(2000),
  participantes: z.array(z.string().trim().min(1)).max(200).default([]),
};

export const createAcSchema = z
  .object({ escolaId: z.string().trim().min(1, "Escola é obrigatória"), ...camposAc })
  .refine((d) => d.horaFim > d.horaInicio, { message: "O fim deve ser depois do início", path: ["horaFim"] });

export const updateAcSchema = z.object({
  area: areaAcEnum.optional(),
  titulo: texto(150),
  diaSemana: diaSemanaEnum.optional(),
  horaInicio: hora.optional(),
  horaFim: hora.optional(),
  local: texto(150),
  coordenadorId: idOpcional,
  observacoes: texto(2000),
  ativo: z.boolean().optional(),
  participantes: z.array(z.string().trim().min(1)).max(200).optional(),
});

export const listarAcsQuerySchema = z.object({
  escolaId: idOpcional,
  area: z.preprocess(semVazio, areaAcEnum.optional()),
  diaSemana: z.preprocess(semVazio, diaSemanaEnum.optional()),
  ativo: z.preprocess((v) => (v === "true" ? true : v === "false" ? false : semVazio(v)), z.boolean().optional()),
});

export const quadroLotacaoQuerySchema = z.object({
  escolaId: z.string().trim().min(1, "Informe a escola"),
});

export type CreateAcInput = z.infer<typeof createAcSchema>;
export type UpdateAcInput = z.infer<typeof updateAcSchema>;
