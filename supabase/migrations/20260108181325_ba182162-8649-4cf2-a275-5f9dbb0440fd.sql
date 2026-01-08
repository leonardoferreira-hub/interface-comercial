-- Criar views no schema public apontando para base_custos
-- Isso permite que o PostgREST acesse os dados sem precisar expor o schema base_custos

-- Views para tabelas de custos por tipo de oferta
CREATE OR REPLACE VIEW public.custos_deb_oferta_privada_pura AS
SELECT * FROM base_custos.custos_deb_oferta_privada_pura;

CREATE OR REPLACE VIEW public.custos_deb_oferta_privada_cetipada AS
SELECT * FROM base_custos.custos_deb_oferta_privada_cetipada;

CREATE OR REPLACE VIEW public.custos_deb_oferta_publica AS
SELECT * FROM base_custos.custos_deb_oferta_publica;

CREATE OR REPLACE VIEW public.custos_cr_oferta_privada_pura AS
SELECT * FROM base_custos.custos_cr_oferta_privada_pura;

CREATE OR REPLACE VIEW public.custos_cr_oferta_privada_cetipada AS
SELECT * FROM base_custos.custos_cr_oferta_privada_cetipada;

CREATE OR REPLACE VIEW public.custos_cr_oferta_publica AS
SELECT * FROM base_custos.custos_cr_oferta_publica;

CREATE OR REPLACE VIEW public.custos_cri_origem AS
SELECT * FROM base_custos.custos_cri_origem;

CREATE OR REPLACE VIEW public.custos_cri_destinacao AS
SELECT * FROM base_custos.custos_cri_destinacao;

CREATE OR REPLACE VIEW public.custos_cra_origem AS
SELECT * FROM base_custos.custos_cra_origem;

CREATE OR REPLACE VIEW public.custos_cra_destinacao AS
SELECT * FROM base_custos.custos_cra_destinacao;

-- Views para tabelas de custos por veículo
CREATE OR REPLACE VIEW public.custos_veiculo_exclusivo AS
SELECT * FROM base_custos.custos_veiculo_exclusivo;

CREATE OR REPLACE VIEW public.custos_patrimonio_separado AS
SELECT * FROM base_custos.custos_patrimonio_separado;

-- Garantir permissões de leitura
GRANT SELECT ON public.custos_deb_oferta_privada_pura TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_deb_oferta_privada_cetipada TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_deb_oferta_publica TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cr_oferta_privada_pura TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cr_oferta_privada_cetipada TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cr_oferta_publica TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cri_origem TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cri_destinacao TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cra_origem TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_cra_destinacao TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_veiculo_exclusivo TO anon, authenticated, service_role;
GRANT SELECT ON public.custos_patrimonio_separado TO anon, authenticated, service_role;