-- Criar bucket para armazenamento de mídia das FAQs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'faqs',
  'faqs',
  true,
  52428800, -- 50MB para permitir vídeos
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket de FAQs
CREATE POLICY "Anyone can view faq files"
ON storage.objects FOR SELECT
USING (bucket_id = 'faqs');

CREATE POLICY "Admins can upload faq files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'faqs' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update faq files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'faqs' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete faq files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'faqs' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Adicionar colunas para imagem e vídeo na tabela de FAQs
ALTER TABLE public.tab_faq 
ADD COLUMN IF NOT EXISTS des_imagem_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS des_video_url text DEFAULT NULL;