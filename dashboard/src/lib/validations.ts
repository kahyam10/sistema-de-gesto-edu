import { z } from "zod";

/**
 * Mensagens de erro personalizadas em português
 */
export const errorMessages = {
  required: "Este campo é obrigatório",
  invalidEmail: "Email inválido",
  invalidCPF: "CPF inválido",
  invalidPhone: "Telefone inválido",
  invalidDate: "Data inválida",
  minLength: (min: number) => `Mínimo de ${min} caracteres`,
  maxLength: (max: number) => `Máximo de ${max} caracteres`,
  minValue: (min: number) => `Valor mínimo: ${min}`,
  maxValue: (max: number) => `Valor máximo: ${max}`,
  invalidFormat: "Formato inválido",
  passwordMismatch: "As senhas não conferem",
  futureDate: "A data não pode ser futura",
  pastDate: "A data não pode ser no passado",
};

/**
 * Validadores personalizados
 */
export const validators = {
  /**
   * Valida CPF brasileiro
   */
  cpf: (message = errorMessages.invalidCPF) =>
    z.string().refine(
      (val) => {
        const cpf = val.replace(/\D/g, "");
        if (cpf.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        // Validação dos dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(10))) return false;

        return true;
      },
      { message }
    ),

  /**
   * Valida telefone brasileiro
   */
  phone: (message = errorMessages.invalidPhone) =>
    z.string().refine(
      (val) => {
        const phone = val.replace(/\D/g, "");
        return phone.length === 10 || phone.length === 11;
      },
      { message }
    ),

  /**
   * Valida email
   */
  email: (message = errorMessages.invalidEmail) =>
    z.string().email(message),

  /**
   * Valida data no formato brasileiro (DD/MM/YYYY)
   */
  dateBR: (message = errorMessages.invalidDate) =>
    z.string().refine(
      (val) => {
        const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) return false;

        const [, day, month, year] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return (
          date.getDate() === parseInt(day) &&
          date.getMonth() === parseInt(month) - 1 &&
          date.getFullYear() === parseInt(year)
        );
      },
      { message }
    ),

  /**
   * Valida que a data não é futura
   */
  notFutureDate: (message = errorMessages.futureDate) =>
    z.date().refine((date) => date <= new Date(), { message }),

  /**
   * Valida que a data não é passada
   */
  notPastDate: (message = errorMessages.pastDate) =>
    z.date().refine((date) => date >= new Date(), { message }),
};

/**
 * Schemas de validação comuns
 */
export const commonSchemas = {
  /**
   * Nome completo (mínimo 3 caracteres)
   */
  nome: z
    .string()
    .min(3, errorMessages.minLength(3))
    .max(255, errorMessages.maxLength(255)),

  /**
   * Email
   */
  email: validators.email(),

  /**
   * CPF
   */
  cpf: validators.cpf(),

  /**
   * Telefone
   */
  telefone: validators.phone().optional(),

  /**
   * Data de nascimento (não pode ser futura)
   */
  dataNascimento: z.date().refine(
    (date) => date <= new Date() && date >= new Date("1900-01-01"),
    { message: "Data de nascimento inválida" }
  ),

  /**
   * CEP brasileiro
   */
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .optional(),

  /**
   * Senha forte (mínimo 8 caracteres, letra maiúscula, minúscula e número)
   */
  senha: z
    .string()
    .min(8, errorMessages.minLength(8))
    .regex(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Deve conter pelo menos um número"),

  /**
   * Senha simples (apenas mínimo de caracteres)
   */
  senhaSimples: z.string().min(6, errorMessages.minLength(6)),

  /**
   * URL opcional
   */
  url: z.string().url("URL inválida").optional(),

  /**
   * Observações/Notas (texto longo opcional)
   */
  observacoes: z.string().max(1000, errorMessages.maxLength(1000)).optional(),
};

/**
 * Schemas para entidades específicas do sistema
 */
export const entitySchemas = {
  /**
   * Matrícula de aluno
   */
  matricula: z.object({
    nomeAluno: commonSchemas.nome,
    dataNascimento: commonSchemas.dataNascimento,
    cpfAluno: commonSchemas.cpf.optional(),
    nomeResponsavel: commonSchemas.nome,
    cpfResponsavel: commonSchemas.cpf,
    telefoneResponsavel: commonSchemas.telefone,
    emailResponsavel: commonSchemas.email.optional(),
    escolaId: z.string().uuid("Escola inválida"),
    etapaId: z.string().uuid("Etapa inválida"),
    turmaId: z.string().uuid("Turma inválida").optional(),
    anoLetivo: z.number().min(2020).max(2050),
  }),

  /**
   * Profissional de educação
   */
  profissional: z.object({
    nome: commonSchemas.nome,
    cpf: commonSchemas.cpf,
    rg: z.string().min(5, "RG inválido").optional(),
    dataNascimento: commonSchemas.dataNascimento,
    telefone: commonSchemas.telefone,
    email: commonSchemas.email,
    tipo: z.enum(["PROFESSOR", "COORDENADOR", "DIRETOR", "AUXILIAR"]),
    matricula: z.string().min(3, "Matrícula inválida").optional(),
    formacao: z.string().min(3, "Formação inválida").optional(),
    especialidades: z.string().optional(),
  }),

  /**
   * Turma
   */
  turma: z.object({
    nome: z.string().min(1, errorMessages.required),
    turno: z.enum(["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"]),
    anoLetivo: z.number().min(2020).max(2050),
    capacidadeMaxima: z.number().min(1).max(100),
    limitePCD: z.number().min(0).max(20),
    escolaId: z.string().uuid(),
    serieId: z.string().uuid(),
  }),

  /**
   * Frequência
   */
  frequencia: z.object({
    turmaId: z.string().uuid(),
    matriculaId: z.string().uuid(),
    data: z.date(),
    presente: z.boolean(),
    justificativa: z.string().max(500).optional(),
  }),

  /**
   * Nota
   */
  nota: z.object({
    matriculaId: z.string().uuid(),
    turmaId: z.string().uuid(),
    disciplina: z.string().min(1),
    bimestre: z.number().min(1).max(4),
    valor: z.number().min(0).max(10),
    observacao: z.string().max(500).optional(),
  }),

  /**
   * Licença
   */
  licenca: z.object({
    profissionalId: z.string().uuid(),
    tipo: z.enum([
      "LICENCA_MEDICA",
      "LICENCA_MATERNIDADE",
      "LICENCA_PATERNIDADE",
      "LICENCA_PREMIO",
      "LICENCA_SEM_VENCIMENTO",
      "FERIAS",
    ]),
    dataInicio: z.date(),
    dataFim: z.date(),
    motivo: z.string().max(500).optional(),
  }).refine((data) => data.dataFim >= data.dataInicio, {
    message: "Data de fim deve ser posterior à data de início",
    path: ["dataFim"],
  }),
};

/**
 * Helper para criar schema de formulário com validações customizadas
 */
export function createFormSchema<T extends z.ZodRawShape>(
  schema: T,
  customValidations?: z.ZodEffects<z.ZodObject<T>>["_def"]["effect"]
) {
  const baseSchema = z.object(schema);

  if (customValidations) {
    return baseSchema.refine(customValidations as any);
  }

  return baseSchema;
}

/**
 * Extrai mensagens de erro do Zod para exibição
 */
export function getZodErrorMessages(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return errors;
}
