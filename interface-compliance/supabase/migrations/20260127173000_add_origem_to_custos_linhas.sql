-- =====================================================
-- Custos: marcar origem das linhas (manual vs auto)
-- Data: 27/01/2026
-- Objetivo: permitir recalcular e substituir apenas custos automáticos,
-- mantendo custos manuais (evita sobrar B3/CVM/ANBIMA indevidos após troca de combinação)
-- =====================================================

ALTER TABLE public.custos_linhas
ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual';

-- backfill (caso existam registros antigos)
UPDATE public.custos_linhas
SET origem = 'manual'
WHERE origem IS NULL;
