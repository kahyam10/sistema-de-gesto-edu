-- CreateTable
CREATE TABLE "grade_horaria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaSemana" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "turmaId" TEXT NOT NULL,
    "profissionalId" TEXT,
    CONSTRAINT "grade_horaria_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grade_horaria_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "grade_horaria_turmaId_idx" ON "grade_horaria"("turmaId");

-- CreateIndex
CREATE INDEX "grade_horaria_profissionalId_idx" ON "grade_horaria"("profissionalId");
