-- CreateTable
CREATE TABLE "documentos_matricula" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matriculaId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedByNome" TEXT NOT NULL,

    CONSTRAINT "documentos_matricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documentos_matricula_storageKey_key" ON "documentos_matricula"("storageKey");

-- CreateIndex
CREATE INDEX "documentos_matricula_matriculaId_idx" ON "documentos_matricula"("matriculaId");

-- CreateIndex
CREATE INDEX "documentos_matricula_matriculaId_tipo_idx" ON "documentos_matricula"("matriculaId", "tipo");

-- AddForeignKey
ALTER TABLE "documentos_matricula" ADD CONSTRAINT "documentos_matricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_matricula" ADD CONSTRAINT "documentos_matricula_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
