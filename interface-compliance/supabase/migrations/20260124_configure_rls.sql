-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Data: 24/01/2026
-- Descrição: Configuração de segurança e políticas de acesso
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE estruturacao.operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE estruturacao.analistas_gestao ENABLE ROW LEVEL SECURITY;

-- Criar tabela de perfis de usuário (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome text,
    email text,
    perfil text NOT NULL CHECK (perfil IN ('admin', 'gestor_estruturacao', 'analista_estruturacao', 'gestor_gestao')),
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- Função auxiliar para obter perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS text AS $$
DECLARE
    v_profile text;
BEGIN
    SELECT perfil INTO v_profile
    FROM public.user_profiles
    WHERE id = auth.uid();

    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_profile() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é gestor de estruturação
CREATE OR REPLACE FUNCTION public.is_gestor_estruturacao()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_profile() = 'gestor_estruturacao';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é analista de estruturação
CREATE OR REPLACE FUNCTION public.is_analista_estruturacao()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_profile() = 'analista_estruturacao';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é gestor de gestão
CREATE OR REPLACE FUNCTION public.is_gestor_gestao()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_profile() = 'gestor_gestao';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICIES PARA OPERACOES
-- =====================================================

-- Admin tem acesso total
CREATE POLICY "admin_full_access" ON estruturacao.operacoes
    FOR ALL USING (public.is_admin());

-- Gestor de estruturação tem acesso total
CREATE POLICY "gestor_estruturacao_full_access" ON estruturacao.operacoes
    FOR ALL USING (public.is_gestor_estruturacao());

-- Analista de estruturação tem acesso total
CREATE POLICY "analista_estruturacao_full_access" ON estruturacao.operacoes
    FOR ALL USING (public.is_analista_estruturacao());

-- Gestor de gestão pode visualizar todas as operações
CREATE POLICY "gestor_gestao_view_all" ON estruturacao.operacoes
    FOR SELECT USING (public.is_gestor_gestao());

-- Gestor de gestão pode atribuir analistas
CREATE POLICY "gestor_gestao_update_analistas" ON estruturacao.operacoes
    FOR UPDATE USING (public.is_gestor_gestao())
    WITH CHECK (public.is_gestor_gestao());

-- =====================================================
-- POLICIES PARA PENDENCIAS
-- =====================================================

-- Admin, Gestor e Analista de estruturação têm acesso total
CREATE POLICY "full_access_pendencias" ON estruturacao.pendencias
    FOR ALL USING (
        public.is_admin() OR
        public.is_gestor_estruturacao() OR
        public.is_analista_estruturacao()
    );

-- Gestor de gestão pode visualizar pendências
CREATE POLICY "gestor_gestao_view_pendencias" ON estruturacao.pendencias
    FOR SELECT USING (public.is_gestor_gestao());

-- =====================================================
-- POLICIES PARA COMPLIANCE_CHECKS
-- =====================================================

-- Admin, Gestor e Analista de estruturação têm acesso total
CREATE POLICY "full_access_compliance" ON estruturacao.compliance_checks
    FOR ALL USING (
        public.is_admin() OR
        public.is_gestor_estruturacao() OR
        public.is_analista_estruturacao()
    );

-- Gestor de gestão pode visualizar compliance
CREATE POLICY "gestor_gestao_view_compliance" ON estruturacao.compliance_checks
    FOR SELECT USING (public.is_gestor_gestao());

-- =====================================================
-- POLICIES PARA ANALISTAS_GESTAO
-- =====================================================

-- Todos autenticados podem ler a lista de analistas
CREATE POLICY "read_analistas" ON estruturacao.analistas_gestao
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admin pode gerenciar analistas
CREATE POLICY "admin_manage_analistas" ON estruturacao.analistas_gestao
    FOR ALL USING (public.is_admin());

-- =====================================================
-- POLICIES PARA USER_PROFILES
-- =====================================================

-- Habilitar RLS em user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seu próprio perfil
CREATE POLICY "users_view_own_profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Admin pode ver todos os perfis
CREATE POLICY "admin_view_all_profiles" ON public.user_profiles
    FOR SELECT USING (public.is_admin());

-- Admin pode gerenciar todos os perfis
CREATE POLICY "admin_manage_profiles" ON public.user_profiles
    FOR ALL USING (public.is_admin());

-- =====================================================
-- POLICIES PARA HISTORICO_ALTERACOES
-- =====================================================

-- Habilitar RLS em historico_alteracoes
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- Admin pode visualizar todo o histórico
CREATE POLICY "admin_view_audit_log" ON public.historico_alteracoes
    FOR SELECT USING (public.is_admin());

-- Gestor de estruturação pode visualizar histórico de estruturação
CREATE POLICY "gestor_estruturacao_view_audit" ON public.historico_alteracoes
    FOR SELECT USING (
        public.is_gestor_estruturacao() AND
        schema_name = 'estruturacao'
    );

-- =====================================================
-- GRANTS
-- =====================================================

-- Garantir que usuários autenticados possam executar as funções
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gestor_estruturacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_analista_estruturacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gestor_gestao() TO authenticated;

-- Comentários
COMMENT ON FUNCTION public.get_user_profile() IS 'Retorna o perfil do usuário autenticado';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário é administrador';
COMMENT ON FUNCTION public.is_gestor_estruturacao() IS 'Verifica se o usuário é gestor de estruturação';
COMMENT ON FUNCTION public.is_analista_estruturacao() IS 'Verifica se o usuário é analista de estruturação';
COMMENT ON FUNCTION public.is_gestor_gestao() IS 'Verifica se o usuário é gestor de gestão';
