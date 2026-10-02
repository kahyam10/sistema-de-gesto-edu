import { z } from "zod";

// ==================== LIMITES DE ENTRADA ====================
// Limites generosos: servem para barrar payloads abusivos (strings de
// megabytes, listas gigantes), não para impor regra de negócio.

/** Nomes, códigos, e-mails, telefones, identificadores e afins. */
export const MAX_TEXTO_CURTO = 255;
/** Textos livres (descrições, observações, justificativas, motivos). */
export const MAX_TEXTO_LIVRE = 10_000;
/**
 * Listas enviadas de uma vez (presenças/notas de uma turma, ids de etapas,
 * escolas, módulos). Uma turma tem dezenas de alunos e a rede, dezenas de
 * escolas/etapas: 1000 cobre com folga qualquer uso legítimo e ainda limita
 * o tamanho da transação.
 */
export const MAX_ITENS_LOTE = 1000;
/** Itens por página nas listas paginadas (as telas pedem no máximo 100). */
export const MAX_ITENS_PAGINA = 100;

const ehDataValida = (v: string) => !Number.isNaN(new Date(v).getTime());

/**
 * Data em texto (AAAA-MM-DD ou ISO) → Date. Antes era
 * `z.string().transform((v) => new Date(v))`, que transformava "abc" em
 * Invalid Date e deixava o erro estourar no Prisma.
 */
export const dataTextoSchema = z
  .string()
  .max(64)
  .refine(ehDataValida, "Data inválida")
  .transform((v) => new Date(v));

// ==================== AUTENTICAÇÃO ====================

export const registerSchema = z.object({
  email: z.string().max(MAX_TEXTO_CURTO).email("Email inválido"),
  password: z.string().max(MAX_TEXTO_CURTO).min(10, "Senha deve ter pelo menos 10 caracteres"),
  nome: z.string().max(MAX_TEXTO_CURTO).min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z
    .enum(["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR", "SECRETARIA", "PROFESSOR", "RESPONSAVEL", "USER"])
    .default("USER"),
  escolaId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

export const loginSchema = z.object({
  email: z.string().max(MAX_TEXTO_CURTO).email("Email inválido"),
  password: z.string().max(MAX_TEXTO_CURTO).min(1, "Senha é obrigatória"),
});

// ==================== SÉRIE ====================

export const createSerieSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  ordem: z.number().int().positive("Ordem deve ser um número positivo"),
  nivelId: z.string().max(MAX_TEXTO_CURTO).min(1, "Nível é obrigatório"),
});

export const updateSerieSchema = createSerieSchema.partial();

// ==================== NÍVEL DE ENSINO ====================

export const createNivelEnsinoSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  descricao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  ordem: z
    .number()
    .int()
    .positive("Ordem deve ser um número positivo")
    .default(1),
  etapaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Etapa é obrigatória"),
});

export const updateNivelEnsinoSchema = createNivelEnsinoSchema.partial();

// ==================== ETAPA DE ENSINO ====================

export const createEtapaSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  descricao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  ordem: z
    .number()
    .int()
    .positive("Ordem deve ser um número positivo")
    .default(1),
  tipoEducacaoId: z.string().max(MAX_TEXTO_CURTO).min(1, "Tipo de educação é obrigatório"),
});

export const updateEtapaSchema = createEtapaSchema.partial();

// ==================== TIPO DE EDUCAÇÃO ====================

export const createTipoEducacaoSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  descricao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  ordem: z
    .number()
    .int()
    .min(0, "Ordem deve ser um número positivo")
    .default(0),
});

export const updateTipoEducacaoSchema = createTipoEducacaoSchema.partial();

// ==================== ESCOLA ====================

export const createEscolaSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  codigo: z.string().max(MAX_TEXTO_CURTO).min(1, "Código é obrigatório"),
  endereco: z.string().max(MAX_TEXTO_CURTO).optional(),
  telefone: z.string().max(MAX_TEXTO_CURTO).optional(),
  email: z.string().max(MAX_TEXTO_CURTO).email("Email inválido").optional().or(z.literal("")),
  quantidadeSalas: z
    .number()
    .int()
    .min(0, "Quantidade de salas não pode ser negativa")
    .default(0),
  ativo: z.boolean().default(true),
  etapasIds: z.array(z.string().max(MAX_TEXTO_CURTO)).max(MAX_ITENS_LOTE).optional(),
  diretorId: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),

  // Infraestrutura - Áreas comuns
  possuiPatio: z.boolean().default(false),
  possuiParque: z.boolean().default(false),
  possuiQuadra: z.boolean().default(false),
  quadraCoberta: z.boolean().default(false),
  possuiBiblioteca: z.boolean().default(false),
  possuiRefeitorio: z.boolean().default(false),
  possuiSalaProfessores: z.boolean().default(false),
  possuiSecretaria: z.boolean().default(false),
  possuiDiretoria: z.boolean().default(false),
  possuiAlmoxarifado: z.boolean().default(false),
  possuiCozinha: z.boolean().default(false),
  possuiDispensa: z.boolean().default(false),

  // Infraestrutura - Banheiros
  qtdBanheirosAlunos: z.number().int().min(0).default(0),
  qtdBanheirosAlunas: z.number().int().min(0).default(0),
  qtdBanheirosAdaptados: z.number().int().min(0).default(0),
  qtdBanheirosFuncionarios: z.number().int().min(0).default(0),

  // Infraestrutura - Tecnologia
  possuiInternet: z.boolean().default(false),
  tipoInternet: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  velocidadeInternet: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  possuiSalaInformatica: z.boolean().default(false),
  qtdComputadores: z.number().int().min(0).default(0),
  possuiProjetores: z.boolean().default(false),
  qtdProjetores: z.number().int().min(0).default(0),

  // Infraestrutura - Acessibilidade
  possuiRampaAcesso: z.boolean().default(false),
  possuiElevador: z.boolean().default(false),
  possuiPisoTatil: z.boolean().default(false),
  possuiSinalizacaoBraile: z.boolean().default(false),
});

