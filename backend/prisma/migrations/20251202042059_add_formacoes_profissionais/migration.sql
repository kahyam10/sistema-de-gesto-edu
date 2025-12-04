-- CreateTable
CREATE TABLE "formacoes_profissionais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "anoConclusao" INTEGER,
    "cargaHoraria" INTEGER,
    "emAndamento" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "formacoes_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
