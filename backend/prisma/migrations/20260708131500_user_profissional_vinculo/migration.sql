-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profissionalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_profissionalId_key" ON "users"("profissionalId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

