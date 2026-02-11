/*
  Warnings:

  - Added the required column `bimestre` to the `notas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disciplina` to the `notas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turmaId` to the `notas` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valor" REAL NOT NULL,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "avaliacaoId" TEXT,
    "matriculaId" TEXT NOT NULL,
    CONSTRAINT "notas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notas_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notas_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notas" ("avaliacaoId", "createdAt", "id", "matriculaId", "observacao", "updatedAt", "valor") SELECT "avaliacaoId", "createdAt", "id", "matriculaId", "observacao", "updatedAt", "valor" FROM "notas";
DROP TABLE "notas";
ALTER TABLE "new_notas" RENAME TO "notas";
CREATE INDEX "notas_matriculaId_idx" ON "notas"("matriculaId");
CREATE INDEX "notas_avaliacaoId_idx" ON "notas"("avaliacaoId");
CREATE INDEX "notas_turmaId_idx" ON "notas"("turmaId");
CREATE INDEX "notas_turmaId_disciplina_idx" ON "notas"("turmaId", "disciplina");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
