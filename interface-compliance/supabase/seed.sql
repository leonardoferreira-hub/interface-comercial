-- =====================================================
-- SEED (LOCAL DEV)
-- Objetivo: popular UI com dados fake para testar fluxo de estruturação
-- =====================================================

-- Ativar acesso anon SOMENTE em dev local (ver migration 20260125_dev_allow_anon_local.sql)
INSERT INTO public.app_config(key, value_boolean)
VALUES ('allow_anon', true)
ON CONFLICT (key) DO UPDATE
SET value_boolean = EXCLUDED.value_boolean,
    updated_at = now();

-- Analistas
INSERT INTO estruturacao.analistas_gestao (nome, email, tipo, ativo)
VALUES
  ('Marina Duarte', 'marina@travessia.com', 'gestao', true),
  ('Bruno Lima', 'bruno@travessia.com', 'financeiro', true),
  ('Carla Nunes', 'carla@travessia.com', 'contabil', true)
ON CONFLICT DO NOTHING;

-- Usuários (para selects de PMO/analistas no UI)
INSERT INTO public.usuarios (nome, email)
VALUES
  ('Marina Duarte', 'marina@travessia.com'),
  ('Bruno Lima', 'bruno@travessia.com'),
  ('Carla Nunes', 'carla@travessia.com')
ON CONFLICT DO NOTHING;

-- Prestadores (mínimo para despesas)
INSERT INTO public.prestadores (nome, ativo)
VALUES
  ('Agente Fiduciário', true),
  ('Securitizadora', true),
  ('Assessor Legal', true)
ON CONFLICT DO NOTHING;

-- Hierarquia (gestão -> financeiro/contábil)
WITH a AS (
  SELECT
    (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'Marina Duarte' LIMIT 1) AS gestao,
    (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'Bruno Lima' LIMIT 1) AS financeiro,
    (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'Carla Nunes' LIMIT 1) AS contabil
)
INSERT INTO estruturacao.hierarquia_analistas (analista_gestao_id, analista_financeiro_id, analista_contabil_id)
SELECT gestao, financeiro, contabil
FROM a
WHERE gestao IS NOT NULL AND financeiro IS NOT NULL AND contabil IS NOT NULL
ON CONFLICT (analista_gestao_id) DO NOTHING;

-- Emissões fake (base comercial)
WITH
  cat_imob AS (SELECT id FROM public.categorias WHERE codigo = 'imobiliario' LIMIT 1),
  cat_agro AS (SELECT id FROM public.categorias WHERE codigo = 'agronegocio' LIMIT 1),
  vei_cri AS (SELECT id FROM public.veiculos WHERE sigla = 'CRI' LIMIT 1),
  vei_cra AS (SELECT id FROM public.veiculos WHERE sigla = 'CRA' LIMIT 1)
INSERT INTO public.emissoes (
  numero_emissao,
  nome,
  status,
  volume_total,
  cnpj_empresa,
  categoria_id,
  veiculo_id,
  tipo_oferta_id
)
VALUES
  ('EM-0001', 'Omni II', 'aceita', 125000000, '12.345.678/0001-90', (SELECT id FROM cat_imob), (SELECT id FROM vei_cri), NULL),
  ('EM-0002', 'Agro Horizonte I', 'aceita', 78000000, '45.987.321/0001-10', (SELECT id FROM cat_agro), (SELECT id FROM vei_cra), NULL),
  ('EM-0003', 'Infra Alpha Deb', 'aceita', 42000000, '22.222.222/0001-22', (SELECT id FROM cat_imob), (SELECT id FROM vei_cri), NULL)
ON CONFLICT DO NOTHING;

-- Séries fake (ligadas às emissões)
INSERT INTO public.series (id_emissao, numero, codigo, nome, valor_emissao, percentual_volume)
SELECT e.id,
       1,
       e.numero_emissao || '-S1',
       'Série Sênior',
       COALESCE(e.volume_total,0) * 0.8,
       80
FROM public.emissoes e
WHERE e.numero_emissao IN ('EM-0001','EM-0002','EM-0003')
ON CONFLICT DO NOTHING;

INSERT INTO public.series (id_emissao, numero, codigo, nome, valor_emissao, percentual_volume)
SELECT e.id,
       2,
       e.numero_emissao || '-S2',
       'Série Mezanino',
       COALESCE(e.volume_total,0) * 0.2,
       20
FROM public.emissoes e
WHERE e.numero_emissao IN ('EM-0001','EM-0002')
ON CONFLICT DO NOTHING;

-- Operações fake (estruturacao) vinculadas às emissões
WITH
  ag AS (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'Marina Duarte' LIMIT 1)
INSERT INTO estruturacao.operacoes (
  id_emissao_comercial,
  numero_emissao,
  nome_operacao,
  status,
  categoria_id,
  veiculo_id,
  volume,
  empresa_cnpj,
  empresa_razao_social,
  data_entrada_pipe,
  data_previsao_liquidacao,
  analista_gestao_id,
  proximos_passos,
  alertas,
  resumo
)
SELECT
  e.id,
  e.numero_emissao,
  e.nome,
  CASE WHEN e.numero_emissao = 'EM-0003' THEN 'Liquidada' ELSE 'Em Estruturação' END,
  e.categoria_id,
  e.veiculo_id,
  COALESCE(e.volume_total,0),
  e.cnpj_empresa,
  COALESCE(e.nome, ''),
  now() - interval '12 days',
  (current_date + 30),
  (SELECT id FROM ag),
  'Próximos passos fake',
  NULL,
  'Seed local para testar UI'
FROM public.emissoes e
WHERE e.numero_emissao IN ('EM-0001','EM-0002','EM-0003')
ON CONFLICT DO NOTHING;

-- Garantir um caso "Liquidada" (se a operação já tiver sido criada por trigger)
UPDATE estruturacao.operacoes
SET status = 'Liquidada'
WHERE numero_emissao = 'EM-0003';

-- Pendências simples para operações em estruturação
INSERT INTO estruturacao.pendencias (
  operacao_id,
  mapa_liquidacao,
  mapa_registros,
  lo_status,
  due_diligence,
  envio_email_prestadores,
  passagem_bastao,
  kick_off
)
SELECT
  o.id,
  'pendente',
  'pendente',
  'ok',
  'ok',
  'ok',
  'ok',
  'pendente'
FROM estruturacao.operacoes o
WHERE o.numero_emissao IN ('EM-0001','EM-0002')
ON CONFLICT DO NOTHING;

-- Pendências fake (para operação liquidada)
INSERT INTO estruturacao.pendencias (
  operacao_id,
  mapa_liquidacao,
  mapa_registros,
  lo_status,
  due_diligence,
  envio_email_prestadores,
  passagem_bastao,
  kick_off
)
SELECT
  o.id,
  'ok',
  'pendente',
  'ok',
  'ok',
  'ok',
  'pendente',
  'ok'
FROM estruturacao.operacoes o
WHERE o.numero_emissao = 'EM-0003'
ON CONFLICT DO NOTHING;

-- Compliance fake
INSERT INTO estruturacao.compliance_checks (
  operacao_id,
  documento,
  tipo_documento,
  nome_entidade,
  tipo_entidade,
  status,
  observacoes
)
SELECT
  o.id,
  '123.456.789-00',
  'CPF',
  'João da Silva',
  'investidor',
  'em_analise',
  'Checar lista restritiva (dados fake).'
FROM estruturacao.operacoes o
WHERE o.numero_emissao = 'EM-0001'
ON CONFLICT DO NOTHING;
