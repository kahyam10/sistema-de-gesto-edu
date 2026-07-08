-- CreateTable
CREATE TABLE "plantoes_pedagogicos" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "profissionais" TEXT,
    "turmaId" TEXT,
    "local" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantoes_pedagogicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunioes_pais" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "turmaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "duracao" INTEGER,
    "local" TEXT,
    "tipo" TEXT NOT NULL,
    "finalidade" TEXT,
    "pauta" TEXT,
    "ata" TEXT,
    "encaminhamentos" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "profissionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunioes_pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas_reunioes" (
    "id" TEXT NOT NULL,
    "reuniaoId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "parentesco" TEXT,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "horarioChegada" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presencas_reunioes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "destinatarios" TEXT NOT NULL,
    "turmaId" TEXT,
    "etapaId" TEXT,
    "anexoUrl" TEXT,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataExpiracao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT,
    "autorNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados_destinatarios" (
    "id" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "dataLeitura" TIMESTAMP(3),
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "dataConfirmacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_destinatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "canais" TEXT NOT NULL,
    "link" TEXT,
    "acaoTipo" TEXT,
    "acaoId" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "dataLeitura" TIMESTAMP(3),
    "enviadaEmail" BOOLEAN NOT NULL DEFAULT false,
    "enviadaSMS" BOOLEAN NOT NULL DEFAULT false,
    "enviadaPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plantoes_pedagogicos_escolaId_idx" ON "plantoes_pedagogicos"("escolaId");

-- CreateIndex
CREATE INDEX "plantoes_pedagogicos_data_idx" ON "plantoes_pedagogicos"("data");

-- CreateIndex
CREATE INDEX "plantoes_pedagogicos_turmaId_idx" ON "plantoes_pedagogicos"("turmaId");

-- CreateIndex
CREATE INDEX "reunioes_pais_escolaId_idx" ON "reunioes_pais"("escolaId");

-- CreateIndex
CREATE INDEX "reunioes_pais_turmaId_idx" ON "reunioes_pais"("turmaId");

-- CreateIndex
CREATE INDEX "reunioes_pais_data_idx" ON "reunioes_pais"("data");

-- CreateIndex
CREATE INDEX "reunioes_pais_status_idx" ON "reunioes_pais"("status");

-- CreateIndex
CREATE INDEX "presencas_reunioes_reuniaoId_idx" ON "presencas_reunioes"("reuniaoId");

-- CreateIndex
CREATE INDEX "presencas_reunioes_matriculaId_idx" ON "presencas_reunioes"("matriculaId");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_reunioes_reuniaoId_matriculaId_key" ON "presencas_reunioes"("reuniaoId", "matriculaId");

-- CreateIndex
CREATE INDEX "comunicados_escolaId_idx" ON "comunicados"("escolaId");

-- CreateIndex
CREATE INDEX "comunicados_tipo_idx" ON "comunicados"("tipo");

-- CreateIndex
CREATE INDEX "comunicados_dataPublicacao_idx" ON "comunicados"("dataPublicacao");

-- CreateIndex
CREATE INDEX "comunicados_turmaId_idx" ON "comunicados"("turmaId");

-- CreateIndex
CREATE INDEX "comunicados_etapaId_idx" ON "comunicados"("etapaId");

-- CreateIndex
CREATE INDEX "comunicados_destinatarios_comunicadoId_idx" ON "comunicados_destinatarios"("comunicadoId");

-- CreateIndex
CREATE INDEX "comunicados_destinatarios_userId_idx" ON "comunicados_destinatarios"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comunicados_destinatarios_comunicadoId_userId_key" ON "comunicados_destinatarios"("comunicadoId", "userId");

-- CreateIndex
CREATE INDEX "notificacoes_userId_idx" ON "notificacoes"("userId");

-- CreateIndex
CREATE INDEX "notificacoes_tipo_idx" ON "notificacoes"("tipo");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "notificacoes"("lida");

-- CreateIndex
CREATE INDEX "notificacoes_createdAt_idx" ON "notificacoes"("createdAt");

-- AddForeignKey
ALTER TABLE "plantoes_pedagogicos" ADD CONSTRAINT "plantoes_pedagogicos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantoes_pedagogicos" ADD CONSTRAINT "plantoes_pedagogicos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_pais" ADD CONSTRAINT "reunioes_pais_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_pais" ADD CONSTRAINT "reunioes_pais_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_pais" ADD CONSTRAINT "reunioes_pais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_reunioes" ADD CONSTRAINT "presencas_reunioes_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "reunioes_pais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_reunioes" ADD CONSTRAINT "presencas_reunioes_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_ensino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados_destinatarios" ADD CONSTRAINT "comunicados_destinatarios_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "comunicados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
