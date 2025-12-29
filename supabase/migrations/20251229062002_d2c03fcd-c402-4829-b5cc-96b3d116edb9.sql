-- Corrigir trigger que usa coluna incorreta
DROP TRIGGER IF EXISTS update_tab_comunicado_updated_at ON public.tab_comunicado;

-- Criar trigger corrigido se não existir
CREATE OR REPLACE FUNCTION public.update_dta_atualizacao_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dta_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recriar trigger com a função correta
DROP TRIGGER IF EXISTS update_tab_comunicado_dta_atualizacao ON public.tab_comunicado;
CREATE TRIGGER update_tab_comunicado_dta_atualizacao
BEFORE UPDATE ON public.tab_comunicado
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();