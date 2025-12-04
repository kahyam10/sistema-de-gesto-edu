-- CreateTable
CREATE TABLE "anos_letivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ano" INTEGER NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "eventos_calendario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "tipo" TEXT NOT NULL,
    "escopo" TEXT NOT NULL DEFAULT 'REDE',
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "tipoRecorrencia" TEXT,
    "diaRecorrencia" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#3B82F6',
    "reduzDiaLetivo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "anoLetivoId" TEXT NOT NULL,
    "escolaId" TEXT,
    CONSTRAINT "eventos_calendario_anoLetivoId_fkey" FOREIGN KEY ("anoLetivoId") REFERENCES "anos_letivos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "eventos_calendario_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "anos_letivos_ano_key" ON "anos_letivos"("ano");
