-- =====================================================
-- BASE (PUBLIC): tabelas mínimas para suportar integrações do projeto
-- Data: 10/01/2026
-- Motivo: migrations posteriores referenciam public.emissoes e public.usuarios
-- =====================================================

-- Emissões (mínimo necessário para triggers/mapeamento)
CREATE TABLE IF NOT EXISTS public.emissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_emissao text NOT NULL,
  nome text,
  status text,
  volume_total numeric(18,2),
  cnpj_empresa text,
  categoria_id uuid,
  veiculo_id uuid,
  tipo_oferta_id uuid,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Usuários (mínimo para referências legadas)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Trigger genérico de update timestamp (compat com migration 20260112223601)
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
