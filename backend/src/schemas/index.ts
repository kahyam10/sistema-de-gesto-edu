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
  quantidadeSalas: z.number().int().min(0, "Quantidade de salas não pode ser negativa").default(0),
  ativo: z.boolean().default(true),
  etapasIds: z.array(z.string()).optional(),
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
