-- =====================================================
-- Schema Compliance
-- Data: 28/01/2026
-- =====================================================

-- Criar schema compliance
CREATE SCHEMA IF NOT EXISTS compliance;

-- =====================================================
-- 1. Tabela de CNPJs verificados (base histórica)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.cnpjs_verificados (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj text UNIQUE NOT NULL,
    razao_social text,
    nome_fantasia text,
    situacao_cadastral text,
    data_abertura date,
    atividade_principal text,
    endereco jsonb,
    qsa jsonb,
    status_compliance text NOT NULL DEFAULT 'aprovado' CHECK (status_compliance IN ('aprovado', 'reprovado', 'pendente')),
    observacoes text,
    verificado_por uuid REFERENCES auth.users(id),
    data_verificacao timestamptz DEFAULT now(),
    origem text, -- 'operacao', 'investidor', etc
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cnpjs_verificados_cnpj ON compliance.cnpjs_verificados(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpjs_verificados_status ON compliance.cnpjs_verificados(status_compliance);

-- =====================================================
-- 2. Tabela de verificações pendentes (vindas da estruturação)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.verificacoes_pendentes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid, -- referência à operação na estruturação
    numero_emissao text,
    nome_operacao text,
    cnpj text NOT NULL,
    tipo_entidade text NOT NULL DEFAULT 'emitente' CHECK (tipo_entidade IN ('emitente', 'garantidor', 'devedor', 'avalista', 'outro')),
    nome_entidade text,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'reprovado')),
    observacoes text,
    solicitado_por uuid REFERENCES auth.users(id),
    data_solicitacao timestamptz DEFAULT now(),
    analisado_por uuid REFERENCES auth.users(id),
    data_analise timestamptz,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verificacoes_pendentes_cnpj ON compliance.verificacoes_pendentes(cnpj);
CREATE INDEX IF NOT EXISTS idx_verificacoes_pendentes_status ON compliance.verificacoes_pendentes(status);
CREATE INDEX IF NOT EXISTS idx_verificacoes_pendentes_operacao ON compliance.verificacoes_pendentes(operacao_id);

-- =====================================================
-- 3. Tabela de Investidores (onboarding)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.investidores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf_cnpj text UNIQUE NOT NULL,
    nome text NOT NULL,
    email text,
    telefone text,
    tipo text NOT NULL DEFAULT 'pessoa_fisica' CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica')),
    tipo_investidor text NOT NULL DEFAULT 'varejo' CHECK (tipo_investidor IN ('varejo', 'qualificado', 'profissional')),
    status_onboarding text NOT NULL DEFAULT 'pendente' CHECK (status_onboarding IN ('pendente', 'documentacao_pendente', 'em_analise', 'aprovado', 'reprovado')),
    
    -- Dados do KYC
    kyc_json jsonb,
    
    -- Dados do Suitability
    suitability_json jsonb,
    perfil_risco text, -- 'conservador', 'moderado', 'agressivo'
    
    -- Origem
    indicado_por uuid REFERENCES auth.users(id),
    origem text DEFAULT 'manual', -- 'manual', 'link', 'api'
    
    -- Token para portal (se enviado por link)
    token_acesso text UNIQUE,
    token_expira_em timestamptz,
    
    analisado_por uuid REFERENCES auth.users(id),
    data_analise timestamptz,
    observacoes text,
    
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investidores_cpf_cnpj ON compliance.investidores(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_investidores_status ON compliance.investidores(status_onboarding);
CREATE INDEX IF NOT EXISTS idx_investidores_token ON compliance.investidores(token_acesso);

-- =====================================================
-- 4. Tabela de Documentos do Investidor
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.investidor_documentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investidor_id uuid NOT NULL REFERENCES compliance.investidores(id) ON DELETE CASCADE,
    tipo_documento text NOT NULL CHECK (tipo_documento IN ('kyc', 'suitability', 'ficha_cadastral', 'comprovante_residencia', 'rg_cpf', 'outros')),
    nome_arquivo text NOT NULL,
    url_arquivo text NOT NULL,
    mime_type text,
    tamanho_bytes bigint,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    observacoes text,
    enviado_por uuid REFERENCES auth.users(id),
    data_envio timestamptz DEFAULT now(),
    validado_por uuid REFERENCES auth.users(id),
    data_validacao timestamptz,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_docs_investidor ON compliance.investidor_documentos(investidor_id);
CREATE INDEX IF NOT EXISTS idx_inv_docs_tipo ON compliance.investidor_documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_inv_docs_status ON compliance.investidor_documentos(status);

-- Garantir apenas 1 documento de cada tipo por investidor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doc_por_tipo 
ON compliance.investidor_documentos(investidor_id, tipo_documento) 
WHERE tipo_documento != 'outros';

-- =====================================================
-- 5. View para dashboard (resumo)
-- =====================================================
CREATE OR REPLACE VIEW compliance.v_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM compliance.verificacoes_pendentes WHERE status = 'pendente') as verificacoes_pendentes,
    (SELECT COUNT(*) FROM compliance.verificacoes_pendentes WHERE status = 'em_analise') as verificacoes_em_analise,
    (SELECT COUNT(*) FROM compliance.investidores WHERE status_onboarding = 'pendente') as investidores_pendentes,
    (SELECT COUNT(*) FROM compliance.investidores WHERE status_onboarding = 'em_analise') as investidores_em_analise,
    (SELECT COUNT(*) FROM compliance.cnpjs_verificados WHERE data_verificacao > now() - interval '30 days') as cnpjs_verificados_30d;

