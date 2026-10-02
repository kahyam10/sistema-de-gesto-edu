import { z } from "zod";
import { MAX_TEXTO_CURTO, MAX_TEXTO_LIVRE } from "./index.js";

// ==================== MÓDULO 7: TRANSPORTE ESCOLAR (schemas) ====================

export const turnoTransporteEnum = z.enum([
  "MATUTINO",
  "VESPERTINO",
  "NOTURNO",
  "INTEGRAL",
]);

// ==================== VEÍCULOS ====================
export const createVeiculoSchema = z.object({
  placa: z.string().min(7, "Placa inválida").max(8),
  tipo: z.enum(["ONIBUS", "MICRO_ONIBUS", "VAN", "KOMBI", "LANCHA", "OUTRO"]),
  marca: z.string().max(MAX_TEXTO_CURTO).optional(),
  modelo: z.string().max(MAX_TEXTO_CURTO).optional(),
  anoFabricacao: z.number().int().min(1980).max(2100).optional(),
  capacidade: z.number().int().positive("Capacidade deve ser maior que zero"),
  renavam: z.string().max(MAX_TEXTO_CURTO).optional(),
  chassi: z.string().max(MAX_TEXTO_CURTO).optional(),
  tipoPropriedade: z
    .enum(["PROPRIO", "TERCEIRIZADO", "CEDIDO"])
    .default("PROPRIO"),
  adaptadoPCD: z.boolean().default(false),
  vencimentoLicenciamento: z.coerce.date().optional(),
  vencimentoSeguro: z.coerce.date().optional(),
  vencimentoVistoria: z.coerce.date().optional(),
  ativo: z.boolean().default(true),
});
export const updateVeiculoSchema = createVeiculoSchema.partial();

// ==================== MOTORISTAS ====================
export const createMotoristaSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  telefone: z.string().max(MAX_TEXTO_CURTO).optional(),
  cnhNumero: z.string().max(MAX_TEXTO_CURTO).min(5, "Número da CNH inválido"),
  cnhCategoria: z.enum(["D", "E"]),
  cnhValidade: z.coerce.date(),
  cursoTransporteEscolar: z.boolean().default(false),
  vencimentoCursoTransporte: z.coerce.date().optional(),
  vinculo: z.enum(["EFETIVO", "CONTRATADO", "TERCEIRIZADO"]).default("EFETIVO"),
  ativo: z.boolean().default(true),
});
export const updateMotoristaSchema = createMotoristaSchema.partial();

// ==================== ROTAS DE TRANSPORTE ====================
export const createRotaTransporteSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(3, "Nome deve ter no mínimo 3 caracteres"),
  codigo: z.string().max(MAX_TEXTO_CURTO).min(1, "Código é obrigatório"),
  turno: turnoTransporteEnum,
  tipo: z.enum(["RURAL", "URBANA", "FLUVIAL"]).default("RURAL"),
  itinerario: z.string().max(MAX_TEXTO_LIVRE).min(5, "Descreva o itinerário"),
  kmDiario: z.number().positive().optional(),
  horarioSaida: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:MM")
    .optional(),
  horarioRetorno: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:MM")
    .optional(),
  veiculoId: z.string().max(MAX_TEXTO_CURTO).optional(),
  motoristaId: z.string().max(MAX_TEXTO_CURTO).optional(),
  ativo: z.boolean().default(true),
});
export const updateRotaTransporteSchema = createRotaTransporteSchema.partial();

export const vincularAlunoRotaSchema = z.object({
  matriculaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Matrícula é obrigatória"),
  pontoEmbarque: z.string().max(MAX_TEXTO_CURTO).optional(),
});
export const vincularEscolaRotaSchema = z.object({
  escolaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Escola é obrigatória"),
});

// ==================== MANUTENÇÕES ====================
export const createManutencaoSchema = z.object({
  veiculoId: z.string().max(MAX_TEXTO_CURTO).min(1, "Veículo é obrigatório"),
  tipo: z.enum([
    "PREVENTIVA",
    "CORRETIVA",
    "REVISAO",
    "TROCA_OLEO",
    "PNEUS",
    "FREIOS",
    "OUTRA",
  ]),
  descricao: z.string().max(MAX_TEXTO_LIVRE).min(3, "Descrição deve ter no mínimo 3 caracteres"),
  dataAgendada: z.coerce.date(),
  dataRealizada: z.coerce.date().optional(),
  custo: z.number().min(0).optional(),
  kmRegistrado: z.number().int().min(0).optional(),
  oficina: z.string().max(MAX_TEXTO_CURTO).optional(),
  status: z
    .enum(["AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"])
    .default("AGENDADA"),
  observacoes: z.string().max(MAX_TEXTO_LIVRE).optional(),
});
export const updateManutencaoSchema = createManutencaoSchema
  .partial()
  .omit({ veiculoId: true });

// Tipos exportados do módulo 7
export type CreateVeiculoInput = z.infer<typeof createVeiculoSchema>;
export type UpdateVeiculoInput = z.infer<typeof updateVeiculoSchema>;
export type CreateMotoristaInput = z.infer<typeof createMotoristaSchema>;
export type UpdateMotoristaInput = z.infer<typeof updateMotoristaSchema>;
export type CreateRotaTransporteInput = z.infer<
  typeof createRotaTransporteSchema
>;
export type UpdateRotaTransporteInput = z.infer<
  typeof updateRotaTransporteSchema
>;
export type VincularAlunoRotaInput = z.infer<typeof vincularAlunoRotaSchema>;
export type VincularEscolaRotaInput = z.infer<typeof vincularEscolaRotaSchema>;
export type CreateManutencaoInput = z.infer<typeof createManutencaoSchema>;
export type UpdateManutencaoInput = z.infer<typeof updateManutencaoSchema>;
