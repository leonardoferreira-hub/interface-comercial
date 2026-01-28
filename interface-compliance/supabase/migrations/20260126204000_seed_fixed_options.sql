-- =====================================================
-- Seed / normalize fixed option sets for the app
-- Data: 26/01/2026
-- =====================================================

-- 1) PMOs (public.usuarios)
INSERT INTO public.usuarios (nome)
SELECT v.nome
FROM (VALUES
  ('Leonardo'),
  ('Lucas'),
  ('Ronaldo'),
  ('Beatriz'),
  ('Eduarda')
) AS v(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios u WHERE u.nome = v.nome
);

-- 2) base_custos.categorias: keep only CRI, CRA, DEB, CR, NC
-- Upsert required categories
INSERT INTO base_custos.categorias (codigo, nome, ativo)
VALUES
  ('CRI', 'CRI', true),
  ('CRA', 'CRA', true),
  ('DEB', 'DEB', true),
  ('CR', 'CR', true),
  ('NC', 'NC', true)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome,
    ativo = true;

-- Deactivate all others
UPDATE base_custos.categorias
SET ativo = false
WHERE codigo NOT IN ('CRI','CRA','DEB','CR','NC');

-- 3) base_custos.veiculos: enforce labels
UPDATE base_custos.veiculos
SET nome = CASE codigo
  WHEN 'patrimonio_separado' THEN 'Patrimônio Separado'
  WHEN 'veiculo_exclusivo' THEN 'Veículo exclusivo'
  ELSE nome
END
WHERE codigo IN ('patrimonio_separado','veiculo_exclusivo');

-- 4) base_custos.tipos_oferta: CVM 160, Privada pura, Privada cetipada
INSERT INTO base_custos.tipos_oferta (codigo, nome, ativo)
VALUES
  ('cvm_160', 'CVM 160', true),
  ('privada_pura', 'Privada pura', true),
  ('privada_cetipada', 'Privada cetipada', true)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome,
    ativo = true;

-- Deactivate other offer types (if any)
UPDATE base_custos.tipos_oferta
SET ativo = false
WHERE codigo NOT IN ('cvm_160','privada_pura','privada_cetipada');
