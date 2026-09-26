import { z } from "zod";

// ==================== MÓDULO 9: COMUNICAÇÃO E EVENTOS (schemas) ====================
// Substituem os schemas JSON antigos das rotas, que estavam desalinhados do
// service e do dashboard (presença de reunião e notificação em massa
// recusavam o que o painel envia) e não bloqueavam campos extras.
// z.object remove campos desconhecidos: nada além do previsto chega ao banco.

const semVazio = (v: unknown) => (v === "" || v === null ? undefined : v);
const texto = (max = 5000) => z.preprocess(semVazio, z.string().trim().min(1).max(max).optional());
const id = z.string().trim().min(1, "Obrigatório");
const idOpcional = z.preprocess(semVazio, z.string().trim().min(1).optional());
const dataOpcional = z.preprocess(semVazio, z.coerce.date({ invalid_type_error: "Data inválida" }).optional());
const boolQuery = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean().optional());
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:MM)");
export const paginacaoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

// ---------- Comunicados ----------
export const tipoComunicadoEnum = z.enum(["INFORMATIVO", "URGENTE", "AVISO", "CONVITE", "ALERTA"]);
export const destinatariosEnum = z.enum([
  "TODOS", "PAIS", "PROFESSORES", "ALUNOS", "FUNCIONARIOS", "DIRETORES", "TURMA_ESPECIFICA", "ETAPA_ESPECIFICA",
]);

export const createComunicadoSchema = z
  .object({
    escolaId: idOpcional,
    titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
    mensagem: z.string().trim().min(1, "Mensagem é obrigatória").max(10000),
    tipo: tipoComunicadoEnum,
    categoria: texto(40),
    destinatarios: destinatariosEnum,
    turmaId: idOpcional,
    etapaId: idOpcional,
    anexoUrl: z.preprocess(semVazio, z.string().url("Endereço do anexo inválido").max(500).optional()),
    dataPublicacao: dataOpcional,
    dataExpiracao: dataOpcional,
    destaque: z.boolean().optional(),
    autorNome: z.string().trim().min(1, "Autor é obrigatório").max(120),
  })
  .refine((d) => d.destinatarios !== "TURMA_ESPECIFICA" || !!d.turmaId, {
    message: "Informe a turma", path: ["turmaId"],
  })
  .refine((d) => d.destinatarios !== "ETAPA_ESPECIFICA" || !!d.etapaId, {
    message: "Informe a etapa", path: ["etapaId"],
  });

export const updateComunicadoSchema = z.object({
  titulo: z.string().trim().min(1).max(200).optional(),
  mensagem: z.string().trim().min(1).max(10000).optional(),
  tipo: tipoComunicadoEnum.optional(),
  categoria: texto(40),
  destinatarios: destinatariosEnum.optional(),
  turmaId: idOpcional,
  etapaId: idOpcional,
  anexoUrl: z.preprocess(semVazio, z.string().url("Endereço do anexo inválido").max(500).optional()),
  dataExpiracao: dataOpcional,
  ativo: z.boolean().optional(),
  destaque: z.boolean().optional(),
});

export const listarComunicadosQuerySchema = paginacaoQuerySchema.extend({
  escolaId: idOpcional,
  turmaId: idOpcional,
  etapaId: idOpcional,
  tipo: z.preprocess(semVazio, tipoComunicadoEnum.optional()),
  categoria: texto(40),
  destinatarios: z.preprocess(semVazio, destinatariosEnum.optional()),
  ativo: boolQuery,
  destaque: boolQuery,
});

export const filtroLeituraComunicadoSchema = z.object({
  filtro: z.preprocess(semVazio, z.enum(["NAO_LIDOS", "LIDOS", "TODOS"]).optional()),
});

// ---------- Notificações ----------
export const tipoNotificacaoEnum = z.enum(["SISTEMA", "ACADEMICO", "FINANCEIRO", "COMUNICADO", "LEMBRETE", "URGENTE"]);
export const prioridadeEnum = z.enum(["BAIXA", "NORMAL", "ALTA", "URGENTE"]);
export const canalEnum = z.enum(["APP", "EMAIL", "SMS", "PUSH"]);

const baseNotificacao = {
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  mensagem: z.string().trim().min(1, "Mensagem é obrigatória").max(5000),
  tipo: tipoNotificacaoEnum,
  prioridade: z.preprocess(semVazio, prioridadeEnum.optional()),
  canais: z.array(canalEnum).min(1).default(["APP"]),
  // Caminho interno do sistema (os apps ignoram links externos)
  link: z.preprocess(semVazio, z.string().max(500).optional()),
  acaoTipo: texto(60),
  acaoId: idOpcional,
};

export const createNotificacaoSchema = z.object({ userId: id, ...baseNotificacao });
export const createNotificacoesEmMassaSchema = z.object({
  userIds: z.array(id).min(1, "Informe ao menos um destinatário").max(5000),
  ...baseNotificacao,
});

