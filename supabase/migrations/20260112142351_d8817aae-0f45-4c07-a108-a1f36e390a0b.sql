-- Fix overly permissive RLS policy on tab_enquete_opcao
-- Drop the overly permissive policy that allows any authenticated user to modify poll options
DROP POLICY IF EXISTS "Authenticated users can manage poll options" ON public.tab_enquete_opcao;

-- Create proper ownership-based policies

-- Admins can manage all poll options
CREATE POLICY "Admins can manage poll options"
ON public.tab_enquete_opcao FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Announcement creators can manage their poll options
CREATE POLICY "Announcement creators can manage their poll options"
ON public.tab_enquete_opcao FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tab_comunicado
    WHERE cod_comunicado = tab_enquete_opcao.seq_comunicado
    AND seq_usuario_publicacao = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tab_comunicado
    WHERE cod_comunicado = tab_enquete_opcao.seq_comunicado
    AND seq_usuario_publicacao = auth.uid()
  )
);