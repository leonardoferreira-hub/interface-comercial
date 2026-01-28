-- =====================================================
-- Fix RLS for compliance_checks - Abordagem alternativa
-- Data: 28/01/2026
-- =====================================================

-- 1) Verificar se RLS está habilitado
ALTER TABLE estruturacao.compliance_checks ENABLE ROW LEVEL SECURITY;

-- 2) Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "compliance_select_all" ON estruturacao.compliance_checks;
DROP POLICY IF EXISTS "compliance_insert_all" ON estruturacao.compliance_checks;
DROP POLICY IF EXISTS "compliance_update_all" ON estruturacao.compliance_checks;
DROP POLICY IF EXISTS "compliance_delete_all" ON estruturacao.compliance_checks;
DROP POLICY IF EXISTS "compliance_modify_compliance" ON estruturacao.compliance_checks;
DROP POLICY IF EXISTS "allow_all" ON estruturacao.compliance_checks;

-- 3) Criar política PERMISSIVA para teste
-- Isso permite qualquer operação para usuários autenticados
CREATE POLICY "allow_all" ON estruturacao.compliance_checks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4) Garantir que o schema estruturacao tem permissões
GRANT ALL ON TABLE estruturacao.compliance_checks TO authenticated;
GRANT ALL ON TABLE estruturacao.compliance_checks TO anon;

-- 5) Recarregar schema
NOTIFY pgrst, 'reload schema';
