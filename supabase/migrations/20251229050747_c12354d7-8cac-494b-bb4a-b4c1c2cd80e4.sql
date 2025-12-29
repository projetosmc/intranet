-- Criar tabela de notificações
CREATE TABLE public.tab_notificacao (
  cod_notificacao uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_usuario uuid NOT NULL, -- usuário que recebe a notificação
  seq_usuario_origem uuid, -- usuário que originou a notificação
  des_tipo text NOT NULL, -- 'mention', 'reply', etc
  des_titulo text NOT NULL,
  des_mensagem text NOT NULL,
  des_link text, -- link para o conteúdo relacionado
  ind_lida boolean DEFAULT false,
  dta_cadastro timestamp with time zone DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_notificacao_usuario ON public.tab_notificacao(seq_usuario);
CREATE INDEX idx_notificacao_lida ON public.tab_notificacao(seq_usuario, ind_lida);

-- Habilitar RLS
ALTER TABLE public.tab_notificacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notifications"
ON public.tab_notificacao
FOR SELECT
USING (auth.uid() = seq_usuario);

CREATE POLICY "System can create notifications"
ON public.tab_notificacao
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own notifications"
ON public.tab_notificacao
FOR UPDATE
USING (auth.uid() = seq_usuario);

CREATE POLICY "Users can delete their own notifications"
ON public.tab_notificacao
FOR DELETE
USING (auth.uid() = seq_usuario);