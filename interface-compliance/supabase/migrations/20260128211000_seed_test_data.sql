-- =====================================================
-- Dados de teste para Interface Compliance
-- Data: 28/01/2026
-- =====================================================

-- 1. Inserir CNPJs verificados (base histórica)
INSERT INTO compliance.cnpjs_verificados (cnpj, razao_social, nome_fantasia, situacao_cadastral, status_compliance, observacoes, origem)
VALUES 
  ('38042694000100', 'TRAVESSIA SECURITIZADORA DE CRÉDITOS FINANCEIROS S.A.', 'TRAVESSIA', 'ATIVA', 'aprovado', 'Empresa regular, sem pendências', 'operacao'),
  ('12345678000190', 'EMPRESA TESTE LTDA', 'TESTE', 'ATIVA', 'aprovado', NULL, 'operacao'),
  ('98765432000110', 'OUTRA EMPRESA S.A.', NULL, 'ATIVA', 'reprovado', 'Restrição no Serasa encontrada', 'operacao');

-- 2. Inserir verificações pendentes (vindas da estruturação)
INSERT INTO compliance.verificacoes_pendentes (operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade, nome_entidade, status, observacoes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'EM-20260127-0011', 'Operação Teste', '11222333000144', 'emitente', 'EMITENTE NOVO S.A.', 'pendente', NULL),
  ('00000000-0000-0000-0000-000000000001', 'EM-20260127-0011', 'Operação Teste', '44555666000177', 'garantidor', 'GARANTIDOR LTDA', 'em_analise', NULL),
  ('00000000-0000-0000-0000-000000000002', 'EM-20260128-0005', 'Outra Operação', '77888999000122', 'devedor', 'DEVEDOR XYZ S.A.', 'pendente', NULL),
  ('00000000-0000-0000-0000-000000000002', 'EM-20260128-0005', 'Outra Operação', '99000111000133', 'avalista', 'AVALISTA ABC LTDA', 'reprovado', 'CNPJ com restrições na Receita Federal');

-- 3. Inserir investidores (onboarding)
INSERT INTO compliance.investidores (cpf_cnpj, nome, email, telefone, tipo, tipo_investidor, status_onboarding, perfil_risco, origem)
VALUES 
  ('12345678900', 'João Silva', 'joao.silva@email.com', '11999990001', 'pessoa_fisica', 'qualificado', 'pendente', NULL, 'manual'),
  ('98765432100', 'Maria Santos', 'maria.santos@email.com', '11999990002', 'pessoa_fisica', 'varejo', 'documentacao_pendente', NULL, 'manual'),
  ('11222333000144', 'INVESTIDOR CORPORATIVO LTDA', 'contato@investcorp.com', '1133334444', 'pessoa_juridica', 'profissional', 'em_analise', 'agressivo', 'manual'),
  ('55666777000188', 'JOSE INVESTIDOR', 'jose@email.com', '11999990003', 'pessoa_fisica', 'varejo', 'aprovado', 'moderado', 'manual'),
  ('22333444000199', 'EMPRESA INVESTIDORA S.A.', 'invest@empresa.com', '1155556666', 'pessoa_juridica', 'qualificado', 'reprovado', NULL, 'manual');

-- 4. Inserir documentos de investidores
INSERT INTO compliance.investidor_documentos (investidor_id, tipo_documento, nome_arquivo, url_arquivo, status, observacoes)
SELECT 
  id,
  'kyc',
  'kyc_joao_silva.pdf',
  'https://exemplo.com/docs/kyc_joao.pdf',
  'pendente',
  NULL
FROM compliance.investidores WHERE cpf_cnpj = '12345678900';

INSERT INTO compliance.investidor_documentos (investidor_id, tipo_documento, nome_arquivo, url_arquivo, status, observacoes)
SELECT 
  id,
  'suitability',
  'suitability_maria.pdf',
  'https://exemplo.com/docs/suitability_maria.pdf',
  'aprovado',
  NULL
FROM compliance.investidores WHERE cpf_cnpj = '98765432100';

-- Verificar os dados
SELECT 'CNPJs Verificados' as tabela, COUNT(*) as total FROM compliance.cnpjs_verificados
UNION ALL
SELECT 'Verificações Pendentes', COUNT(*) FROM compliance.verificacoes_pendentes
UNION ALL
SELECT 'Investidores', COUNT(*) FROM compliance.investidores
UNION ALL
SELECT 'Documentos', COUNT(*) FROM compliance.investidor_documentos;
