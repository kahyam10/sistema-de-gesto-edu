// Tipos para o Questionário de Escola - Censo Escolar 2025

export interface QuestionarioEscolaFormData {
  // Identificação
  codigoEscola: string;
  nomeEscola: string;

  // Vinculação Institucional
  dependenciaAdministrativa:
    | "Federal"
    | "Estadual"
    | "Municipal"
    | "Privada"
    | "";
  orgaoVinculacao: string;
  orgaoRegional: string;
  regulamentacao: "Sim" | "Em tramitação" | "Não" | "";
  esferaRegulamentacao: string[];
  entidadeSuperior: string[];

  // Convênio
  parceriaConvenio: "Sim" | "Não" | "";
  poderPublicoParceria: string;
  formaContratacaoEstadual: string[];
  formaContratacaoMunicipal: string[];

  // Funcionamento
  situacaoFuncionamento: "Em atividade" | "Paralisada" | "Extinta" | "";
  inicioAnoLetivo: string;
  terminoAnoLetivo: string;

  // Endereço
  localizacao: "Urbana" | "Rural" | "";
  cep: string;
  uf: string;
  municipio: string;
  regiaoAdministrativa: string;
  distrito: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  ddd: string;
  telefone: string;
  outroTelefone: string;
  email: string;
  localizacaoDiferenciada: string;

  // Vinculação
  unidadeVinculada: string;
  codigoEscolaSede: string;
  codigoIES: string;

  // Escola Privada
  categoriaEscolaPrivada: string;
  mantenedoraPrivada: string[];
  cnpjMantenedora: string;
  cnpjEscola: string;

  // Estrutura Física
  localFuncionamento: string;
  formaOcupacao: string;
  compartilhaPredio: "Sim" | "Não" | "";
  codigoEscolaCompartilhada: string;

  // Infraestrutura
  aguaPotavel: "Sim" | "Não" | "";
  abastecimentoAgua: string[];
  fonteEnergia: string[];
  esgotamento: string[];
  destinacaoLixo: string[];
  tratamentoLixo: string[];

  // Dependências Físicas
  dependenciasFisicas: string[];
  recursosAcessibilidade: string[];

  // Salas
  salasAulaDentro: string;
  salasAulaFora: string;
  salasClimatizadas: string;
  salasAcessibilidade: string;
  salasCantinoLeitura: string;

  // Equipamentos
  equipamentosAdministrativos: string[];
  equipamentosEnsinoAprendizagem: string[];
  computadoresDesktop: string;
  computadoresPortateis: string;
  tablets: string;

  // Tecnologia
  redeLocal: string[];
  acessoInternet: string[];
  dispositivosAcessoInternet: string[];
  internetBandaLarga: "Sim" | "Não" | "";

  // Recursos Humanos
  profissionais: Record<string, string>;

  // Organização Escolar
  alimentacaoEscolar: "Oferece" | "Não oferece" | "";
  escolaIndigena: "Sim" | "Não" | "";
  linguaEnsino: string[];
  codigoLinguaIndigena: string[];
  instrumentosMateriais: string[];
  educacaoAmbiental: "Sim" | "Não" | "";
  formasEducacaoAmbiental: string[];
  pppAtualizado: string;
  orgaosColegiados: string[];
  compartilhaEspacos: "Sim" | "Não" | "";
  usaEspacosEntorno: "Sim" | "Não" | "";
  siteBlogRedes: "Sim" | "Não" | "";
  exameSelecao: "Sim" | "Não" | "";
  reservaVagas: string[];
}

