-- Frequência POR AULA (Fundamental II: uma chamada por aula da grade).
-- Só acrescenta colunas/índices: nenhum dado é apagado. Registros existentes
-- recebem aulaChave = 'DIA' pelo default (chamada diária) e continuam contando.
-- O índice único novo é criado ANTES de remover o antigo (o antigo é mais
-- restritivo, então os dados existentes já satisfazem o novo).

-- AlterTable
ALTER TABLE "frequencias" ADD COLUMN     "aulaChave" TEXT NOT NULL DEFAULT 'DIA',
ADD COLUMN     "disciplina" TEXT,
ADD COLUMN     "gradeHorariaId" TEXT,
ADD COLUMN     "horaInicio" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "frequencias_matriculaId_turmaId_data_aulaChave_key" ON "frequencias"("matriculaId", "turmaId", "data", "aulaChave");

-- DropIndex (unicidade antiga: um registro por aluno por turma por dia)
DROP INDEX "frequencias_matriculaId_turmaId_data_key";

-- CreateIndex
CREATE INDEX "frequencias_gradeHorariaId_idx" ON "frequencias"("gradeHorariaId");

-- CreateIndex (limite de login por IP: lib/limite-login.ts filtra acao + ip + createdAt)
CREATE INDEX "audit_logs_acao_ip_createdAt_idx" ON "audit_logs"("acao", "ip", "createdAt");

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_gradeHorariaId_fkey" FOREIGN KEY ("gradeHorariaId") REFERENCES "grade_horaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
