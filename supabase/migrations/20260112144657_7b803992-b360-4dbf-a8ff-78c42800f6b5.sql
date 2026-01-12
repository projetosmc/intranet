-- Fix: Change view to use SECURITY INVOKER (default, but making explicit)
-- This ensures the view respects the RLS policies of the querying user
DROP VIEW IF EXISTS public.view_diretorio_usuarios;

CREATE VIEW public.view_diretorio_usuarios 
WITH (security_invoker = true)
AS
SELECT 
  cod_usuario,
  des_nome_completo,
  des_departamento,
  des_cargo,
  des_unidade,
  des_avatar_url,
  ind_ativo
FROM public.tab_perfil_usuario
WHERE ind_ativo = true;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.view_diretorio_usuarios TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.view_diretorio_usuarios IS 
'View segura para consultas de diretório. Não expõe dados sensíveis como email, telefone, aniversário ou AD Object ID. Usa SECURITY INVOKER para respeitar RLS.';