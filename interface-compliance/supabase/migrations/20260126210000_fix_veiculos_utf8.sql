-- =====================================================
-- Fix mojibake (encoding) for base_custos.veiculos labels
-- Data: 26/01/2026
-- =====================================================

-- Use Unicode escapes to guarantee correct accents regardless of file encoding.
UPDATE base_custos.veiculos
SET nome = U&'Patrim\00F4nio Separado'
WHERE codigo = 'patrimonio_separado';

UPDATE base_custos.veiculos
SET nome = U&'Ve\00EDculo exclusivo'
WHERE codigo = 'veiculo_exclusivo';
