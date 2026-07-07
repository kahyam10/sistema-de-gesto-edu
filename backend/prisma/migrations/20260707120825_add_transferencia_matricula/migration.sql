-- CreateTable
CREATE TABLE "transferencias_matricula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matriculaId" TEXT NOT NULL,
    "escolaOrigemId" TEXT NOT NULL,
    "escolaDestinoId" TEXT NOT NULL,
    "turmaOrigemId" TEXT,
    "turmaDestinoId" TEXT,
    "motivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transferencias_matricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "transferencias_matricula_matriculaId_idx" ON "transferencias_matricula"("matriculaId");
