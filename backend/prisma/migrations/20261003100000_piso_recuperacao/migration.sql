-- Piso entre recuperação e reprovação configurável (antes fixo em 3,0 no
-- código). Só acrescenta a coluna; o default 3.0 mantém o comportamento
-- atual para todas as configurações existentes. Nenhum dado é apagado.

-- AlterTable
ALTER TABLE "configuracoes_avaliacao" ADD COLUMN     "notaMinimaRecuperacao" DOUBLE PRECISION NOT NULL DEFAULT 3.0;