export const updateEscolaSchema = createEscolaSchema.partial();

// ==================== TURMA ====================

export const createTurmaSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  turno: z.enum(["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"]),
  anoLetivo: z.number().int().min(2020).max(2100),
  capacidadeMaxima: z.number().int().positive().default(25),
  limitePCD: z.number().int().min(0).default(3),
  escolaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Escola é obrigatória"),
  serieId: z.string().max(MAX_TEXTO_CURTO).min(1, "Série é obrigatória"),
  ativo: z.boolean().default(true),
});

export const updateTurmaSchema = createTurmaSchema.partial();

export const addAlunoTurmaSchema = z.object({
  matriculaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Matrícula é obrigatória"),
});

export const addProfessorTurmaSchema = z.object({
  profissionalId: z.string().max(MAX_TEXTO_CURTO).min(1, "Profissional é obrigatório"),
  tipo: z.enum(["PROFESSOR", "AUXILIAR"]),
  disciplina: z.string().max(MAX_TEXTO_CURTO).optional(),
});

// ==================== MATRÍCULA ====================

export const createMatriculaSchema = z.object({
  anoLetivo: z.number().int().min(2020).max(2100),

  // Dados do Aluno
  nomeAluno: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome do aluno é obrigatório"),
  dataNascimento: dataTextoSchema,
  cpfAluno: z.string().max(MAX_TEXTO_CURTO).optional(),
  rgAluno: z.string().max(MAX_TEXTO_CURTO).optional(),
  sexo: z.enum(["M", "F"]),
  naturalidade: z.string().max(MAX_TEXTO_CURTO).optional(),
  nacionalidade: z.string().max(MAX_TEXTO_CURTO).default("Brasileira"),
  corRaca: z.string().max(MAX_TEXTO_CURTO).optional(),

  // Necessidades Especiais
  possuiDeficiencia: z.boolean().default(false),
  tipoDeficiencia: z.string().max(MAX_TEXTO_LIVRE).optional(),

  // Dados do Responsável
  nomeResponsavel: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome do responsável é obrigatório"),
  cpfResponsavel: z.string().max(MAX_TEXTO_CURTO).optional(),
  telefoneResponsavel: z.string().max(MAX_TEXTO_CURTO).optional(),
  emailResponsavel: z
    .string().max(MAX_TEXTO_CURTO)
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  parentesco: z.string().max(MAX_TEXTO_CURTO).optional(),

  // Endereço
  endereco: z.string().max(MAX_TEXTO_CURTO).optional(),
  bairro: z.string().max(MAX_TEXTO_CURTO).optional(),
  cidade: z.string().max(MAX_TEXTO_CURTO).optional(),
  estado: z.string().max(MAX_TEXTO_CURTO).optional(),
  cep: z.string().max(MAX_TEXTO_CURTO).optional(),

  // Documentos e Observações
  documentosEntregues: z.record(z.boolean()).optional(),
  observacoes: z.string().max(MAX_TEXTO_LIVRE).optional(),

  // Saúde e Emergência
  tipoSanguineo: z.string().max(MAX_TEXTO_CURTO).optional(),
  alergias: z.string().max(MAX_TEXTO_LIVRE).optional(),
  medicamentos: z.string().max(MAX_TEXTO_LIVRE).optional(),
  condicoesSaude: z.string().max(MAX_TEXTO_LIVRE).optional(),
  numeroCartaoSUS: z.string().max(MAX_TEXTO_CURTO).optional(),
  planoSaude: z.string().max(MAX_TEXTO_CURTO).optional(),
  contatoEmergenciaNome: z.string().max(MAX_TEXTO_CURTO).optional(),
  contatoEmergenciaTelefone: z.string().max(MAX_TEXTO_CURTO).optional(),
  contatoEmergenciaParentesco: z.string().max(MAX_TEXTO_CURTO).optional(),

  // NIS (PIS/PASEP) do aluno — exportação Sistema Presença (Bolsa Família)
  nisAluno: z.string().max(MAX_TEXTO_CURTO).optional(),

  // Relacionamentos
  escolaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Escola é obrigatória"),
  etapaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Etapa é obrigatória"),
  turmaId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

export const updateMatriculaSchema = createMatriculaSchema.partial().extend({
  status: z
    .enum(["ATIVA", "TRANSFERIDA", "CANCELADA", "CONCLUIDA"])
    .optional(),
});

// ==================== PROFISSIONAL ====================

export const createProfissionalSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  cpf: z.string().max(MAX_TEXTO_CURTO).min(11, "CPF inválido"),
  email: z.string().max(MAX_TEXTO_CURTO).email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().max(MAX_TEXTO_CURTO).optional(),
  tipo: z.enum(["PROFESSOR", "AUXILIAR", "COORDENADOR", "DIRETOR"]),
  formacao: z.string().max(MAX_TEXTO_CURTO).optional(),
  especialidade: z.string().max(MAX_TEXTO_CURTO).optional(),
  matricula: z.string().max(MAX_TEXTO_CURTO).optional(),
  ativo: z.boolean().default(true),
  escolasIds: z.array(z.string().max(MAX_TEXTO_CURTO)).max(MAX_ITENS_LOTE).optional(),
});

