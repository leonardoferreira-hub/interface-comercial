# Interface Compliance - SQLs e Migração

> **Local temporário:** `interface-comercial/interface-compliance/`
> **Local final:** Repositório próprio `interface-compliance`

---

## 🗄️ SQLs para Rodar no Supabase

Execute na ordem abaixo:

### 1. Criar Schema Compliance (PRIMEIRO)
**Arquivo:** `01_create_compliance_schema.sql`

```sql
-- =====================================================
-- Schema Compliance - Fase 1
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
    origem text,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cnpjs_verificados_cnpj ON compliance.cnpjs_verificados(cnpj);
CREATE INDEX IF NOT EXISTS idx_cnpjs_verificados_status ON compliance.cnpjs_verificados(status_compliance);

-- =====================================================
-- 2. Tabela de verificações pendentes
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance.verificacoes_pendentes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid,
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
    kyc_json jsonb,
    suitability_json jsonb,
    perfil_risco text,
    indicado_por uuid REFERENCES auth.users(id),
    origem text DEFAULT 'manual',
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doc_por_tipo 
ON compliance.investidor_documentos(investidor_id, tipo_documento) 
WHERE tipo_documento != 'outros';

-- =====================================================
-- 5. View para dashboard
-- =====================================================
CREATE OR REPLACE VIEW compliance.v_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM compliance.verificacoes_pendentes WHERE status = 'pendente') as verificacoes_pendentes,
    (SELECT COUNT(*) FROM compliance.verificacoes_pendentes WHERE status = 'em_analise') as verificacoes_em_analise,
    (SELECT COUNT(*) FROM compliance.investidores WHERE status_onboarding = 'pendente') as investidores_pendentes,
    (SELECT COUNT(*) FROM compliance.investidores WHERE status_onboarding = 'em_analise') as investidores_em_analise,
    (SELECT COUNT(*) FROM compliance.cnpjs_verificados WHERE data_verificacao > now() - interval '30 days') as cnpjs_verificados_30d;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION compliance.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cnpjs_verificados ON compliance.cnpjs_verificados;
CREATE TRIGGER trigger_cnpjs_verificados
    BEFORE UPDATE ON compliance.cnpjs_verificados
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

DROP TRIGGER IF EXISTS trigger_verificacoes_pendentes ON compliance.verificacoes_pendentes;
CREATE TRIGGER trigger_verificacoes_pendentes
    BEFORE UPDATE ON compliance.verificacoes_pendentes
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

DROP TRIGGER IF EXISTS trigger_investidores ON compliance.investidores;
CREATE TRIGGER trigger_investidores
    BEFORE UPDATE ON compliance.investidores
    FOR EACH ROW EXECUTE FUNCTION compliance.update_timestamp();

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

CREATE POLICY "compliance_cnpjs_select" ON compliance.cnpjs_verificados FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_cnpjs_insert" ON compliance.cnpjs_verificados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_cnpjs_update" ON compliance.cnpjs_verificados FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "compliance_verif_select" ON compliance.verificacoes_pendentes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_verif_insert" ON compliance.verificacoes_pendentes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_verif_update" ON compliance.verificacoes_pendentes FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "compliance_inv_select" ON compliance.investidores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_inv_insert" ON compliance.investidores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_inv_update" ON compliance.investidores FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "compliance_docs_select" ON compliance.investidor_documentos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_docs_insert" ON compliance.investidor_documentos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "compliance_docs_update" ON compliance.investidor_documentos FOR UPDATE USING (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
```

---

### 2. Inserir Dados de Teste (SEGUNDO)
**Arquivo:** `02_seed_test_data.sql`

