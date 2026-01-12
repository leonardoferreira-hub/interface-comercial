-- Remover views de custos do schema public (devem ficar apenas em base_custos)
-- O código das Edge Functions agora usa .schema("base_custos").from(tabela)

DROP VIEW IF EXISTS public.custos_cr_oferta_privada_cetipada CASCADE;
DROP VIEW IF EXISTS public.custos_cr_oferta_privada_pura CASCADE;
DROP VIEW IF EXISTS public.custos_cr_oferta_publica CASCADE;
DROP VIEW IF EXISTS public.custos_cra_destinacao CASCADE;
DROP VIEW IF EXISTS public.custos_cra_origem CASCADE;
DROP VIEW IF EXISTS public.custos_cri_destinacao CASCADE;
DROP VIEW IF EXISTS public.custos_cri_origem CASCADE;
DROP VIEW IF EXISTS public.custos_deb_oferta_privada_cetipada CASCADE;
DROP VIEW IF EXISTS public.custos_deb_oferta_privada_pura CASCADE;
DROP VIEW IF EXISTS public.custos_deb_oferta_publica CASCADE;
DROP VIEW IF EXISTS public.custos_patrimonio_separado CASCADE;
DROP VIEW IF EXISTS public.custos_veiculo_exclusivo CASCADE;