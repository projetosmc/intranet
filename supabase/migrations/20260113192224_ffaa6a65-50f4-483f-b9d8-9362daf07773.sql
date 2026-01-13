-- Corrigir search_path da função
CREATE OR REPLACE FUNCTION public.limpar_tentativas_antigas()
RETURNS void AS $$
BEGIN
  DELETE FROM public.tab_tentativa_login WHERE dta_tentativa < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- A política permissiva é intencional pois apenas Edge Functions com service_role acessam
-- Usuários anônimos e autenticados NÃO têm acesso direto a esta tabela
-- O RLS está habilitado mas a política permite tudo apenas para service_role