export const updateProfissionalSchema = createProfissionalSchema.partial();

// ==================== FORMAÇÕES ====================

export const createFormacaoSchema = z.object({
  tipo: z.enum([
    "GRADUACAO",
    "POS_GRADUACAO",
    "MESTRADO",
    "DOUTORADO",
    "CURSO_TECNICO",
    "CURSO_LIVRE",
  ]),
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome da formação é obrigatório"),
  instituicao: z.string().max(MAX_TEXTO_CURTO).optional(),
  anoConclusao: z.number().int().min(1950).max(2100).optional(),
  cargaHoraria: z.number().int().positive().optional(),
  emAndamento: z.boolean().optional(),
});

export const updateFormacaoSchema = createFormacaoSchema.partial();

// ==================== VÍNCULOS ====================

export const vincularEscolaSchema = z.object({
  escolaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Escola é obrigatória"),
  funcao: z.string().max(MAX_TEXTO_CURTO).optional(),
  cargaHoraria: z.number().int().positive().optional(),
});

export const transferirMatriculaSchema = z.object({
  escolaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Escola de destino é obrigatória"),
  turmaId: z.string().max(MAX_TEXTO_CURTO).optional(),
  motivo: z.string().max(MAX_TEXTO_LIVRE).optional(),
});

// ==================== CALENDÁRIO ====================

export const tipoEventoEnum = z.enum([
  "INICIO_ANO_LETIVO",
  "FIM_ANO_LETIVO",
  "INICIO_AULAS_REGULARES",
  "FIM_AULAS_REGULARES",
  "FERIADO",
  "RECESSO",
  "SABADO_LETIVO",
  "EVENTO",
  "AC",
  "AVALIACAO",
  "REUNIAO",
  "CONSELHO_CLASSE",
  "PLANEJAMENTO",
  "FORMACAO",
  "OUTRO",
]);

export const createAnoLetivoSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  ativo: z.boolean().optional(),
});

export const updateAnoLetivoSchema = createAnoLetivoSchema.partial();

const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createEventoSchema = z.object({
  titulo: z.string().max(MAX_TEXTO_CURTO).min(1, "Título é obrigatório"),
  descricao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  dataInicio: z.coerce.date({ invalid_type_error: "Data de início inválida" }),
  dataFim: z.coerce.date({ invalid_type_error: "Data de fim inválida" }).optional(),
  horaInicio: z.string().max(MAX_TEXTO_CURTO).regex(horaRegex, "Hora de início inválida (HH:MM)").optional(),
  horaFim: z.string().max(MAX_TEXTO_CURTO).regex(horaRegex, "Hora de fim inválida (HH:MM)").optional(),
  tipo: tipoEventoEnum,
  escopo: z.enum(["REDE", "ESCOLA"]).optional(),
  recorrente: z.boolean().optional(),
  tipoRecorrencia: z.enum(["SEMANAL", "MENSAL", "ANUAL"]).optional(),
  diaRecorrencia: z.string().max(MAX_TEXTO_CURTO).optional(),
  cor: z.string().max(MAX_TEXTO_CURTO).regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hexadecimal (#RRGGBB)").optional(),
  reduzDiaLetivo: z.boolean().optional(),
  anoLetivoId: z.string().max(MAX_TEXTO_CURTO).min(1, "Ano letivo é obrigatório"),
  escolaId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

// Datas que estruturam o ano letivo não se repetem
const TIPOS_SEM_RECORRENCIA = ["INICIO_ANO_LETIVO", "FIM_ANO_LETIVO", "INICIO_AULAS_REGULARES", "FIM_AULAS_REGULARES"];
const DIAS_SEMANA_EVENTO = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];
/** Regras de recorrência (lib/recorrencia.ts); valem na criação e na edição. */
function conferirRecorrencia(
  d: { recorrente?: boolean; tipoRecorrencia?: string; diaRecorrencia?: string; tipo?: string; reduzDiaLetivo?: boolean },
  ctx: z.RefinementCtx
) {
  if (!d.recorrente) return;
  if (d.tipo && TIPOS_SEM_RECORRENCIA.includes(d.tipo)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recorrente"], message: "Este tipo de evento não pode se repetir" });
  }
  if (d.reduzDiaLetivo) {
    // A contagem de dias letivos (calcularDiasLetivos) não expande repetições
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reduzDiaLetivo"], message: "Evento que se repete não pode reduzir dia letivo: cadastre cada data" });
  }
  if (!d.tipoRecorrencia) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tipoRecorrencia"], message: "Informe se repete toda semana, todo mês ou todo ano" });
  }
  const dia = d.diaRecorrencia;
  if (dia && d.tipoRecorrencia === "SEMANAL" && !DIAS_SEMANA_EVENTO.includes(dia)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["diaRecorrencia"], message: "Dia da semana inválido (ex.: SEGUNDA)" });
  }
  if (dia && d.tipoRecorrencia === "MENSAL" && !/^([1-9]|[12]\d|3[01])$/.test(dia)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["diaRecorrencia"], message: "Dia do mês inválido (1 a 31)" });
  }
}
export const createEventoRecorrenteSchema = createEventoSchema.superRefine(conferirRecorrencia);

export const updateEventoSchema = createEventoSchema
  .omit({ anoLetivoId: true })
  .partial();
