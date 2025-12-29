-- Adicionar coluna para controlar quando mostrar o popup
ALTER TABLE public.tab_comunicado 
ADD COLUMN IF NOT EXISTS des_popup_modo text DEFAULT 'proximo_login';

-- Comentário para documentação
COMMENT ON COLUMN public.tab_comunicado.des_popup_modo IS 'Modo de exibição do popup: imediato ou proximo_login';