// Minimização de dados na RESPOSTA (LGPD art. 6º, III) para PROFESSOR.
// O escopo (lib/escopo.ts) já limita QUAIS alunos ele vê (só das suas turmas);
// aqui se removem os CAMPOS que a docência não precisa. Ficam: identificação,
// idade, deficiência, saúde e contato de emergência (segurança em sala).
// Funciona em qualquer nível do JSON (includes aninhados).

const CAMPOS_MATRICULA_OCULTOS = [
  "cpfAluno", "rgAluno", "nisAluno", "naturalidade", "corRaca",
  "cpfResponsavel", "telefoneResponsavel", "emailResponsavel",
  "endereco", "bairro", "cidade", "estado", "cep",
  "documentosEntregues", "numeroCartaoSUS", "planoSaude",
];

const CAMPOS_PROFISSIONAL_OCULTOS = [
  "cpf", "dataNascimento", "banco", "agencia", "conta", "tipoConta", "pix", "dadosCenso",
];

const ehMatricula = (o: Record<string, unknown>) => "nomeAluno" in o && "numeroMatricula" in o;
const ehProfissional = (o: Record<string, unknown>) => "cpf" in o && "nome" in o && !("nomeAluno" in o);

export function minimizarParaProfessor<T>(valor: T, profundidade = 0): T {
  if (profundidade > 12 || valor === null || typeof valor !== "object") return valor;
  if (valor instanceof Date || Buffer.isBuffer(valor)) return valor;
  if (Array.isArray(valor)) {
    return valor.map((v) => minimizarParaProfessor(v, profundidade + 1)) as unknown as T;
  }
  const o = { ...(valor as Record<string, unknown>) };
  const ocultos = ehMatricula(o) ? CAMPOS_MATRICULA_OCULTOS : ehProfissional(o) ? CAMPOS_PROFISSIONAL_OCULTOS : [];
  for (const k of ocultos) delete o[k];
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === "object") o[k] = minimizarParaProfessor(v, profundidade + 1);
  }
  return o as T;
}
