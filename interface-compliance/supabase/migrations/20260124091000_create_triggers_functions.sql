-- =====================================================
-- TRIGGERS E FUNCTIONS
-- Data: 24/01/2026
-- Descrição: Triggers e functions para automação e auditoria
-- =====================================================

-- 1. Trigger para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_operacoes_updated_at
    BEFORE UPDATE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_pendencias_updated_at
    BEFORE UPDATE ON estruturacao.pendencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_compliance_updated_at
    BEFORE UPDATE ON estruturacao.compliance_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Trigger para preencher analistas via hierarquia
CREATE OR REPLACE FUNCTION preencher_analistas_hierarquia()
RETURNS TRIGGER AS $$
DECLARE
    v_financeiro_id uuid;
    v_contabil_id uuid;
BEGIN
    IF NEW.analista_gestao_id IS NOT NULL AND
       (OLD.analista_gestao_id IS NULL OR OLD.analista_gestao_id != NEW.analista_gestao_id) THEN

        SELECT analista_financeiro_id, analista_contabil_id
        INTO v_financeiro_id, v_contabil_id
        FROM estruturacao.hierarquia_analistas
        WHERE analista_gestao_id = NEW.analista_gestao_id;

        IF v_financeiro_id IS NOT NULL THEN
            NEW.analista_financeiro_id := v_financeiro_id;
        END IF;

        IF v_contabil_id IS NOT NULL THEN
            NEW.analista_contabil_id := v_contabil_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_preencher_analistas
    BEFORE INSERT OR UPDATE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION preencher_analistas_hierarquia();

-- 3. Trigger para criar operação quando emissão é aceita no comercial
CREATE OR REPLACE FUNCTION criar_operacao_de_emissao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'aceita' AND (OLD.status IS NULL OR OLD.status != 'aceita') THEN
        INSERT INTO estruturacao.operacoes (
            id_emissao_comercial,
            numero_emissao,
            nome_operacao,
            volume,
            empresa_cnpj,
            categoria_id,
            veiculo_id,
            tipo_oferta_id
        ) VALUES (
            NEW.id,
            NEW.numero_emissao,
            COALESCE(NEW.nome, 'Operação ' || NEW.numero_emissao),
            COALESCE(NEW.volume_total, 0),
            NEW.cnpj_empresa,
            NEW.categoria_id,
            NEW.veiculo_id,
            NEW.tipo_oferta_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_operacao
    AFTER INSERT OR UPDATE ON public.emissoes
    FOR EACH ROW EXECUTE FUNCTION criar_operacao_de_emissao();

-- 4. Trigger para Audit Log
CREATE OR REPLACE FUNCTION log_alteracao()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.historico_alteracoes (schema_name, table_name, record_id, new_data, action, changed_by)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW), 'INSERT', auth.uid());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.historico_alteracoes (schema_name, table_name, record_id, old_data, new_data, action, changed_by)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW), 'UPDATE', auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.historico_alteracoes (schema_name, table_name, record_id, old_data, action, changed_by)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD), 'DELETE', auth.uid());
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_operacoes
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION log_alteracao();

CREATE TRIGGER audit_pendencias
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.pendencias
    FOR EACH ROW EXECUTE FUNCTION log_alteracao();

CREATE TRIGGER audit_compliance
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.compliance_checks
    FOR EACH ROW EXECUTE FUNCTION log_alteracao();

-- 5. Trigger para criar pendências automaticamente quando operação é liquidada
CREATE OR REPLACE FUNCTION criar_pendencias_ao_liquidar()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Liquidada' AND (OLD.status IS NULL OR OLD.status != 'Liquidada') THEN
        INSERT INTO estruturacao.pendencias (operacao_id)
        VALUES (NEW.id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_pendencias
    AFTER INSERT OR UPDATE ON estruturacao.operacoes
    FOR EACH ROW EXECUTE FUNCTION criar_pendencias_ao_liquidar();

-- 6. Function para marcar pendências como resolvidas automaticamente
CREATE OR REPLACE FUNCTION verificar_pendencias_resolvidas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mapa_liquidacao = 'ok' AND
       NEW.mapa_registros = 'ok' AND
       NEW.lo_status = 'ok' AND
       NEW.due_diligence = 'ok' AND
       NEW.envio_email_prestadores = 'ok' AND
       NEW.passagem_bastao = 'ok' AND
       NEW.kick_off = 'ok' THEN
        NEW.resolvida := true;
    ELSE
        NEW.resolvida := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verificar_pendencias
    BEFORE INSERT OR UPDATE ON estruturacao.pendencias
    FOR EACH ROW EXECUTE FUNCTION verificar_pendencias_resolvidas();