export const updateEventoRecorrenteSchema = updateEventoSchema.superRefine(conferirRecorrencia);

// ==================== PHASES ====================

export const createPhaseSchema = z.object({
  name: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  description: z.string().max(MAX_TEXTO_LIVRE).min(1, "Descrição é obrigatória"),
  monthRange: z.string().max(MAX_TEXTO_CURTO).min(1, "Período é obrigatório"),
  duration: z.string().max(MAX_TEXTO_CURTO).min(1, "Duração é obrigatória"),
  ordem: z.number().int().optional(),
  status: z
    .enum([
      "planning",
      "in-progress",
      "review",
      "correction",
      "homologated",
      "completed",
      "blocked",
    ])
    .optional(),
  moduleIds: z.array(z.string().max(MAX_TEXTO_CURTO)).max(MAX_ITENS_LOTE).optional(),
});

export const updatePhaseSchema = createPhaseSchema.partial();

// ==================== TIPOS EXPORTADOS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSerieInput = z.infer<typeof createSerieSchema>;
export type UpdateSerieInput = z.infer<typeof updateSerieSchema>;
export type CreateNivelEnsinoInput = z.infer<typeof createNivelEnsinoSchema>;
export type UpdateNivelEnsinoInput = z.infer<typeof updateNivelEnsinoSchema>;
export type CreateEtapaInput = z.infer<typeof createEtapaSchema>;
export type UpdateEtapaInput = z.infer<typeof updateEtapaSchema>;
export type CreateTipoEducacaoInput = z.infer<typeof createTipoEducacaoSchema>;
export type UpdateTipoEducacaoInput = z.infer<typeof updateTipoEducacaoSchema>;
export type CreateEscolaInput = z.infer<typeof createEscolaSchema>;
export type UpdateEscolaInput = z.infer<typeof updateEscolaSchema>;
export type CreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
export type CreateMatriculaInput = z.infer<typeof createMatriculaSchema>;
export type UpdateMatriculaInput = z.infer<typeof updateMatriculaSchema>;
export type CreateProfissionalInput = z.infer<typeof createProfissionalSchema>;
export type UpdateProfissionalInput = z.infer<typeof updateProfissionalSchema>;
export type CreateFormacaoInput = z.infer<typeof createFormacaoSchema>;
export type UpdateFormacaoInput = z.infer<typeof updateFormacaoSchema>;
export type VincularEscolaInput = z.infer<typeof vincularEscolaSchema>;
export type TransferirMatriculaInput = z.infer<typeof transferirMatriculaSchema>;
export type CreateAnoLetivoInput = z.infer<typeof createAnoLetivoSchema>;
export type UpdateAnoLetivoInput = z.infer<typeof updateAnoLetivoSchema>;
export type CreateEventoInput = z.infer<typeof createEventoSchema>;
export type UpdateEventoInput = z.infer<typeof updateEventoSchema>;
export type CreatePhaseInput = z.infer<typeof createPhaseSchema>;
export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;

// ==================== MÓDULO 2: PEDAGÓGICO (schemas) ====================
// ==================== GRADE HORÁRIA ====================

export const createGradeHorarioSchema = z.object({
  turmaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Turma é obrigatória"),
  diaSemana: z.enum([
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
  ]),
  horaInicio: z.string().max(MAX_TEXTO_CURTO).min(1, "Hora inicial é obrigatória"),
  horaFim: z.string().max(MAX_TEXTO_CURTO).min(1, "Hora final é obrigatória"),
  disciplina: z.string().max(MAX_TEXTO_CURTO).min(1, "Disciplina é obrigatória"),
  profissionalId: z.string().max(MAX_TEXTO_CURTO).optional(),
  observacoes: z.string().max(MAX_TEXTO_LIVRE).optional(),
});

export const updateGradeHorarioSchema = createGradeHorarioSchema.partial();

// ==================== FREQUÊNCIA ====================

export const createFrequenciaSchema = z.object({
  matriculaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Matrícula é obrigatória"),
  turmaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Turma é obrigatória"),
  data: dataTextoSchema,
  status: z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]),
  justificativa: z.string().max(MAX_TEXTO_LIVRE).optional(),
  observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  // Aula da grade (frequência por aula); ausente = chamada diária
  gradeHorariaId: z.string().max(MAX_TEXTO_CURTO).min(1).optional(),
});

export const updateFrequenciaSchema = z.object({
  status: z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]).optional(),
  justificativa: z.string().max(MAX_TEXTO_LIVRE).optional(),
  observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
});

export const registrarFrequenciaTurmaSchema = z.object({
  turmaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Turma é obrigatória"),
  data: dataTextoSchema,
  // Aula da grade: obrigatória quando a turma tem aulas no dia da semana
  // (chamada por aula); ausente = chamada diária (turma sem grade no dia)
  gradeHorariaId: z.string().max(MAX_TEXTO_CURTO).min(1).optional(),
  presencas: z.array(
    z.object({
      matriculaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Matrícula é obrigatória"),
      status: z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]),
      justificativa: z.string().max(MAX_TEXTO_LIVRE).optional(),
      observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
    })
  ).max(MAX_ITENS_LOTE),
});

// ==================== DISCIPLINA ====================

export const createDisciplinaSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  codigo: z.string().min(1, "Código é obrigatório").max(20),
  descricao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  cargaHorariaSemanal: z.number().int().min(0).optional(),
  obrigatoria: z.boolean().default(true),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0),
  etapaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Etapa é obrigatória"),
});

export const updateDisciplinaSchema = createDisciplinaSchema.partial();

