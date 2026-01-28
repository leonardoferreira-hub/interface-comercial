-- =====================================================
-- DEV (LOCAL): permitir acesso anon (read) controlado por flag
-- Data: 25/01/2026
-- Obs: Para NÃO abrir isso em produção, deixe app_config.allow_anon=false no cloud.
-- =====================================================

-- Tabela simples de config
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value_boolean boolean,
  updated_at timestamptz DEFAULT now()
);

-- Função helper
CREATE OR REPLACE FUNCTION public.allow_anon()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT value_boolean FROM public.app_config WHERE key = 'allow_anon'), false);
$$;

-- Garantir execução
GRANT EXECUTE ON FUNCTION public.allow_anon() TO anon, authenticated;

-- Policies (somente SELECT) para facilitar dev local
DO $$
BEGIN
  -- Operações
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'estruturacao'
      AND tablename = 'operacoes'
      AND policyname = 'dev_anon_select_operacoes'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_operacoes" ON estruturacao.operacoes FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'estruturacao'
      AND tablename = 'operacoes'
      AND policyname = 'dev_anon_update_operacoes'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_update_operacoes" ON estruturacao.operacoes FOR UPDATE TO anon USING (public.allow_anon()) WITH CHECK (public.allow_anon());';
  END IF;

  -- Pendências
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'estruturacao'
      AND tablename = 'pendencias'
      AND policyname = 'dev_anon_select_pendencias'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_pendencias" ON estruturacao.pendencias FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  -- Compliance
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'estruturacao'
      AND tablename = 'compliance_checks'
      AND policyname = 'dev_anon_select_compliance'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_compliance" ON estruturacao.compliance_checks FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  -- Analistas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'estruturacao'
      AND tablename = 'analistas_gestao'
      AND policyname = 'dev_anon_select_analistas'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_analistas" ON estruturacao.analistas_gestao FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  -- Lookups no public
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'categorias'
      AND policyname = 'dev_anon_select_categorias'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_categorias" ON public.categorias FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'veiculos'
      AND policyname = 'dev_anon_select_veiculos'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_veiculos" ON public.veiculos FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  -- Series
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'series'
      AND policyname = 'dev_anon_select_series'
  ) THEN
    EXECUTE 'CREATE POLICY "dev_anon_select_series" ON public.series FOR SELECT TO anon USING (public.allow_anon());';
  END IF;

  -- (Custos policies moved to a later migration, so this file stays order-safe)
END
$$;
