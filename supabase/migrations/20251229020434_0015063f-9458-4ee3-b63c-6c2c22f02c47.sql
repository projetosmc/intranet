-- Remove triggers incorretos que usam updated_at
DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.tab_reserva_sala;
DROP TRIGGER IF EXISTS update_tab_reserva_sala_updated_at ON public.tab_reserva_sala;
DROP TRIGGER IF EXISTS update_room_reservations_updated_at ON public.tab_reserva_sala;

-- Criar trigger correto para atualizar dta_atualizacao
CREATE OR REPLACE TRIGGER update_tab_reserva_sala_dta_atualizacao
BEFORE UPDATE ON public.tab_reserva_sala
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();