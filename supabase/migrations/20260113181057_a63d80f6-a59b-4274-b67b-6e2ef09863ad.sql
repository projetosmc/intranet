-- Corrigir a view para usar SECURITY INVOKER (padrão seguro)
-- Primeiro, dropar a view existente
DROP VIEW IF EXISTS public.view_diretorio_publico;

-- Recriar a view com SECURITY INVOKER explícito
CREATE VIEW public.view_diretorio_publico 
WITH (security_invoker = true)
AS
SELECT 
    cod_usuario,
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
FROM public.tab_perfil_usuario
WHERE ind_ativo = true;

-- Garantir permissão de SELECT na view para usuários autenticados
GRANT SELECT ON public.view_diretorio_publico TO authenticated;

-- Documentar a view
COMMENT ON VIEW public.view_diretorio_publico IS 
'View pública do diretório de usuários com SECURITY INVOKER. Expõe apenas: nome, departamento, cargo, avatar, unidade. NÃO expõe: email, telefone, aniversário, AD ID.';