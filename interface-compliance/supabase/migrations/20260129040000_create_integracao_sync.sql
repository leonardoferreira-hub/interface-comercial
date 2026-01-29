-- =====================================================
-- Integração automática entre Comercial, Estruturação e Compliance
-- Data: 29/01/2026
-- =====================================================

-- 1. Trigger: Quando emissão é criada no Comercial → cria operação na Estruturação e verificação no Compliance
CREATE OR REPLACE FUNCTION public.sync_emissao_to_estruturacao_and_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operacao_id uuid;
    v_numero_emissao text;
BEGIN
    -- Gerar número de emissão se não tiver
    v_numero_emissao := COALESCE(
        NEW.numero_emissao,
        'EM-' || TO_CHAR(NEW.data_emissao, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::text, 4, '0')
    );
    
    -- 1. Criar operação na estruturação
    INSERT INTO estruturacao.operacoes (
        id,
        numero_emissao,
        nome_operacao,
        status,
        valor_total,
        data_emissao,
        empresa_cnpj,
        empresa_razao_social,
        origem
    )
    VALUES (
        NEW.id,
        v_numero_emissao,
        COALESCE(NEW.nome_operacao, 'Operação ' || v_numero_emissao),
        'pendente',
        NEW.valor_total,
        NEW.data_emissao,
        NEW.empresa_cnpj,
        NEW.empresa_razao_social,
        'comercial'
    )
    ON CONFLICT (id) DO UPDATE SET
        numero_emissao = EXCLUDED.numero_emissao,
        nome_operacao = EXCLUDED.nome_operacao,
        valor_total = EXCLUDED.valor_total,
        empresa_cnpj = EXCLUDED.empresa_cnpj,
        empresa_razao_social = EXCLUDED.empresa_razao_social,
        atualizado_em = now();
    
    -- 2. Criar verificação no compliance para o CNPJ principal
    IF NEW.empresa_cnpj IS NOT NULL THEN
        INSERT INTO compliance.verificacoes_pendentes (
            operacao_id,
            numero_emissao,
            nome_operacao,
            cnpj,
            tipo_entidade,
            nome_entidade,
            status,
            origem
        )
        VALUES (
            NEW.id,
            v_numero_emissao,
            COALESCE(NEW.nome_operacao, 'Operação ' || v_numero_emissao),
            NEW.empresa_cnpj,
            'emitente',
            NEW.empresa_razao_social,
            'pendente',
            'comercial'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger na tabela emissoes do schema public
DROP TRIGGER IF EXISTS trigger_sync_emissao_to_estruturacao ON public.emissoes;
CREATE TRIGGER trigger_sync_emissao_to_estruturacao
    AFTER INSERT OR UPDATE ON public.emissoes
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_emissao_to_estruturacao_and_compliance();

-- 2. Função para sincronizar CNPJs da estruturação para o compliance
CREATE OR REPLACE FUNCTION estruturacao.sync_cnpjs_to_compliance(p_operacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operacao RECORD;
    v_cnpj RECORD;
BEGIN
    -- Buscar dados da operação
    SELECT * INTO v_operacao
    FROM estruturacao.operacoes
    WHERE id = p_operacao_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Para cada CNPJ de compliance_checks, criar verificação no compliance
    FOR v_cnpj IN
        SELECT * FROM estruturacao.compliance_checks
        WHERE operacao_id = p_operacao_id
    LOOP
        INSERT INTO compliance.verificacoes_pendentes (
            operacao_id,
            numero_emissao,
            nome_operacao,
            cnpj,
            tipo_entidade,
            nome_entidade,
            status,
            origem
        )
        VALUES (
            p_operacao_id,
            v_operacao.numero_emissao,
            v_operacao.nome_operacao,
            v_cnpj.cnpj,
            v_cnpj.tipo_entidade,
            v_cnpj.nome_entidade,
            CASE 
                WHEN v_cnpj.status = 'aprovado' THEN 'aprovado'
                WHEN v_cnpj.status = 'reprovado' THEN 'reprovado'
                ELSE 'pendente'
            END,
            'estruturacao'
        )
        ON CONFLICT (operacao_id, cnpj) WHERE status IN ('pendente', 'em_analise')
        DO UPDATE SET
            tipo_entidade = EXCLUDED.tipo_entidade,
            nome_entidade = EXCLUDED.nome_entidade,
            atualizado_em = now();
    END LOOP;
END;
$$;

-- 3. Trigger automático quando adicionar CNPJ na estruturação
CREATE OR REPLACE FUNCTION estruturacao.auto_sync_compliance_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM estruturacao.sync_cnpjs_to_compliance(NEW.operacao_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_sync_compliance ON estruturacao.compliance_checks;
CREATE TRIGGER trigger_auto_sync_compliance
    AFTER INSERT ON estruturacao.compliance_checks
    FOR EACH ROW
    EXECUTE FUNCTION estruturacao.auto_sync_compliance_check();

-- 4. View unificada para mostrar operações com status de compliance
CREATE OR REPLACE VIEW public.v_operacoes_compliance_unificado AS
SELECT 
    o.id,
    o.numero_emissao,
    o.nome_operacao,
    o.status as status_operacao,
    o.valor_total,
    o.data_emissao,
    o.empresa_cnpj,
    o.empresa_razao_social,
    COUNT(v.id) as total_verificacoes,
    COUNT(v.id) FILTER (WHERE v.status = 'pendente') as pendentes,
    COUNT(v.id) FILTER (WHERE v.status = 'em_analise') as em_analise,
    COUNT(v.id) FILTER (WHERE v.status = 'aprovado') as aprovados,
    COUNT(v.id) FILTER (WHERE v.status = 'reprovado') as reprovados,
    CASE 
        WHEN COUNT(v.id) = 0 THEN 'sem_verificacoes'
        WHEN COUNT(v.id) FILTER (WHERE v.status = 'reprovado') > 0 THEN 'bloqueado'
        WHEN COUNT(v.id) FILTER (WHERE v.status != 'aprovado') = 0 THEN 'aprovado'
        ELSE 'pendente'
    END as status_compliance
FROM estruturacao.operacoes o
LEFT JOIN compliance.verificacoes_pendentes v ON v.operacao_id = o.id
GROUP BY o.id, o.numero_emissao, o.nome_operacao, o.status, o.valor_total, o.data_emissao, o.empresa_cnpj, o.empresa_razao_social;

-- Grants
GRANT SELECT ON public.v_operacoes_compliance_unificado TO authenticated;
GRANT EXECUTE ON FUNCTION estruturacao.sync_cnpjs_to_compliance(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
