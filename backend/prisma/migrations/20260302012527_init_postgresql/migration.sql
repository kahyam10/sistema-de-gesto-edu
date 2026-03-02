-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RESPONSAVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT,
    "profissionalId" TEXT,
    "matriculaId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etapaId" TEXT NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas_ensino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapas_ensino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escolas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "quantidadeSalas" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "possuiPatio" BOOLEAN NOT NULL DEFAULT false,
    "possuiParque" BOOLEAN NOT NULL DEFAULT false,
    "possuiQuadra" BOOLEAN NOT NULL DEFAULT false,
    "quadraCoberta" BOOLEAN NOT NULL DEFAULT false,
    "possuiBiblioteca" BOOLEAN NOT NULL DEFAULT false,
    "possuiRefeitorio" BOOLEAN NOT NULL DEFAULT false,
    "possuiSalaProfessores" BOOLEAN NOT NULL DEFAULT false,
    "possuiSecretaria" BOOLEAN NOT NULL DEFAULT false,
    "possuiDiretoria" BOOLEAN NOT NULL DEFAULT false,
    "possuiAlmoxarifado" BOOLEAN NOT NULL DEFAULT false,
    "possuiCozinha" BOOLEAN NOT NULL DEFAULT false,
    "possuiDispensa" BOOLEAN NOT NULL DEFAULT false,
    "qtdBanheirosAlunos" INTEGER NOT NULL DEFAULT 0,
    "qtdBanheirosAlunas" INTEGER NOT NULL DEFAULT 0,
    "qtdBanheirosAdaptados" INTEGER NOT NULL DEFAULT 0,
    "qtdBanheirosFuncionarios" INTEGER NOT NULL DEFAULT 0,
    "possuiInternet" BOOLEAN NOT NULL DEFAULT false,
    "tipoInternet" TEXT,
    "velocidadeInternet" TEXT,
    "possuiSalaInformatica" BOOLEAN NOT NULL DEFAULT false,
    "qtdComputadores" INTEGER NOT NULL DEFAULT 0,
    "possuiProjetores" BOOLEAN NOT NULL DEFAULT false,
    "qtdProjetores" INTEGER NOT NULL DEFAULT 0,
    "possuiRampaAcesso" BOOLEAN NOT NULL DEFAULT false,
    "possuiElevador" BOOLEAN NOT NULL DEFAULT false,
    "possuiPisoTatil" BOOLEAN NOT NULL DEFAULT false,
    "possuiSinalizacaoBraile" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 25,
    "possuiArCondicionado" BOOLEAN NOT NULL DEFAULT false,
    "possuiVentilador" BOOLEAN NOT NULL DEFAULT false,
    "possuiTV" BOOLEAN NOT NULL DEFAULT false,
    "possuiProjetor" BOOLEAN NOT NULL DEFAULT false,
    "possuiQuadro" BOOLEAN NOT NULL DEFAULT true,
    "metragem" DOUBLE PRECISION,
    "andar" INTEGER NOT NULL DEFAULT 0,
    "acessivel" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "salas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escolas_etapas" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escolas_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "capacidadeMaxima" INTEGER NOT NULL DEFAULT 25,
    "limitePCD" INTEGER NOT NULL DEFAULT 3,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "numeroMatricula" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomeAluno" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "cpfAluno" TEXT,
    "rgAluno" TEXT,
    "sexo" TEXT NOT NULL,
    "naturalidade" TEXT,
    "nacionalidade" TEXT NOT NULL DEFAULT 'Brasileira',
    "corRaca" TEXT,
    "possuiDeficiencia" BOOLEAN NOT NULL DEFAULT false,
    "tipoDeficiencia" TEXT,
    "nomeResponsavel" TEXT NOT NULL,
    "cpfResponsavel" TEXT,
    "telefoneResponsavel" TEXT,
    "emailResponsavel" TEXT,
    "parentesco" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "documentosEntregues" TEXT,
    "observacoes" TEXT,
    "fotoAluno" TEXT,
    "documentoRG" TEXT,
    "documentoCPF" TEXT,
    "comprovanteResidencia" TEXT,
    "certidaoNascimento" TEXT,
    "historicoEscolar" TEXT,
    "outrosDocumentos" TEXT,
    "tipoSanguineo" TEXT,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "condicoesSaude" TEXT,
    "planoSaude" TEXT,
    "numeroCartaoSUS" TEXT,
    "contatoEmergenciaNome" TEXT,
    "contatoEmergenciaTelefone" TEXT,
    "contatoEmergenciaParentesco" TEXT,
    "autorizacaoImagem" BOOLEAN NOT NULL DEFAULT false,
    "autorizacaoSaida" BOOLEAN NOT NULL DEFAULT false,
    "pessoasAutorizadasRetirar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "turmaId" TEXT,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais_educacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "tipo" TEXT NOT NULL,
    "formacao" TEXT,
    "especialidade" TEXT,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataNascimento" TIMESTAMP(3),
    "dataAdmissao" TIMESTAMP(3),
    "regimeContratacao" TEXT,
    "escolaridade" TEXT,
    "jornada" INTEGER,
    "banco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "tipoConta" TEXT,
    "pix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_educacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_horaria" (
    "id" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "profissionalId" TEXT,

    CONSTRAINT "grade_horaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formacoes_profissionais" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "anoConclusao" INTEGER,
    "cargaHoraria" INTEGER,
    "emAndamento" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formacoes_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificacoes_profissionais" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3),
    "cargaHoraria" INTEGER,
    "urlCertificado" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificacoes_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_contratacoes" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataEvento" TIMESTAMP(3) NOT NULL,
    "cargo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historico_contratacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afastamentos" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "motivo" TEXT,
    "observacoes" TEXT,
    "documentoPath" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "afastamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licencas" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "diasCorridos" INTEGER NOT NULL,
    "diasUteis" INTEGER,
    "motivo" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "documentoPath" TEXT,
    "aprovadaPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "justificativaRejeicao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "escolaId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "entrada" TEXT,
    "saida" TEXT,
    "entrada2" TEXT,
    "saida2" TEXT,
    "horasTrabalhadas" DOUBLE PRECISION,
    "tipoRegistro" TEXT NOT NULL DEFAULT 'NORMAL',
    "observacoes" TEXT,
    "justificativa" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escolas_profissionais" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "funcao" TEXT,
    "cargaHoraria" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escolas_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_professores" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "disciplina" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turmas_professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'GraduationCap',
    "phase" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "sub_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthRange" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "moduleIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequencias" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "justificativa" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,

    CONSTRAINT "frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anos_letivos" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anos_letivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_calendario" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "tipo" TEXT NOT NULL,
    "escopo" TEXT NOT NULL DEFAULT 'REDE',
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "tipoRecorrencia" TEXT,
    "diaRecorrencia" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#3B82F6',
    "reduzDiaLetivo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "anoLetivoId" TEXT NOT NULL,
    "escolaId" TEXT,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "cargaHorariaSemanal" INTEGER,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etapaId" TEXT NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_avaliacao" (
    "id" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "sistemaAvaliacao" TEXT NOT NULL DEFAULT 'NOTA',
    "numeroPeriodos" INTEGER NOT NULL DEFAULT 4,
    "mediaMinima" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "percentualFrequenciaMinima" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "recuperacaoParalela" BOOLEAN NOT NULL DEFAULT false,
    "recuperacaoFinal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT,
    "etapaId" TEXT,

    CONSTRAINT "configuracoes_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "valorMaximo" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "data" TIMESTAMP(3) NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "profissionalId" TEXT,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "avaliacaoId" TEXT,
    "matriculaId" TEXT NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "busca_ativa" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "responsavelId" TEXT,
    "escolaId" TEXT,
    "resultado" TEXT,
    "dataResolucao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "busca_ativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_domiciliares" (
    "id" TEXT NOT NULL,
    "buscaAtivaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT,
    "responsavel" TEXT NOT NULL,
    "situacao" TEXT NOT NULL,
    "relato" TEXT,
    "observacoes" TEXT,
    "proximaVisita" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_domiciliares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encaminhamentos_externos" (
    "id" TEXT NOT NULL,
    "buscaAtivaId" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL,
    "protocolo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENVIADO',
    "retorno" TEXT,
    "dataRetorno" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_externos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_educacionais_individualizados" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "deficiencia" TEXT NOT NULL,
    "cid" TEXT,
    "laudoMedico" BOOLEAN NOT NULL DEFAULT false,
    "laudoPath" TEXT,
    "necessitaAEE" BOOLEAN NOT NULL DEFAULT false,
    "frequenciaAEE" TEXT,
    "profissionalAEE" TEXT,
    "objetivosGerais" TEXT,
    "objetivosEspecificos" TEXT,
    "estrategias" TEXT,
    "recursos" TEXT,
    "avaliacaoDiagnostica" TEXT,
    "elaboradoPor" TEXT,
    "dataElaboracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRevisao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_educacionais_individualizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas_recursos" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 10,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "recursos" TEXT,
    "profissionais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salas_recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos_aee" (
    "id" TEXT NOT NULL,
    "peiId" TEXT NOT NULL,
    "salaRecursosId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT,
    "duracao" INTEGER,
    "objetivo" TEXT,
    "atividades" TEXT,
    "recursos" TEXT,
    "observacoes" TEXT,
    "presenca" BOOLEAN NOT NULL DEFAULT true,
    "justificativa" TEXT,
    "profissionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendimentos_aee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamentos_individualizados" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "objetivos" TEXT,
    "profissionalId" TEXT,
    "escolaId" TEXT,
    "acoes" TEXT,
    "estrategias" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "evolucoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acompanhamentos_individualizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantoes_pedagogicos" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "profissionais" TEXT,
    "turmaId" TEXT,
    "local" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantoes_pedagogicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunioes_pais" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "turmaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "duracao" INTEGER,
    "local" TEXT,
    "tipo" TEXT NOT NULL,
    "finalidade" TEXT,
    "pauta" TEXT,
    "ata" TEXT,
    "encaminhamentos" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "profissionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunioes_pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas_reunioes" (
    "id" TEXT NOT NULL,
    "reuniaoId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "parentesco" TEXT,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "horarioChegada" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presencas_reunioes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "destinatarios" TEXT NOT NULL,
    "turmaId" TEXT,
    "etapaId" TEXT,
    "anexoUrl" TEXT,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataExpiracao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT,
    "autorNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados_destinatarios" (
    "id" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "dataLeitura" TIMESTAMP(3),
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "dataConfirmacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_destinatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "canais" TEXT NOT NULL,
    "link" TEXT,
    "acaoTipo" TEXT,
    "acaoId" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "dataLeitura" TIMESTAMP(3),
    "enviadaEmail" BOOLEAN NOT NULL DEFAULT false,
    "enviadaSMS" BOOLEAN NOT NULL DEFAULT false,
    "enviadaPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "query" TEXT,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "module" TEXT,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_metrics" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "module" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "error4xxCount" INTEGER NOT NULL DEFAULT 0,
    "error5xxCount" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minDuration" INTEGER NOT NULL DEFAULT 0,
    "maxDuration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "module" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "code" TEXT,
    "path" TEXT,
    "method" TEXT,
    "userId" TEXT,
    "requestData" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uptime" INTEGER NOT NULL,
    "memoryUsage" DOUBLE PRECISION NOT NULL,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "dbConnections" INTEGER NOT NULL,
    "dbQueryTime" DOUBLE PRECISION NOT NULL,
    "requestsPerMin" INTEGER NOT NULL,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_profissionalId_key" ON "users"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "users_matriculaId_key" ON "users"("matriculaId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "escolas_codigo_key" ON "escolas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "escolas_etapas_escolaId_etapaId_key" ON "escolas_etapas"("escolaId", "etapaId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_numeroMatricula_key" ON "matriculas"("numeroMatricula");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_educacao_cpf_key" ON "profissionais_educacao"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_educacao_matricula_key" ON "profissionais_educacao"("matricula");

-- CreateIndex
CREATE INDEX "grade_horaria_turmaId_idx" ON "grade_horaria"("turmaId");

-- CreateIndex
CREATE INDEX "grade_horaria_profissionalId_idx" ON "grade_horaria"("profissionalId");

-- CreateIndex
CREATE INDEX "historico_contratacoes_profissionalId_idx" ON "historico_contratacoes"("profissionalId");

-- CreateIndex
CREATE INDEX "afastamentos_profissionalId_idx" ON "afastamentos"("profissionalId");

-- CreateIndex
CREATE INDEX "afastamentos_dataInicio_dataFim_idx" ON "afastamentos"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "licencas_profissionalId_idx" ON "licencas"("profissionalId");

-- CreateIndex
CREATE INDEX "licencas_status_idx" ON "licencas"("status");

-- CreateIndex
CREATE INDEX "licencas_dataInicio_dataFim_idx" ON "licencas"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "pontos_profissionalId_idx" ON "pontos"("profissionalId");

-- CreateIndex
CREATE INDEX "pontos_data_idx" ON "pontos"("data");

-- CreateIndex
CREATE INDEX "pontos_escolaId_idx" ON "pontos"("escolaId");

-- CreateIndex
CREATE INDEX "escolas_profissionais_escolaId_idx" ON "escolas_profissionais"("escolaId");

-- CreateIndex
CREATE INDEX "escolas_profissionais_profissionalId_idx" ON "escolas_profissionais"("profissionalId");

-- CreateIndex
CREATE INDEX "escolas_profissionais_ativo_idx" ON "escolas_profissionais"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_professores_turmaId_profissionalId_key" ON "turmas_professores"("turmaId", "profissionalId");

-- CreateIndex
CREATE INDEX "frequencias_matriculaId_idx" ON "frequencias"("matriculaId");

-- CreateIndex
CREATE INDEX "frequencias_turmaId_idx" ON "frequencias"("turmaId");

-- CreateIndex
CREATE INDEX "frequencias_data_idx" ON "frequencias"("data");

-- CreateIndex
CREATE UNIQUE INDEX "frequencias_matriculaId_turmaId_data_key" ON "frequencias"("matriculaId", "turmaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "anos_letivos_ano_key" ON "anos_letivos"("ano");

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivoId_idx" ON "eventos_calendario"("anoLetivoId");

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivoId_escolaId_idx" ON "eventos_calendario"("anoLetivoId", "escolaId");

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivoId_dataInicio_idx" ON "eventos_calendario"("anoLetivoId", "dataInicio");

-- CreateIndex
CREATE INDEX "eventos_calendario_dataInicio_dataFim_idx" ON "eventos_calendario"("dataInicio", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE INDEX "disciplinas_etapaId_idx" ON "disciplinas"("etapaId");

-- CreateIndex
CREATE INDEX "configuracoes_avaliacao_anoLetivo_idx" ON "configuracoes_avaliacao"("anoLetivo");

-- CreateIndex
CREATE INDEX "avaliacoes_turmaId_idx" ON "avaliacoes"("turmaId");

-- CreateIndex
CREATE INDEX "avaliacoes_disciplinaId_idx" ON "avaliacoes"("disciplinaId");

-- CreateIndex
CREATE INDEX "avaliacoes_turmaId_disciplinaId_bimestre_idx" ON "avaliacoes"("turmaId", "disciplinaId", "bimestre");

-- CreateIndex
CREATE INDEX "notas_matriculaId_idx" ON "notas"("matriculaId");

-- CreateIndex
CREATE INDEX "notas_avaliacaoId_idx" ON "notas"("avaliacaoId");

-- CreateIndex
CREATE INDEX "notas_turmaId_idx" ON "notas"("turmaId");

-- CreateIndex
CREATE INDEX "notas_turmaId_disciplina_idx" ON "notas"("turmaId", "disciplina");

-- CreateIndex
CREATE UNIQUE INDEX "notas_avaliacaoId_matriculaId_key" ON "notas"("avaliacaoId", "matriculaId");

-- CreateIndex
CREATE INDEX "busca_ativa_matriculaId_idx" ON "busca_ativa"("matriculaId");

-- CreateIndex
CREATE INDEX "busca_ativa_status_idx" ON "busca_ativa"("status");

-- CreateIndex
CREATE INDEX "busca_ativa_prioridade_idx" ON "busca_ativa"("prioridade");

-- CreateIndex
CREATE INDEX "busca_ativa_escolaId_idx" ON "busca_ativa"("escolaId");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_buscaAtivaId_idx" ON "visitas_domiciliares"("buscaAtivaId");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_data_idx" ON "visitas_domiciliares"("data");

-- CreateIndex
CREATE INDEX "encaminhamentos_externos_buscaAtivaId_idx" ON "encaminhamentos_externos"("buscaAtivaId");

-- CreateIndex
CREATE INDEX "encaminhamentos_externos_orgao_idx" ON "encaminhamentos_externos"("orgao");

-- CreateIndex
CREATE INDEX "encaminhamentos_externos_status_idx" ON "encaminhamentos_externos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "planos_educacionais_individualizados_matriculaId_key" ON "planos_educacionais_individualizados"("matriculaId");

-- CreateIndex
CREATE INDEX "planos_educacionais_individualizados_matriculaId_idx" ON "planos_educacionais_individualizados"("matriculaId");

-- CreateIndex
CREATE INDEX "planos_educacionais_individualizados_anoLetivo_idx" ON "planos_educacionais_individualizados"("anoLetivo");

-- CreateIndex
CREATE INDEX "planos_educacionais_individualizados_status_idx" ON "planos_educacionais_individualizados"("status");

-- CreateIndex
CREATE INDEX "salas_recursos_escolaId_idx" ON "salas_recursos"("escolaId");

-- CreateIndex
CREATE INDEX "salas_recursos_turno_idx" ON "salas_recursos"("turno");

-- CreateIndex
CREATE INDEX "atendimentos_aee_peiId_idx" ON "atendimentos_aee"("peiId");

-- CreateIndex
CREATE INDEX "atendimentos_aee_salaRecursosId_idx" ON "atendimentos_aee"("salaRecursosId");

-- CreateIndex
CREATE INDEX "atendimentos_aee_data_idx" ON "atendimentos_aee"("data");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_matriculaId_idx" ON "acompanhamentos_individualizados"("matriculaId");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_tipo_idx" ON "acompanhamentos_individualizados"("tipo");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_status_idx" ON "acompanhamentos_individualizados"("status");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_escolaId_idx" ON "acompanhamentos_individualizados"("escolaId");

-- CreateIndex
CREATE INDEX "plantoes_pedagogicos_escolaId_idx" ON "plantoes_pedagogicos"("escolaId");

-- CreateIndex
CREATE INDEX "plantoes_pedagogicos_data_idx" ON "plantoes_pedagogicos"("data");

-- CreateIndex
CREATE INDEX "plantoes_pedagogicos_turmaId_idx" ON "plantoes_pedagogicos"("turmaId");

-- CreateIndex
CREATE INDEX "reunioes_pais_escolaId_idx" ON "reunioes_pais"("escolaId");

-- CreateIndex
CREATE INDEX "reunioes_pais_turmaId_idx" ON "reunioes_pais"("turmaId");

-- CreateIndex
CREATE INDEX "reunioes_pais_data_idx" ON "reunioes_pais"("data");

-- CreateIndex
CREATE INDEX "reunioes_pais_status_idx" ON "reunioes_pais"("status");

-- CreateIndex
CREATE INDEX "presencas_reunioes_reuniaoId_idx" ON "presencas_reunioes"("reuniaoId");

-- CreateIndex
CREATE INDEX "presencas_reunioes_matriculaId_idx" ON "presencas_reunioes"("matriculaId");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_reunioes_reuniaoId_matriculaId_key" ON "presencas_reunioes"("reuniaoId", "matriculaId");

-- CreateIndex
CREATE INDEX "comunicados_escolaId_idx" ON "comunicados"("escolaId");

-- CreateIndex
CREATE INDEX "comunicados_tipo_idx" ON "comunicados"("tipo");

-- CreateIndex
CREATE INDEX "comunicados_dataPublicacao_idx" ON "comunicados"("dataPublicacao");

-- CreateIndex
CREATE INDEX "comunicados_turmaId_idx" ON "comunicados"("turmaId");

-- CreateIndex
CREATE INDEX "comunicados_etapaId_idx" ON "comunicados"("etapaId");

-- CreateIndex
CREATE INDEX "comunicados_destinatarios_comunicadoId_idx" ON "comunicados_destinatarios"("comunicadoId");

-- CreateIndex
CREATE INDEX "comunicados_destinatarios_userId_idx" ON "comunicados_destinatarios"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comunicados_destinatarios_comunicadoId_userId_key" ON "comunicados_destinatarios"("comunicadoId", "userId");

-- CreateIndex
CREATE INDEX "notificacoes_userId_idx" ON "notificacoes"("userId");

-- CreateIndex
CREATE INDEX "notificacoes_tipo_idx" ON "notificacoes"("tipo");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "notificacoes"("lida");

-- CreateIndex
CREATE INDEX "notificacoes_createdAt_idx" ON "notificacoes"("createdAt");

-- CreateIndex
CREATE INDEX "request_logs_path_idx" ON "request_logs"("path");

-- CreateIndex
CREATE INDEX "request_logs_method_idx" ON "request_logs"("method");

-- CreateIndex
CREATE INDEX "request_logs_statusCode_idx" ON "request_logs"("statusCode");

-- CreateIndex
CREATE INDEX "request_logs_timestamp_idx" ON "request_logs"("timestamp");

-- CreateIndex
CREATE INDEX "request_logs_userId_idx" ON "request_logs"("userId");

-- CreateIndex
CREATE INDEX "request_logs_module_idx" ON "request_logs"("module");

-- CreateIndex
CREATE INDEX "route_metrics_date_idx" ON "route_metrics"("date");

-- CreateIndex
CREATE INDEX "route_metrics_module_idx" ON "route_metrics"("module");

-- CreateIndex
CREATE INDEX "route_metrics_totalRequests_idx" ON "route_metrics"("totalRequests");

-- CreateIndex
CREATE UNIQUE INDEX "route_metrics_method_path_date_key" ON "route_metrics"("method", "path", "date");

-- CreateIndex
CREATE INDEX "error_logs_type_idx" ON "error_logs"("type");

-- CreateIndex
CREATE INDEX "error_logs_severity_idx" ON "error_logs"("severity");

-- CreateIndex
CREATE INDEX "error_logs_module_idx" ON "error_logs"("module");

-- CreateIndex
CREATE INDEX "error_logs_resolved_idx" ON "error_logs"("resolved");

-- CreateIndex
CREATE INDEX "error_logs_lastSeen_idx" ON "error_logs"("lastSeen");

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salas" ADD CONSTRAINT "salas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolas_etapas" ADD CONSTRAINT "escolas_etapas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolas_etapas" ADD CONSTRAINT "escolas_etapas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_horaria" ADD CONSTRAINT "grade_horaria_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_horaria" ADD CONSTRAINT "grade_horaria_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formacoes_profissionais" ADD CONSTRAINT "formacoes_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificacoes_profissionais" ADD CONSTRAINT "certificacoes_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_contratacoes" ADD CONSTRAINT "historico_contratacoes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licencas" ADD CONSTRAINT "licencas_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos" ADD CONSTRAINT "pontos_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolas_profissionais" ADD CONSTRAINT "escolas_profissionais_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolas_profissionais" ADD CONSTRAINT "escolas_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_modules" ADD CONSTRAINT "sub_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_anoLetivoId_fkey" FOREIGN KEY ("anoLetivoId") REFERENCES "anos_letivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_avaliacao" ADD CONSTRAINT "configuracoes_avaliacao_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_avaliacao" ADD CONSTRAINT "configuracoes_avaliacao_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "busca_ativa" ADD CONSTRAINT "busca_ativa_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "busca_ativa" ADD CONSTRAINT "busca_ativa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "busca_ativa" ADD CONSTRAINT "busca_ativa_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_domiciliares" ADD CONSTRAINT "visitas_domiciliares_buscaAtivaId_fkey" FOREIGN KEY ("buscaAtivaId") REFERENCES "busca_ativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encaminhamentos_externos" ADD CONSTRAINT "encaminhamentos_externos_buscaAtivaId_fkey" FOREIGN KEY ("buscaAtivaId") REFERENCES "busca_ativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_educacionais_individualizados" ADD CONSTRAINT "planos_educacionais_individualizados_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salas_recursos" ADD CONSTRAINT "salas_recursos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_aee" ADD CONSTRAINT "atendimentos_aee_peiId_fkey" FOREIGN KEY ("peiId") REFERENCES "planos_educacionais_individualizados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_aee" ADD CONSTRAINT "atendimentos_aee_salaRecursosId_fkey" FOREIGN KEY ("salaRecursosId") REFERENCES "salas_recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_aee" ADD CONSTRAINT "atendimentos_aee_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_individualizados" ADD CONSTRAINT "acompanhamentos_individualizados_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_individualizados" ADD CONSTRAINT "acompanhamentos_individualizados_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_individualizados" ADD CONSTRAINT "acompanhamentos_individualizados_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantoes_pedagogicos" ADD CONSTRAINT "plantoes_pedagogicos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantoes_pedagogicos" ADD CONSTRAINT "plantoes_pedagogicos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_pais" ADD CONSTRAINT "reunioes_pais_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_pais" ADD CONSTRAINT "reunioes_pais_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_pais" ADD CONSTRAINT "reunioes_pais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_reunioes" ADD CONSTRAINT "presencas_reunioes_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "reunioes_pais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_reunioes" ADD CONSTRAINT "presencas_reunioes_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados_destinatarios" ADD CONSTRAINT "comunicados_destinatarios_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "comunicados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