// ==================== CONFIGURAÇÃO DE AVALIAÇÃO ====================

export const createConfiguracaoAvaliacaoSchema = z.object({
  anoLetivo: z.number().int().min(2020).max(2100),
  sistemaAvaliacao: z.enum(["NOTA", "CONCEITO"]).default("NOTA"),
  numeroPeriodos: z.number().int().min(1).max(6).default(4),
  mediaMinima: z.number().min(0).max(10).default(6.0),
  percentualFrequenciaMinima: z.number().min(0).max(100).default(75),
  recuperacaoParalela: z.boolean().default(false),
  recuperacaoFinal: z.boolean().default(true),
  escolaId: z.string().max(MAX_TEXTO_CURTO).optional(),
  etapaId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

export const updateConfiguracaoAvaliacaoSchema =
  createConfiguracaoAvaliacaoSchema.partial();

// ==================== AVALIAÇÃO ====================

export const createAvaliacaoSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1, "Nome é obrigatório"),
  tipo: z.enum([
    "PROVA",
    "TRABALHO",
    "ATIVIDADE",
    "PARTICIPACAO",
    "RECUPERACAO",
  ]),
  peso: z.number().positive("Peso deve ser maior que zero").default(1.0),
  valorMaximo: z.number().positive("Valor máximo deve ser maior que zero").default(10.0),
  data: dataTextoSchema,
  bimestre: z.number().int().min(1).max(4),
  observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  turmaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Turma é obrigatória"),
  disciplinaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Disciplina é obrigatória"),
  profissionalId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

export const updateAvaliacaoSchema = z.object({
  nome: z.string().max(MAX_TEXTO_CURTO).min(1).optional(),
  tipo: z
    .enum(["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"])
    .optional(),
  peso: z.number().positive("Peso deve ser maior que zero").optional(),
  valorMaximo: z.number().positive("Valor máximo deve ser maior que zero").optional(),
  data: dataTextoSchema.optional(),
  bimestre: z.number().int().min(1).max(4).optional(),
  observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  profissionalId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

// ==================== NOTA ====================

export const createNotaSchema = z.object({
  valor: z.number().min(0),
  observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
  avaliacaoId: z.string().max(MAX_TEXTO_CURTO).nullable().optional(),
  matriculaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Matrícula é obrigatória"),
  turmaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Turma é obrigatória"),
  disciplina: z.string().max(MAX_TEXTO_CURTO).min(1, "Disciplina é obrigatória"),
  bimestre: z.number().int().min(1).max(5), // 1-4 bimestres regulares, 5 = recuperação final
});

export const updateNotaSchema = z.object({
  valor: z.number().min(0).optional(),
  observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
});

export const lancarNotasTurmaSchema = z.object({
  avaliacaoId: z.string().max(MAX_TEXTO_CURTO).min(1, "Avaliação é obrigatória"),
  notas: z.array(
    z.object({
      matriculaId: z.string().max(MAX_TEXTO_CURTO).min(1, "Matrícula é obrigatória"),
      valor: z.number().min(0),
      observacao: z.string().max(MAX_TEXTO_LIVRE).optional(),
    })
  ).max(MAX_ITENS_LOTE),
});

// Tipos exportados do Módulo 2
export type CreateGradeHorarioInput = z.infer<typeof createGradeHorarioSchema>;
export type UpdateGradeHorarioInput = z.infer<typeof updateGradeHorarioSchema>;
export type CreateFrequenciaInput = z.infer<typeof createFrequenciaSchema>;
export type UpdateFrequenciaInput = z.infer<typeof updateFrequenciaSchema>;
export type RegistrarFrequenciaTurmaInput = z.infer<typeof registrarFrequenciaTurmaSchema>;

/** Filtro da chamada de um dia: id da aula da grade ou "DIA" (chamada diária). */
export const chamadaDoDiaQuerySchema = z.object({
  aulaChave: z.string().max(MAX_TEXTO_CURTO).min(1).optional(),
});
export type CreateDisciplinaInput = z.infer<typeof createDisciplinaSchema>;
export type UpdateDisciplinaInput = z.infer<typeof updateDisciplinaSchema>;
export type CreateNotaInput = z.infer<typeof createNotaSchema>;
export type UpdateNotaInput = z.infer<typeof updateNotaSchema>;
export type LancarNotasTurmaInput = z.infer<typeof lancarNotasTurmaSchema>;
export type CreateConfiguracaoAvaliacaoInput = z.infer<
  typeof createConfiguracaoAvaliacaoSchema
>;
export type UpdateConfiguracaoAvaliacaoInput = z.infer<
  typeof updateConfiguracaoAvaliacaoSchema
>;
export type CreateAvaliacaoInput = z.infer<typeof createAvaliacaoSchema>;
export type UpdateAvaliacaoInput = z.infer<typeof updateAvaliacaoSchema>;

// ==================== MÓDULO 4: RH (schemas) ====================
// ==================== PONTO DIGITAL ====================

export const createPontoSchema = z.object({
  profissionalId: z.string().max(MAX_TEXTO_CURTO).min(1, "Profissional é obrigatório"),
  escolaId: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  data: z.coerce.date(),
  entrada: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  saida: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  entrada2: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  saida2: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  tipoRegistro: z
    .enum(["NORMAL", "ATESTADO", "FALTA", "FALTA_JUSTIFICADA", "FERIAS", "LICENCA"])
    .default("NORMAL"),
  observacoes: z.string().max(MAX_TEXTO_LIVRE).optional().nullable(),
  justificativa: z.string().max(MAX_TEXTO_LIVRE).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const updatePontoSchema = createPontoSchema.partial();

export const registrarPontoSchema = z.object({
  profissionalId: z.string().max(MAX_TEXTO_CURTO).min(1, "Profissional é obrigatório"),
  escolaId: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
  tipo: z.enum(["ENTRADA", "SAIDA", "ENTRADA2", "SAIDA2"]),
  horario: z.string().max(MAX_TEXTO_CURTO).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de horário inválido (HH:MM)"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

// ==================== LICENÇAS ====================

export const createLicencaSchema = z.object({
  profissionalId: z.string().max(MAX_TEXTO_CURTO).min(1, "Profissional é obrigatório"),
  tipo: z.enum([
    "LICENCA_MEDICA",
    "LICENCA_MATERNIDADE",
    "LICENCA_PATERNIDADE",
    "LICENCA_PREMIO",
    "LICENCA_SEM_VENCIMENTO",
    "FERIAS",
  ]),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  motivo: z.string().max(MAX_TEXTO_LIVRE).optional().nullable(),
  observacoes: z.string().max(MAX_TEXTO_LIVRE).optional().nullable(),
  documentoPath: z.string().max(MAX_TEXTO_CURTO).optional().nullable(),
});

export const updateLicencaSchema = createLicencaSchema.partial();

export const aprovarLicencaSchema = z.object({
  aprovadaPor: z.string().max(MAX_TEXTO_CURTO).min(1, "Usuário aprovador é obrigatório"),
  status: z.enum(["APROVADA", "REJEITADA"]),
  justificativaRejeicao: z.string().max(MAX_TEXTO_LIVRE).optional().nullable(),
});

// ==================== DOCUMENTOS DA MATRÍCULA ====================

export const tipoDocumentoMatriculaEnum = z.enum([
  "CERTIDAO_NASCIMENTO",
  "RG_ALUNO",
  "CPF_ALUNO",
  "FOTO_3X4",
  "CARTAO_SUS",
  "CADERNETA_VACINACAO",
  "COMPROVANTE_RESIDENCIA",
  "RG_RESPONSAVEL",
  "CPF_RESPONSAVEL",
  "HISTORICO_ESCOLAR",
  "DECLARACAO_TRANSFERENCIA",
  "LAUDO_MEDICO",
  "OUTRO",
]);

export const uploadDocumentoMatriculaQuerySchema = z.object({
  tipo: tipoDocumentoMatriculaEnum,
});

export type TipoDocumentoMatricula = z.infer<typeof tipoDocumentoMatriculaEnum>;

// ==================== PAGINAÇÃO ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(MAX_ITENS_PAGINA).default(20),
});


// Tipos exportados do Módulo 4
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreatePontoInput = z.infer<typeof createPontoSchema>;
export type UpdatePontoInput = z.infer<typeof updatePontoSchema>;
export type RegistrarPontoInput = z.infer<typeof registrarPontoSchema>;
export type CreateLicencaInput = z.infer<typeof createLicencaSchema>;
export type UpdateLicencaInput = z.infer<typeof updateLicencaSchema>;
export type AprovarLicencaInput = z.infer<typeof aprovarLicencaSchema>;

// ==================== MÓDULO 3: PORTAIS ====================

export const criarAcessoMatriculaSchema = z.object({
  email: z.string().max(MAX_TEXTO_CURTO).email("Email inválido"),
  // Obrigatórios apenas quando o usuário ainda não existe (validado no service — BIZ_024)
  nome: z.string().max(MAX_TEXTO_CURTO).min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  senha: z.string().max(MAX_TEXTO_CURTO).min(10, "Senha deve ter pelo menos 10 caracteres").optional(),
  tipoVinculo: z.enum(["RESPONSAVEL", "ALUNO"]).default("RESPONSAVEL"),
  parentesco: z.string().max(MAX_TEXTO_CURTO).optional(),
});

export const periodoPortalSchema = z.object({
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

export const resumoPortalQuerySchema = z.object({
  anoLetivo: z.coerce.number().int().min(2020).max(2100).optional(),
  escolaId: z.string().max(MAX_TEXTO_CURTO).optional(),
});

export type CriarAcessoMatriculaInput = z.infer<typeof criarAcessoMatriculaSchema>;
export type PeriodoPortalInput = z.infer<typeof periodoPortalSchema>;
export type ResumoPortalQueryInput = z.infer<typeof resumoPortalQuerySchema>;

// ==================== CONSULTAS DE LISTA (querystring) ====================

/** "" na querystring (ex.: ?dataInicio=) conta como ausente, como antes. */
const vazioComoAusente = (v: unknown) => (v === "" ? undefined : v);

/**
 * page/limit/dataInicio/dataFim das listas com paginação opcional.
 * Mantém o contrato: só pagina quando page E limit vêm; sem eles a rota
 * devolve a lista do escopo. Quando vêm, page >= 1 e 1 <= limit <= 100
 * (antes: parseInt sem teto — limit=1000000 devolvia tudo e page=0 gerava
 * skip negativo).
 */
export const consultaListaSchema = z.object({
  page: z.preprocess(vazioComoAusente, z.coerce.number().int().positive().max(1_000_000).optional()),
  limit: z.preprocess(vazioComoAusente, z.coerce.number().int().positive().max(MAX_ITENS_PAGINA).optional()),
  dataInicio: z.preprocess(vazioComoAusente, dataTextoSchema.optional()),
  dataFim: z.preprocess(vazioComoAusente, dataTextoSchema.optional()),
});

export type ConsultaListaInput = z.infer<typeof consultaListaSchema>;

// ==================== LICENÇA: APROVAR / REJEITAR ====================

/**
 * Corpo de POST /api/licencas/:id/aprovar. Aceita o formato documentado
 * ({ aprovado, motivo }) e o que o dashboard envia
 * ({ status: "APROVADA"|"REJEITADA", justificativaRejeicao }). O aprovador
 * vem SEMPRE da sessão: `aprovadaPor` do corpo é ignorado.
 */
export const decisaoLicencaSchema = z
  .object({
    aprovado: z.boolean().optional(),
    motivo: z.string().trim().max(MAX_TEXTO_LIVRE).optional().nullable(),
    status: z.enum(["APROVADA", "REJEITADA"]).optional(),
    justificativaRejeicao: z.string().trim().max(MAX_TEXTO_LIVRE).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.aprovado === undefined && d.status === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["aprovado"], message: "Informe se a licença é aprovada ou rejeitada" });
      return;
    }
    if (d.aprovado !== undefined && d.status !== undefined && d.aprovado !== (d.status === "APROVADA")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "aprovado e status são contraditórios" });
      return;
    }
    const aprovado = d.aprovado ?? d.status === "APROVADA";
    const motivo = d.motivo || d.justificativaRejeicao;
    if (!aprovado && !motivo) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["motivo"], message: "Informe o motivo da rejeição" });
    }
  })
  .transform((d) => {
    const aprovado = d.aprovado ?? d.status === "APROVADA";
    return { aprovado, motivo: aprovado ? null : (d.motivo || d.justificativaRejeicao || null) };
  });

