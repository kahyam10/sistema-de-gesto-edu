/*
  Warnings:

  - Added the required column `updatedAt` to the `escolas_profissionais` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profissionais_educacao" ADD COLUMN "dataAdmissao" DATETIME;
ALTER TABLE "profissionais_educacao" ADD COLUMN "dataNascimento" DATETIME;
ALTER TABLE "profissionais_educacao" ADD COLUMN "escolaridade" TEXT;
ALTER TABLE "profissionais_educacao" ADD COLUMN "regimeContratacao" TEXT;

-- CreateTable
CREATE TABLE "certificacoes_profissionais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "dataEmissao" DATETIME,
    "dataValidade" DATETIME,
    "cargaHoraria" INTEGER,
    "urlCertificado" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "certificacoes_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_contratacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataEvento" DATETIME NOT NULL,
    "cargo" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "historico_contratacoes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "afastamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME,
    "motivo" TEXT,
    "observacoes" TEXT,
    "documentoPath" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "afastamentos_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_escolas_profissionais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escolaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "funcao" TEXT,
    "cargaHoraria" INTEGER,
    "dataInicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" DATETIME,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "escolas_profissionais_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "escolas_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_escolas_profissionais" ("cargaHoraria", "createdAt", "escolaId", "funcao", "id", "profissionalId", "updatedAt", "dataInicio") SELECT "cargaHoraria", "createdAt", "escolaId", "funcao", "id", "profissionalId", CURRENT_TIMESTAMP, "createdAt" FROM "escolas_profissionais";
DROP TABLE "escolas_profissionais";
ALTER TABLE "new_escolas_profissionais" RENAME TO "escolas_profissionais";
CREATE INDEX "escolas_profissionais_escolaId_idx" ON "escolas_profissionais"("escolaId");
CREATE INDEX "escolas_profissionais_profissionalId_idx" ON "escolas_profissionais"("profissionalId");
CREATE INDEX "escolas_profissionais_ativo_idx" ON "escolas_profissionais"("ativo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "historico_contratacoes_profissionalId_idx" ON "historico_contratacoes"("profissionalId");

-- CreateIndex
CREATE INDEX "afastamentos_profissionalId_idx" ON "afastamentos"("profissionalId");

-- CreateIndex
CREATE INDEX "afastamentos_dataInicio_dataFim_idx" ON "afastamentos"("dataInicio", "dataFim");
