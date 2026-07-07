export const turmaForm = {
  censoTurma2025: {
    identificacao: {
      codigoEscola: "",
      nomeEscola: "",
      nomeTurma: "",
    },
    caracteristicas: {
      tipoMediacaoPedagogica: "",
      turmaEducacaoEspecial: false,
      turmaBilingueSurdos: false,
      turmaFormacaoAlternancia: false,
      localFuncionamentoDiferenciado: "",
    },
    horarioFuncionamento: {
      horarioUnificado: false,
      diasSemana: {
        domingo: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
        segunda: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
        terca: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
        quarta: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
        quinta: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
        sexta: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
        sabado: {
          ativo: false,
          horaInicial: "",
          horaFinal: "",
        },
      },
    },
    tipoTurma: {
      tipo: "",
      opcoes: [
        "Curricular (etapa de ensino)",
        "Atividade complementar",
        "Atendimento educacional especializado (AEE)",
        "Curricular (etapa de ensino) com Atividade complementar",
      ],
    },
    etapaEnsino: {
      etapa: "",
      educacaoInfantil: {
        subEtapa: "",
        opcoes: [
          "Creche (0 a 3 anos)",
          "Pré-escola (4 e 5 anos)",
          "Unificada (0 a 5 anos)",
          "Multietapa",
          "Educação infantil e ensino fundamental (9 anos)",
        ],
      },
      ensinoFundamental: {
        ano: "",
        opcoes: [
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
        ],
      },
      ensinoMedio: {
        anoSerie: "",
        opcoes: [
          "1º ano/série",
          "2º ano/série",
          "3º ano/série",
          "4º ano/série",
          "Não seriada",
        ],
      },
      ensinoMedioNormalMagisterio: {
        serie: "",
        opcoes: ["1ª série", "2ª série", "3ª série", "4ª série"],
      },
      eja: {
        etapa: "",
        opcoes: [
          "Ensino fundamental – anos iniciais",
          "Ensino fundamental – anos finais",
          "Ensino fundamental – anos iniciais e anos finais",
          "Ensino médio",
          "Curso FIC integrado na modalidade EJA – nível fundamental",
          "Curso FIC integrado na modalidade EJA – nível médio",
        ],
      },
      cursoTecnico: {
        tipo: "",
        opcoes: [
          "Curso técnico - concomitante",
          "Curso técnico - subsequente",
          "Curso técnico misto",
          "Curso FIC concomitante",
          "Curso técnico integrado na modalidade EJA",
        ],
        codigoCurso: "",
        nomeCurso: "",
      },
    },
    organizacaoCurricular: {
      ensinoMedio: {
        organizacao: [],
        opcoes: [
          "Formação geral básica (FGB)",
          "Itinerário formativo de aprofundamento (IFA)",
          "Itinerário de formação técnica e profissional (IFTP)",
        ],
      },
      itinerarioFormativo: {
        areas: [],
        opcoesAreas: [
          "Linguagens e suas tecnologias",
          "Matemática e suas tecnologias",
          "Ciências da natureza e suas tecnologias",
          "Ciências humanas e sociais aplicadas",
        ],
      },
      itinerarioTecnico: {
        tipo: "",
        opcoes: ["Curso técnico", "Qualificação profissional técnica"],
        codigoCurso: "",
        nomeCurso: "",
      },
      formasOrganizacao: [],
      opcoesFormasOrganizacao: [
        "Série/ano (séries anuais)",
        "Módulos",
        "Ciclo(s)",
        "Períodos semestrais",
        "Grupos não seriados com base na idade ou competência",
      ],
    },
    componentesCurriculares: {
      selecionados: [],
      areas: {
        linguagens: [
          {
            codigo: "6",
            descricao: "Língua/Literatura Portuguesa",
          },
          {
            codigo: "7",
            descricao: "Língua/Literatura Estrangeira – Inglês",
          },
          {
            codigo: "8",
            descricao: "Língua/Literatura Estrangeira – Espanhol",
          },
          {
            codigo: "9",
            descricao: "Língua/Literatura Estrangeira – Outra",
          },
          {
            codigo: "30",
            descricao: "Língua/Literatura Estrangeira – Francês",
          },
          {
            codigo: "23",
            descricao: "Libras",
          },
          {
            codigo: "27",
            descricao: "Língua Indígena",
          },
          {
            codigo: "31",
            descricao: "Língua Portuguesa como Segunda Língua",
          },
          {
            codigo: "10",
            descricao:
              "Arte (Educação Artística, Teatro, Dança, Música, Artes Plásticas e outras)",
          },
          {
            codigo: "11",
            descricao: "Educação Física",
          },
        ],
        matematica: [
          {
            codigo: "3",
            descricao: "Matemática",
          },
        ],
        cienciasNatureza: [
          {
            codigo: "5",
            descricao: "Ciências",
          },
          {
            codigo: "1",
            descricao: "Química",
          },
          {
            codigo: "2",
            descricao: "Física",
          },
          {
            codigo: "4",
            descricao: "Biologia",
          },
        ],
        cienciasHumanas: [
          {
            codigo: "28",
            descricao: "Estudos Sociais",
          },
          {
            codigo: "12",
            descricao: "História",
          },
          {
            codigo: "13",
            descricao: "Geografia",
          },
          {
            codigo: "14",
            descricao: "Filosofia",
          },
          {
            codigo: "29",
            descricao: "Sociologia",
          },
        ],
        outrasAreas: [
          {
            codigo: "16",
            descricao: "Informática/Computação",
          },
          {
            codigo: "17",
            descricao: "Áreas do conhecimento profissionalizantes",
          },
          {
            codigo: "25",
            descricao: "Áreas do conhecimento pedagógicas",
          },
          {
            codigo: "26",
            descricao: "Ensino religioso",
          },
          {
            codigo: "32",
            descricao: "Estágio curricular supervisionado",
          },
          {
            codigo: "33",
            descricao: "Projeto de vida",
          },
          {
            codigo: "99",
            descricao: "Outras áreas do conhecimento",
          },
        ],
      },
    },
    atividadeComplementar: {
      tipo: "",
      codigo: "",
      observacao:
        "Ver código no Caderno de Conceitos e Orientações do Censo Escolar",
    },
    metadados: {
      dataPreenchimento: "",
      versaoFormulario: "2025-preliminar",
      observacoes: "",
    },
  },
};
