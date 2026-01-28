-- =====================================================
-- DEV (LOCAL): permitir leitura do audit log para anon quando allow_anon=true
-- Data: 26/01/2026
-- =====================================================

-- Garantir SELECT no objeto
GRANT SELECT ON TABLE public.historico_alteracoes TO anon, authenticated;

-- Habilitar RLS (se já não estiver)
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='historico_alteracoes' AND policyname='dev_anon_select_audit'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_audit" ON public.historico_alteracoes FOR SELECT TO anon USING (public.allow_anon());';
  END IF;
END
$$;
