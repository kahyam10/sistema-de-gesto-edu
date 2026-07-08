-- CreateTable
CREATE TABLE "grade_horaria" (
    "id" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "profissionalId" TEXT,

    CONSTRAINT "grade_horaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequencias" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "justificativa" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,

    CONSTRAINT "frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "cargaHorariaSemanal" INTEGER,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etapaId" TEXT NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_avaliacao" (
    "id" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "sistemaAvaliacao" TEXT NOT NULL DEFAULT 'NOTA',
    "numeroPeriodos" INTEGER NOT NULL DEFAULT 4,
    "mediaMinima" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "percentualFrequenciaMinima" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "recuperacaoParalela" BOOLEAN NOT NULL DEFAULT false,
    "recuperacaoFinal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT,
    "etapaId" TEXT,

    CONSTRAINT "configuracoes_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "valorMaximo" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "data" TIMESTAMP(3) NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "profissionalId" TEXT,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "avaliacaoId" TEXT,
    "matriculaId" TEXT NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_horaria_turmaId_idx" ON "grade_horaria"("turmaId");

-- CreateIndex
CREATE INDEX "grade_horaria_profissionalId_idx" ON "grade_horaria"("profissionalId");

-- CreateIndex
CREATE INDEX "frequencias_matriculaId_idx" ON "frequencias"("matriculaId");

-- CreateIndex
CREATE INDEX "frequencias_turmaId_idx" ON "frequencias"("turmaId");

-- CreateIndex
CREATE INDEX "frequencias_data_idx" ON "frequencias"("data");

-- CreateIndex
CREATE UNIQUE INDEX "frequencias_matriculaId_turmaId_data_key" ON "frequencias"("matriculaId", "turmaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE INDEX "disciplinas_etapaId_idx" ON "disciplinas"("etapaId");

-- CreateIndex
CREATE INDEX "configuracoes_avaliacao_anoLetivo_idx" ON "configuracoes_avaliacao"("anoLetivo");

-- CreateIndex
CREATE INDEX "avaliacoes_turmaId_idx" ON "avaliacoes"("turmaId");

-- CreateIndex
CREATE INDEX "avaliacoes_disciplinaId_idx" ON "avaliacoes"("disciplinaId");

-- CreateIndex
CREATE INDEX "avaliacoes_turmaId_disciplinaId_bimestre_idx" ON "avaliacoes"("turmaId", "disciplinaId", "bimestre");

-- CreateIndex
CREATE INDEX "notas_matriculaId_idx" ON "notas"("matriculaId");

-- CreateIndex
CREATE INDEX "notas_avaliacaoId_idx" ON "notas"("avaliacaoId");

-- CreateIndex
CREATE INDEX "notas_turmaId_idx" ON "notas"("turmaId");

-- CreateIndex
CREATE INDEX "notas_turmaId_disciplina_idx" ON "notas"("turmaId", "disciplina");

-- CreateIndex
CREATE UNIQUE INDEX "notas_avaliacaoId_matriculaId_key" ON "notas"("avaliacaoId", "matriculaId");

-- AddForeignKey
ALTER TABLE "grade_horaria" ADD CONSTRAINT "grade_horaria_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_horaria" ADD CONSTRAINT "grade_horaria_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_avaliacao" ADD CONSTRAINT "configuracoes_avaliacao_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_avaliacao" ADD CONSTRAINT "configuracoes_avaliacao_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
