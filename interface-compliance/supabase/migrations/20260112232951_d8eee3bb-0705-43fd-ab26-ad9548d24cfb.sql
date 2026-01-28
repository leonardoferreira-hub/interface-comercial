-- Funções para acessar tabelas do schema base_custos

-- Categorias (CRI, CRA, CR, DEB)
CREATE OR REPLACE FUNCTION public.get_base_custos_categorias()
RETURNS TABLE (
  id uuid,
  nome text,
  codigo text,
  ativo boolean,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, codigo, ativo, created_at 
  FROM base_custos.categorias 
  WHERE ativo = true 
  ORDER BY nome;
$$;

-- Veículos (Patrimônio Separado, Veículo Exclusivo)
CREATE OR REPLACE FUNCTION public.get_base_custos_veiculos()
RETURNS TABLE (
  id uuid,
  nome text,
  codigo text,
  ativo boolean,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, codigo, ativo, created_at 
  FROM base_custos.veiculos 
  WHERE ativo = true 
  ORDER BY nome;
$$;

-- Lastros (Origem, Destinação)
CREATE OR REPLACE FUNCTION public.get_base_custos_lastros()
RETURNS TABLE (
  id uuid,
  nome text,
  codigo text,
  ativo boolean,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, codigo, ativo, created_at 
  FROM base_custos.lastros 
  WHERE ativo = true 
  ORDER BY nome;
$$;

-- Tipos de Oferta (Privada Pura, Privada Cetipada, CVM 160)
CREATE OR REPLACE FUNCTION public.get_base_custos_tipos_oferta()
RETURNS TABLE (
  id uuid,
  nome text,
  codigo text,
  ativo boolean,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, codigo, ativo, created_at 
  FROM base_custos.tipos_oferta 
  WHERE ativo = true 
  ORDER BY nome;
$$;