-- =====================================================
-- AUDIT LOG: incluir alterações relevantes do schema public (custos, series)
-- Data: 26/01/2026
-- =====================================================

-- Criar triggers de auditoria para tabelas que aparecem na interface.
-- Usa a função public.log_alteracao() criada em 20260124091000_create_triggers_functions.sql

DO $$
BEGIN
  -- Estruturação (despesas): custos_emissao + custos_linhas
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'audit_custos_emissao'
      AND n.nspname = 'estruturacao'
      AND c.relname = 'custos_emissao'
  ) THEN
    EXECUTE 'CREATE TRIGGER audit_custos_emissao AFTER INSERT OR UPDATE OR DELETE ON estruturacao.custos_emissao FOR EACH ROW EXECUTE FUNCTION public.log_alteracao();';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'audit_custos_linhas'
      AND n.nspname = 'estruturacao'
      AND c.relname = 'custos_linhas'
  ) THEN
    EXECUTE 'CREATE TRIGGER audit_custos_linhas AFTER INSERT OR UPDATE OR DELETE ON estruturacao.custos_linhas FOR EACH ROW EXECUTE FUNCTION public.log_alteracao();';
  END IF;

  -- Comercial (séries): public.series
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'audit_series'
      AND n.nspname = 'public'
      AND c.relname = 'series'
  ) THEN
    EXECUTE 'CREATE TRIGGER audit_series AFTER INSERT OR UPDATE OR DELETE ON public.series FOR EACH ROW EXECUTE FUNCTION public.log_alteracao();';
  END IF;
END
$$;

-- Ajustar policy para permitir que gestor de estruturação visualize audit do que é relevante
-- (mantendo o resto do audit log privado).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'historico_alteracoes'
      AND policyname = 'gestor_estruturacao_view_audit'
  ) THEN
    EXECUTE 'DROP POLICY "gestor_estruturacao_view_audit" ON public.historico_alteracoes;';
  END IF;

  EXECUTE 'CREATE POLICY "gestor_estruturacao_view_audit" ON public.historico_alteracoes '
    || 'FOR SELECT USING ( '
    || 'public.is_gestor_estruturacao() AND ( '
    || '  schema_name = ''estruturacao'' '
    || '  OR (schema_name = ''public'' AND table_name IN (''series'')) '
    || ') '
    || ');';
END
$$;
