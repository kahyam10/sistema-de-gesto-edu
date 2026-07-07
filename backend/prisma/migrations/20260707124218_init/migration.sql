-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_educacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_educacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas_ensino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipoEducacaoId" TEXT NOT NULL,

    CONSTRAINT "etapas_ensino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveis_ensino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etapaId" TEXT NOT NULL,

    CONSTRAINT "niveis_ensino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nivelId" TEXT NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
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
    "dadosCenso" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diretorId" TEXT,
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
    "dadosCenso" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "turmaId" TEXT,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_matricula" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "escolaOrigemId" TEXT NOT NULL,
    "escolaDestinoId" TEXT NOT NULL,
    "turmaOrigemId" TEXT,
    "turmaDestinoId" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencias_matricula_pkey" PRIMARY KEY ("id")
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
    "dadosCenso" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_educacao_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "escolas_profissionais" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "funcao" TEXT,
    "cargaHoraria" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_educacao_nome_key" ON "tipos_educacao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "escolas_codigo_key" ON "escolas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "escolas_etapas_escolaId_etapaId_key" ON "escolas_etapas"("escolaId", "etapaId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_numeroMatricula_key" ON "matriculas"("numeroMatricula");

-- CreateIndex
CREATE INDEX "transferencias_matricula_matriculaId_idx" ON "transferencias_matricula"("matriculaId");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_educacao_cpf_key" ON "profissionais_educacao"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_educacao_matricula_key" ON "profissionais_educacao"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "escolas_profissionais_escolaId_profissionalId_key" ON "escolas_profissionais"("escolaId", "profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_professores_turmaId_profissionalId_key" ON "turmas_professores"("turmaId", "profissionalId");

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

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas_ensino" ADD CONSTRAINT "etapas_ensino_tipoEducacaoId_fkey" FOREIGN KEY ("tipoEducacaoId") REFERENCES "tipos_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niveis_ensino" ADD CONSTRAINT "niveis_ensino_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "niveis_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_diretorId_fkey" FOREIGN KEY ("diretorId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "transferencias_matricula" ADD CONSTRAINT "transferencias_matricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formacoes_profissionais" ADD CONSTRAINT "formacoes_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_anoLetivoId_fkey" FOREIGN KEY ("anoLetivoId") REFERENCES "anos_letivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
