-- Add image position column to announcements table
ALTER TABLE public.tab_comunicado 
ADD COLUMN IF NOT EXISTS des_posicao_imagem text DEFAULT 'center';