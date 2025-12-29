-- Adicionar coluna para permitir comentários na tabela de comunicados
ALTER TABLE public.tab_comunicado
ADD COLUMN ind_permite_comentarios boolean DEFAULT false;

-- Criar tabela de comentários
CREATE TABLE public.tab_comunicado_comentario (
  cod_comentario uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_comunicado uuid NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
  seq_usuario uuid NOT NULL,
  seq_comentario_pai uuid REFERENCES public.tab_comunicado_comentario(cod_comentario) ON DELETE CASCADE,
  des_conteudo text NOT NULL,
  ind_editado boolean DEFAULT false,
  dta_cadastro timestamp with time zone DEFAULT now(),
  dta_atualizacao timestamp with time zone DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_comentario_comunicado ON public.tab_comunicado_comentario(seq_comunicado);
CREATE INDEX idx_comentario_usuario ON public.tab_comunicado_comentario(seq_usuario);
CREATE INDEX idx_comentario_pai ON public.tab_comunicado_comentario(seq_comentario_pai);

-- Habilitar RLS
ALTER TABLE public.tab_comunicado_comentario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view comments"
ON public.tab_comunicado_comentario
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments"
ON public.tab_comunicado_comentario
FOR INSERT
WITH CHECK (auth.uid() = seq_usuario);

CREATE POLICY "Users can update their own comments"
ON public.tab_comunicado_comentario
FOR UPDATE
USING (auth.uid() = seq_usuario);

CREATE POLICY "Users can delete their own comments"
ON public.tab_comunicado_comentario
FOR DELETE
USING (auth.uid() = seq_usuario);

CREATE POLICY "Admins can manage all comments"
ON public.tab_comunicado_comentario
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar dta_atualizacao
CREATE TRIGGER update_tab_comunicado_comentario_dta_atualizacao
BEFORE UPDATE ON public.tab_comunicado_comentario
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();