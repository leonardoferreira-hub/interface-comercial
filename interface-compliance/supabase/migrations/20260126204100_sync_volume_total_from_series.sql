-- =====================================================
-- Keep public.emissoes.volume_total in sync with sum(public.series.valor_emissao)
-- Data: 26/01/2026
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_volume_total_from_series()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_emissao_id uuid;
  v_sum numeric;
BEGIN
  v_emissao_id := COALESCE(NEW.id_emissao, OLD.id_emissao);
  IF v_emissao_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(COALESCE(valor_emissao, 0)), 0)
  INTO v_sum
  FROM public.series
  WHERE id_emissao = v_emissao_id;

  UPDATE public.emissoes
  SET volume_total = v_sum,
      atualizado_em = now()
  WHERE id = v_emissao_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_volume_total_from_series ON public.series;
CREATE TRIGGER trigger_sync_volume_total_from_series
AFTER INSERT OR UPDATE OF valor_emissao OR DELETE
ON public.series
FOR EACH ROW
EXECUTE FUNCTION public.sync_volume_total_from_series();
