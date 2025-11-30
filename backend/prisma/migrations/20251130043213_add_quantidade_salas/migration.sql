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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_escolas" ("ativo", "codigo", "createdAt", "email", "endereco", "id", "nome", "telefone", "updatedAt") SELECT "ativo", "codigo", "createdAt", "email", "endereco", "id", "nome", "telefone", "updatedAt" FROM "escolas";
DROP TABLE "escolas";
ALTER TABLE "new_escolas" RENAME TO "escolas";
CREATE UNIQUE INDEX "escolas_codigo_key" ON "escolas"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