```sql
-- =====================================================
-- Dados de teste para Interface Compliance
-- =====================================================

-- 1. CNPJs verificados (base histórica)
INSERT INTO compliance.cnpjs_verificados (cnpj, razao_social, nome_fantasia, situacao_cadastral, status_compliance, observacoes, origem)
VALUES 
  ('38042694000100', 'TRAVESSIA SECURITIZADORA DE CRÉDITOS FINANCEIROS S.A.', 'TRAVESSIA', 'ATIVA', 'aprovado', 'Empresa regular, sem pendências', 'operacao'),
  ('12345678000190', 'EMPRESA TESTE LTDA', 'TESTE', 'ATIVA', 'aprovado', NULL, 'operacao'),
  ('98765432000110', 'OUTRA EMPRESA S.A.', NULL, 'ATIVA', 'reprovado', 'Restrição no Serasa encontrada', 'operacao');

-- 2. Verificações pendentes
INSERT INTO compliance.verificacoes_pendentes (operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade, nome_entidade, status, observacoes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'EM-20260127-0011', 'Operação Teste', '11222333000144', 'emitente', 'EMITENTE NOVO S.A.', 'pendente', NULL),
  ('00000000-0000-0000-0000-000000000001', 'EM-20260127-0011', 'Operação Teste', '44555666000177', 'garantidor', 'GARANTIDOR LTDA', 'em_analise', NULL),
  ('00000000-0000-0000-0000-000000000002', 'EM-20260128-0005', 'Outra Operação', '77888999000122', 'devedor', 'DEVEDOR XYZ S.A.', 'pendente', NULL),
  ('00000000-0000-0000-0000-000000000002', 'EM-20260128-0005', 'Outra Operação', '99000111000133', 'avalista', 'AVALISTA ABC LTDA', 'reprovado', 'CNPJ com restrições na Receita Federal');

-- 3. Investidores
INSERT INTO compliance.investidores (cpf_cnpj, nome, email, telefone, tipo, tipo_investidor, status_onboarding, perfil_risco, origem)
VALUES 
  ('12345678900', 'João Silva', 'joao.silva@email.com', '11999990001', 'pessoa_fisica', 'qualificado', 'pendente', NULL, 'manual'),
  ('98765432100', 'Maria Santos', 'maria.santos@email.com', '11999990002', 'pessoa_fisica', 'varejo', 'documentacao_pendente', NULL, 'manual'),
  ('11222333000144', 'INVESTIDOR CORPORATIVO LTDA', 'contato@investcorp.com', '1133334444', 'pessoa_juridica', 'profissional', 'em_analise', 'agressivo', 'manual'),
  ('55666777000188', 'JOSE INVESTIDOR', 'jose@email.com', '11999990003', 'pessoa_fisica', 'varejo', 'aprovado', 'moderado', 'manual'),
  ('22333444000199', 'EMPRESA INVESTIDORA S.A.', 'invest@empresa.com', '1155556666', 'pessoa_juridica', 'qualificado', 'reprovado', NULL, 'manual');

-- 4. Documentos
INSERT INTO compliance.investidor_documentos (investidor_id, tipo_documento, nome_arquivo, url_arquivo, status, observacoes)
SELECT id, 'kyc', 'kyc_joao_silva.pdf', 'https://exemplo.com/docs/kyc_joao.pdf', 'pendente', NULL
FROM compliance.investidores WHERE cpf_cnpj = '12345678900';

INSERT INTO compliance.investidor_documentos (investidor_id, tipo_documento, nome_arquivo, url_arquivo, status, observacoes)
SELECT id, 'suitability', 'suitability_maria.pdf', 'https://exemplo.com/docs/suitability_maria.pdf', 'aprovado', NULL
FROM compliance.investidores WHERE cpf_cnpj = '98765432100';

-- Verificar dados
SELECT 'CNPJs Verificados' as tabela, COUNT(*) as total FROM compliance.cnpjs_verificados
UNION ALL
SELECT 'Verificações Pendentes', COUNT(*) FROM compliance.verificacoes_pendentes
UNION ALL
SELECT 'Investidores', COUNT(*) FROM compliance.investidores
UNION ALL
SELECT 'Documentos', COUNT(*) FROM compliance.investidor_documentos;
```

---

### 3. Criar Função de Sincronização (TERCEIRO)
**Arquivo:** `03_create_sync_function.sql`

