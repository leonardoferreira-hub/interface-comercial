-- Adicionar campo versao na tabela emissoes
ALTER TABLE public.emissoes ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1;

-- Adicionar campos na tabela historico_emissoes
ALTER TABLE public.historico_emissoes 
  ADD COLUMN IF NOT EXISTS dados_anteriores JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS versao INTEGER,
  ADD COLUMN IF NOT EXISTS tipo_alteracao TEXT DEFAULT 'status';

-- Atualizar registros existentes com versão 1
UPDATE public.emissoes SET versao = 1 WHERE versao IS NULL;

-- Criar índice para buscas no histórico
CREATE INDEX IF NOT EXISTS idx_historico_emissoes_id_emissao_criado 
ON public.historico_emissoes(id_emissao, criado_em DESC);