// ==================== QUESTIONÁRIOS DO CENSO ESCOLAR (dadosCenso) ====================
// Espelham os formulários do dashboard (dashboard/src/lib/types/questionario-*.ts),
// que são os que gravam dadosCenso; o exportador Educacenso lê da escola
// codigoEscola, situacaoFuncionamento, dependenciaAdministrativa e localizacao.
// Todos os campos são opcionais (a tela manda o formulário inteiro, mas o
// contrato nunca exigiu campos); chaves desconhecidas são descartadas.
// `null` continua limpando o questionário (comportamento anterior do service).

const MAX_ITENS_CENSO = 200;
const textoCenso = z.string().max(MAX_TEXTO_CURTO);
const listaCenso = z.array(textoCenso).max(MAX_ITENS_CENSO);
const mapaCenso = z
  .record(z.string().max(MAX_TEXTO_CURTO), textoCenso)
  .refine((m) => Object.keys(m).length <= MAX_ITENS_CENSO, "Itens demais");

// Sub-objetos (dashboard/src/lib/types/questionario-*.ts)

const cursoSuperiorCensoSchema = z.object({
  area: textoCenso,
  nivelGrau: textoCenso,
  curso: textoCenso,
  anoConclusao: textoCenso,
  tipoInstituicao: textoCenso,
  instituicao: textoCenso,
}).partial();

