-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "escolaId" TEXT,
    CONSTRAINT "users_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "etapaId" TEXT NOT NULL,
    CONSTRAINT "series_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "etapas_ensino" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "escolas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "escolas_etapas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escolaId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "escolas_etapas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "escolas_etapas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "capacidadeMaxima" INTEGER NOT NULL DEFAULT 25,
    "limitePCD" INTEGER NOT NULL DEFAULT 3,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "escolaId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    CONSTRAINT "turmas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "turmas_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroMatricula" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "dataMatricula" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomeAluno" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "escolaId" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "turmaId" TEXT,
    CONSTRAINT "matriculas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matriculas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matriculas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "profissionais_educacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "tipo" TEXT NOT NULL,
    "formacao" TEXT,
    "especialidade" TEXT,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "escolas_profissionais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escolaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "funcao" TEXT,
    "cargaHoraria" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "escolas_profissionais_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "escolas_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "turmas_professores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turmaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "disciplina" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "turmas_professores_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "turmas_professores_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'GraduationCap',
    "phase" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sub_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "moduleId" TEXT NOT NULL,
    CONSTRAINT "sub_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthRange" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "moduleIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

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
CREATE UNIQUE INDEX "escolas_profissionais_escolaId_profissionalId_key" ON "escolas_profissionais"("escolaId", "profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_professores_turmaId_profissionalId_key" ON "turmas_professores"("turmaId", "profissionalId");
