-- =====================================================
-- Grants necessários para PostgREST/Supabase expor schema "estruturacao"
-- Data: 25/01/2026
-- =====================================================

-- Permite que anon/authenticated resolvam objetos no schema
GRANT USAGE ON SCHEMA estruturacao TO anon, authenticated;

-- Permite SELECT (RLS ainda controla as linhas)
GRANT SELECT ON ALL TABLES IN SCHEMA estruturacao TO anon, authenticated;

-- Garante que futuras tabelas no schema também herdem SELECT
ALTER DEFAULT PRIVILEGES IN SCHEMA estruturacao
GRANT SELECT ON TABLES TO anon, authenticated;
