-- Drop the existing trigger if it exists on tab_menu_item
DROP TRIGGER IF EXISTS update_tab_menu_item_updated_at ON public.tab_menu_item;

-- Create a new function that works with the Portuguese column name
CREATE OR REPLACE FUNCTION public.update_dta_atualizacao_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.dta_atualizacao = now();
  RETURN NEW;
END;
$function$;

-- Create trigger for tab_menu_item using the correct column
CREATE TRIGGER update_tab_menu_item_dta_atualizacao
BEFORE UPDATE ON public.tab_menu_item
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();