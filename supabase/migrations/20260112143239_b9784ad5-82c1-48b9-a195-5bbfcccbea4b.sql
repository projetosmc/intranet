-- Restrict user profile visibility - users can only see their own profile
-- Admins and moderators can see all profiles

-- Drop existing permissive policies that allow broad SELECT access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.tab_perfil_usuario;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.tab_perfil_usuario;

-- Ensure the correct policies exist (these may already be in place, so use IF NOT EXISTS pattern)
-- Users can view only their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tab_perfil_usuario' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON public.tab_perfil_usuario FOR SELECT
    USING (auth.uid() = cod_usuario);
  END IF;
END $$;

-- Admins can view all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tab_perfil_usuario' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.tab_perfil_usuario FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Moderators can view all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tab_perfil_usuario' 
    AND policyname = 'Moderators can view all profiles'
  ) THEN
    CREATE POLICY "Moderators can view all profiles"
    ON public.tab_perfil_usuario FOR SELECT
    USING (has_role(auth.uid(), 'moderator'::app_role));
  END IF;
END $$;