export const listarNotificacoesQuerySchema = paginacaoQuerySchema.extend({
  userId: idOpcional,
  tipo: z.preprocess(semVazio, tipoNotificacaoEnum.optional()),
  prioridade: z.preprocess(semVazio, prioridadeEnum.optional()),
  lida: boolQuery,
});

export const filtroLeituraNotificacaoSchema = z.object({
  filtro: z.preprocess(semVazio, z.enum(["NAO_LIDAS", "LIDAS", "TODAS"]).optional()),
});

export const statusEnvioSchema = z.object({
  canal: z.enum(["EMAIL", "SMS", "PUSH"]),
  enviado: z.boolean(),
});

// ---------- Reuniões de pais ----------
export const tipoReuniaoEnum = z.enum(["BIMESTRAL", "TRIMESTRAL", "EXTRAORDINARIA", "CONSELHO_PARTICIPATIVO"]);
export const statusReuniaoEnum = z.enum(["AGENDADA", "REALIZADA", "CANCELADA"]);

export const createReuniaoPaisSchema = z.object({
  escolaId: id,
  turmaId: idOpcional,
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  descricao: texto(),
  data: z.coerce.date({ invalid_type_error: "Data inválida" }),
  horario: hora,
  duracao: z.coerce.number().int().min(1).max(1440).optional(),
  local: texto(200),
  tipo: tipoReuniaoEnum,
  finalidade: texto(),
  pauta: texto(10000),
  profissionalId: idOpcional,
});

export const updateReuniaoPaisSchema = z.object({
  titulo: z.string().trim().min(1).max(200).optional(),
  descricao: texto(),
  data: dataOpcional,
  horario: hora.optional(),
  duracao: z.coerce.number().int().min(1).max(1440).optional(),
  local: texto(200),
  tipo: tipoReuniaoEnum.optional(),
  finalidade: texto(),
  pauta: texto(10000),
  ata: texto(50000),
  encaminhamentos: texto(20000),
  status: statusReuniaoEnum.optional(),
  profissionalId: idOpcional,
});

export const registrarPresencaReuniaoSchema = z.object({
  reuniaoId: id,
  matriculaId: id,
  nomeResponsavel: z.string().trim().min(2, "Nome do responsável é obrigatório").max(150),
  parentesco: texto(60),
  presente: z.boolean().default(true),
  horarioChegada: z.preprocess(semVazio, hora.optional()),
  observacoes: texto(2000),
});

export const listarReunioesQuerySchema = paginacaoQuerySchema.extend({
  escolaId: idOpcional,
  turmaId: idOpcional,
  tipo: z.preprocess(semVazio, tipoReuniaoEnum.optional()),
  status: z.preprocess(semVazio, statusReuniaoEnum.optional()),
  dataInicio: dataOpcional,
  dataFim: dataOpcional,
});

// ---------- Plantões pedagógicos ----------
export const tipoPlantaoEnum = z.enum(["INDIVIDUAL", "COLETIVO", "POR_TURMA"]);

export const createPlantaoSchema = z
  .object({
    escolaId: id,
    data: z.coerce.date({ invalid_type_error: "Data inválida" }),
    tipo: tipoPlantaoEnum,
    descricao: texto(),
    horarioInicio: hora,
    horarioFim: hora,
    profissionais: texto(5000),
    turmaId: idOpcional,
    local: texto(200),
    observacoes: texto(),
  })
  .refine((d) => d.horarioFim > d.horarioInicio, { message: "Fim deve ser depois do início", path: ["horarioFim"] });

export const updatePlantaoSchema = z.object({
  data: dataOpcional,
  tipo: tipoPlantaoEnum.optional(),
  descricao: texto(),
  horarioInicio: hora.optional(),
  horarioFim: hora.optional(),
  profissionais: texto(5000),
  turmaId: idOpcional,
  local: texto(200),
  observacoes: texto(),
  ativo: z.boolean().optional(),
});

export const listarPlantoesQuerySchema = z.object({
  escolaId: idOpcional,
  turmaId: idOpcional,
  tipo: z.preprocess(semVazio, tipoPlantaoEnum.optional()),
  dataInicio: dataOpcional,
  dataFim: dataOpcional,
  ativo: boolQuery,
});

export const periodoObrigatorioQuerySchema = z.object({
  dataInicio: z.coerce.date({ required_error: "dataInicio é obrigatória", invalid_type_error: "Data inválida" }),
  dataFim: z.coerce.date({ required_error: "dataFim é obrigatória", invalid_type_error: "Data inválida" }),
});

export const escolaQuerySchema = z.object({ escolaId: idOpcional });
export const usuarioQuerySchema = z.object({ userId: idOpcional });
export const idParamSchema = z.object({ id });
