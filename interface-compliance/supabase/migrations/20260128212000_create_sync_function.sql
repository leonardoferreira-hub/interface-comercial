-- =====================================================
-- Função para sincronizar CNPJ da Estruturação para Compliance
-- =====================================================

CREATE OR REPLACE FUNCTION compliance.sincronizar_cnpj_para_compliance(
  p_operacao_id uuid,
  p_numero_emissao text,
  p_nome_operacao text,
  p_cnpj text,
  p_tipo_entidade text DEFAULT 'emitente',
  p_nome_entidade text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Verificar se já existe verificação pendente para este CNPJ nesta operação
  SELECT id INTO v_id
  FROM compliance.verificacoes_pendentes
  WHERE operacao_id = p_operacao_id 
    AND cnpj = p_cnpj
    AND status IN ('pendente', 'em_analise');
  
  -- Se já existe, retorna o ID existente
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;
  
  -- Verificar se CNPJ já foi verificado anteriormente (aprovado/reprovado)
  SELECT id INTO v_id
  FROM compliance.cnpjs_verificados
  WHERE cnpj = p_cnpj;
  
  -- Se já foi verificado antes, podemos copiar o status
  IF v_id IS NOT NULL THEN
    INSERT INTO compliance.verificacoes_pendentes (
      operacao_id,
      numero_emissao,
      nome_operacao,
      cnpj,
      tipo_entidade,
      nome_entidade,
      status,
      observacoes
    )
    SELECT 
      p_operacao_id,
      p_numero_emissao,
      p_nome_operacao,
      p_cnpj,
      p_tipo_entidade,
      COALESCE(p_nome_entidade, razao_social),
      CASE 
        WHEN status_compliance = 'aprovado' THEN 'aprovado'::text
        WHEN status_compliance = 'reprovado' THEN 'reprovado'::text
        ELSE 'pendente'::text
      END,
      observacoes
    FROM compliance.cnpjs_verificados
    WHERE id = v_id
    RETURNING id INTO v_id;
    
    RETURN v_id;
  END IF;
  
  -- Criar nova verificação pendente
  INSERT INTO compliance.verificacoes_pendentes (
    operacao_id,
    numero_emissao,
    nome_operacao,
    cnpj,
    tipo_entidade,
    nome_entidade,
    status,
    solicitado_por
  )
  VALUES (
    p_operacao_id,
    p_numero_emissao,
    p_nome_operacao,
    p_cnpj,
    p_tipo_entidade,
    p_nome_entidade,
    'pendente',
    auth.uid()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION compliance.sincronizar_cnpj_para_compliance IS 
'Sincroniza um CNPJ da estruturação para o compliance.
Se já existe verificação pendente, retorna o ID existente.
Se já foi verificado antes, copia o histórico.
Se é novo, cria verificação pendente.';

-- Grant execute para authenticated
GRANT EXECUTE ON FUNCTION compliance.sincronizar_cnpj_para_compliance TO authenticated;

-- Trigger na tabela de compliance_checks do schema estruturacao
-- para sincronizar automaticamente quando um CNPJ é adicionado

CREATE OR REPLACE FUNCTION estruturacao.sync_compliance_check_to_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_operacao RECORD;
BEGIN
  -- Buscar dados da operação
  SELECT 
    o.id,
    o.numero_emissao,
    o.nome_operacao
  INTO v_operacao
  FROM estruturacao.operacoes o
  WHERE o.id = NEW.operacao_id;
  
  -- Chamar função de sincronização no schema compliance
  PERFORM compliance.sincronizar_cnpj_para_compliance(
    NEW.operacao_id,
    v_operacao.numero_emissao,
    v_operacao.nome_operacao,
    NEW.cnpj,
    NEW.tipo_entidade,
    NEW.nome_entidade
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger (se não existir)
DROP TRIGGER IF EXISTS trigger_sync_to_compliance ON estruturacao.compliance_checks;
CREATE TRIGGER trigger_sync_to_compliance
  AFTER INSERT ON estruturacao.compliance_checks
  FOR EACH ROW
  EXECUTE FUNCTION estruturacao.sync_compliance_check_to_compliance();

-- Grant necessários
GRANT USAGE ON SCHEMA compliance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON compliance.verificacoes_pendentes TO authenticated;
GRANT SELECT ON compliance.cnpjs_verificados TO authenticated;

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