const posGraduacaoCensoSchema = z.object({
  nivel: textoCenso,
  area: textoCenso,
  anoConclusao: textoCenso,
}).partial();

const diaSemanaCensoSchema = z.object({
  ativo: z.boolean(),
  horaInicial: textoCenso,
  horaFinal: textoCenso,
}).partial();

const diasSemanaCensoSchema = z.object({
  domingo: diaSemanaCensoSchema,
  segunda: diaSemanaCensoSchema,
  terca: diaSemanaCensoSchema,
  quarta: diaSemanaCensoSchema,
  quinta: diaSemanaCensoSchema,
  sexta: diaSemanaCensoSchema,
  sabado: diaSemanaCensoSchema,
}).partial();

/** QuestionarioEscolaFormData (dashboard/src/lib/types/questionario-escola.ts) */
export const censoEscolaSchema = z
  .object({
    codigoEscola: textoCenso,
    nomeEscola: textoCenso,
    dependenciaAdministrativa: z.enum(["Federal", "Estadual", "Municipal", "Privada", ""]),
    orgaoVinculacao: textoCenso,
    orgaoRegional: textoCenso,
    regulamentacao: z.enum(["Sim", "Em tramitação", "Não", ""]),
    esferaRegulamentacao: listaCenso,
    entidadeSuperior: listaCenso,
    parceriaConvenio: z.enum(["Sim", "Não", ""]),
    poderPublicoParceria: textoCenso,
    formaContratacaoEstadual: listaCenso,
    formaContratacaoMunicipal: listaCenso,
    situacaoFuncionamento: z.enum(["Em atividade", "Paralisada", "Extinta", ""]),
    inicioAnoLetivo: textoCenso,
    terminoAnoLetivo: textoCenso,
    localizacao: z.enum(["Urbana", "Rural", ""]),
    cep: textoCenso,
    uf: textoCenso,
    municipio: textoCenso,
    regiaoAdministrativa: textoCenso,
    distrito: textoCenso,
    endereco: textoCenso,
    numero: textoCenso,
    complemento: textoCenso,
    bairro: textoCenso,
    ddd: textoCenso,
    telefone: textoCenso,
    outroTelefone: textoCenso,
    email: textoCenso,
    localizacaoDiferenciada: textoCenso,
    unidadeVinculada: textoCenso,
    codigoEscolaSede: textoCenso,
    codigoIES: textoCenso,
    categoriaEscolaPrivada: textoCenso,
    mantenedoraPrivada: listaCenso,
    cnpjMantenedora: textoCenso,
    cnpjEscola: textoCenso,
    localFuncionamento: textoCenso,
    formaOcupacao: textoCenso,
    compartilhaPredio: z.enum(["Sim", "Não", ""]),
    codigoEscolaCompartilhada: textoCenso,
    aguaPotavel: z.enum(["Sim", "Não", ""]),
    abastecimentoAgua: listaCenso,
    fonteEnergia: listaCenso,
    esgotamento: listaCenso,
    destinacaoLixo: listaCenso,
    tratamentoLixo: listaCenso,
    dependenciasFisicas: listaCenso,
    recursosAcessibilidade: listaCenso,
    salasAulaDentro: textoCenso,
    salasAulaFora: textoCenso,
    salasClimatizadas: textoCenso,
    salasAcessibilidade: textoCenso,
    salasCantinoLeitura: textoCenso,
    equipamentosAdministrativos: listaCenso,
    equipamentosEnsinoAprendizagem: listaCenso,
    computadoresDesktop: textoCenso,
    computadoresPortateis: textoCenso,
    tablets: textoCenso,
    redeLocal: listaCenso,
    acessoInternet: listaCenso,
    dispositivosAcessoInternet: listaCenso,
    internetBandaLarga: z.enum(["Sim", "Não", ""]),
    profissionais: mapaCenso,
    alimentacaoEscolar: z.enum(["Oferece", "Não oferece", ""]),
    escolaIndigena: z.enum(["Sim", "Não", ""]),
    linguaEnsino: listaCenso,
    codigoLinguaIndigena: listaCenso,
    instrumentosMateriais: listaCenso,
    educacaoAmbiental: z.enum(["Sim", "Não", ""]),
    formasEducacaoAmbiental: listaCenso,
    pppAtualizado: textoCenso,
    orgaosColegiados: listaCenso,
    compartilhaEspacos: z.enum(["Sim", "Não", ""]),
    usaEspacosEntorno: z.enum(["Sim", "Não", ""]),
    siteBlogRedes: z.enum(["Sim", "Não", ""]),
    exameSelecao: z.enum(["Sim", "Não", ""]),
    reservaVagas: listaCenso,
  })
  .partial()
  .nullable();

