-- =====================================================
-- SCRIPT DE CRIAÇÃO DO SCHEMA ESTRUTURACAO
-- Data: 24/01/2026
-- Descrição: Migração e evolução da plataforma de gestão de securitização
-- =====================================================

-- 1. Criar o schema
CREATE SCHEMA IF NOT EXISTS estruturacao;

-- 2. Tabela de Analistas de Gestão (referência)
CREATE TABLE IF NOT EXISTS estruturacao.analistas_gestao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    email text,
    tipo text NOT NULL CHECK (tipo IN ('gestao', 'financeiro', 'contabil')),
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz DEFAULT now()
);

-- 3. Tabela de Hierarquia de Analistas
CREATE TABLE IF NOT EXISTS estruturacao.hierarquia_analistas (
    analista_gestao_id uuid PRIMARY KEY REFERENCES estruturacao.analistas_gestao(id),
    analista_financeiro_id uuid NOT NULL REFERENCES estruturacao.analistas_gestao(id),
    analista_contabil_id uuid NOT NULL REFERENCES estruturacao.analistas_gestao(id)
);

-- 4. Tabela Central de Operações
CREATE TABLE IF NOT EXISTS estruturacao.operacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_emissao_comercial uuid UNIQUE REFERENCES public.emissoes(id),
    numero_emissao text NOT NULL,
    nome_operacao text NOT NULL,
    status text NOT NULL DEFAULT 'Em Estruturação'
        CHECK (status IN ('Em Estruturação', 'Liquidada', 'On Hold', 'Abortada', 'Finalizada')),
    pmo_id uuid REFERENCES auth.users(id),
    analista_gestao_id uuid REFERENCES estruturacao.analistas_gestao(id),
    analista_financeiro_id uuid REFERENCES estruturacao.analistas_gestao(id),
    analista_contabil_id uuid REFERENCES estruturacao.analistas_gestao(id),
    categoria_id uuid,
    veiculo_id uuid,
    tipo_oferta_id uuid,
    lastro_id uuid,
    volume numeric(18,2) NOT NULL DEFAULT 0,
    empresa_cnpj text,
    empresa_razao_social text,
    data_entrada_pipe timestamptz NOT NULL DEFAULT now(),
    data_previsao_liquidacao date,
    data_liquidacao date,
    data_primeira_pagamento date,
    fee_estruturacao numeric(10,4),
    fee_gestao numeric(10,4),
    fee_originacao numeric(10,4),
    boletagem text,
    df text,
    banco text,
    agencia text,
    conta_bancaria text,
    majoracao numeric(10,4),
    floating boolean DEFAULT false,
    proximos_passos text,
    alertas text,
    status_tech text,
    resumo text,
    investidores_obs text,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- 5. Tabela de Pendências
CREATE TABLE IF NOT EXISTS estruturacao.pendencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid NOT NULL REFERENCES estruturacao.operacoes(id) ON DELETE CASCADE,
    mapa_liquidacao text NOT NULL DEFAULT 'pendente' CHECK (mapa_liquidacao IN ('ok', 'nok', 'pendente')),
    mapa_registros text NOT NULL DEFAULT 'pendente' CHECK (mapa_registros IN ('ok', 'nok', 'pendente')),
    lo_status text NOT NULL DEFAULT 'pendente' CHECK (lo_status IN ('ok', 'nok', 'pendente')),
    due_diligence text NOT NULL DEFAULT 'pendente' CHECK (due_diligence IN ('ok', 'nok', 'pendente')),
    envio_email_prestadores text NOT NULL DEFAULT 'pendente' CHECK (envio_email_prestadores IN ('ok', 'nok', 'pendente')),
    passagem_bastao text NOT NULL DEFAULT 'pendente' CHECK (passagem_bastao IN ('ok', 'nok', 'pendente')),
    kick_off text NOT NULL DEFAULT 'pendente' CHECK (kick_off IN ('ok', 'nok', 'pendente')),
    resolvida boolean NOT NULL DEFAULT false,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- 6. Tabela de Compliance Checks
CREATE TABLE IF NOT EXISTS estruturacao.compliance_checks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid NOT NULL REFERENCES estruturacao.operacoes(id) ON DELETE CASCADE,
    documento text NOT NULL,
    tipo_documento text NOT NULL CHECK (tipo_documento IN ('CPF', 'CNPJ')),
    nome_entidade text,
    tipo_entidade text,
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'reprovado')),
    responsavel_id uuid REFERENCES auth.users(id),
    observacoes text,
    data_verificacao timestamptz,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now()
);

-- 7. Tabela de Audit Log
CREATE TABLE IF NOT EXISTS public.historico_alteracoes (
    id bigserial PRIMARY KEY,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_operacoes_status ON estruturacao.operacoes(status);
CREATE INDEX IF NOT EXISTS idx_operacoes_pmo ON estruturacao.operacoes(pmo_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_operacao ON estruturacao.pendencias(operacao_id);
CREATE INDEX IF NOT EXISTS idx_compliance_operacao ON estruturacao.compliance_checks(operacao_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON public.historico_alteracoes(table_name, changed_at);

-- Comentários nas tabelas
COMMENT ON TABLE estruturacao.analistas_gestao IS 'Tabela de referência para analistas de gestão, financeiro e contábil';
COMMENT ON TABLE estruturacao.hierarquia_analistas IS 'Mapeia a relação automática entre analistas de gestão, financeiro e contábil';
COMMENT ON TABLE estruturacao.operacoes IS 'Tabela central do sistema, consolidando todas as operações desde a aceitação até a liquidação';
COMMENT ON TABLE estruturacao.pendencias IS 'Gerencia as pendências de operações já liquidadas';
COMMENT ON TABLE estruturacao.compliance_checks IS 'Rastreia as verificações de compliance (CPF/CNPJ) para cada parte envolvida';
COMMENT ON TABLE public.historico_alteracoes IS 'Registra todas as alterações importantes no sistema para auditoria';
