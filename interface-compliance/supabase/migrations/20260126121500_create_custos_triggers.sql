-- =====================================================
-- Triggers de timestamp para custos/prestadores
-- Data: 26/01/2026
-- (Postgres não suporta CREATE TRIGGER IF NOT EXISTS)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_public_prestadores_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'prestadores'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_public_prestadores_updated_at BEFORE UPDATE ON public.prestadores FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_public_custos_emissao_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'custos_emissao'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_public_custos_emissao_updated_at BEFORE UPDATE ON public.custos_emissao FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_public_custos_linhas_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'custos_linhas'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_public_custos_linhas_updated_at BEFORE UPDATE ON public.custos_linhas FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_estr_custos_emissao_updated_at'
      AND n.nspname = 'estruturacao'
      AND c.relname = 'custos_emissao'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_estr_custos_emissao_updated_at BEFORE UPDATE ON estruturacao.custos_emissao FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trigger_estr_custos_linhas_updated_at'
      AND n.nspname = 'estruturacao'
      AND c.relname = 'custos_linhas'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_estr_custos_linhas_updated_at BEFORE UPDATE ON estruturacao.custos_linhas FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
  END IF;
END
$$;
