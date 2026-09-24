-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "nisAluno" TEXT;

-- CreateTable
CREATE TABLE "matriculas_usuarios" (
    "id" TEXT NOT NULL,
    "tipoVinculo" TEXT NOT NULL DEFAULT 'RESPONSAVEL',
    "parentesco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matriculaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "matriculas_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardapios" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "turno" TEXT NOT NULL,
    "tipoRefeicao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "itens" JSONB,
    "observacoesNutricionais" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT,

    CONSTRAINT "cardapios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_estoque" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "itens_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custoUnitario" DOUBLE PRECISION,
    "fornecedor" TEXT,
    "notaFiscal" TEXT,
    "motivo" TEXT,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_refeicao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "turno" TEXT NOT NULL,
    "tipoRefeicao" TEXT NOT NULL,
    "quantidadeServida" INTEGER NOT NULL,
    "quantidadePlanejada" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "cardapioId" TEXT,

    CONSTRAINT "registros_refeicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "anoFabricacao" INTEGER,
    "capacidade" INTEGER NOT NULL,
    "renavam" TEXT,
    "chassi" TEXT,
    "tipoPropriedade" TEXT NOT NULL DEFAULT 'PROPRIO',
    "adaptadoPCD" BOOLEAN NOT NULL DEFAULT false,
    "vencimentoLicenciamento" TIMESTAMP(3),
    "vencimentoSeguro" TIMESTAMP(3),
    "vencimentoVistoria" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motoristas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "cnhNumero" TEXT NOT NULL,
    "cnhCategoria" TEXT NOT NULL,
    "cnhValidade" TIMESTAMP(3) NOT NULL,
    "cursoTransporteEscolar" BOOLEAN NOT NULL DEFAULT false,
    "vencimentoCursoTransporte" TIMESTAMP(3),
    "vinculo" TEXT NOT NULL DEFAULT 'EFETIVO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motoristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_transporte" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'RURAL',
    "itinerario" TEXT NOT NULL,
    "kmDiario" DOUBLE PRECISION,
    "horarioSaida" TEXT,
    "horarioRetorno" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "veiculoId" TEXT,
    "motoristaId" TEXT,

    CONSTRAINT "rotas_transporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_escolas" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "rotas_escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_alunos" (
    "id" TEXT NOT NULL,
    "pontoEmbarque" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotaId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,

    CONSTRAINT "rotas_alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes_veiculos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "dataRealizada" TIMESTAMP(3),
    "custo" DOUBLE PRECISION,
    "kmRegistrado" INTEGER,
    "oficina" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "veiculoId" TEXT NOT NULL,

    CONSTRAINT "manutencoes_veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colegiados_escolares" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Colegiado Escolar',
    "dataInicioMandato" TIMESTAMP(3) NOT NULL,
    "dataFimMandato" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "colegiados_escolares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_colegiado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'TITULAR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "colegiadoId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "matriculaId" TEXT,

    CONSTRAINT "membros_colegiado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gremios_estudantis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ELEICAO',
    "dataFundacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "gremios_estudantis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapas_gremio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "membros" JSONB,
    "votosRecebidos" INTEGER,
    "eleita" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gremioId" TEXT NOT NULL,

    CONSTRAINT "chapas_gremio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_gremio" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gremioId" TEXT NOT NULL,

    CONSTRAINT "atividades_gremio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lideres_turma" (
    "id" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "formaEscolha" TEXT NOT NULL DEFAULT 'ELEICAO',
    "dataEscolha" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,

    CONSTRAINT "lideres_turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunioes_democraticas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "local" TEXT,
    "pauta" JSONB,
    "ata" TEXT,
    "decisoes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "colegiadoId" TEXT,

    CONSTRAINT "reunioes_democraticas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas_reunioes_democraticas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "segmento" TEXT,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reuniaoId" TEXT NOT NULL,

    CONSTRAINT "presencas_reunioes_democraticas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matriculas_usuarios_userId_idx" ON "matriculas_usuarios"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_usuarios_matriculaId_userId_key" ON "matriculas_usuarios"("matriculaId", "userId");

-- CreateIndex
CREATE INDEX "cardapios_escolaId_idx" ON "cardapios"("escolaId");

-- CreateIndex
CREATE INDEX "cardapios_data_idx" ON "cardapios"("data");

-- CreateIndex
CREATE INDEX "itens_estoque_escolaId_idx" ON "itens_estoque"("escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_estoque_escolaId_nome_key" ON "itens_estoque"("escolaId", "nome");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_itemId_idx" ON "movimentacoes_estoque"("itemId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_data_idx" ON "movimentacoes_estoque"("data");

-- CreateIndex
CREATE INDEX "registros_refeicao_escolaId_idx" ON "registros_refeicao"("escolaId");

-- CreateIndex
CREATE INDEX "registros_refeicao_data_idx" ON "registros_refeicao"("data");

-- CreateIndex
CREATE UNIQUE INDEX "registros_refeicao_escolaId_data_turno_tipoRefeicao_key" ON "registros_refeicao"("escolaId", "data", "turno", "tipoRefeicao");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_cpf_key" ON "motoristas"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "rotas_transporte_codigo_key" ON "rotas_transporte"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "rotas_escolas_rotaId_escolaId_key" ON "rotas_escolas"("rotaId", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "rotas_alunos_rotaId_matriculaId_key" ON "rotas_alunos"("rotaId", "matriculaId");

-- CreateIndex
CREATE INDEX "manutencoes_veiculos_veiculoId_idx" ON "manutencoes_veiculos"("veiculoId");

-- CreateIndex
CREATE INDEX "manutencoes_veiculos_dataAgendada_idx" ON "manutencoes_veiculos"("dataAgendada");

-- CreateIndex
CREATE INDEX "colegiados_escolares_escolaId_idx" ON "colegiados_escolares"("escolaId");

-- CreateIndex
CREATE INDEX "membros_colegiado_colegiadoId_idx" ON "membros_colegiado"("colegiadoId");

-- CreateIndex
CREATE UNIQUE INDEX "gremios_estudantis_escolaId_anoLetivo_key" ON "gremios_estudantis"("escolaId", "anoLetivo");

-- CreateIndex
CREATE UNIQUE INDEX "chapas_gremio_gremioId_numero_key" ON "chapas_gremio"("gremioId", "numero");

-- CreateIndex
CREATE INDEX "atividades_gremio_gremioId_idx" ON "atividades_gremio"("gremioId");

-- CreateIndex
CREATE INDEX "lideres_turma_turmaId_idx" ON "lideres_turma"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "lideres_turma_turmaId_anoLetivo_tipo_key" ON "lideres_turma"("turmaId", "anoLetivo", "tipo");

-- CreateIndex
CREATE INDEX "reunioes_democraticas_escolaId_idx" ON "reunioes_democraticas"("escolaId");

-- CreateIndex
CREATE INDEX "reunioes_democraticas_data_idx" ON "reunioes_democraticas"("data");

-- CreateIndex
CREATE INDEX "presencas_reunioes_democraticas_reuniaoId_idx" ON "presencas_reunioes_democraticas"("reuniaoId");

-- AddForeignKey
ALTER TABLE "matriculas_usuarios" ADD CONSTRAINT "matriculas_usuarios_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_usuarios" ADD CONSTRAINT "matriculas_usuarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardapios" ADD CONSTRAINT "cardapios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_estoque" ADD CONSTRAINT "itens_estoque_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_refeicao" ADD CONSTRAINT "registros_refeicao_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_refeicao" ADD CONSTRAINT "registros_refeicao_cardapioId_fkey" FOREIGN KEY ("cardapioId") REFERENCES "cardapios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_transporte" ADD CONSTRAINT "rotas_transporte_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_transporte" ADD CONSTRAINT "rotas_transporte_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "motoristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_escolas" ADD CONSTRAINT "rotas_escolas_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "rotas_transporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_escolas" ADD CONSTRAINT "rotas_escolas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_alunos" ADD CONSTRAINT "rotas_alunos_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "rotas_transporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_alunos" ADD CONSTRAINT "rotas_alunos_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes_veiculos" ADD CONSTRAINT "manutencoes_veiculos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colegiados_escolares" ADD CONSTRAINT "colegiados_escolares_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_colegiado" ADD CONSTRAINT "membros_colegiado_colegiadoId_fkey" FOREIGN KEY ("colegiadoId") REFERENCES "colegiados_escolares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_colegiado" ADD CONSTRAINT "membros_colegiado_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_colegiado" ADD CONSTRAINT "membros_colegiado_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gremios_estudantis" ADD CONSTRAINT "gremios_estudantis_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapas_gremio" ADD CONSTRAINT "chapas_gremio_gremioId_fkey" FOREIGN KEY ("gremioId") REFERENCES "gremios_estudantis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_gremio" ADD CONSTRAINT "atividades_gremio_gremioId_fkey" FOREIGN KEY ("gremioId") REFERENCES "gremios_estudantis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lideres_turma" ADD CONSTRAINT "lideres_turma_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lideres_turma" ADD CONSTRAINT "lideres_turma_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_democraticas" ADD CONSTRAINT "reunioes_democraticas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_democraticas" ADD CONSTRAINT "reunioes_democraticas_colegiadoId_fkey" FOREIGN KEY ("colegiadoId") REFERENCES "colegiados_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_reunioes_democraticas" ADD CONSTRAINT "presencas_reunioes_democraticas_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "reunioes_democraticas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
