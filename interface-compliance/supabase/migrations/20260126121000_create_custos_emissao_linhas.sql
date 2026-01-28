-- =====================================================
-- Custos (comercial/public) e Custos (estruturação/schema estruturacao)
-- Data: 26/01/2026
-- Notas:
--  - custos_emissao consolida custos_linhas (totais upfront/anual/mensal)
--  - custos_linhas guarda as linhas e referencia prestadores
-- =====================================================

-- Prestadores (mínimo)
CREATE TABLE IF NOT EXISTS public.prestadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Comercial: custos_emissao
CREATE TABLE IF NOT EXISTS public.custos_emissao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_emissao uuid NOT NULL UNIQUE REFERENCES public.emissoes(id) ON DELETE CASCADE,
  versao integer NOT NULL DEFAULT 1,
  total_upfront numeric(18,2) NOT NULL DEFAULT 0,
  total_anual numeric(18,2) NOT NULL DEFAULT 0,
  total_mensal numeric(18,2) NOT NULL DEFAULT 0,
  total_primeiro_ano numeric(18,2) NOT NULL DEFAULT 0,
  total_anos_subsequentes numeric(18,2) NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Comercial: custos_linhas
CREATE TABLE IF NOT EXISTS public.custos_linhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_custos_emissao uuid NOT NULL REFERENCES public.custos_emissao(id) ON DELETE CASCADE,
  papel text,
  id_prestador uuid REFERENCES public.prestadores(id),
  tipo_preco text,
  preco_upfront numeric(18,2) NOT NULL DEFAULT 0,
  preco_recorrente numeric(18,2) NOT NULL DEFAULT 0,
  periodicidade text CHECK (periodicidade IN ('mensal','anual') OR periodicidade IS NULL),
  gross_up numeric(10,4) NOT NULL DEFAULT 0,
  valor_upfront_bruto numeric(18,2) NOT NULL DEFAULT 0,
  valor_recorrente_bruto numeric(18,2) NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custos_emissao_emissao ON public.custos_emissao(id_emissao);
CREATE INDEX IF NOT EXISTS idx_custos_linhas_custos ON public.custos_linhas(id_custos_emissao);

-- Estruturação: espelho das tabelas (mesma estrutura)
CREATE TABLE IF NOT EXISTS estruturacao.custos_emissao (
  id uuid PRIMARY KEY,
  id_emissao_comercial uuid NOT NULL UNIQUE REFERENCES public.emissoes(id) ON DELETE CASCADE,
  versao integer NOT NULL DEFAULT 1,
  total_upfront numeric(18,2) NOT NULL DEFAULT 0,
  total_anual numeric(18,2) NOT NULL DEFAULT 0,
  total_mensal numeric(18,2) NOT NULL DEFAULT 0,
  total_primeiro_ano numeric(18,2) NOT NULL DEFAULT 0,
  total_anos_subsequentes numeric(18,2) NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estruturacao.custos_linhas (
  id uuid PRIMARY KEY,
  id_custos_emissao uuid NOT NULL REFERENCES estruturacao.custos_emissao(id) ON DELETE CASCADE,
  papel text,
  id_prestador uuid REFERENCES public.prestadores(id),
  tipo_preco text,
  preco_upfront numeric(18,2) NOT NULL DEFAULT 0,
  preco_recorrente numeric(18,2) NOT NULL DEFAULT 0,
  periodicidade text CHECK (periodicidade IN ('mensal','anual') OR periodicidade IS NULL),
  gross_up numeric(10,4) NOT NULL DEFAULT 0,
  valor_upfront_bruto numeric(18,2) NOT NULL DEFAULT 0,
  valor_recorrente_bruto numeric(18,2) NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estr_custos_emissao_emissao ON estruturacao.custos_emissao(id_emissao_comercial);
CREATE INDEX IF NOT EXISTS idx_estr_custos_linhas_custos ON estruturacao.custos_linhas(id_custos_emissao);
