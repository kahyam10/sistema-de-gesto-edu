-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "escolas_profissionais_profissionalId_idx" ON "escolas_profissionais"("profissionalId");

-- CreateIndex
CREATE INDEX "frequencias_turmaId_data_idx" ON "frequencias"("turmaId", "data");

-- CreateIndex
CREATE INDEX "matriculas_turmaId_status_idx" ON "matriculas"("turmaId", "status");

-- CreateIndex
CREATE INDEX "matriculas_escolaId_anoLetivo_status_idx" ON "matriculas"("escolaId", "anoLetivo", "status");

-- CreateIndex
CREATE INDEX "matriculas_anoLetivo_status_idx" ON "matriculas"("anoLetivo", "status");

-- CreateIndex
CREATE INDEX "matriculas_cpfAluno_idx" ON "matriculas"("cpfAluno");

-- CreateIndex
CREATE INDEX "turmas_escolaId_anoLetivo_idx" ON "turmas"("escolaId", "anoLetivo");

-- CreateIndex
CREATE INDEX "turmas_professores_profissionalId_idx" ON "turmas_professores"("profissionalId");

