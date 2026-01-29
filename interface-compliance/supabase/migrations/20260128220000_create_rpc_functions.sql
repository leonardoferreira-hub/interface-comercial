-- =====================================================
-- Funções RPC para operações de escrita no Compliance
-- =====================================================

-- 1. Atualizar status de verificação
CREATE OR REPLACE FUNCTION atualizar_verificacao(
    p_id uuid,
    p_status text,
    p_observacoes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    UPDATE compliance.verificacoes_pendentes
    SET 
        status = p_status,
        observacoes = p_observacoes,
        data_analise = now(),
        analisado_por = auth.uid()
    WHERE id = p_id
    RETURNING to_jsonb(*) INTO v_result;
    
    -- Se aprovado/reprovado, adicionar ao histórico
    IF p_status IN ('aprovado', 'reprovado') THEN
        INSERT INTO compliance.cnpjs_verificados (
            cnpj, 
            razao_social, 
            status_compliance, 
            observacoes,
            verificado_por,
            origem
        )
        SELECT 
            cnpj,
            nome_entidade,
            p_status,
            p_observacoes,
            auth.uid(),
            'verificacao'
        FROM compliance.verificacoes_pendentes
        WHERE id = p_id
        ON CONFLICT (cnpj) DO UPDATE SET
            status_compliance = p_status,
            observacoes = p_observacoes,
            data_verificacao = now(),
            verificado_por = auth.uid();
    END IF;
    
    RETURN v_result;
END;
$$;

-- 2. Criar investidor
CREATE OR REPLACE FUNCTION criar_investidor(
    p_cpf_cnpj text,
    p_nome text,
    p_email text DEFAULT NULL,
    p_telefone text DEFAULT NULL,
    p_tipo text DEFAULT 'pessoa_fisica',
    p_tipo_investidor text DEFAULT 'varejo'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    INSERT INTO compliance.investidores (
        cpf_cnpj,
        nome,
        email,
        telefone,
        tipo,
        tipo_investidor,
        status_onboarding,
        indicado_por
    )
    VALUES (
        p_cpf_cnpj,
        p_nome,
        p_email,
        p_telefone,
        p_tipo,
        p_tipo_investidor,
        'documentacao_pendente',
        auth.uid()
    )
    RETURNING to_jsonb(*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 3. Atualizar status do investidor
CREATE OR REPLACE FUNCTION atualizar_investidor(
    p_id uuid,
    p_status text,
    p_observacoes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    UPDATE compliance.investidores
    SET 
        status_onboarding = p_status,
        observacoes = p_observacoes,
        data_analise = now(),
        analisado_por = auth.uid()
    WHERE id = p_id
    RETURNING to_jsonb(*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 4. Buscar detalhes do investidor com documentos
CREATE OR REPLACE FUNCTION get_investidor_detalhes(p_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'investidor', to_jsonb(i.*),
        'documentos', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*))
             FROM compliance.investidor_documentos d
             WHERE d.investidor_id = i.id),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM compliance.investidores i
    WHERE i.id = p_id;
    
    RETURN v_result;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION atualizar_verificacao(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION criar_investidor(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION atualizar_investidor(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investidor_detalhes(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
