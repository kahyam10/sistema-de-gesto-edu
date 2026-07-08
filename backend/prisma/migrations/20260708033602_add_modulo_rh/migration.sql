-- AlterTable
ALTER TABLE "profissionais_educacao" ADD COLUMN     "agencia" TEXT,
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "conta" TEXT,
ADD COLUMN     "dataAdmissao" TIMESTAMP(3),
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "escolaridade" TEXT,
ADD COLUMN     "jornada" INTEGER,
ADD COLUMN     "pix" TEXT,
ADD COLUMN     "regimeContratacao" TEXT,
ADD COLUMN     "tipoConta" TEXT;

-- CreateTable
CREATE TABLE "certificacoes_profissionais" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3),
    "cargaHoraria" INTEGER,
    "urlCertificado" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificacoes_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_contratacoes" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataEvento" TIMESTAMP(3) NOT NULL,
    "cargo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historico_contratacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afastamentos" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "motivo" TEXT,
    "observacoes" TEXT,
    "documentoPath" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "afastamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licencas" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "diasCorridos" INTEGER NOT NULL,
    "diasUteis" INTEGER,
    "motivo" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "documentoPath" TEXT,
    "aprovadaPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "justificativaRejeicao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "escolaId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "entrada" TEXT,
    "saida" TEXT,
    "entrada2" TEXT,
    "saida2" TEXT,
    "horasTrabalhadas" DOUBLE PRECISION,
    "tipoRegistro" TEXT NOT NULL DEFAULT 'NORMAL',
    "observacoes" TEXT,
    "justificativa" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historico_contratacoes_profissionalId_idx" ON "historico_contratacoes"("profissionalId");

-- CreateIndex
CREATE INDEX "afastamentos_profissionalId_idx" ON "afastamentos"("profissionalId");

-- CreateIndex
CREATE INDEX "afastamentos_dataInicio_dataFim_idx" ON "afastamentos"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "licencas_profissionalId_idx" ON "licencas"("profissionalId");

-- CreateIndex
CREATE INDEX "licencas_status_idx" ON "licencas"("status");

-- CreateIndex
CREATE INDEX "licencas_dataInicio_dataFim_idx" ON "licencas"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "pontos_profissionalId_idx" ON "pontos"("profissionalId");

-- CreateIndex
CREATE INDEX "pontos_data_idx" ON "pontos"("data");

-- CreateIndex
CREATE INDEX "pontos_escolaId_idx" ON "pontos"("escolaId");

-- AddForeignKey
ALTER TABLE "certificacoes_profissionais" ADD CONSTRAINT "certificacoes_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_contratacoes" ADD CONSTRAINT "historico_contratacoes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licencas" ADD CONSTRAINT "licencas_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos" ADD CONSTRAINT "pontos_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
