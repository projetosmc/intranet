-- =====================================================
-- CORREÇÃO DEFINITIVA: Proteção de Dados Pessoais
-- =====================================================

-- 1. Remover funções existentes (dropar para permitir mudança de assinatura)
DROP FUNCTION IF EXISTS public.search_users_directory(text, integer);
DROP FUNCTION IF EXISTS public.get_user_public_info(uuid);
DROP FUNCTION IF EXISTS public.get_user_display_info(uuid);

-- 2. Remover a política que permite admins verem TODOS os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.tab_perfil_usuario;

-- 3. Remover view anterior se existir
DROP VIEW IF EXISTS public.view_diretorio_publico;
DROP VIEW IF EXISTS public.view_diretorio_usuarios;

-- 4. Criar view SEGURA para diretório de usuários (apenas dados públicos)
CREATE VIEW public.view_diretorio_publico AS
SELECT 
    cod_usuario,
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
FROM public.tab_perfil_usuario
WHERE ind_ativo = true;

-- 5. Remover políticas existentes para recriar de forma segura
DROP POLICY IF EXISTS "Users can view own profile" ON public.tab_perfil_usuario;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.tab_perfil_usuario;
DROP POLICY IF EXISTS "Users can update own profile" ON public.tab_perfil_usuario;

-- 6. Política: Usuários podem ver APENAS seu próprio perfil completo
CREATE POLICY "Users can view own profile"
ON public.tab_perfil_usuario
FOR SELECT
TO authenticated
USING (auth.uid() = cod_usuario);

-- 7. Política: Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON public.tab_perfil_usuario
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = cod_usuario);

-- 8. Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.tab_perfil_usuario
FOR UPDATE
TO authenticated
USING (auth.uid() = cod_usuario)
WITH CHECK (auth.uid() = cod_usuario);

-- 9. Criar função SECURITY DEFINER para buscar dados públicos de display (nome e avatar)
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_id uuid)
RETURNS TABLE(nome text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    des_nome_completo,
    des_avatar_url
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id
    AND ind_ativo = true;
$$;

-- 10. Criar função SECURITY DEFINER segura para buscar dados públicos completos
CREATE OR REPLACE FUNCTION public.get_user_public_info(user_id uuid)
RETURNS TABLE(
    nome text, 
    departamento text, 
    cargo text, 
    avatar_url text, 
    unidade text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id
    AND ind_ativo = true;
$$;

-- 11. Função para buscar diretório com pesquisa (dados públicos apenas)
CREATE OR REPLACE FUNCTION public.search_users_directory(search_term text, result_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, nome text, departamento text, cargo text, avatar_url text, unidade text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    cod_usuario,
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
  FROM public.tab_perfil_usuario
  WHERE ind_ativo = true
    AND (
      des_nome_completo ILIKE '%' || search_term || '%'
      OR des_departamento ILIKE '%' || search_term || '%'
    )
  ORDER BY des_nome_completo
  LIMIT result_limit;
$$;

-- 12. Grant para usuários autenticados chamarem a view
GRANT SELECT ON public.view_diretorio_publico TO authenticated;

-- 13. Comentários de documentação
COMMENT ON POLICY "Users can view own profile" ON public.tab_perfil_usuario IS 
'Usuários podem ver APENAS seu próprio perfil completo. Dados sensíveis como email, telefone e aniversário são protegidos.';

COMMENT ON VIEW public.view_diretorio_publico IS 
'View pública do diretório de usuários. Expõe apenas: nome, departamento, cargo, avatar, unidade. NÃO expõe: email, telefone, aniversário, AD ID.';

COMMENT ON FUNCTION public.get_user_public_info(uuid) IS 
'Retorna informações públicas de um usuário específico. Não expõe dados sensíveis.';

COMMENT ON FUNCTION public.get_user_display_info(uuid) IS 
'Retorna nome e avatar de um usuário para exibição. Função segura sem exposição de dados sensíveis.';

COMMENT ON FUNCTION public.search_users_directory(text, integer) IS 
'Pesquisa no diretório de usuários. Retorna apenas dados públicos: nome, departamento, cargo, avatar, unidade.';