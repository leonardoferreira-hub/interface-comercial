-- =====================================================
-- BASE_CUSTOS: schema/tabelas mínimas para suportar funções helper
-- Data: 12/01/2026
-- =====================================================

CREATE SCHEMA IF NOT EXISTS base_custos;

CREATE TABLE IF NOT EXISTS base_custos.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS base_custos.veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS base_custos.lastros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS base_custos.tipos_oferta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seeds mínimos
INSERT INTO base_custos.categorias (nome, codigo) VALUES
  ('Imobiliário', 'imobiliario'),
  ('Agronegócio', 'agronegocio')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO base_custos.veiculos (nome, codigo) VALUES
  ('Patrimônio Separado', 'patrimonio_separado'),
  ('Veículo Exclusivo', 'veiculo_exclusivo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO base_custos.lastros (nome, codigo) VALUES
  ('Origem', 'origem'),
  ('Destinação', 'destinacao')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO base_custos.tipos_oferta (nome, codigo) VALUES
  ('Privada Pura', 'privada_pura'),
  ('CVM 160', 'cvm_160')
ON CONFLICT (codigo) DO NOTHING;
