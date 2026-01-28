-- =====================================================
-- Fix RLS for compliance_checks
-- Data: 28/01/2026
-- Problema: INSERT estava falhando com "violates row-level security policy"
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "compliance_select_all" ON estruturacao.compliance_checks;
DROP POLICY IF EXISTS "compliance_modify_compliance" ON estruturacao.compliance_checks;

-- Política SELECT: todos autenticados podem ver
CREATE POLICY "compliance_select_all" ON estruturacao.compliance_checks
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Política INSERT: todos autenticados podem inserir
CREATE POLICY "compliance_insert_all" ON estruturacao.compliance_checks
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Política UPDATE: todos autenticados podem atualizar
CREATE POLICY "compliance_update_all" ON estruturacao.compliance_checks
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política DELETE: todos autenticados podem deletar
CREATE POLICY "compliance_delete_all" ON estruturacao.compliance_checks
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
