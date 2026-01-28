-- =====================================================
-- Bidirectional sync (last-write-wins):
-- public.custos_emissao <-> estruturacao.custos_emissao
-- public.custos_linhas  <-> estruturacao.custos_linhas
-- Data: 26/01/2026
-- =====================================================

-- Helpers already created in 20260126090000_bidirectional_sync_emissoes_operacoes.sql:
--   public._sync_set_flag(flag)
--   public._sync_get_flag()

-- 1) custos_emissao: public -> estruturacao
CREATE OR REPLACE FUNCTION public.sync_custos_emissao_to_estr()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_flag text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  v_flag := public._sync_get_flag();
  IF v_flag = 'estr_custos' THEN
    RETURN NEW;
  END IF;

  PERFORM public._sync_set_flag('pub_custos');

  INSERT INTO estruturacao.custos_emissao (
    id,
    id_emissao_comercial,
    versao,
    total_upfront,
    total_anual,
    total_mensal,
    total_primeiro_ano,
    total_anos_subsequentes,
    criado_em,
    atualizado_em
  ) VALUES (
    NEW.id,
    NEW.id_emissao,
    NEW.versao,
    NEW.total_upfront,
    NEW.total_anual,
    NEW.total_mensal,
    NEW.total_primeiro_ano,
    NEW.total_anos_subsequentes,
    NEW.criado_em,
    NEW.atualizado_em
  )
  ON CONFLICT (id_emissao_comercial) DO UPDATE
  SET
    id = EXCLUDED.id,
    versao = EXCLUDED.versao,
    total_upfront = EXCLUDED.total_upfront,
    total_anual = EXCLUDED.total_anual,
    total_mensal = EXCLUDED.total_mensal,
    total_primeiro_ano = EXCLUDED.total_primeiro_ano,
    total_anos_subsequentes = EXCLUDED.total_anos_subsequentes,
    atualizado_em = EXCLUDED.atualizado_em
  WHERE estruturacao.custos_emissao.atualizado_em IS NULL
     OR EXCLUDED.atualizado_em >= estruturacao.custos_emissao.atualizado_em;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_pub_custos_emissao ON public.custos_emissao;
CREATE TRIGGER trigger_sync_pub_custos_emissao
AFTER INSERT OR UPDATE ON public.custos_emissao
FOR EACH ROW EXECUTE FUNCTION public.sync_custos_emissao_to_estr();


-- 2) custos_emissao: estruturacao -> public
CREATE OR REPLACE FUNCTION public.sync_custos_emissao_to_pub()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_flag text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  v_flag := public._sync_get_flag();
  IF v_flag = 'pub_custos' THEN
    RETURN NEW;
  END IF;

  PERFORM public._sync_set_flag('estr_custos');

  INSERT INTO public.custos_emissao (
    id,
    id_emissao,
    versao,
    total_upfront,
    total_anual,
    total_mensal,
    total_primeiro_ano,
    total_anos_subsequentes,
    criado_em,
    atualizado_em
  ) VALUES (
    NEW.id,
    NEW.id_emissao_comercial,
    NEW.versao,
    NEW.total_upfront,
    NEW.total_anual,
    NEW.total_mensal,
    NEW.total_primeiro_ano,
    NEW.total_anos_subsequentes,
    NEW.criado_em,
    NEW.atualizado_em
  )
  ON CONFLICT (id_emissao) DO UPDATE
  SET
    id = EXCLUDED.id,
    versao = EXCLUDED.versao,
    total_upfront = EXCLUDED.total_upfront,
    total_anual = EXCLUDED.total_anual,
    total_mensal = EXCLUDED.total_mensal,
    total_primeiro_ano = EXCLUDED.total_primeiro_ano,
    total_anos_subsequentes = EXCLUDED.total_anos_subsequentes,
    atualizado_em = EXCLUDED.atualizado_em
  WHERE public.custos_emissao.atualizado_em IS NULL
     OR EXCLUDED.atualizado_em >= public.custos_emissao.atualizado_em;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_estr_custos_emissao ON estruturacao.custos_emissao;
CREATE TRIGGER trigger_sync_estr_custos_emissao
AFTER INSERT OR UPDATE ON estruturacao.custos_emissao
FOR EACH ROW EXECUTE FUNCTION public.sync_custos_emissao_to_pub();


