-- CreateTable
CREATE TABLE "salas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 25,
    "possuiArCondicionado" BOOLEAN NOT NULL DEFAULT false,
    "possuiVentilador" BOOLEAN NOT NULL DEFAULT false,
    "possuiTV" BOOLEAN NOT NULL DEFAULT false,
    "possuiProjetor" BOOLEAN NOT NULL DEFAULT false,
    "possuiQuadro" BOOLEAN NOT NULL DEFAULT true,
    "metragem" REAL,
    "andar" INTEGER NOT NULL DEFAULT 0,
    "acessivel" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "escolaId" TEXT NOT NULL,
    CONSTRAINT "salas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_escolas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "quantidadeSalas" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "possuiPatio" BOOLEAN NOT NULL DEFAULT false,
    "possuiParque" BOOLEAN NOT NULL DEFAULT false,
    "possuiQuadra" BOOLEAN NOT NULL DEFAULT false,
    "quadraCoberta" BOOLEAN NOT NULL DEFAULT false,
    "possuiBiblioteca" BOOLEAN NOT NULL DEFAULT false,
    "possuiRefeitorio" BOOLEAN NOT NULL DEFAULT false,
    "possuiSalaProfessores" BOOLEAN NOT NULL DEFAULT false,
    "possuiSecretaria" BOOLEAN NOT NULL DEFAULT false,
    "possuiDiretoria" BOOLEAN NOT NULL DEFAULT false,
    "possuiAlmoxarifado" BOOLEAN NOT NULL DEFAULT false,
    "possuiCozinha" BOOLEAN NOT NULL DEFAULT false,
    "possuiDispensa" BOOLEAN NOT NULL DEFAULT false,
    "qtdBanheirosAlunos" INTEGER NOT NULL DEFAULT 0,
    "qtdBanheirosAlunas" INTEGER NOT NULL DEFAULT 0,
    "qtdBanheirosAdaptados" INTEGER NOT NULL DEFAULT 0,
    "qtdBanheirosFuncionarios" INTEGER NOT NULL DEFAULT 0,
    "possuiInternet" BOOLEAN NOT NULL DEFAULT false,
    "tipoInternet" TEXT,
    "velocidadeInternet" TEXT,
    "possuiSalaInformatica" BOOLEAN NOT NULL DEFAULT false,
    "qtdComputadores" INTEGER NOT NULL DEFAULT 0,
    "possuiProjetores" BOOLEAN NOT NULL DEFAULT false,
    "qtdProjetores" INTEGER NOT NULL DEFAULT 0,
    "possuiRampaAcesso" BOOLEAN NOT NULL DEFAULT false,
    "possuiElevador" BOOLEAN NOT NULL DEFAULT false,
    "possuiPisoTatil" BOOLEAN NOT NULL DEFAULT false,
    "possuiSinalizacaoBraile" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_escolas" ("ativo", "codigo", "createdAt", "email", "endereco", "id", "nome", "quantidadeSalas", "telefone", "updatedAt") SELECT "ativo", "codigo", "createdAt", "email", "endereco", "id", "nome", "quantidadeSalas", "telefone", "updatedAt" FROM "escolas";
DROP TABLE "escolas";
ALTER TABLE "new_escolas" RENAME TO "escolas";
CREATE UNIQUE INDEX "escolas_codigo_key" ON "escolas"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
