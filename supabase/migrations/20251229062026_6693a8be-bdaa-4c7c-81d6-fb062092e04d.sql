-- Remover trigger antigo que está causando erro
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.tab_comunicado;