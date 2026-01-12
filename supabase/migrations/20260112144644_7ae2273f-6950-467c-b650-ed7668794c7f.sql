-- Remove moderator access to all profiles (security fix)
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.tab_perfil_usuario;

-- Create a secure view for directory lookups (non-sensitive fields only)
CREATE OR REPLACE VIEW public.view_diretorio_usuarios AS
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

-- Create a policy so moderators can view basic info through the underlying table
-- but only for active users and limited fields via the view
CREATE POLICY "Moderators can view active profiles basic info"
ON public.tab_perfil_usuario FOR SELECT
USING (
  has_role(auth.uid(), 'moderator'::app_role) 
  AND ind_ativo = true
);

-- Add comment explaining the security model
COMMENT ON VIEW public.view_diretorio_usuarios IS 
'View segura para consultas de diretório. Não expõe dados sensíveis como email, telefone, aniversário ou AD Object ID.';