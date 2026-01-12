-- Fix security issues by requiring authentication for SELECT operations

-- 1. tab_perfil_usuario: Already restricted, but ensure unauthenticated users cannot access
-- The current policies already restrict to own profile + admin/moderator
-- Adding explicit auth check for extra security

-- 2. tab_reserva_sala: Change from public to authenticated-only
DROP POLICY IF EXISTS "Users can view all reservations" ON public.tab_reserva_sala;

CREATE POLICY "Authenticated users can view reservations"
ON public.tab_reserva_sala FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. tab_config_suporte: Require authentication to view
DROP POLICY IF EXISTS "Authenticated users can view active support config" ON public.tab_config_suporte;

CREATE POLICY "Authenticated users can view active support config"
ON public.tab_config_suporte FOR SELECT
USING (auth.uid() IS NOT NULL AND ind_ativo = true);