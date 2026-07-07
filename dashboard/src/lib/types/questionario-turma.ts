// Tipos para o Questionário de Turma - Censo Escolar 2025

export interface DiaSemana {
  ativo: boolean;
  horaInicial: string;
  horaFinal: string;
}

export interface DiasSemana {
  domingo: DiaSemana;
  segunda: DiaSemana;
  terca: DiaSemana;
  quarta: DiaSemana;
  quinta: DiaSemana;
  sexta: DiaSemana;
  sabado: DiaSemana;
}

export interface QuestionarioTurmaFormData {
  // Identificação
  codigoEscola: string;
  nomeEscola: string;
  nomeTurma: string;

  // Características
  tipoMediacaoPedagogica: string;
  turmaEducacaoEspecial: "Sim" | "Não" | "";
  turmaBilingueSurdos: "Sim" | "Não" | "";
  turmaFormacaoAlternancia: "Sim" | "Não" | "";
  localFuncionamentoDiferenciado: string;

  // Horários
  horarioUnificado: "Sim" | "Não" | "";
  diasSemana: DiasSemana;

  // Tipo de Turma e Etapas
  tipoTurma: string;
  etapaEnsino: string;
  subEtapaEducacaoInfantil: string;
  anoSerieEnsFundamental: string;
  anoSerieEnsMedio: string;
  anoSerieNormalMagisterio: string;
  etapaEJA: string;
  tipoAtividadeComplementar: string;
  codigoAtividadeComplementar: string;

  // Organização Curricular
  organizacaoCurricular: string[];
  areasItinerarioFormativo: string[];
  tipoItinerarioTecnico: string;
  codigoCurso: string;
  nomeCurso: string;
  formasOrganizacao: string[];

  // Componentes Curriculares
  componentesCurriculares: string[];
}

export const initialTurmaFormData: QuestionarioTurmaFormData = {
  codigoEscola: "",
  nomeEscola: "",
  nomeTurma: "",
  tipoMediacaoPedagogica: "",
  turmaEducacaoEspecial: "",
  turmaBilingueSurdos: "",
  turmaFormacaoAlternancia: "",
  localFuncionamentoDiferenciado: "",
  horarioUnificado: "",
  diasSemana: {
    domingo: { ativo: false, horaInicial: "", horaFinal: "" },
    segunda: { ativo: false, horaInicial: "", horaFinal: "" },
    terca: { ativo: false, horaInicial: "", horaFinal: "" },
    quarta: { ativo: false, horaInicial: "", horaFinal: "" },
    quinta: { ativo: false, horaInicial: "", horaFinal: "" },
    sexta: { ativo: false, horaInicial: "", horaFinal: "" },
    sabado: { ativo: false, horaInicial: "", horaFinal: "" },
  },
  tipoTurma: "",
  etapaEnsino: "",
  subEtapaEducacaoInfantil: "",
  anoSerieEnsFundamental: "",
  anoSerieEnsMedio: "",
  anoSerieNormalMagisterio: "",
  etapaEJA: "",
  tipoAtividadeComplementar: "",
  codigoAtividadeComplementar: "",
  organizacaoCurricular: [],
  areasItinerarioFormativo: [],
  tipoItinerarioTecnico: "",
  codigoCurso: "",
  nomeCurso: "",
  formasOrganizacao: [],
  componentesCurriculares: [],
};

// Opções de formulário
export const opcoesTipoMediacao = [
  "Presencial",
  "Semipresencial",
  "Educação a distância – EAD",
];

export const opcoesLocalFuncionamentoDiferenciado = [
  "A turma não está em local de funcionamento diferenciado",
  "Unidade de atendimento socioeducativo",
  "Unidade prisional",
  "Sala anexa",
];

export const opcoesTipoTurma = [
  "Curricular (etapa de ensino)",
  "Atividade complementar",
  "Atendimento educacional especializado (AEE)",
  "Curricular (etapa de ensino) com Atividade complementar",
];

export const opcoesEtapaEnsino = [
  { value: "educacao-infantil", label: "Educação infantil" },
  { value: "ensino-fundamental", label: "Ensino fundamental" },
  { value: "multi-correcao", label: "Multi e correção de fluxo" },
  { value: "ensino-medio", label: "Ensino Médio" },
  { value: "ensino-medio-normal", label: "Ensino Médio - Normal/Magistério" },
  { value: "eja", label: "Educação de Jovens e Adultos (EJA)" },
  {
    value: "curso-tecnico",
    label: "Curso Técnico e FIC - Concomitante ou Subsequente",
  },
];

export const opcoesEducacaoInfantil = [
  "Creche (0 a 3 anos)",
  "Pré-escola (4 e 5 anos)",
  "Unificada (0 a 5 anos)",
  "Multietapa",
  "Educação infantil e ensino fundamental (9 anos)",
];

