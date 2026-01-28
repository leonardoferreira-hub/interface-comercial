-- =====================================================
-- Fase 1: Criar tabelas de lookup para campos UUID
-- =====================================================

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de lastros
CREATE TABLE IF NOT EXISTS public.lastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de tipos de operação
CREATE TABLE IF NOT EXISTS public.tipos_operacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Inserir dados iniciais de veículos
INSERT INTO public.veiculos (nome, sigla) VALUES 
  ('Certificado de Recebíveis Imobiliários', 'CRI'),
  ('Certificado de Recebíveis do Agronegócio', 'CRA'),
  ('Debêntures', 'DEB'),
  ('Fundo de Investimento em Direitos Creditórios', 'FIDC')
ON CONFLICT DO NOTHING;

-- Inserir dados iniciais de categorias
INSERT INTO public.categorias (nome, codigo) VALUES 
  ('Imobiliário', 'imobiliario'),
  ('Agronegócio', 'agronegocio'),
  ('Infraestrutura', 'infraestrutura'),
  ('Corporativo', 'corporativo')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- Fase 2: Criar tabela de dados complementares de estruturação
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dados_estruturacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_emissao UUID NOT NULL UNIQUE REFERENCES public.emissoes(id) ON DELETE CASCADE,
  
  -- PMO e Analistas (referências para usuarios)
  pmo_id UUID REFERENCES public.usuarios(id),
  analista_financeiro_id UUID REFERENCES public.usuarios(id),
  analista_contabil_id UUID REFERENCES public.usuarios(id),
  analista_gestao_id UUID REFERENCES public.usuarios(id),
  
  -- Datas importantes
  previsao_liquidacao DATE,
  data_liquidacao DATE,
  primeira_data_pagamento DATE,
  data_df DATE,
  data_entrada_pipe TIMESTAMPTZ,
  
  -- Dados Bancários
  banco TEXT,
  agencia TEXT,
  conta_bancaria TEXT,
  
  -- Status/Flags (OK/NOK/Pendente)
  compliance TEXT DEFAULT 'pendente' CHECK (compliance IN ('ok', 'nok', 'pendente')),
  boletagem TEXT DEFAULT 'pendente' CHECK (boletagem IN ('sim', 'nao', 'na', 'pendente')),
  floating BOOLEAN DEFAULT FALSE,
  mapa_liquidacao TEXT DEFAULT 'pendente' CHECK (mapa_liquidacao IN ('ok', 'nok', 'pendente')),
  mapa_registros TEXT DEFAULT 'pendente' CHECK (mapa_registros IN ('ok', 'nok', 'pendente')),
  lo_status TEXT DEFAULT 'pendente' CHECK (lo_status IN ('ok', 'nok', 'pendente')),
  due_diligence TEXT DEFAULT 'pendente' CHECK (due_diligence IN ('ok', 'nok', 'pendente')),
  envio_email_prestadores TEXT DEFAULT 'pendente' CHECK (envio_email_prestadores IN ('ok', 'nok', 'pendente')),
  passagem_bastao TEXT DEFAULT 'pendente' CHECK (passagem_bastao IN ('ok', 'nok', 'pendente')),
  kick_off TEXT DEFAULT 'pendente' CHECK (kick_off IN ('ok', 'nok', 'pendente')),
  
  -- Campos de texto/observações
  proximos_passos TEXT,
  alertas TEXT,
  status_tech TEXT,
  resumo TEXT,
  investidores_obs TEXT,
  
  -- Timestamps
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por emissão
CREATE INDEX IF NOT EXISTS idx_dados_estruturacao_emissao ON public.dados_estruturacao(id_emissao);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_dados_estruturacao_timestamp
  BEFORE UPDATE ON public.dados_estruturacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- =====================================================
-- Fase 3: RLS Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.dados_estruturacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lastros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_operacao ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (sistema interno sem auth)
CREATE POLICY "allow_all_dados_estruturacao" ON public.dados_estruturacao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_veiculos" ON public.veiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lastros" ON public.lastros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tipos_operacao" ON public.tipos_operacao FOR ALL USING (true) WITH CHECK (true);