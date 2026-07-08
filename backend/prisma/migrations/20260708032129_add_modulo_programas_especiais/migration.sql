-- CreateTable
CREATE TABLE "busca_ativa" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "responsavelId" TEXT,
    "escolaId" TEXT,
    "resultado" TEXT,
    "dataResolucao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "busca_ativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_domiciliares" (
    "id" TEXT NOT NULL,
    "buscaAtivaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT,
    "responsavel" TEXT NOT NULL,
    "situacao" TEXT NOT NULL,
    "relato" TEXT,
    "observacoes" TEXT,
    "proximaVisita" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_domiciliares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encaminhamentos_externos" (
    "id" TEXT NOT NULL,
    "buscaAtivaId" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL,
    "protocolo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENVIADO',
    "retorno" TEXT,
    "dataRetorno" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_externos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_educacionais_individualizados" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "deficiencia" TEXT NOT NULL,
    "cid" TEXT,
    "laudoMedico" BOOLEAN NOT NULL DEFAULT false,
    "laudoPath" TEXT,
    "necessitaAEE" BOOLEAN NOT NULL DEFAULT false,
    "frequenciaAEE" TEXT,
    "profissionalAEE" TEXT,
    "objetivosGerais" TEXT,
    "objetivosEspecificos" TEXT,
    "estrategias" TEXT,
    "recursos" TEXT,
    "avaliacaoDiagnostica" TEXT,
    "elaboradoPor" TEXT,
    "dataElaboracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRevisao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_educacionais_individualizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas_recursos" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 10,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "recursos" TEXT,
    "profissionais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salas_recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos_aee" (
    "id" TEXT NOT NULL,
    "peiId" TEXT NOT NULL,
    "salaRecursosId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT,
    "duracao" INTEGER,
    "objetivo" TEXT,
    "atividades" TEXT,
    "recursos" TEXT,
    "observacoes" TEXT,
    "presenca" BOOLEAN NOT NULL DEFAULT true,
    "justificativa" TEXT,
    "profissionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendimentos_aee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamentos_individualizados" (
    "id" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "objetivos" TEXT,
    "profissionalId" TEXT,
    "escolaId" TEXT,
    "acoes" TEXT,
    "estrategias" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "evolucoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acompanhamentos_individualizados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "busca_ativa_matriculaId_idx" ON "busca_ativa"("matriculaId");

-- CreateIndex
CREATE INDEX "busca_ativa_status_idx" ON "busca_ativa"("status");

-- CreateIndex
CREATE INDEX "busca_ativa_prioridade_idx" ON "busca_ativa"("prioridade");

-- CreateIndex
CREATE INDEX "busca_ativa_escolaId_idx" ON "busca_ativa"("escolaId");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_buscaAtivaId_idx" ON "visitas_domiciliares"("buscaAtivaId");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_data_idx" ON "visitas_domiciliares"("data");

-- CreateIndex
CREATE INDEX "encaminhamentos_externos_buscaAtivaId_idx" ON "encaminhamentos_externos"("buscaAtivaId");

-- CreateIndex
CREATE INDEX "encaminhamentos_externos_orgao_idx" ON "encaminhamentos_externos"("orgao");

-- CreateIndex
CREATE INDEX "encaminhamentos_externos_status_idx" ON "encaminhamentos_externos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "planos_educacionais_individualizados_matriculaId_key" ON "planos_educacionais_individualizados"("matriculaId");

-- CreateIndex
CREATE INDEX "planos_educacionais_individualizados_matriculaId_idx" ON "planos_educacionais_individualizados"("matriculaId");

-- CreateIndex
CREATE INDEX "planos_educacionais_individualizados_anoLetivo_idx" ON "planos_educacionais_individualizados"("anoLetivo");

-- CreateIndex
CREATE INDEX "planos_educacionais_individualizados_status_idx" ON "planos_educacionais_individualizados"("status");

-- CreateIndex
CREATE INDEX "salas_recursos_escolaId_idx" ON "salas_recursos"("escolaId");

-- CreateIndex
CREATE INDEX "salas_recursos_turno_idx" ON "salas_recursos"("turno");

-- CreateIndex
CREATE INDEX "atendimentos_aee_peiId_idx" ON "atendimentos_aee"("peiId");

-- CreateIndex
CREATE INDEX "atendimentos_aee_salaRecursosId_idx" ON "atendimentos_aee"("salaRecursosId");

-- CreateIndex
CREATE INDEX "atendimentos_aee_data_idx" ON "atendimentos_aee"("data");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_matriculaId_idx" ON "acompanhamentos_individualizados"("matriculaId");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_tipo_idx" ON "acompanhamentos_individualizados"("tipo");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_status_idx" ON "acompanhamentos_individualizados"("status");

-- CreateIndex
CREATE INDEX "acompanhamentos_individualizados_escolaId_idx" ON "acompanhamentos_individualizados"("escolaId");

-- AddForeignKey
ALTER TABLE "busca_ativa" ADD CONSTRAINT "busca_ativa_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "busca_ativa" ADD CONSTRAINT "busca_ativa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "busca_ativa" ADD CONSTRAINT "busca_ativa_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_domiciliares" ADD CONSTRAINT "visitas_domiciliares_buscaAtivaId_fkey" FOREIGN KEY ("buscaAtivaId") REFERENCES "busca_ativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encaminhamentos_externos" ADD CONSTRAINT "encaminhamentos_externos_buscaAtivaId_fkey" FOREIGN KEY ("buscaAtivaId") REFERENCES "busca_ativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_educacionais_individualizados" ADD CONSTRAINT "planos_educacionais_individualizados_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salas_recursos" ADD CONSTRAINT "salas_recursos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_aee" ADD CONSTRAINT "atendimentos_aee_peiId_fkey" FOREIGN KEY ("peiId") REFERENCES "planos_educacionais_individualizados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_aee" ADD CONSTRAINT "atendimentos_aee_salaRecursosId_fkey" FOREIGN KEY ("salaRecursosId") REFERENCES "salas_recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_aee" ADD CONSTRAINT "atendimentos_aee_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_individualizados" ADD CONSTRAINT "acompanhamentos_individualizados_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_individualizados" ADD CONSTRAINT "acompanhamentos_individualizados_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_individualizados" ADD CONSTRAINT "acompanhamentos_individualizados_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