export const initialFormData: QuestionarioEscolaFormData = {
  codigoEscola: "",
  nomeEscola: "",
  dependenciaAdministrativa: "",
  orgaoVinculacao: "",
  orgaoRegional: "",
  regulamentacao: "",
  esferaRegulamentacao: [],
  entidadeSuperior: [],
  parceriaConvenio: "",
  poderPublicoParceria: "",
  formaContratacaoEstadual: [],
  formaContratacaoMunicipal: [],
  situacaoFuncionamento: "",
  inicioAnoLetivo: "",
  terminoAnoLetivo: "",
  localizacao: "",
  cep: "",
  uf: "",
  municipio: "",
  regiaoAdministrativa: "",
  distrito: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  ddd: "",
  telefone: "",
  outroTelefone: "",
  email: "",
  localizacaoDiferenciada: "",
  unidadeVinculada: "",
  codigoEscolaSede: "",
  codigoIES: "",
  categoriaEscolaPrivada: "",
  mantenedoraPrivada: [],
  cnpjMantenedora: "",
  cnpjEscola: "",
  localFuncionamento: "",
  formaOcupacao: "",
  compartilhaPredio: "",
  codigoEscolaCompartilhada: "",
  aguaPotavel: "",
  abastecimentoAgua: [],
  fonteEnergia: [],
  esgotamento: [],
  destinacaoLixo: [],
  tratamentoLixo: [],
  dependenciasFisicas: [],
  recursosAcessibilidade: [],
  salasAulaDentro: "",
  salasAulaFora: "",
  salasClimatizadas: "",
  salasAcessibilidade: "",
  salasCantinoLeitura: "",
  equipamentosAdministrativos: [],
  equipamentosEnsinoAprendizagem: [],
  computadoresDesktop: "",
  computadoresPortateis: "",
  tablets: "",
  redeLocal: [],
  acessoInternet: [],
  dispositivosAcessoInternet: [],
  internetBandaLarga: "",
  profissionais: {},
  alimentacaoEscolar: "",
  escolaIndigena: "",
  linguaEnsino: [],
  codigoLinguaIndigena: ["", "", ""],
  instrumentosMateriais: [],
  educacaoAmbiental: "",
  formasEducacaoAmbiental: [],
  pppAtualizado: "",
  orgaosColegiados: [],
  compartilhaEspacos: "",
  usaEspacosEntorno: "",
  siteBlogRedes: "",
  exameSelecao: "",
  reservaVagas: [],
};

// Opções de formulário
export const opcoesDependenciasFisicas = {
  administracao: [
    "Sala de diretoria",
    "Sala de professores",
    "Sala de secretaria",
    "Almoxarifado",
  ],
  alimentacao: ["Cozinha", "Refeitório", "Despensa"],
  banheiros: [
    "Banheiro",
    "Banheiro acessível (PCD)",
    "Banheiro exclusivo para funcionários",
    "Banheiro adequado à educação infantil",
    "Banheiro ou vestiário com chuveiro",
  ],
  acomodacao: [
    "Dormitório de aluno(a)",
    "Dormitório de professor(a)",
    "Sala de repouso para aluno(a)",
  ],
  aprendizagem: [
    "Biblioteca",
    "Sala de leitura",
    "Laboratório de informática",
    "Laboratório de ciências",
    "Laboratório específico para educação profissional",
    "Sala de oficina da educação profissional",
    "Sala de recursos multifuncionais (AEE)",
    "Auditório",
    "Sala multiuso (música, dança e artes)",
    "Sala de música/coral",
    "Sala/estúdio de dança",
    "Sala/ateliê de artes",
    "Estúdio de gravação e edição",
  ],
  esportesRecreacao: [
    "Parque infantil",
    "Pátio coberto",
    "Pátio descoberto",
    "Piscina",
    "Quadra de esportes coberta",
    "Quadra de esportes descoberta",
    "Terreirão",
  ],
  meioAmbiente: [
    "Área de horta, plantio e/ou produção agrícola",
    "Área de vegetação ou gramado",
    "Viveiro/criação de animais",
  ],
};

export const opcoesRecursosAcessibilidade = [
  "Rampas",
  "Elevador",
  "Pisos táteis",
  "Portas com vão livre de no mínimo 80 cm",
  "Corrimão e guarda-corpos",
  "Sinalização/alarme luminoso",
  "Sinalização sonora",
  "Sinalização tátil",
  "Sinalização visual (piso/paredes)",
  "Nenhum dos recursos listados",
];

export const opcoesProfissionais = [
  "Secretário(a) escolar",
  "Auxiliares de secretaria",
  "Auxiliar de serviços gerais",
  "Bibliotecário(a)",
  "Profissionais de apoio pedagógico",
  "Segurança",
  "Técnicos de laboratório",
  "Psicólogo(a) escolar",
  "Fonoaudiólogo(a)",
  "Profissionais de alimentação",
  "Coordenador(a) de turno",
  "Nutricionista",
  "Orientador(a) comunitário",
  "Vice-diretor(a)",
  "Tradutor(a) e Intérprete de Libras",
  "Agrônomos(as)",
  "Revisor(a) de texto Braille",
  "Bombeiro(a) brigadista",
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
