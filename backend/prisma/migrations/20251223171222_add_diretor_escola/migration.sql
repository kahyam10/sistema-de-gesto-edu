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
    "diretorId" TEXT,
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
    "possuiSinalizacaoBraile" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "escolas_diretorId_fkey" FOREIGN KEY ("diretorId") REFERENCES "profissionais_educacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_escolas" ("ativo", "codigo", "createdAt", "email", "endereco", "id", "nome", "possuiAlmoxarifado", "possuiBiblioteca", "possuiCozinha", "possuiDiretoria", "possuiDispensa", "possuiElevador", "possuiInternet", "possuiParque", "possuiPatio", "possuiPisoTatil", "possuiProjetores", "possuiQuadra", "possuiRampaAcesso", "possuiRefeitorio", "possuiSalaInformatica", "possuiSalaProfessores", "possuiSecretaria", "possuiSinalizacaoBraile", "qtdBanheirosAdaptados", "qtdBanheirosAlunas", "qtdBanheirosAlunos", "qtdBanheirosFuncionarios", "qtdComputadores", "qtdProjetores", "quadraCoberta", "quantidadeSalas", "telefone", "tipoInternet", "updatedAt", "velocidadeInternet") SELECT "ativo", "codigo", "createdAt", "email", "endereco", "id", "nome", "possuiAlmoxarifado", "possuiBiblioteca", "possuiCozinha", "possuiDiretoria", "possuiDispensa", "possuiElevador", "possuiInternet", "possuiParque", "possuiPatio", "possuiPisoTatil", "possuiProjetores", "possuiQuadra", "possuiRampaAcesso", "possuiRefeitorio", "possuiSalaInformatica", "possuiSalaProfessores", "possuiSecretaria", "possuiSinalizacaoBraile", "qtdBanheirosAdaptados", "qtdBanheirosAlunas", "qtdBanheirosAlunos", "qtdBanheirosFuncionarios", "qtdComputadores", "qtdProjetores", "quadraCoberta", "quantidadeSalas", "telefone", "tipoInternet", "updatedAt", "velocidadeInternet" FROM "escolas";
DROP TABLE "escolas";
ALTER TABLE "new_escolas" RENAME TO "escolas";
CREATE UNIQUE INDEX "escolas_codigo_key" ON "escolas"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
