export const gestorForm = {
  censoGestorEscolar2025: {
    identificacao: {
      identificacaoUnica: "",
      codigoEscola: "",
      cpf: "",
      nomeCompleto: "",
      dataNascimento: "",
      filiacao: {
        filiacao1: "",
        filiacao2: "",
      },
      sexo: "",
      corRaca: "",
      povoIndigena: {
        codigo: "",
        observacao:
          "Código disponível na tabela de Povo Indígena. Use 999 se não souber.",
      },
      nacionalidade: "",
      paisNacionalidade: "",
      naturalidade: {
        ufNascimento: "",
        municipioNascimento: "",
      },
      deficiencia: {
        possui: false,
        tipos: [],
      },
    },
    areaResidencial: {
      paisResidencia: "",
      cep: "",
      uf: "",
      municipio: "",
      localizacao: "",
      localizacaoDiferenciada: "",
    },
    escolaridade: {
      maiorNivelConcluido: "",
      ensinoMedio: {
        tipo: "",
        opcoes: [
          "Formação geral",
          "Modalidade normal/magistério",
          "Magistério indígena - modalidade normal",
          "Curso técnico",
        ],
      },
      cursosSuperiores: [
        {
          area: "",
          nivelGrau: "",
          opcoesNivel: [
            "Bacharelado",
            "Licenciatura",
            "Tecnológico",
            "Sequencial",
          ],
          curso: "",
          anoConclusao: "",
          tipoInstituicao: "",
          instituicao: "",
        },
      ],
      observacaoCursosSuperiores:
        "Pode ser informado até 3 (três) cursos superiores",
      posGraduacoes: [
        {
          nivel: "",
          opcoesNivel: ["Especialização", "Mestrado", "Doutorado"],
          area: "",
          anoConclusao: "",
        },
      ],
      observacaoPosGraduacoes:
        "Pode ser informado até 6 (seis) cursos de pós-graduação",
      outrosCursosEspecificos: {
        descricao: "Formação continuada com no mínimo 80 horas",
        cursos: [],
        opcoes: [
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
        ],
      },
    },
    vinculo: {
      cargo: "",
      criterioAcesso: {
        escolaPublica: [
          "Concurso público específico para o cargo de gestor(a) escolar",
          "Exclusivamente por indicação/escolha da gestão",
          "Processo seletivo qualificado e eleição com a participação da comunidade escolar",
          "Exclusivamente por processo eleitoral com a participação da comunidade escolar",
          "Processo seletivo qualificado e escolha/nomeação da gestão",
          "Outros",
        ],
        escolaPrivada: [
          "Exclusivamente por indicação/escolha da gestão",
          "Processo seletivo qualificado e escolha/nomeação da gestão",
          "Ser proprietário(a) ou sócio(a)-proprietário(a) da escola",
          "Outros",
        ],
        criterioSelecionado: "",
      },
      situacaoFuncional: "",
      opcoesSituacaoFuncional: [
        "Concursado/efetivo/estável",
        "Contrato temporário",
        "Contrato terceirizado",
        "Contrato CLT",
      ],
      email: "",
    },
    metadados: {
      dataPreenchimento: "",
      versaoFormulario: "2025",
      observacoes: {
        cpf: "Se informado o CPF, as informações serão carregadas da Receita Federal",
        codigoPovo:
          "Código disponível na tabela de Povo Indígena no Caderno de Conceitos",
        codigoArea:
          "Código da área disponível na tabela de Curso Superior no Caderno de Conceitos",
        linkDocumentacao:
          "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar/orientacoes/matricula-inicial",
      },
    },
    tiposDeficiencia: {
      opcoes: [
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
      ],
    },
    opcoesNacionalidade: [
      "Brasileira",
      "Brasileira – nascido no exterior ou naturalizado",
      "Estrangeira",
    ],
    opcoesCorRaca: [
      "Branca",
      "Preta",
      "Parda",
      "Amarela",
      "Indígena",
      "Não declarada",
    ],
    opcoesSexo: ["Masculino", "Feminino"],
    opcoesLocalizacao: ["Urbana", "Rural"],
    opcoesLocalizacaoDiferenciada: [
      "Não está em área de localização diferenciada",
      "Área de assentamento",
      "Terra indígena",
      "Comunidade quilombola",
      "Área onde se localizam povos e comunidades tradicionais",
    ],
    opcoesEscolaridade: [
      "Não concluiu o ensino fundamental",
      "Ensino fundamental",
      "Ensino médio",
      "Educação superior",
    ],
    opcoesCargo: ["Diretor(a)", "Outro cargo"],
  },
};
