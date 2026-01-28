-- =====================================================
-- Fix: sync triggers should bypass RLS on estruturacao.operacoes
-- Data: 27/01/2026
-- Motivo: updates em public.emissoes estavam falhando com
--   "new row violates row-level security policy for table operacoes"
--   quando o trigger tentava INSERT/UPSERT em estruturacao.operacoes.
-- Estratégia: tornar functions SECURITY DEFINER + set search_path.
-- =====================================================

-- 1) Comercial -> Estruturação
CREATE OR REPLACE FUNCTION public.sync_emissao_to_operacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, estruturacao
AS $$
DECLARE
  v_flag text;
BEGIN
  -- anti-loop
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  v_flag := public._sync_get_flag();
  IF v_flag = 'operacao' THEN
    RETURN NEW;
  END IF;

  -- só sincroniza quando status estiver em 'aceita' (pipeline)
  IF NEW.status IS DISTINCT FROM 'aceita' THEN
    RETURN NEW;
  END IF;

  PERFORM public._sync_set_flag('emissao');

  INSERT INTO estruturacao.operacoes (
    id_emissao_comercial,
    numero_emissao,
    nome_operacao,
    volume,
    empresa_cnpj,
    categoria_id,
    veiculo_id,
    tipo_oferta_id,
    atualizado_em
  ) VALUES (
    NEW.id,
    NEW.numero_emissao,
    COALESCE(NEW.nome, 'Operação ' || NEW.numero_emissao),
    COALESCE(NEW.volume_total, 0),
    NEW.cnpj_empresa,
    NEW.categoria_id,
    NEW.veiculo_id,
    NEW.tipo_oferta_id,
    COALESCE(NEW.atualizado_em, now())
  )
  ON CONFLICT (id_emissao_comercial) DO UPDATE
  SET
    numero_emissao = EXCLUDED.numero_emissao,
    nome_operacao  = EXCLUDED.nome_operacao,
    volume         = EXCLUDED.volume,
    empresa_cnpj   = EXCLUDED.empresa_cnpj,
    categoria_id   = EXCLUDED.categoria_id,
    veiculo_id     = EXCLUDED.veiculo_id,
    tipo_oferta_id = EXCLUDED.tipo_oferta_id,
    atualizado_em  = EXCLUDED.atualizado_em
  WHERE estruturacao.operacoes.atualizado_em IS NULL
     OR EXCLUDED.atualizado_em >= estruturacao.operacoes.atualizado_em;

  RETURN NEW;
END;
$$;

-- 2) Estruturação -> Comercial
CREATE OR REPLACE FUNCTION public.sync_operacao_to_emissao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, estruturacao
AS $$
DECLARE
  v_flag text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  v_flag := public._sync_get_flag();
  IF v_flag = 'emissao' THEN
    RETURN NEW;
  END IF;

  IF NEW.id_emissao_comercial IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public._sync_set_flag('operacao');

  UPDATE public.emissoes e
  SET
    numero_emissao = NEW.numero_emissao,
    nome           = NEW.nome_operacao,
    volume_total   = NEW.volume,
    cnpj_empresa   = NEW.empresa_cnpj,
    categoria_id   = NEW.categoria_id,
    veiculo_id     = NEW.veiculo_id,
    tipo_oferta_id = NEW.tipo_oferta_id,
    atualizado_em  = COALESCE(NEW.atualizado_em, now())
  WHERE e.id = NEW.id_emissao_comercial
    AND (
      e.atualizado_em IS NULL
      OR COALESCE(NEW.atualizado_em, now()) >= e.atualizado_em
    );

  RETURN NEW;
END;
$$;

-- 3) Trigger "criar_operacao_de_emissao" também precisa bypass RLS
CREATE OR REPLACE FUNCTION criar_operacao_de_emissao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, estruturacao
AS $$
BEGIN
    IF NEW.status = 'aceita' AND (OLD.status IS NULL OR OLD.status != 'aceita') THEN
        INSERT INTO estruturacao.operacoes (
            id_emissao_comercial,
            numero_emissao,
            nome_operacao,
            volume,
            empresa_cnpj,
            categoria_id,
            veiculo_id,
            tipo_oferta_id
        ) VALUES (
            NEW.id,
            NEW.numero_emissao,
            COALESCE(NEW.nome, 'Operação ' || NEW.numero_emissao),
            COALESCE(NEW.volume_total, 0),
            NEW.cnpj_empresa,
            NEW.categoria_id,
            NEW.veiculo_id,
            NEW.tipo_oferta_id
        )
        ON CONFLICT (id_emissao_comercial) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;
