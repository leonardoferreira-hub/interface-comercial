-- Adicionar coluna prazo na tabela series
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS prazo integer;
COMMENT ON COLUMN public.series.prazo IS 'Prazo da série em anos';