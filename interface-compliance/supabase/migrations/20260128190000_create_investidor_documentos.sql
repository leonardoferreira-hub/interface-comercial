-- =====================================================
-- Documentos do Investidor: KYC, Suitability, Ficha Cadastral
-- Data: 28/01/2026
-- =====================================================

-- Tabela de documentos do investidor
CREATE TABLE IF NOT EXISTS estruturacao.investidor_documentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_investidor uuid NOT NULL REFERENCES estruturacao.investidores(id) ON DELETE CASCADE,
    tipo_documento text NOT NULL CHECK (tipo_documento IN ('kyc', 'suitability', 'ficha_cadastral', 'outros')),
    nome_arquivo text NOT NULL,
    url_arquivo text NOT NULL,
    mime_type text,
    tamanho_bytes bigint,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    observacoes text,
    enviado_por uuid REFERENCES auth.users(id),
    data_envio timestamptz DEFAULT now(),
    data_validacao timestamptz,
    validado_por uuid REFERENCES auth.users(id),
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_investidor_documentos_investidor ON estruturacao.investidor_documentos(id_investidor);
CREATE INDEX IF NOT EXISTS idx_investidor_documentos_tipo ON estruturacao.investidor_documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_investidor_documentos_status ON estruturacao.investidor_documentos(status);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION estruturacao.update_investidor_doc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_investidor_doc_timestamp ON estruturacao.investidor_documentos;
CREATE TRIGGER trigger_update_investidor_doc_timestamp
    BEFORE UPDATE ON estruturacao.investidor_documentos
    FOR EACH ROW EXECUTE FUNCTION estruturacao.update_investidor_doc_timestamp();

-- Garantir que só existe 1 documento de cada tipo por investidor (exceto 'outros')
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doc_por_tipo 
ON estruturacao.investidor_documentos(id_investidor, tipo_documento) 
WHERE tipo_documento != 'outros';

-- RLS
ALTER TABLE estruturacao.investidor_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investidor_docs_select_all" ON estruturacao.investidor_documentos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "investidor_docs_insert_all" ON estruturacao.investidor_documentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "investidor_docs_update_all" ON estruturacao.investidor_documentos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "investidor_docs_delete_all" ON estruturacao.investidor_documentos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
