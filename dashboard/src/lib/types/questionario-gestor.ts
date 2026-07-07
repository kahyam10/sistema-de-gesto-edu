// Tipos para o Questionário de Gestor Escolar - Censo Escolar 2025

export interface CursoSuperior {
  area: string;
  nivelGrau: string;
  curso: string;
  anoConclusao: string;
  tipoInstituicao: string;
  instituicao: string;
}

export interface PosGraduacao {
  nivel: string;
  area: string;
  anoConclusao: string;
}

export interface QuestionarioGestorFormData {
  // Identificação
  identificacaoUnica: string;
  codigoEscola: string;
  cpf: string;
  nomeCompleto: string;
  dataNascimento: string;
  filiacao1: string;
  filiacao2: string;
  sexo: string;
  corRaca: string;
  povoIndigena: string;
  nacionalidade: string;
  paisNacionalidade: string;
  ufNascimento: string;
  municipioNascimento: string;

  // Deficiência
  possuiDeficiencia: boolean;
  tiposDeficiencia: string[];

  // Área Residencial
  paisResidencia: string;
  cep: string;
  uf: string;
  municipio: string;
  localizacao: string;
  localizacaoDiferenciada: string;

  // Escolaridade
  maiorNivelConcluido: string;
  tipoEnsinoMedio: string;
  cursosSuperiores: CursoSuperior[];
  posGraduacoes: PosGraduacao[];
  outrosCursosEspecificos: string[];

  // Vínculo
  cargo: string;
  criterioAcesso: string;
  situacaoFuncional: string;
  email: string;
}

export const initialGestorFormData: QuestionarioGestorFormData = {
  identificacaoUnica: "",
  codigoEscola: "",
  cpf: "",
  nomeCompleto: "",
  dataNascimento: "",
  filiacao1: "",
  filiacao2: "",
  sexo: "",
  corRaca: "",
  povoIndigena: "",
  nacionalidade: "",
  paisNacionalidade: "",
  ufNascimento: "",
  municipioNascimento: "",
  possuiDeficiencia: false,
  tiposDeficiencia: [],
  paisResidencia: "",
  cep: "",
  uf: "",
  municipio: "",
  localizacao: "",
  localizacaoDiferenciada: "",
  maiorNivelConcluido: "",
  tipoEnsinoMedio: "",
  cursosSuperiores: [
    {
      area: "",
      nivelGrau: "",
      curso: "",
      anoConclusao: "",
      tipoInstituicao: "",
      instituicao: "",
    },
  ],
  posGraduacoes: [
    {
      nivel: "",
      area: "",
      anoConclusao: "",
    },
  ],
  outrosCursosEspecificos: [],
  cargo: "",
  criterioAcesso: "",
  situacaoFuncional: "",
  email: "",
};

// Opções do formulário
export const opcoesSexo = ["Masculino", "Feminino"];

export const opcoesCorRaca = [
  "Branca",
  "Preta",
  "Parda",
  "Amarela",
  "Indígena",
  "Não declarada",
];

export const opcoesNacionalidade = [
  "Brasileira",
  "Brasileira – nascido no exterior ou naturalizado",
  "Estrangeira",
];

export const opcoesLocalizacao = ["Urbana", "Rural"];

export const opcoesLocalizacaoDiferenciada = [
  "Não está em área de localização diferenciada",
  "Área de assentamento",
  "Terra indígena",
  "Comunidade quilombola",
  "Área onde se localizam povos e comunidades tradicionais",
];

export const opcoesEscolaridade = [
  "Não concluiu o ensino fundamental",
  "Ensino fundamental",
  "Ensino médio",
  "Educação superior",
];

export const opcoesEnsinoMedio = [
  "Formação geral",
  "Modalidade normal/magistério",
  "Magistério indígena - modalidade normal",
  "Curso técnico",
];

export const opcoesNivelSuperior = [
  "Bacharelado",
  "Licenciatura",
  "Tecnológico",
  "Sequencial",
];

export const opcoesNivelPosGraduacao = [
  "Especialização",
  "Mestrado",
  "Doutorado",
];

export const opcoesTipoInstituicao = ["Pública", "Privada"];

export const opcoesCargo = ["Diretor(a)", "Outro cargo"];

export const opcoesCriterioAcessoPublica = [
  "Concurso público específico para o cargo de gestor(a) escolar",
  "Exclusivamente por indicação/escolha da gestão",
  "Processo seletivo qualificado e eleição com a participação da comunidade escolar",
  "Exclusivamente por processo eleitoral com a participação da comunidade escolar",
  "Processo seletivo qualificado e escolha/nomeação da gestão",
  "Outros",
];

export const opcoesCriterioAcessoPrivada = [
  "Exclusivamente por indicação/escolha da gestão",
  "Processo seletivo qualificado e escolha/nomeação da gestão",
  "Ser proprietário(a) ou sócio(a)-proprietário(a) da escola",
  "Outros",
];

export const opcoesSituacaoFuncional = [
  "Concursado/efetivo/estável",
  "Contrato temporário",
  "Contrato terceirizado",
  "Contrato CLT",
];

export const tiposDeficiencia = [
  "Cegueira",
  "Baixa visão",
  "Visão monocular",
  "Surdez",
  "Deficiência auditiva",
  "Surdocegueira",
  "Deficiência física",
  "Deficiência intelectual",
  "Deficiência múltipla",
  "Transtorno do espectro autista",
  "Altas habilidades ou superdotação",
];

export const opcoesCursosEspecificos = [
  "Creche (0 a 3 anos)",
  "Pré-escola (4 e 5 anos)",
  "Anos iniciais do ensino fundamental",
  "Anos finais do ensino fundamental",
  "Ensino médio",
  "Educação de jovens e adultos",
  "Educação especial",
  "Educação indígena",
  "Educação do campo",
  "Educação ambiental",
  "Educação em direitos humanos",
  "Educação para as relações étnico-raciais e história e cultura afro-brasileira e africana",
  "Educação bilíngue de surdos",
  "Direitos da criança e do adolescente",
  "Gênero e diversidade sexual",
  "Gestão escolar",
  "Educação e Tecnologia de Informação e Comunicação (TIC)",
  "Outros",
  "Nenhum",
];

export const ufs = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];
