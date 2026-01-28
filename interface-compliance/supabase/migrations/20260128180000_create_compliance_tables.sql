-- =====================================================
-- Compliance: estrutura para gerenciamento de checks de CNPJ
-- Data: 28/01/2026
-- =====================================================

-- 1) Tabela principal de compliance checks
CREATE TABLE IF NOT EXISTS estruturacao.compliance_checks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid NOT NULL REFERENCES estruturacao.operacoes(id) ON DELETE CASCADE,
    cnpj text NOT NULL,
    tipo_entidade text NOT NULL DEFAULT 'emitente' CHECK (tipo_entidade IN ('emitente', 'garantidor', 'devedor', 'avalista', 'outro')),
    nome_entidade text,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'reprovado')),
    observacoes text,
    responsavel_id uuid REFERENCES auth.users(id),
    data_verificacao timestamptz,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_compliance_checks_operacao ON estruturacao.compliance_checks(operacao_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON estruturacao.compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_cnpj ON estruturacao.compliance_checks(cnpj);

-- 2) Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION estruturacao.update_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_compliance_timestamp ON estruturacao.compliance_checks;
CREATE TRIGGER trigger_update_compliance_timestamp
    BEFORE UPDATE ON estruturacao.compliance_checks
    FOR EACH ROW EXECUTE FUNCTION estruturacao.update_compliance_timestamp();

-- 3) Função para verificar se operacao tem compliance completo
CREATE OR REPLACE FUNCTION estruturacao.operacao_compliance_completo(p_operacao_id uuid)
RETURNS boolean AS $$
DECLARE
    v_total integer;
    v_aprovados integer;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM estruturacao.compliance_checks
    WHERE operacao_id = p_operacao_id;
    
    -- Se não tem nenhum check, considera incompleto (CNPJ principal do Comercial deve ser verificado)
    IF v_total = 0 THEN
        RETURN false;
    END IF;
    
    SELECT COUNT(*) INTO v_aprovados
    FROM estruturacao.compliance_checks
    WHERE operacao_id = p_operacao_id AND status = 'aprovado';
    
    RETURN v_total = v_aprovados;
END;
$$ LANGUAGE plpgsql;

-- 4) View para resumo de compliance por operacao
CREATE OR REPLACE VIEW estruturacao.v_operacoes_compliance AS
SELECT 
    o.id as operacao_id,
    o.numero_emissao,
    o.nome_operacao,
    o.status as operacao_status,
    COUNT(c.id) as total_checks,
    COUNT(c.id) FILTER (WHERE c.status = 'pendente') as pendentes,
    COUNT(c.id) FILTER (WHERE c.status = 'em_analise') as em_analise,
    COUNT(c.id) FILTER (WHERE c.status = 'aprovado') as aprovados,
    COUNT(c.id) FILTER (WHERE c.status = 'reprovado') as reprovados,
    CASE 
        WHEN COUNT(c.id) = 0 THEN 'incompleto'
        WHEN COUNT(c.id) FILTER (WHERE c.status != 'aprovado') = 0 THEN 'completo'
        WHEN COUNT(c.id) FILTER (WHERE c.status = 'reprovado') > 0 THEN 'bloqueado'
        ELSE 'pendente'
    END as compliance_status
FROM estruturacao.operacoes o
LEFT JOIN estruturacao.compliance_checks c ON c.operacao_id = o.id
GROUP BY o.id, o.numero_emissao, o.nome_operacao, o.status;

-- 5) RLS policies (basic - ajustar conforme necessidade)
ALTER TABLE estruturacao.compliance_checks ENABLE ROW LEVEL SECURITY;

-- Policy: todos autenticados podem ver
CREATE POLICY "compliance_select_all" ON estruturacao.compliance_checks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: apenas compliance pode modificar (simplificado - ajustar com roles específicas depois)
CREATE POLICY "compliance_modify_compliance" ON estruturacao.compliance_checks
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE estruturacao.compliance_checks IS 'Checks de compliance por CNPJ/entidade';
COMMENT ON COLUMN estruturacao.compliance_checks.tipo_entidade IS 'Tipo: emitente, garantidor, devedor, avalista, outro';
COMMENT ON COLUMN estruturacao.compliance_checks.status IS 'Status: pendente, em_analise, aprovado, reprovado';
