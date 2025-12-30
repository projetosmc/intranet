-- Enable realtime for menu items table so changes sync automatically to sidebar
ALTER PUBLICATION supabase_realtime ADD TABLE public.tab_menu_item;