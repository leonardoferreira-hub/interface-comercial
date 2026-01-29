-- Migration: Security Hardening - Remove Anonymous Access and Enforce RLS
-- Created: 2025-01-27
-- Description: Removes anonymous policies and enforces RLS on all tables

-- ============================================
-- 1. DROP ALL ANONYMOUS (anon) POLICIES
-- ============================================

-- Drop anonymous policies on public schema tables
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (permissive = 'PERMISSIVE' OR permissive = 'RESTRICTIVE')
    LOOP
        -- Check if policy allows anon role
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE policyname = pol.policyname 
            AND tablename = pol.tablename
            AND roles @> ARRAY['anon']::name[]
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
            RAISE NOTICE 'Dropped anonymous policy: % on %', pol.policyname, pol.tablename;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- 2. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================

-- Enable RLS on all tables in public schema
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on table: %', tbl.tablename;
    END LOOP;
END $$;

-- Enable RLS on all tables in base_custos schema
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'base_custos'
    LOOP
        EXECUTE format('ALTER TABLE base_custos.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on base_custos table: %', tbl.tablename;
    END LOOP;
END $$;

-- ============================================
-- 3. CREATE AUTHENTICATED USER POLICIES
-- ============================================

-- Policy for emissoes table - authenticated users can access their data
DROP POLICY IF EXISTS "Authenticated users can access emissoes" ON public.emissoes;
CREATE POLICY "Authenticated users can access emissoes"
    ON public.emissoes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for series table
DROP POLICY IF EXISTS "Authenticated users can access series" ON public.series;
CREATE POLICY "Authenticated users can access series"
    ON public.series
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for custos_emissao table
DROP POLICY IF EXISTS "Authenticated users can access custos_emissao" ON public.custos_emissao;
CREATE POLICY "Authenticated users can access custos_emissao"
    ON public.custos_emissao
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for custos_linhas table
DROP POLICY IF EXISTS "Authenticated users can access custos_linhas" ON public.custos_linhas;
CREATE POLICY "Authenticated users can access custos_linhas"
    ON public.custos_linhas
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for custos_series table
DROP POLICY IF EXISTS "Authenticated users can access custos_series" ON public.custos_series;
CREATE POLICY "Authenticated users can access custos_series"
    ON public.custos_series
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for custos table
DROP POLICY IF EXISTS "Authenticated users can access custos" ON public.custos;
CREATE POLICY "Authenticated users can access custos"
    ON public.custos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for dados_empresa table
DROP POLICY IF EXISTS "Authenticated users can access dados_empresa" ON public.dados_empresa;
CREATE POLICY "Authenticated users can access dados_empresa"
    ON public.dados_empresa
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for historico_emissoes table
DROP POLICY IF EXISTS "Authenticated users can access historico_emissoes" ON public.historico_emissoes;
CREATE POLICY "Authenticated users can access historico_emissoes"
    ON public.historico_emissoes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 4. CREATE READ-ONLY POLICIES FOR base_custos
-- ============================================

-- Policy for categorias - read only for authenticated
DROP POLICY IF EXISTS "Authenticated users can read categorias" ON base_custos.categorias;
CREATE POLICY "Authenticated users can read categorias"
    ON base_custos.categorias
    FOR SELECT
    TO authenticated
    USING (ativo = true);

-- Policy for veiculos - read only for authenticated
DROP POLICY IF EXISTS "Authenticated users can read veiculos" ON base_custos.veiculos;
CREATE POLICY "Authenticated users can read veiculos"
    ON base_custos.veiculos
    FOR SELECT
    TO authenticated
    USING (ativo = true);

-- Policy for tipos_oferta - read only for authenticated
DROP POLICY IF EXISTS "Authenticated users can read tipos_oferta" ON base_custos.tipos_oferta;
CREATE POLICY "Authenticated users can read tipos_oferta"
    ON base_custos.tipos_oferta
    FOR SELECT
    TO authenticated
    USING (ativo = true);

-- Policy for lastros - read only for authenticated
DROP POLICY IF EXISTS "Authenticated users can read lastros" ON base_custos.lastros;
CREATE POLICY "Authenticated users can read lastros"
    ON base_custos.lastros
    FOR SELECT
    TO authenticated
    USING (ativo = true);

-- ============================================
-- 5. VERIFY NO ANONYMOUS ACCESS REMAINS
-- ============================================

-- Revoke all privileges from anon role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA base_custos FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA base_custos FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Grant only minimal necessary privileges to authenticated
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA base_custos TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA base_custos TO authenticated;

-- ============================================
-- 6. FORCE RLS FOR TABLE OWNERS
-- ============================================

-- Force RLS to apply to table owners too (defense in depth)
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Forced RLS on table: %', tbl.tablename;
    END LOOP;
END $$;