-- =====================================================
-- Triggers para atualizar timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION compliance.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cnpjs_verificados
DROP TRIGGER IF EXISTS trigger_cnpjs_verificados ON compliance.cnpjs_verificados;
CREATE TRIGGER trigger_cnpjs_verificados
    BEFORE UPDATE ON compliance.cnpjs_verificados
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

-- Trigger para verificacoes_pendentes
DROP TRIGGER IF EXISTS trigger_verificacoes_pendentes ON compliance.verificacoes_pendentes;
CREATE TRIGGER trigger_verificacoes_pendentes
    BEFORE UPDATE ON compliance.verificacoes_pendentes
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

-- Trigger para investidores
DROP TRIGGER IF EXISTS trigger_investidores ON compliance.investidores;
CREATE TRIGGER trigger_investidores
    BEFORE UPDATE ON compliance.investidores
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

-- Trigger para documentos
DROP TRIGGER IF EXISTS trigger_inv_docs ON compliance.investidor_documentos;
CREATE TRIGGER trigger_inv_docs
    BEFORE UPDATE ON compliance.investidor_documentos
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE compliance.cnpjs_verificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.verificacoes_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.investidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.investidor_documentos ENABLE ROW LEVEL SECURITY;

-- Policies para cnpjs_verificados
CREATE POLICY "compliance_cnpjs_select" ON compliance.cnpjs_verificados FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_cnpjs_insert" ON compliance.cnpjs_verificados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_cnpjs_update" ON compliance.cnpjs_verificados FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies para verificacoes_pendentes
CREATE POLICY "compliance_verif_select" ON compliance.verificacoes_pendentes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_verif_insert" ON compliance.verificacoes_pendentes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_verif_update" ON compliance.verificacoes_pendentes FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies para investidores
CREATE POLICY "compliance_inv_select" ON compliance.investidores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_inv_insert" ON compliance.investidores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_inv_update" ON compliance.investidores FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies para documentos
CREATE POLICY "compliance_docs_select" ON compliance.investidor_documentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_docs_insert" ON compliance.investidor_documentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_docs_update" ON compliance.investidor_documentos FOR UPDATE USING (auth.role() = 'authenticated');

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
