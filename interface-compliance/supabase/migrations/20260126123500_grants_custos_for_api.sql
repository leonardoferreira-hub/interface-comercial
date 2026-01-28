-- =====================================================
-- Grants para permitir CRUD nas tabelas de custos via PostgREST (dev/local)
-- Data: 26/01/2026
-- Obs: RLS continua sendo a barreira de linhas; este arquivo só dá privilégio no objeto.
-- =====================================================

-- PUBLIC
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custos_emissao TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custos_linhas TO anon, authenticated;
GRANT SELECT ON TABLE public.prestadores TO anon, authenticated;

-- ESTRUTURACAO
GRANT USAGE ON SCHEMA estruturacao TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE estruturacao.custos_emissao TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE estruturacao.custos_linhas TO anon, authenticated;
