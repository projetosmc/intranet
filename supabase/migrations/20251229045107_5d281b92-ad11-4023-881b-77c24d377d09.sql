-- Adicionar coluna de autor e agendamento na tabela de comunicados
ALTER TABLE public.tab_comunicado
ADD COLUMN seq_usuario_publicacao uuid,
ADD COLUMN dta_inicio timestamp with time zone,
ADD COLUMN dta_fim timestamp with time zone;

-- Criar tabela de visualizações
CREATE TABLE public.tab_comunicado_visualizacao (
  cod_visualizacao uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seq_comunicado uuid NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
  seq_usuario uuid NOT NULL,
  dta_cadastro timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(seq_comunicado, seq_usuario)
);

-- Habilitar RLS
ALTER TABLE public.tab_comunicado_visualizacao ENABLE ROW LEVEL SECURITY;

-- Políticas para visualizações
CREATE POLICY "Users can view their own views"
ON public.tab_comunicado_visualizacao
FOR SELECT
USING (auth.uid() = seq_usuario);

CREATE POLICY "Users can insert their view"
ON public.tab_comunicado_visualizacao
FOR INSERT
WITH CHECK (auth.uid() = seq_usuario);

CREATE POLICY "Admins can view all views"
ON public.tab_comunicado_visualizacao
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Índice para contagem rápida
CREATE INDEX idx_comunicado_visualizacao_comunicado ON public.tab_comunicado_visualizacao(seq_comunicado);