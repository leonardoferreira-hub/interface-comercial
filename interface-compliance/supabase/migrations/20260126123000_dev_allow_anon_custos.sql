-- =====================================================
-- DEV (LOCAL): permitir anon em custos (public + estruturacao)
-- Data: 26/01/2026
-- Depende de public.allow_anon() (migration 20260124093000_dev_allow_anon_local.sql)
-- =====================================================

DO $$
BEGIN
  -- PUBLIC
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='custos_emissao') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custos_emissao' AND policyname='dev_anon_all_custos_emissao'
    ) THEN
      EXECUTE 'CREATE POLICY "dev_anon_all_custos_emissao" ON public.custos_emissao FOR ALL TO anon USING (public.allow_anon()) WITH CHECK (public.allow_anon());';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='custos_linhas') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custos_linhas' AND policyname='dev_anon_all_custos_linhas'
    ) THEN
      EXECUTE 'CREATE POLICY "dev_anon_all_custos_linhas" ON public.custos_linhas FOR ALL TO anon USING (public.allow_anon()) WITH CHECK (public.allow_anon());';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='prestadores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prestadores' AND policyname='dev_anon_select_prestadores'
    ) THEN
      EXECUTE 'CREATE POLICY "dev_anon_select_prestadores" ON public.prestadores FOR SELECT TO anon USING (public.allow_anon());';
    END IF;
  END IF;

  -- ESTRUTURACAO
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='estruturacao' AND c.relname='custos_emissao') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='estruturacao' AND tablename='custos_emissao' AND policyname='dev_anon_all_estr_custos_emissao'
    ) THEN
      EXECUTE 'CREATE POLICY "dev_anon_all_estr_custos_emissao" ON estruturacao.custos_emissao FOR ALL TO anon USING (public.allow_anon()) WITH CHECK (public.allow_anon());';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='estruturacao' AND c.relname='custos_linhas') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='estruturacao' AND tablename='custos_linhas' AND policyname='dev_anon_all_estr_custos_linhas'
    ) THEN
      EXECUTE 'CREATE POLICY "dev_anon_all_estr_custos_linhas" ON estruturacao.custos_linhas FOR ALL TO anon USING (public.allow_anon()) WITH CHECK (public.allow_anon());';
    END IF;
  END IF;
END
$$;