```sql
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
  -- Verificar se já existe verificação pendente
  SELECT id INTO v_id
  FROM compliance.verificacoes_pendentes
  WHERE operacao_id = p_operacao_id 
    AND cnpj = p_cnpj
    AND status IN ('pendente', 'em_analise');
  
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;
  
  -- Verificar se CNPJ já foi verificado anteriormente
  SELECT id INTO v_id
  FROM compliance.cnpjs_verificados
  WHERE cnpj = p_cnpj;
  
  IF v_id IS NOT NULL THEN
    INSERT INTO compliance.verificacoes_pendentes (
      operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade, nome_entidade,
      status, observacoes
    )
    SELECT 
      p_operacao_id, p_numero_emissao, p_nome_operacao, p_cnpj,
      p_tipo_entidade, COALESCE(p_nome_entidade, razao_social),
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
    operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade, nome_entidade,
    status, solicitado_por
  )
  VALUES (
    p_operacao_id, p_numero_emissao, p_nome_operacao, p_cnpj,
    p_tipo_entidade, p_nome_entidade, 'pendente', auth.uid()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION compliance.sincronizar_cnpj_para_compliance IS 
'Sincroniza um CNPJ da estruturação para o compliance.';

GRANT EXECUTE ON FUNCTION compliance.sincronizar_cnpj_para_compliance TO authenticated;

-- Trigger para sincronização automática
CREATE OR REPLACE FUNCTION estruturacao.sync_compliance_check_to_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_operacao RECORD;
BEGIN
  SELECT o.id, o.numero_emissao, o.nome_operacao
  INTO v_operacao
  FROM estruturacao.operacoes o
  WHERE o.id = NEW.operacao_id;
  
  PERFORM compliance.sincronizar_cnpj_para_compliance(
    NEW.operacao_id, v_operacao.numero_emissao, v_operacao.nome_operacao,
    NEW.cnpj, NEW.tipo_entidade, NEW.nome_entidade
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_to_compliance ON estruturacao.compliance_checks;
CREATE TRIGGER trigger_sync_to_compliance
  AFTER INSERT ON estruturacao.compliance_checks
  FOR EACH ROW
  EXECUTE FUNCTION estruturacao.sync_compliance_check_to_compliance();

-- Grants
GRANT USAGE ON SCHEMA compliance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON compliance.verificacoes_pendentes TO authenticated;
GRANT SELECT ON compliance.cnpjs_verificados TO authenticated;

NOTIFY pgrst, 'reload schema';
```

---

## 📦 Guia de Migração para Repositório Próprio

### Quando tiver acesso ao PC:

#### Opção 1: Via Git (Recomendado)

```bash
# 1. Acesse a pasta do projeto
 cd Documents\GitHub\interface-comercial\interface-compliance

# 2. Inicialize git (se necessário)
 git init

# 3. Crie repositório no GitHub (manualmente em github.com)
# Nome: interface-compliance

# 4. Adicione remote
 git remote add origin https://github.com/leonardoferreira-hub/interface-compliance.git

# 5. Faça push
 git branch -M main
 git push -u origin main
```

#### Opção 2: Cópia Manual

```bash
# 1. Crie nova pasta
 mkdir C:\Users\Leonardo\Documents\GitHub\interface-compliance-new
 cd C:\Users\Leonardo\Documents\GitHub\interface-compliance-new

# 2. Copie os arquivos essenciais
 xcopy /E /I "..\interface-comercial\interface-compliance\src" .
 xcopy /E /I "..\interface-comercial\interface-compliance\supabase" .
 copy "..\interface-comercial\interface-compliance\package.json" .
 copy "..\interface-comercial\interface-compliance\README.md" .
 copy "..\interface-comercial\interface-compliance\index.html" .
 copy "..\interface-comercial\interface-compliance\vite.config.ts" .

# 3. Instale e rode
 npm install
 npm run dev -- --port 5176
```

---

## ✅ Checklist Pós-Migração

- [ ] Criar repositório `interface-compliance` no GitHub
- [ ] Mover código da pasta temporária
- [ ] Verificar se SQLs foram rodados no Supabase
- [ ] Testar dashboard com dados
- [ ] Testar integração Estruturação → Compliance
- [ ] Deletar pasta temporária `interface-comercial/interface-compliance/`

---

## 🚀 URLs Após Migração

| Serviço | URL Local |
|---------|-----------|
| Interface Compliance | http://localhost:5176 |
| Interface Estruturação | http://localhost:5174 |
| Interface Comercial | http://localhost:5173 |

---

**Última atualização:** 28/01/2026
**Autor:** Clawd
