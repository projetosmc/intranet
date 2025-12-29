-- Drop the old trigger that uses the wrong function
DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.tab_faq;

-- Create a new trigger using the correct function that updates dta_atualizacao
CREATE TRIGGER update_tab_faq_dta_atualizacao
BEFORE UPDATE ON public.tab_faq
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();