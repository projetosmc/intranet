-- SOLUÇÃO DEFINITIVA: Máxima restrição para dados de perfil

-- 1. Remover política de moderadores (não devem ter acesso a todos os perfis)
DROP POLICY IF EXISTS "Moderators can view active profiles basic info" ON public.tab_perfil_usuario;

-- 2. Remover view antiga
DROP VIEW IF EXISTS public.view_diretorio_usuarios;

-- 3. Criar função SECURITY DEFINER para consultas de diretório
-- Retorna apenas nome e avatar - dados não sensíveis
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_id uuid)
RETURNS TABLE (
  nome text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    des_nome_completo,
    des_avatar_url
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id
    AND ind_ativo = true;
$$;

-- 4. Criar função para busca de usuários por nome (para autocomplete, etc)
-- Retorna apenas ID, nome e avatar - sem dados sensíveis
CREATE OR REPLACE FUNCTION public.search_users_directory(search_term text, result_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  nome text,
  departamento text,
  cargo text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cod_usuario,
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url
  FROM public.tab_perfil_usuario
  WHERE ind_ativo = true
    AND (
      des_nome_completo ILIKE '%' || search_term || '%'
      OR des_departamento ILIKE '%' || search_term || '%'
    )
  ORDER BY des_nome_completo
  LIMIT result_limit;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_display_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_directory(text, int) TO authenticated;

-- 6. Comentários explicativos
COMMENT ON FUNCTION public.get_user_display_info IS 
'Retorna apenas nome e avatar de um usuário. Não expõe dados sensíveis.';

COMMENT ON FUNCTION public.search_users_directory IS 
'Busca usuários por nome/departamento. Retorna apenas dados públicos de diretório (nome, departamento, cargo, avatar). Não expõe email, telefone, aniversário ou AD IDs.';