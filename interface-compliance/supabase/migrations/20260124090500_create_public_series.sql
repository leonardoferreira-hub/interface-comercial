-- =====================================================
-- PUBLIC: tabela series (mínimo) para relacionar com emissoes
-- Data: 24/01/2026
-- =====================================================

CREATE TABLE IF NOT EXISTS public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emissao_id uuid NOT NULL REFERENCES public.emissoes(id) ON DELETE CASCADE,
  codigo text,
  nome text,
  volume numeric(18,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_series_emissao_id ON public.series(emissao_id);
