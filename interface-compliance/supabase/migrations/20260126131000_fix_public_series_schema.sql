-- =====================================================
-- Fix schema public.series to match app types/hooks
-- Data: 26/01/2026
-- Objetivo: alinhar a tabela local (emissao_id/volume/created_at) com o que o frontend espera
-- =====================================================

DO $$
BEGIN
  -- Renames (only if old columns exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='emissao_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='id_emissao'
  ) THEN
    EXECUTE 'ALTER TABLE public.series RENAME COLUMN emissao_id TO id_emissao';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='volume'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='valor_emissao'
  ) THEN
    EXECUTE 'ALTER TABLE public.series RENAME COLUMN volume TO valor_emissao';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='criado_em'
  ) THEN
    EXECUTE 'ALTER TABLE public.series RENAME COLUMN created_at TO criado_em';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='series' AND column_name='atualizado_em'
  ) THEN
    EXECUTE 'ALTER TABLE public.series RENAME COLUMN updated_at TO atualizado_em';
  END IF;
END
$$;

-- Add missing columns used by UI
ALTER TABLE public.series
  ADD COLUMN IF NOT EXISTS numero integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS taxa_juros numeric(18,6),
  ADD COLUMN IF NOT EXISTS prazo integer,
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS percentual_volume numeric(18,6);

-- Ensure defaults for app naming
ALTER TABLE public.series
  ALTER COLUMN criado_em SET DEFAULT now();
ALTER TABLE public.series
  ALTER COLUMN atualizado_em SET DEFAULT now();

-- Index + uniqueness
CREATE INDEX IF NOT EXISTS idx_series_id_emissao ON public.series(id_emissao);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'series_id_emissao_numero_uniq'
  ) THEN
    EXECUTE 'ALTER TABLE public.series ADD CONSTRAINT series_id_emissao_numero_uniq UNIQUE (id_emissao, numero)';
  END IF;
END
$$;

-- Trigger de updated_at (reusa função já existente no projeto)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE t.tgname='trigger_public_series_updated_at'
      AND n.nspname='public'
      AND c.relname='series'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_public_series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();';
  END IF;
END
$$;
