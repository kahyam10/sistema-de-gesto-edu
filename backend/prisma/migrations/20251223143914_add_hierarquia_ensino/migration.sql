/*
  Warnings:

  - You are about to drop the column `etapaId` on the `series` table. All the data in the column will be lost.
  - Added the required column `tipoEducacaoId` to the `etapas_ensino` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nivelId` to the `series` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "tipos_educacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "niveis_ensino" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "etapaId" TEXT NOT NULL,
    CONSTRAINT "niveis_ensino_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_etapas_ensino" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tipoEducacaoId" TEXT NOT NULL,
    CONSTRAINT "etapas_ensino_tipoEducacaoId_fkey" FOREIGN KEY ("tipoEducacaoId") REFERENCES "tipos_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_etapas_ensino" ("createdAt", "descricao", "id", "nome", "ordem", "updatedAt") SELECT "createdAt", "descricao", "id", "nome", "ordem", "updatedAt" FROM "etapas_ensino";
DROP TABLE "etapas_ensino";
ALTER TABLE "new_etapas_ensino" RENAME TO "etapas_ensino";
CREATE TABLE "new_series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "nivelId" TEXT NOT NULL,
    CONSTRAINT "series_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "niveis_ensino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_series" ("createdAt", "id", "nome", "ordem", "updatedAt") SELECT "createdAt", "id", "nome", "ordem", "updatedAt" FROM "series";
DROP TABLE "series";
ALTER TABLE "new_series" RENAME TO "series";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "tipos_educacao_nome_key" ON "tipos_educacao"("nome");
