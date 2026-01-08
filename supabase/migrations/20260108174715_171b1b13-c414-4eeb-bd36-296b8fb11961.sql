-- Adicionar colunas de Registro B3 e Custódia B3 na tabela custos_series
ALTER TABLE custos_series 
  ADD COLUMN IF NOT EXISTS registro_b3 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custodia_b3 numeric DEFAULT 0;

COMMENT ON COLUMN custos_series.registro_b3 IS 'Custo de Registro B3 para esta série';
COMMENT ON COLUMN custos_series.custodia_b3 IS 'Custo de Custódia B3 para esta série';

-- Adicionar constraint unique para suportar upsert
ALTER TABLE custos_series 
  DROP CONSTRAINT IF EXISTS custos_series_id_serie_papel_key;

ALTER TABLE custos_series 
  ADD CONSTRAINT custos_series_id_serie_papel_key UNIQUE (id_serie, papel);