-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "cargaHorariaSemanal" INTEGER,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "etapaId" TEXT NOT NULL,
    CONSTRAINT "disciplinas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracoes_avaliacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anoLetivo" INTEGER NOT NULL,
    "sistemaAvaliacao" TEXT NOT NULL DEFAULT 'NOTA',
    "numeroPeriodos" INTEGER NOT NULL DEFAULT 4,
    "mediaMinima" REAL NOT NULL DEFAULT 6.0,
    "percentualFrequenciaMinima" REAL NOT NULL DEFAULT 75.0,
    "recuperacaoParalela" BOOLEAN NOT NULL DEFAULT false,
    "recuperacaoFinal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "escolaId" TEXT,
    "etapaId" TEXT,
    CONSTRAINT "configuracoes_avaliacao_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "configuracoes_avaliacao_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "peso" REAL NOT NULL DEFAULT 1.0,
    "valorMaximo" REAL NOT NULL DEFAULT 10.0,
    "data" DATETIME NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "profissionalId" TEXT,
    CONSTRAINT "avaliacoes_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valor" REAL NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    CONSTRAINT "notas_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notas_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE UNIQUE INDEX "notas_avaliacaoId_matriculaId_key" ON "notas"("avaliacaoId", "matriculaId");
