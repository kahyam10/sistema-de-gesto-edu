import { z } from "zod";

// ==================== AUTENTICAÇÃO ====================

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z
    .enum(["ADMIN", "DIRETOR", "PROFESSOR", "SECRETARIA", "SEMEC", "USER"])
    .default("USER"),
  escolaId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// ==================== SÉRIE ====================

export const createSerieSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  ordem: z.number().int().positive("Ordem deve ser um número positivo"),
  nivelId: z.string().min(1, "Nível é obrigatório"),
});

export const updateSerieSchema = createSerieSchema.partial();

// ==================== NÍVEL DE ENSINO ====================

export const createNivelEnsinoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  ordem: z
    .number()
    .int()
    .positive("Ordem deve ser um número positivo")
    .default(1),
  etapaId: z.string().min(1, "Etapa é obrigatória"),
});

export const updateNivelEnsinoSchema = createNivelEnsinoSchema.partial();

// ==================== ETAPA DE ENSINO ====================

export const createEtapaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  ordem: z
    .number()
    .int()
    .positive("Ordem deve ser um número positivo")
    .default(1),
  tipoEducacaoId: z.string().min(1, "Tipo de educação é obrigatório"),
});

export const updateEtapaSchema = createEtapaSchema.partial();

// ==================== TIPO DE EDUCAÇÃO ====================

export const createTipoEducacaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  ordem: z
    .number()
    .int()
    .min(0, "Ordem deve ser um número positivo")
    .default(0),
});

export const updateTipoEducacaoSchema = createTipoEducacaoSchema.partial();

// ==================== ESCOLA ====================

export const createEscolaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().min(1, "Código é obrigatório"),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  quantidadeSalas: z
    .number()
    .int()
    .min(0, "Quantidade de salas não pode ser negativa")
    .default(0),
  ativo: z.boolean().default(true),
  etapasIds: z.array(z.string()).optional(),
  diretorId: z.string().optional().nullable(),

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
  tipoInternet: z.string().optional().nullable(),
  velocidadeInternet: z.string().optional().nullable(),
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
  nome: z.string().min(1, "Nome é obrigatório"),
  turno: z.enum(["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"]),
  anoLetivo: z.number().int().min(2020).max(2100),
  capacidadeMaxima: z.number().int().positive().default(25),
  limitePCD: z.number().int().min(0).default(3),
  escolaId: z.string().min(1, "Escola é obrigatória"),
  serieId: z.string().min(1, "Série é obrigatória"),
  ativo: z.boolean().default(true),
});

export const updateTurmaSchema = createTurmaSchema.partial();

export const addAlunoTurmaSchema = z.object({
  matriculaId: z.string().min(1, "Matrícula é obrigatória"),
});

export const addProfessorTurmaSchema = z.object({
  profissionalId: z.string().min(1, "Profissional é obrigatório"),
  tipo: z.enum(["PROFESSOR", "AUXILIAR"]),
  disciplina: z.string().optional(),
});

// ==================== MATRÍCULA ====================

export const createMatriculaSchema = z.object({
  anoLetivo: z.number().int().min(2020).max(2100),

  // Dados do Aluno
  nomeAluno: z.string().min(1, "Nome do aluno é obrigatório"),
  dataNascimento: z.string().transform((val) => new Date(val)),
  cpfAluno: z.string().optional(),
  rgAluno: z.string().optional(),
  sexo: z.enum(["M", "F"]),
  naturalidade: z.string().optional(),
  nacionalidade: z.string().default("Brasileira"),
  corRaca: z.string().optional(),

  // Necessidades Especiais
  possuiDeficiencia: z.boolean().default(false),
  tipoDeficiencia: z.string().optional(),

  // Dados do Responsável
  nomeResponsavel: z.string().min(1, "Nome do responsável é obrigatório"),
  cpfResponsavel: z.string().optional(),
  telefoneResponsavel: z.string().optional(),
  emailResponsavel: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  parentesco: z.string().optional(),

  // Endereço
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),

  // Documentos e Observações
  documentosEntregues: z.string().optional(),
  observacoes: z.string().optional(),

  // Relacionamentos
  escolaId: z.string().min(1, "Escola é obrigatória"),
  etapaId: z.string().min(1, "Etapa é obrigatória"),
  turmaId: z.string().optional(),
});

export const updateMatriculaSchema = createMatriculaSchema.partial();

// ==================== PROFISSIONAL ====================

export const createProfissionalSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  tipo: z.enum(["PROFESSOR", "AUXILIAR", "COORDENADOR", "DIRETOR"]),
  formacao: z.string().optional(),
  especialidade: z.string().optional(),
  matricula: z.string().optional(),
  ativo: z.boolean().default(true),
  escolasIds: z.array(z.string()).optional(),
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
  nome: z.string().min(1, "Nome da formação é obrigatório"),
  instituicao: z.string().optional(),
  anoConclusao: z.number().int().min(1950).max(2100).optional(),
  cargaHoraria: z.number().int().positive().optional(),
  emAndamento: z.boolean().optional(),
});

export const updateFormacaoSchema = createFormacaoSchema.partial();

// ==================== VÍNCULOS ====================

export const vincularEscolaSchema = z.object({
  escolaId: z.string().min(1, "Escola é obrigatória"),
  funcao: z.string().optional(),
  cargaHoraria: z.number().int().positive().optional(),
});

export const transferirMatriculaSchema = z.object({
  escolaId: z.string().min(1, "Escola de destino é obrigatória"),
  turmaId: z.string().optional(),
  motivo: z.string().optional(),
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
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  dataInicio: z.coerce.date({ invalid_type_error: "Data de início inválida" }),
  dataFim: z.coerce.date({ invalid_type_error: "Data de fim inválida" }).optional(),
  horaInicio: z.string().regex(horaRegex, "Hora de início inválida (HH:MM)").optional(),
  horaFim: z.string().regex(horaRegex, "Hora de fim inválida (HH:MM)").optional(),
  tipo: tipoEventoEnum,
  escopo: z.enum(["REDE", "ESCOLA"]).optional(),
  recorrente: z.boolean().optional(),
  tipoRecorrencia: z.enum(["SEMANAL", "MENSAL", "ANUAL"]).optional(),
  diaRecorrencia: z.string().optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hexadecimal (#RRGGBB)").optional(),
  reduzDiaLetivo: z.boolean().optional(),
  anoLetivoId: z.string().min(1, "Ano letivo é obrigatório"),
  escolaId: z.string().optional(),
});

export const updateEventoSchema = createEventoSchema
  .omit({ anoLetivoId: true })
  .partial();

// ==================== PHASES ====================

export const createPhaseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  monthRange: z.string().min(1, "Período é obrigatório"),
  duration: z.string().min(1, "Duração é obrigatória"),
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
  moduleIds: z.array(z.string()).optional(),
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
