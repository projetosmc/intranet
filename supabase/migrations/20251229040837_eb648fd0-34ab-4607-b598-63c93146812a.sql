-- Adicionar coluna de tags na tabela de FAQs
ALTER TABLE public.tab_faq 
ADD COLUMN IF NOT EXISTS des_tags text[] DEFAULT ARRAY[]::text[];