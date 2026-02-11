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
  etapaId: z.string().min(1, "Etapa é obrigatória"),
});

export const updateSerieSchema = createSerieSchema.partial();

// ==================== ETAPA DE ENSINO ====================

export const createEtapaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  ordem: z.number().int().positive("Ordem deve ser um número positivo"),
});

export const updateEtapaSchema = createEtapaSchema.partial();

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

// ==================== GRADE HORÁRIA ====================

export const createGradeHorarioSchema = z.object({
  turmaId: z.string().min(1, "Turma é obrigatória"),
  diaSemana: z.enum([
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
  ]),
  horaInicio: z.string().min(1, "Hora inicial é obrigatória"),
  horaFim: z.string().min(1, "Hora final é obrigatória"),
  disciplina: z.string().min(1, "Disciplina é obrigatória"),
  profissionalId: z.string().optional(),
  observacoes: z.string().optional(),
});

export const updateGradeHorarioSchema = createGradeHorarioSchema.partial();

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

// ==================== FREQUÊNCIA ====================

export const createFrequenciaSchema = z.object({
  matriculaId: z.string().min(1, "Matrícula é obrigatória"),
  turmaId: z.string().min(1, "Turma é obrigatória"),
  data: z.string().transform((val) => new Date(val)),
  status: z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]),
  justificativa: z.string().optional(),
  observacao: z.string().optional(),
});

export const updateFrequenciaSchema = z.object({
  status: z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]).optional(),
  justificativa: z.string().optional(),
  observacao: z.string().optional(),
});

export const registrarFrequenciaTurmaSchema = z.object({
  turmaId: z.string().min(1, "Turma é obrigatória"),
  data: z.string().transform((val) => new Date(val)),
  presencas: z.array(
    z.object({
      matriculaId: z.string().min(1, "Matrícula é obrigatória"),
      status: z.enum(["PRESENTE", "FALTA", "JUSTIFICADA"]),
      justificativa: z.string().optional(),
      observacao: z.string().optional(),
    })
  ),
});

// ==================== DISCIPLINA ====================

export const createDisciplinaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().min(1, "Código é obrigatório").max(20),
  descricao: z.string().optional(),
  cargaHorariaSemanal: z.number().int().min(0).optional(),
  obrigatoria: z.boolean().default(true),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0),
  etapaId: z.string().min(1, "Etapa é obrigatória"),
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
  escolaId: z.string().optional(),
  etapaId: z.string().optional(),
});

export const updateConfiguracaoAvaliacaoSchema =
  createConfiguracaoAvaliacaoSchema.partial();

// ==================== AVALIAÇÃO ====================

export const createAvaliacaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum([
    "PROVA",
    "TRABALHO",
    "ATIVIDADE",
    "PARTICIPACAO",
    "RECUPERACAO",
  ]),
  peso: z.number().min(0).default(1.0),
  valorMaximo: z.number().min(0).default(10.0),
  data: z.string().transform((val) => new Date(val)),
  bimestre: z.number().int().min(1).max(4),
  observacao: z.string().optional(),
  turmaId: z.string().min(1, "Turma é obrigatória"),
  disciplinaId: z.string().min(1, "Disciplina é obrigatória"),
  profissionalId: z.string().optional(),
});

export const updateAvaliacaoSchema = z.object({
  nome: z.string().min(1).optional(),
  tipo: z
    .enum(["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"])
    .optional(),
  peso: z.number().min(0).optional(),
  valorMaximo: z.number().min(0).optional(),
  data: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  bimestre: z.number().int().min(1).max(4).optional(),
  observacao: z.string().optional(),
  profissionalId: z.string().optional(),
});

// ==================== NOTA ====================

export const createNotaSchema = z.object({
  valor: z.number().min(0),
  observacao: z.string().optional(),
  avaliacaoId: z.string().min(1, "Avaliação é obrigatória"),
  matriculaId: z.string().min(1, "Matrícula é obrigatória"),
});

export const updateNotaSchema = z.object({
  valor: z.number().min(0).optional(),
  observacao: z.string().optional(),
});

export const lancarNotasTurmaSchema = z.object({
  avaliacaoId: z.string().min(1, "Avaliação é obrigatória"),
  notas: z.array(
    z.object({
      matriculaId: z.string().min(1, "Matrícula é obrigatória"),
      valor: z.number().min(0),
      observacao: z.string().optional(),
    })
  ),
});

// ==================== PAGINAÇÃO ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ==================== TIPOS EXPORTADOS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSerieInput = z.infer<typeof createSerieSchema>;
export type UpdateSerieInput = z.infer<typeof updateSerieSchema>;
export type CreateEtapaInput = z.infer<typeof createEtapaSchema>;
export type UpdateEtapaInput = z.infer<typeof updateEtapaSchema>;
export type CreateEscolaInput = z.infer<typeof createEscolaSchema>;
export type UpdateEscolaInput = z.infer<typeof updateEscolaSchema>;
export type CreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
export type CreateMatriculaInput = z.infer<typeof createMatriculaSchema>;
export type UpdateMatriculaInput = z.infer<typeof updateMatriculaSchema>;
export type CreateProfissionalInput = z.infer<typeof createProfissionalSchema>;
export type UpdateProfissionalInput = z.infer<typeof updateProfissionalSchema>;
export type CreateGradeHorarioInput = z.infer<typeof createGradeHorarioSchema>;
export type UpdateGradeHorarioInput = z.infer<typeof updateGradeHorarioSchema>;
export type CreateFrequenciaInput = z.infer<typeof createFrequenciaSchema>;
export type UpdateFrequenciaInput = z.infer<typeof updateFrequenciaSchema>;
export type RegistrarFrequenciaTurmaInput = z.infer<typeof registrarFrequenciaTurmaSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateDisciplinaInput = z.infer<typeof createDisciplinaSchema>;
export type UpdateDisciplinaInput = z.infer<typeof updateDisciplinaSchema>;
export type CreateConfiguracaoAvaliacaoInput = z.infer<
  typeof createConfiguracaoAvaliacaoSchema
>;
export type UpdateConfiguracaoAvaliacaoInput = z.infer<
  typeof updateConfiguracaoAvaliacaoSchema
>;
export type CreateAvaliacaoInput = z.infer<typeof createAvaliacaoSchema>;
export type UpdateAvaliacaoInput = z.infer<typeof updateAvaliacaoSchema>;
export type CreateNotaInput = z.infer<typeof createNotaSchema>;
export type UpdateNotaInput = z.infer<typeof updateNotaSchema>;
export type LancarNotasTurmaInput = z.infer<typeof lancarNotasTurmaSchema>;
