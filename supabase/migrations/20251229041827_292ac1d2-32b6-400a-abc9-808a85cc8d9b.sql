-- Add caption columns for images and videos
ALTER TABLE public.tab_faq 
ADD COLUMN IF NOT EXISTS des_legenda_imagem text,
ADD COLUMN IF NOT EXISTS des_legenda_video text;