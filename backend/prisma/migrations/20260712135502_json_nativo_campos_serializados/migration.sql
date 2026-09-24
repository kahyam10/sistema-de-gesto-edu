-- Conversão String(JSON serializado) -> jsonb com fallback seguro:
--   NULL / string vazia            -> NULL
--   JSON válido                    -> jsonb
--   texto inválido (não-JSON)      -> preservado como string JSON (to_jsonb) — nada é perdido
CREATE FUNCTION pg_temp.to_jsonb_seguro(txt text) RETURNS jsonb
LANGUAGE plpgsql AS $$
BEGIN
  IF txt IS NULL OR btrim(txt) = '' THEN
    RETURN NULL;
  END IF;
  RETURN txt::jsonb;
EXCEPTION WHEN others THEN
  RETURN to_jsonb(txt);
END;
$$;

ALTER TABLE "escolas"
  ALTER COLUMN "dadosCenso" TYPE jsonb USING pg_temp.to_jsonb_seguro("dadosCenso");
ALTER TABLE "turmas"
  ALTER COLUMN "dadosCenso" TYPE jsonb USING pg_temp.to_jsonb_seguro("dadosCenso");
ALTER TABLE "profissionais_educacao"
  ALTER COLUMN "dadosCenso" TYPE jsonb USING pg_temp.to_jsonb_seguro("dadosCenso");
ALTER TABLE "matriculas"
  ALTER COLUMN "documentosEntregues" TYPE jsonb USING pg_temp.to_jsonb_seguro("documentosEntregues");
ALTER TABLE "acompanhamentos_individualizados"
  ALTER COLUMN "evolucoes" TYPE jsonb USING pg_temp.to_jsonb_seguro("evolucoes");

-- Colunas NOT NULL: COALESCE para array vazio (USING não pode produzir NULL aqui)
ALTER TABLE "phases"
  ALTER COLUMN "moduleIds" TYPE jsonb
  USING COALESCE(pg_temp.to_jsonb_seguro("moduleIds"), '[]'::jsonb);
ALTER TABLE "notificacoes"
  ALTER COLUMN "canais" TYPE jsonb
  USING COALESCE(pg_temp.to_jsonb_seguro("canais"), '[]'::jsonb);