-- 3) custos_linhas: public -> estruturacao
CREATE OR REPLACE FUNCTION public.sync_custos_linhas_to_estr()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_flag text;
  v_estr_custos_id uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  v_flag := public._sync_get_flag();
  IF v_flag = 'estr_custos' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public._sync_set_flag('pub_custos');

  -- map custos_emissao id -> estruturacao.custos_emissao.id
  SELECT ce.id INTO v_estr_custos_id
  FROM estruturacao.custos_emissao ce
  WHERE ce.id_emissao_comercial = (SELECT id_emissao FROM public.custos_emissao WHERE id = COALESCE(NEW.id_custos_emissao, OLD.id_custos_emissao));

  IF v_estr_custos_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM estruturacao.custos_linhas WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO estruturacao.custos_linhas (
    id,
    id_custos_emissao,
    papel,
    id_prestador,
    tipo_preco,
    preco_upfront,
    preco_recorrente,
    periodicidade,
    gross_up,
    valor_upfront_bruto,
    valor_recorrente_bruto,
    criado_em,
    atualizado_em
  ) VALUES (
    NEW.id,
    v_estr_custos_id,
    NEW.papel,
    NEW.id_prestador,
    NEW.tipo_preco,
    NEW.preco_upfront,
    NEW.preco_recorrente,
    NEW.periodicidade,
    NEW.gross_up,
    NEW.valor_upfront_bruto,
    NEW.valor_recorrente_bruto,
    NEW.criado_em,
    NEW.atualizado_em
  )
  ON CONFLICT (id) DO UPDATE
  SET
    papel = EXCLUDED.papel,
    id_prestador = EXCLUDED.id_prestador,
    tipo_preco = EXCLUDED.tipo_preco,
    preco_upfront = EXCLUDED.preco_upfront,
    preco_recorrente = EXCLUDED.preco_recorrente,
    periodicidade = EXCLUDED.periodicidade,
    gross_up = EXCLUDED.gross_up,
    valor_upfront_bruto = EXCLUDED.valor_upfront_bruto,
    valor_recorrente_bruto = EXCLUDED.valor_recorrente_bruto,
    atualizado_em = EXCLUDED.atualizado_em
  WHERE estruturacao.custos_linhas.atualizado_em IS NULL
     OR EXCLUDED.atualizado_em >= estruturacao.custos_linhas.atualizado_em;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_pub_custos_linhas ON public.custos_linhas;
CREATE TRIGGER trigger_sync_pub_custos_linhas
AFTER INSERT OR UPDATE OR DELETE ON public.custos_linhas
FOR EACH ROW EXECUTE FUNCTION public.sync_custos_linhas_to_estr();


-- 4) custos_linhas: estruturacao -> public
CREATE OR REPLACE FUNCTION public.sync_custos_linhas_to_pub()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_flag text;
  v_pub_custos_id uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  v_flag := public._sync_get_flag();
  IF v_flag = 'pub_custos' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public._sync_set_flag('estr_custos');

  -- map estruturacao.custos_emissao.id -> public.custos_emissao.id
  SELECT pe.id INTO v_pub_custos_id
  FROM public.custos_emissao pe
  WHERE pe.id_emissao = (SELECT id_emissao_comercial FROM estruturacao.custos_emissao WHERE id = COALESCE(NEW.id_custos_emissao, OLD.id_custos_emissao));

  IF v_pub_custos_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.custos_linhas WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.custos_linhas (
    id,
    id_custos_emissao,
    papel,
    id_prestador,
    tipo_preco,
    preco_upfront,
    preco_recorrente,
    periodicidade,
    gross_up,
    valor_upfront_bruto,
    valor_recorrente_bruto,
    criado_em,
    atualizado_em
  ) VALUES (
    NEW.id,
    v_pub_custos_id,
    NEW.papel,
    NEW.id_prestador,
    NEW.tipo_preco,
    NEW.preco_upfront,
    NEW.preco_recorrente,
    NEW.periodicidade,
    NEW.gross_up,
    NEW.valor_upfront_bruto,
    NEW.valor_recorrente_bruto,
    NEW.criado_em,
    NEW.atualizado_em
  )
  ON CONFLICT (id) DO UPDATE
  SET
    papel = EXCLUDED.papel,
    id_prestador = EXCLUDED.id_prestador,
    tipo_preco = EXCLUDED.tipo_preco,
    preco_upfront = EXCLUDED.preco_upfront,
    preco_recorrente = EXCLUDED.preco_recorrente,
    periodicidade = EXCLUDED.periodicidade,
    gross_up = EXCLUDED.gross_up,
    valor_upfront_bruto = EXCLUDED.valor_upfront_bruto,
    valor_recorrente_bruto = EXCLUDED.valor_recorrente_bruto,
    atualizado_em = EXCLUDED.atualizado_em
  WHERE public.custos_linhas.atualizado_em IS NULL
     OR EXCLUDED.atualizado_em >= public.custos_linhas.atualizado_em;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_estr_custos_linhas ON estruturacao.custos_linhas;
CREATE TRIGGER trigger_sync_estr_custos_linhas
AFTER INSERT OR UPDATE OR DELETE ON estruturacao.custos_linhas
FOR EACH ROW EXECUTE FUNCTION public.sync_custos_linhas_to_pub();
