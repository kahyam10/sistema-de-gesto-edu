import { z } from "zod";

// ==================== MÓDULO 5: PROGRAMAS ESPECIAIS (schemas) ====================
// Alinhados ao model/service (os schemas JSON antigos das rotas pediam campos
// que não existem — ex.: evolução com "descricao", visita com
// "profissionalId" — e recusavam o que o painel envia). Campos desconhecidos
// são descartados: nada além do previsto chega ao banco (dados sensíveis de
// criança: deficiência, CID, laudo, situação familiar).

const semVazio = (v: unknown) => (v === "" || v === null ? undefined : v);
const texto = (max = 5000) => z.preprocess(semVazio, z.string().trim().min(1).max(max).optional());
const codigo = (max = 60) => z.string().trim().min(1, "Obrigatório").max(max);
const codigoOpcional = (max = 60) => z.preprocess(semVazio, codigo(max).optional());
const id = z.string().trim().min(1, "Obrigatório");
const idOpcional = z.preprocess(semVazio, z.string().trim().min(1).optional());
const data = z.coerce.date({ invalid_type_error: "Data inválida" });
const dataOpcional = z.preprocess(semVazio, data.optional());
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:MM)");
const horaOpcional = z.preprocess(semVazio, hora.optional());
const inteiroQuery = z.preprocess(semVazio, z.coerce.number().int().optional());
const paginacao = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
};

// ---------- AEE: PEI ----------
const camposPEI = {
  deficiencia: codigo(),
  cid: texto(20),
  laudoMedico: z.boolean().optional(),
  laudoPath: texto(500),
  necessitaAEE: z.boolean().optional(),
  frequenciaAEE: texto(60),
  profissionalAEE: texto(150),
  objetivosGerais: texto(10000),
  objetivosEspecificos: texto(10000),
  estrategias: texto(10000),
  recursos: texto(10000),
  avaliacaoDiagnostica: texto(10000),
};
export const createPEISchema = z.object({
  matriculaId: id,
  anoLetivo: z.coerce.number().int().min(2000).max(2100),
  ...camposPEI,
  elaboradoPor: texto(150),
  dataElaboracao: dataOpcional,
});
export const updatePEISchema = z.object({
  ...camposPEI,
  deficiencia: codigoOpcional(),
  dataRevisao: dataOpcional,
  status: codigoOpcional(),
});
export const listarPEIQuerySchema = z.object({
  escolaId: idOpcional,
  anoLetivo: inteiroQuery,
  status: codigoOpcional(),
  ...paginacao,
});

// ---------- AEE: salas de recursos ----------
export const createSalaRecursosSchema = z.object({
  escolaId: id,
  nome: z.string().trim().min(1, "Nome é obrigatório").max(150),
  tipo: codigo(),
  turno: codigo(),
  capacidade: z.coerce.number().int().min(1).max(500).optional(),
  recursos: texto(10000),
  profissionais: texto(5000),
});
export const updateSalaRecursosSchema = createSalaRecursosSchema.omit({ escolaId: true }).partial().extend({
  nome: z.preprocess(semVazio, z.string().trim().min(1).max(150).optional()),
});
export const listarSalasQuerySchema = z.object({ escolaId: idOpcional, turno: codigoOpcional() });

// ---------- AEE: atendimentos ----------
const camposAtendimento = {
  horario: horaOpcional,
  duracao: z.coerce.number().int().min(1).max(600).optional(),
  objetivo: texto(),
  atividades: texto(10000),
  recursos: texto(),
  observacoes: texto(),
  presenca: z.boolean().optional(),
  justificativa: texto(),
  profissionalId: idOpcional,
};
export const createAtendimentoAEESchema = z.object({ peiId: id, salaRecursosId: id, data, ...camposAtendimento });
export const updateAtendimentoAEESchema = z.object({ data: dataOpcional, ...camposAtendimento });
export const mesAnoQuerySchema = z.object({
  mes: z.preprocess(semVazio, z.coerce.number().int().min(1).max(12).optional()),
  ano: z.preprocess(semVazio, z.coerce.number().int().min(2000).max(2100).optional()),
});

// ---------- Busca ativa ----------
export const createBuscaAtivaSchema = z.object({
  matriculaId: id,
  motivo: codigo(),
  descricao: texto(),
  prioridade: codigoOpcional(),
  responsavelId: idOpcional,
  escolaId: idOpcional,
});
export const updateBuscaAtivaSchema = z.object({
  status: codigoOpcional(),
  prioridade: codigoOpcional(),
  responsavelId: idOpcional,
  resultado: texto(),
  dataResolucao: dataOpcional,
});
export const listarBuscaAtivaQuerySchema = z.object({
  escolaId: idOpcional,
  status: codigoOpcional(),
  prioridade: codigoOpcional(),
  motivo: codigoOpcional(),
  ...paginacao,
});

export const createVisitaSchema = z.object({
  buscaAtivaId: id,
  data,
  horario: horaOpcional,
  responsavel: z.string().trim().min(1, "Responsável é obrigatório").max(150),
  situacao: codigo(),
  relato: texto(10000),
  observacoes: texto(),
  proximaVisita: dataOpcional,
});
export const updateVisitaSchema = createVisitaSchema.omit({ buscaAtivaId: true }).partial().extend({
  data: dataOpcional,
  responsavel: z.preprocess(semVazio, z.string().trim().min(1).max(150).optional()),
  situacao: codigoOpcional(),
});

export const createEncaminhamentoSchema = z.object({
  buscaAtivaId: id,
  orgao: codigo(),
  motivo: z.string().trim().min(1, "Motivo é obrigatório").max(5000),
  dataEnvio: data,
  protocolo: texto(100),
});
export const updateEncaminhamentoSchema = z.object({
  status: codigoOpcional(),
  retorno: texto(),
  dataRetorno: dataOpcional,
  observacoes: texto(),
});

// ---------- Acompanhamento individualizado ----------
export const createAcompanhamentoSchema = z.object({
  matriculaId: id,
  tipo: codigo(),
  motivo: z.string().trim().min(1, "Motivo é obrigatório").max(5000),
  objetivos: texto(10000),
  profissionalId: idOpcional,
  escolaId: idOpcional,
  acoes: texto(10000),
  estrategias: texto(10000),
  dataInicio: dataOpcional,
});
export const updateAcompanhamentoSchema = z.object({
  objetivos: texto(10000),
  profissionalId: idOpcional,
  acoes: texto(10000),
  estrategias: texto(10000),
  status: codigoOpcional(),
  resultado: texto(),
  dataFim: dataOpcional,
});
export const registrarEvolucaoSchema = z.object({
  data: z.preprocess((v) => (v === "" || v == null ? new Date() : v), data),
  observacao: z.string().trim().min(1, "Descreva a evolução").max(10000),
  profissionalId: idOpcional,
});
export const concluirAcompanhamentoSchema = z.object({ resultado: z.string().trim().min(1, "Informe o resultado").max(5000) });
export const suspenderAcompanhamentoSchema = z.object({ motivo: z.string().trim().min(1, "Informe o motivo").max(5000) });
export const listarAcompanhamentosQuerySchema = z.object({
  escolaId: idOpcional,
  tipo: codigoOpcional(),
  status: codigoOpcional(),
  profissionalId: idOpcional,
  ...paginacao,
});

export const escolaQuerySchema = z.object({ escolaId: idOpcional });