export const opcoesEnsinoFundamental = [
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
  "5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
  "Multi",
  "Correção de fluxo",
];

export const opcoesEnsinoMedio = [
  "1º ano/série",
  "2º ano/série",
  "3º ano/série",
  "4º ano/série",
  "Não seriada",
];

export const opcoesNormalMagisterio = [
  "1ª série",
  "2ª série",
  "3ª série",
  "4ª série",
];

export const opcoesEJA = [
  "Ensino fundamental – anos iniciais",
  "Ensino fundamental – anos finais",
  "Ensino fundamental – anos iniciais e anos finais",
  "Ensino médio",
  "Curso FIC integrado na modalidade EJA – nível fundamental",
  "Curso FIC integrado na modalidade EJA – nível médio",
];

export const opcoesCursoTecnico = [
  "Curso técnico - concomitante",
  "Curso técnico - subsequente",
  "Curso técnico misto",
  "Curso FIC concomitante",
  "Curso técnico integrado na modalidade EJA",
];

export const opcoesOrganizacaoCurricular = [
  "Formação geral básica (FGB)",
  "Itinerário formativo de aprofundamento (IFA)",
  "Itinerário de formação técnica e profissional (IFTP)",
];

export const opcoesAreasItinerario = [
  "Linguagens e suas tecnologias",
  "Matemática e suas tecnologias",
  "Ciências da natureza e suas tecnologias",
  "Ciências humanas e sociais aplicadas",
];

export const opcoesTipoItinerarioTecnico = [
  "Curso técnico",
  "Qualificação profissional técnica",
];

export const opcoesFormasOrganizacao = [
  "Série/ano (séries anuais)",
  "Módulos",
  "Ciclo(s)",
  "Períodos semestrais",
  "Grupos não seriados com base na idade ou competência",
];

export const diasSemanaConfig = [
  { key: "domingo" as const, label: "Domingo" },
  { key: "segunda" as const, label: "Segunda-feira" },
  { key: "terca" as const, label: "Terça-feira" },
  { key: "quarta" as const, label: "Quarta-feira" },
  { key: "quinta" as const, label: "Quinta-feira" },
  { key: "sexta" as const, label: "Sexta-feira" },
  { key: "sabado" as const, label: "Sábado" },
];

export const componentesCurricularesOpcoes = [
  {
    categoria: "Linguagens",
    opcoes: [
      { codigo: "6", descricao: "Língua/Literatura Portuguesa" },
      { codigo: "7", descricao: "Língua/Literatura Estrangeira – Inglês" },
      { codigo: "8", descricao: "Língua/Literatura Estrangeira – Espanhol" },
      { codigo: "9", descricao: "Língua/Literatura Estrangeira – Outra" },
      { codigo: "30", descricao: "Língua/Literatura Estrangeira – Francês" },
      { codigo: "23", descricao: "Libras" },
      { codigo: "27", descricao: "Língua Indígena" },
      { codigo: "31", descricao: "Língua Portuguesa como Segunda Língua" },
      {
        codigo: "10",
        descricao:
          "Arte (Educação Artística, Teatro, Dança, Música, Artes Plásticas e outras)",
      },
      { codigo: "11", descricao: "Educação Física" },
    ],
  },
  {
    categoria: "Matemática",
    opcoes: [{ codigo: "3", descricao: "Matemática" }],
  },
  {
    categoria: "Ciências da Natureza",
    opcoes: [
      { codigo: "5", descricao: "Ciências" },
      { codigo: "1", descricao: "Química" },
      { codigo: "2", descricao: "Física" },
      { codigo: "4", descricao: "Biologia" },
    ],
  },
  {
    categoria: "Ciências Humanas e Sociais",
    opcoes: [
      { codigo: "28", descricao: "Estudos Sociais" },
      { codigo: "12", descricao: "História" },
      { codigo: "13", descricao: "Geografia" },
      { codigo: "14", descricao: "Filosofia" },
      { codigo: "29", descricao: "Sociologia" },
    ],
  },
  {
    categoria: "Outras Áreas",
    opcoes: [
      { codigo: "16", descricao: "Informática/Computação" },
      { codigo: "17", descricao: "Áreas do conhecimento profissionalizantes" },
      { codigo: "25", descricao: "Áreas do conhecimento pedagógicas" },
      { codigo: "26", descricao: "Ensino religioso" },
      { codigo: "32", descricao: "Estágio curricular supervisionado" },
      { codigo: "33", descricao: "Projeto de vida" },
      { codigo: "99", descricao: "Outras áreas do conhecimento" },
    ],
  },
];
