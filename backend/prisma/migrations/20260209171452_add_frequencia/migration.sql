-- CreateTable
CREATE TABLE "frequencias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "justificativa" TEXT,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    CONSTRAINT "frequencias_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "frequencias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "frequencias_matriculaId_idx" ON "frequencias"("matriculaId");

-- CreateIndex
CREATE INDEX "frequencias_turmaId_idx" ON "frequencias"("turmaId");

-- CreateIndex
CREATE INDEX "frequencias_data_idx" ON "frequencias"("data");

-- CreateIndex
CREATE UNIQUE INDEX "frequencias_matriculaId_turmaId_data_key" ON "frequencias"("matriculaId", "turmaId", "data");
