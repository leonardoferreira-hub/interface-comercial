-- =====================================================
-- Fix: sync triggers were referencing old column names on public.emissoes
-- Data: 27/01/2026
-- Erro visto: record "new" has no field "nome"
-- Causa: funções sync_* usavam NEW.nome/volume_total/cnpj_empresa/etc,
--        mas a tabela atual usa nome_operacao/volume/empresa_cnpj/categoria/veiculo/tipo_oferta.
-- =====================================================

-- Comercial -> Estruturação
CREATE OR REPLACE FUNCTION public.sync_emissao_to_operacao()
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
  IF v_flag = 'operacao' THEN
    RETURN NEW;
  END IF;

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
    COALESCE(NEW.nome_operacao, 'Operação ' || NEW.numero_emissao),
    COALESCE(NEW.volume, 0),
    NEW.empresa_cnpj,
    NEW.categoria,
    NEW.veiculo,
    NEW.tipo_oferta,
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

-- Estruturação -> Comercial
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
    nome_operacao  = NEW.nome_operacao,
    volume         = NEW.volume,
    empresa_cnpj   = NEW.empresa_cnpj,
    categoria      = NEW.categoria_id,
    veiculo        = NEW.veiculo_id,
    tipo_oferta    = NEW.tipo_oferta_id,
    atualizado_em  = COALESCE(NEW.atualizado_em, now())
  WHERE e.id = NEW.id_emissao_comercial
    AND (
      e.atualizado_em IS NULL
      OR COALESCE(NEW.atualizado_em, now()) >= e.atualizado_em
    );

  RETURN NEW;
END;
$$;

-- Trigger "criar_operacao_de_emissao" (cria operação ao aceitar)
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
      COALESCE(NEW.nome_operacao, 'Operação ' || NEW.numero_emissao),
      COALESCE(NEW.volume, 0),
      NEW.empresa_cnpj,
      NEW.categoria,
      NEW.veiculo,
      NEW.tipo_oferta
    )
    ON CONFLICT (id_emissao_comercial) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
