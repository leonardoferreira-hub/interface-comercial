-- Add new columns for company address and contact information
ALTER TABLE emissoes ADD COLUMN IF NOT EXISTS empresa_endereco TEXT;
ALTER TABLE emissoes ADD COLUMN IF NOT EXISTS contato_nome VARCHAR(255);
ALTER TABLE emissoes ADD COLUMN IF NOT EXISTS contato_email VARCHAR(255);