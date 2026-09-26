-- CreateTable
CREATE TABLE "conteudos_programaticos" (
    "id" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "habilidadesBncc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serieId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "escolaId" TEXT,

    CONSTRAINT "conteudos_programaticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_aula" (
    "id" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "dataAula" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT NOT NULL,
    "objetivos" TEXT NOT NULL,
    "desenvolvimento" TEXT,
    "recursos" TEXT,
    "avaliacao" TEXT,
    "habilidadesBncc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "enviadoEm" TIMESTAMP(3),
    "parecer" TEXT,
    "revisadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "revisadoPorId" TEXT,
    "conteudoProgramaticoId" TEXT,

    CONSTRAINT "planos_aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_pedagogicas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "habilidadesBncc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "serieId" TEXT,
    "escolaId" TEXT,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "atividades_pedagogicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_aula_atividades" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_aula_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conteudos_programaticos_anoLetivo_serieId_disciplinaId_bime_idx" ON "conteudos_programaticos"("anoLetivo", "serieId", "disciplinaId", "bimestre");

-- CreateIndex
CREATE INDEX "conteudos_programaticos_escolaId_idx" ON "conteudos_programaticos"("escolaId");

-- CreateIndex
CREATE INDEX "planos_aula_turmaId_disciplinaId_bimestre_idx" ON "planos_aula"("turmaId", "disciplinaId", "bimestre");

-- CreateIndex
CREATE INDEX "planos_aula_autorId_idx" ON "planos_aula"("autorId");

-- CreateIndex
CREATE INDEX "planos_aula_status_idx" ON "planos_aula"("status");

-- CreateIndex
CREATE INDEX "planos_aula_conteudoProgramaticoId_idx" ON "planos_aula"("conteudoProgramaticoId");

-- CreateIndex
CREATE INDEX "atividades_pedagogicas_disciplinaId_idx" ON "atividades_pedagogicas"("disciplinaId");

-- CreateIndex
CREATE INDEX "atividades_pedagogicas_escolaId_idx" ON "atividades_pedagogicas"("escolaId");

-- CreateIndex
CREATE INDEX "atividades_pedagogicas_autorId_idx" ON "atividades_pedagogicas"("autorId");

-- CreateIndex
CREATE INDEX "planos_aula_atividades_atividadeId_idx" ON "planos_aula_atividades"("atividadeId");

-- CreateIndex
CREATE UNIQUE INDEX "planos_aula_atividades_planoId_atividadeId_key" ON "planos_aula_atividades"("planoId", "atividadeId");

-- AddForeignKey
ALTER TABLE "conteudos_programaticos" ADD CONSTRAINT "conteudos_programaticos_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos_programaticos" ADD CONSTRAINT "conteudos_programaticos_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos_programaticos" ADD CONSTRAINT "conteudos_programaticos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula" ADD CONSTRAINT "planos_aula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula" ADD CONSTRAINT "planos_aula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula" ADD CONSTRAINT "planos_aula_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula" ADD CONSTRAINT "planos_aula_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula" ADD CONSTRAINT "planos_aula_conteudoProgramaticoId_fkey" FOREIGN KEY ("conteudoProgramaticoId") REFERENCES "conteudos_programaticos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_pedagogicas" ADD CONSTRAINT "atividades_pedagogicas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_pedagogicas" ADD CONSTRAINT "atividades_pedagogicas_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_pedagogicas" ADD CONSTRAINT "atividades_pedagogicas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_pedagogicas" ADD CONSTRAINT "atividades_pedagogicas_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula_atividades" ADD CONSTRAINT "planos_aula_atividades_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos_aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_aula_atividades" ADD CONSTRAINT "planos_aula_atividades_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades_pedagogicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

