-- Create storage bucket for KB attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('kb-attachments', 'kb-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kb-attachments
CREATE POLICY "Authenticated users can view KB attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload KB attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kb-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete KB attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'kb-attachments' AND public.has_role(auth.uid(), 'admin'));

-- Add urgent announcement columns
ALTER TABLE public.tab_comunicado 
ADD COLUMN IF NOT EXISTS ind_urgente boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ind_popup boolean DEFAULT false;

-- Create table for tracking which users have seen urgent popups
CREATE TABLE IF NOT EXISTS public.tab_comunicado_popup_visto (
  cod_popup_visto uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_comunicado uuid NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
  seq_usuario uuid NOT NULL,
  dta_cadastro timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(seq_comunicado, seq_usuario)
);

-- Enable RLS
ALTER TABLE public.tab_comunicado_popup_visto ENABLE ROW LEVEL SECURITY;

-- RLS policies for popup tracking
CREATE POLICY "Users can view their own popup views"
ON public.tab_comunicado_popup_visto FOR SELECT
USING (auth.uid() = seq_usuario);

CREATE POLICY "Users can mark popups as seen"
ON public.tab_comunicado_popup_visto FOR INSERT
WITH CHECK (auth.uid() = seq_usuario);