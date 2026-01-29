-- =====================================================
-- Funções para gestão de documentos do investidor
-- =====================================================

-- 1. Adicionar documento
CREATE OR REPLACE FUNCTION adicionar_documento_investidor(
    p_investidor_id uuid,
    p_tipo_documento text,
    p_nome_arquivo text,
    p_url_arquivo text,
    p_mime_type text,
    p_tamanho_bytes bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    -- Remover documento anterior do mesmo tipo (se existir)
    DELETE FROM compliance.investidor_documentos
    WHERE investidor_id = p_investidor_id
      AND tipo_documento = p_tipo_documento
      AND tipo_documento != 'outros';
    
    -- Inserir novo documento
    INSERT INTO compliance.investidor_documentos (
        investidor_id,
        tipo_documento,
        nome_arquivo,
        url_arquivo,
        mime_type,
        tamanho_bytes,
        status,
        enviado_por
    )
    VALUES (
        p_investidor_id,
        p_tipo_documento,
        p_nome_arquivo,
        p_url_arquivo,
        p_mime_type,
        p_tamanho_bytes,
        'pendente',
        auth.uid()
    )
    RETURNING to_jsonb(*) INTO v_result;
    
    -- Atualizar status do investidor
    UPDATE compliance.investidores
    SET status_onboarding = 'em_analise'
    WHERE id = p_investidor_id
      AND status_onboarding = 'documentacao_pendente';
    
    RETURN v_result;
END;
$$;

-- 2. Remover documento
CREATE OR REPLACE FUNCTION remover_documento_investidor(p_documento_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM compliance.investidor_documentos
    WHERE id = p_documento_id;
    
    RETURN FOUND;
END;
$$;

-- 3. Validar documento (aprovar/rejeitar)
CREATE OR REPLACE FUNCTION validar_documento_investidor(
    p_documento_id uuid,
    p_status text,
    p_observacoes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_investidor_id uuid;
    v_result json;
BEGIN
    -- Atualizar documento
    UPDATE compliance.investidor_documentos
    SET 
        status = p_status,
        observacoes = p_observacoes,
        validado_por = auth.uid(),
        data_validacao = now()
    WHERE id = p_documento_id
    RETURNING investidor_id, to_jsonb(*) INTO v_investidor_id, v_result;
    
    -- Verificar se todos documentos obrigatórios estão aprovados
    IF p_status = 'aprovado' THEN
        IF NOT EXISTS (
            SELECT 1 FROM compliance.investidor_documentos
            WHERE investidor_id = v_investidor_id
              AND tipo_documento IN ('kyc', 'suitability', 'ficha_cadastral')
              AND status != 'aprovado'
        ) THEN
            -- Verificar se há documentos obrigatórios pendentes de envio
            IF NOT EXISTS (
                SELECT 1 FROM compliance.investidor_documentos
                WHERE investidor_id = v_investidor_id
                  AND tipo_documento IN ('kyc', 'suitability', 'ficha_cadastral')
            ) THEN
                -- Ainda faltam documentos
                NULL;
            ELSE
                -- Todos documentos enviados estão aprovados
                UPDATE compliance.investidores
                SET status_onboarding = 'aprovado'
                WHERE id = v_investidor_id
                  AND status_onboarding = 'em_analise';
            END IF;
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$;

-- 4. Listar documentos por investidor
CREATE OR REPLACE FUNCTION listar_documentos_investidor(p_investidor_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.data_envio DESC)
    INTO v_result
    FROM compliance.investidor_documentos d
    WHERE d.investidor_id = p_investidor_id;
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION adicionar_documento_investidor(uuid, text, text, text, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION remover_documento_investidor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validar_documento_investidor(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION listar_documentos_investidor(uuid) TO authenticated;

-- Criar bucket no storage (executar no painel do Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('investidor-documentos', 'investidor-documentos', true);

NOTIFY pgrst, 'reload schema';
