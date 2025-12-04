/*
  Warnings:

  - You are about to drop the column `dataFim` on the `anos_letivos` table. All the data in the column will be lost.
  - You are about to drop the column `dataInicio` on the `anos_letivos` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_anos_letivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ano" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_anos_letivos" ("ano", "ativo", "createdAt", "id", "updatedAt") SELECT "ano", "ativo", "createdAt", "id", "updatedAt" FROM "anos_letivos";
DROP TABLE "anos_letivos";
ALTER TABLE "new_anos_letivos" RENAME TO "anos_letivos";
CREATE UNIQUE INDEX "anos_letivos_ano_key" ON "anos_letivos"("ano");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivoId_idx" ON "eventos_calendario"("anoLetivoId");

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivoId_escolaId_idx" ON "eventos_calendario"("anoLetivoId", "escolaId");

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivoId_dataInicio_idx" ON "eventos_calendario"("anoLetivoId", "dataInicio");

-- CreateIndex
CREATE INDEX "eventos_calendario_dataInicio_dataFim_idx" ON "eventos_calendario"("dataInicio", "dataFim");
