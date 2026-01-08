-- Recriar views com security_invoker = true para evitar warnings do linter
-- Isso faz com que as views respeitem RLS do usuário que consulta

DROP VIEW IF EXISTS public.custos_deb_oferta_privada_pura;
DROP VIEW IF EXISTS public.custos_deb_oferta_privada_cetipada;
DROP VIEW IF EXISTS public.custos_deb_oferta_publica;
DROP VIEW IF EXISTS public.custos_cr_oferta_privada_pura;
DROP VIEW IF EXISTS public.custos_cr_oferta_privada_cetipada;
DROP VIEW IF EXISTS public.custos_cr_oferta_publica;
DROP VIEW IF EXISTS public.custos_cri_origem;
DROP VIEW IF EXISTS public.custos_cri_destinacao;
DROP VIEW IF EXISTS public.custos_cra_origem;
DROP VIEW IF EXISTS public.custos_cra_destinacao;
DROP VIEW IF EXISTS public.custos_veiculo_exclusivo;
DROP VIEW IF EXISTS public.custos_patrimonio_separado;

-- Recriar com security_invoker
CREATE VIEW public.custos_deb_oferta_privada_pura 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_deb_oferta_privada_pura;

CREATE VIEW public.custos_deb_oferta_privada_cetipada 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_deb_oferta_privada_cetipada;

CREATE VIEW public.custos_deb_oferta_publica 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_deb_oferta_publica;

CREATE VIEW public.custos_cr_oferta_privada_pura 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cr_oferta_privada_pura;

CREATE VIEW public.custos_cr_oferta_privada_cetipada 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cr_oferta_privada_cetipada;

CREATE VIEW public.custos_cr_oferta_publica 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cr_oferta_publica;

CREATE VIEW public.custos_cri_origem 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cri_origem;

CREATE VIEW public.custos_cri_destinacao 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cri_destinacao;

CREATE VIEW public.custos_cra_origem 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cra_origem;

CREATE VIEW public.custos_cra_destinacao 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_cra_destinacao;

CREATE VIEW public.custos_veiculo_exclusivo 
WITH (security_invoker = true) AS
SELECT * FROM base_custos.custos_veiculo_exclusivo;

CREATE VIEW public.custos_patrimonio_separado 
WITH (security_invoker = true) AS
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