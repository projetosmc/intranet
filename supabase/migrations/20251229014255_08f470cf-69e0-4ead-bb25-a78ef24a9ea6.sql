-- Remove the old trigger that uses the wrong column name
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.tab_menu_item;