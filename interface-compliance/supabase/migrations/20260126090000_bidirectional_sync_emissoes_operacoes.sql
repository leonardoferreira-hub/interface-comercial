-- =====================================================
-- Bidirectional sync (last-write-wins): public.emissoes <-> estruturacao.operacoes
-- Data: 26/01/2026
-- Objetivo: manter campos espelhados sincronizados entre comercial (public) e estruturação (schema estruturacao)
-- Regras:
--  - Last-write-wins via timestamp (atualizado_em)
--  - Proteção anti-loop: pg_trigger_depth() + flag em session (set_config)
-- =====================================================

-- Helper: set a session flag to prevent ping-pong updates
CREATE OR REPLACE FUNCTION public._sync_set_flag(flag text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.sync_origin', flag, true);
END;
$$;

CREATE OR REPLACE FUNCTION public._sync_get_flag()
RETURNS text
LANGUAGE sql
AS $$
  SELECT current_setting('app.sync_origin', true);
$$;

-- 1) Comercial -> Estruturação
CREATE OR REPLACE FUNCTION public.sync_emissao_to_operacao()
RETURNS trigger
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trigger_sync_emissao_to_operacao ON public.emissoes;
CREATE TRIGGER trigger_sync_emissao_to_operacao
AFTER INSERT OR UPDATE OF
  status,
  numero_emissao,
  nome,
  volume_total,
  cnpj_empresa,
  categoria_id,
  veiculo_id,
  tipo_oferta_id,
  atualizado_em
ON public.emissoes
FOR EACH ROW
EXECUTE FUNCTION public.sync_emissao_to_operacao();


-- 2) Estruturação -> Comercial
CREATE OR REPLACE FUNCTION public.sync_operacao_to_emissao()
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

DROP TRIGGER IF EXISTS trigger_sync_operacao_to_emissao ON estruturacao.operacoes;
CREATE TRIGGER trigger_sync_operacao_to_emissao
AFTER UPDATE OF
  numero_emissao,
  nome_operacao,
  volume,
  empresa_cnpj,
  categoria_id,
  veiculo_id,
  tipo_oferta_id,
  atualizado_em
ON estruturacao.operacoes
FOR EACH ROW
EXECUTE FUNCTION public.sync_operacao_to_emissao();
