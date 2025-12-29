-- Adicionar coluna de tags para busca nos itens de menu
ALTER TABLE public.tab_menu_item 
ADD COLUMN IF NOT EXISTS des_tags text[] DEFAULT ARRAY[]::text[];

-- Comentário explicativo
COMMENT ON COLUMN public.tab_menu_item.des_tags IS 'Tags de busca para auxiliar na localização do item de menu';