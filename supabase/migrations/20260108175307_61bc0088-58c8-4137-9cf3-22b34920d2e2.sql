-- 1. Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS base_custos;

-- 2. Configurar search_path para incluir base_custos
ALTER ROLE anon SET search_path TO public, base_custos;
ALTER ROLE authenticated SET search_path TO public, base_custos;
ALTER ROLE service_role SET search_path TO public, base_custos;

-- 3. Conceder permissões no novo schema
GRANT USAGE ON SCHEMA base_custos TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA base_custos TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA base_custos TO service_role;

-- 4. Default privileges para tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA base_custos GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA base_custos GRANT ALL ON TABLES TO service_role;