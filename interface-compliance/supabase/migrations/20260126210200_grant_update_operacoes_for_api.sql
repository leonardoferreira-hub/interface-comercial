-- =====================================================
-- Grants: allow API roles to UPDATE estruturacao.operacoes (dev / local)
-- Data: 26/01/2026
-- =====================================================

GRANT UPDATE ON TABLE estruturacao.operacoes TO anon, authenticated;
