-- Recriar trigger para usar o nome correto da coluna
DROP TRIGGER IF EXISTS update_tab_comunicado_dta_atualizacao ON public.tab_comunicado;

CREATE TRIGGER update_tab_comunicado_dta_atualizacao
BEFORE UPDATE ON public.tab_comunicado
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();