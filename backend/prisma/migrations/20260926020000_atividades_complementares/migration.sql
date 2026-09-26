-- CreateTable
CREATE TABLE "atividades_complementares" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "titulo" TEXT,
    "diaSemana" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "local" TEXT,
    "coordenadorId" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atividades_complementares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ac_participantes" (
    "id" TEXT NOT NULL,
    "acId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ac_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "atividades_complementares_escolaId_idx" ON "atividades_complementares"("escolaId");

-- CreateIndex
CREATE INDEX "atividades_complementares_coordenadorId_idx" ON "atividades_complementares"("coordenadorId");

-- CreateIndex
CREATE INDEX "ac_participantes_profissionalId_idx" ON "ac_participantes"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ac_participantes_acId_profissionalId_key" ON "ac_participantes"("acId", "profissionalId");

-- AddForeignKey
ALTER TABLE "atividades_complementares" ADD CONSTRAINT "atividades_complementares_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_complementares" ADD CONSTRAINT "atividades_complementares_coordenadorId_fkey" FOREIGN KEY ("coordenadorId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ac_participantes" ADD CONSTRAINT "ac_participantes_acId_fkey" FOREIGN KEY ("acId") REFERENCES "atividades_complementares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ac_participantes" ADD CONSTRAINT "ac_participantes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