/** QuestionarioTurmaFormData (dashboard/src/lib/types/questionario-turma.ts) */
export const censoTurmaSchema = z
  .object({
    codigoEscola: textoCenso,
    nomeEscola: textoCenso,
    nomeTurma: textoCenso,
    tipoMediacaoPedagogica: textoCenso,
    turmaEducacaoEspecial: z.enum(["Sim", "Não", ""]),
    turmaBilingueSurdos: z.enum(["Sim", "Não", ""]),
    turmaFormacaoAlternancia: z.enum(["Sim", "Não", ""]),
    localFuncionamentoDiferenciado: textoCenso,
    horarioUnificado: z.enum(["Sim", "Não", ""]),
    diasSemana: diasSemanaCensoSchema,
    tipoTurma: textoCenso,
    etapaEnsino: textoCenso,
    subEtapaEducacaoInfantil: textoCenso,
    anoSerieEnsFundamental: textoCenso,
    anoSerieEnsMedio: textoCenso,
    anoSerieNormalMagisterio: textoCenso,
    etapaEJA: textoCenso,
    tipoAtividadeComplementar: textoCenso,
    codigoAtividadeComplementar: textoCenso,
    organizacaoCurricular: listaCenso,
    areasItinerarioFormativo: listaCenso,
    tipoItinerarioTecnico: textoCenso,
    codigoCurso: textoCenso,
    nomeCurso: textoCenso,
    formasOrganizacao: listaCenso,
    componentesCurriculares: listaCenso,
  })
  .partial()
  .nullable();

/** QuestionarioGestorFormData (dashboard/src/lib/types/questionario-gestor.ts) */
export const censoProfissionalSchema = z
  .object({
    identificacaoUnica: textoCenso,
    codigoEscola: textoCenso,
    cpf: textoCenso,
    nomeCompleto: textoCenso,
    dataNascimento: textoCenso,
    filiacao1: textoCenso,
    filiacao2: textoCenso,
    sexo: textoCenso,
    corRaca: textoCenso,
    povoIndigena: textoCenso,
    nacionalidade: textoCenso,
    paisNacionalidade: textoCenso,
    ufNascimento: textoCenso,
    municipioNascimento: textoCenso,
    possuiDeficiencia: z.boolean(),
    tiposDeficiencia: listaCenso,
    paisResidencia: textoCenso,
    cep: textoCenso,
    uf: textoCenso,
    municipio: textoCenso,
    localizacao: textoCenso,
    localizacaoDiferenciada: textoCenso,
    maiorNivelConcluido: textoCenso,
    tipoEnsinoMedio: textoCenso,
    cursosSuperiores: z.array(cursoSuperiorCensoSchema).max(MAX_ITENS_CENSO),
    posGraduacoes: z.array(posGraduacaoCensoSchema).max(MAX_ITENS_CENSO),
    outrosCursosEspecificos: listaCenso,
    cargo: textoCenso,
    criterioAcesso: textoCenso,
    situacaoFuncional: textoCenso,
    email: textoCenso,
  })
  .partial()
  .nullable();

export type CensoEscolaInput = z.infer<typeof censoEscolaSchema>;
export type CensoTurmaInput = z.infer<typeof censoTurmaSchema>;
export type CensoProfissionalInput = z.infer<typeof censoProfissionalSchema>;
