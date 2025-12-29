-- Criar tabela de base de conhecimento com versionamento
CREATE TABLE public.tab_base_conhecimento (
  cod_item uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  des_titulo text NOT NULL,
  des_descricao text,
  des_tipo text NOT NULL CHECK (des_tipo IN ('imagem', 'video', 'documento')),
  des_arquivo_url text NOT NULL,
  des_arquivo_nome text NOT NULL,
  num_tamanho_bytes bigint,
  num_versao integer NOT NULL DEFAULT 1,
  seq_usuario_criacao uuid NOT NULL,
  seq_usuario_atualizacao uuid NOT NULL,
  des_nome_usuario_atualizacao text NOT NULL,
  dta_cadastro timestamp with time zone NOT NULL DEFAULT now(),
  dta_atualizacao timestamp with time zone NOT NULL DEFAULT now(),
  ind_ativo boolean DEFAULT true
);

-- Tabela de histórico de versões
CREATE TABLE public.tab_base_conhecimento_versao (
  cod_versao uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seq_item uuid NOT NULL REFERENCES public.tab_base_conhecimento(cod_item) ON DELETE CASCADE,
  num_versao integer NOT NULL,
  des_arquivo_url text NOT NULL,
  des_arquivo_nome text NOT NULL,
  num_tamanho_bytes bigint,
  seq_usuario uuid NOT NULL,
  des_nome_usuario text NOT NULL,
  dta_cadastro timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tab_base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_base_conhecimento_versao ENABLE ROW LEVEL SECURITY;

-- Políticas para base de conhecimento
CREATE POLICY "Authenticated users can view active items"
ON public.tab_base_conhecimento
FOR SELECT
USING (ind_ativo = true);

CREATE POLICY "Authenticated users can insert items"
ON public.tab_base_conhecimento
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update items"
ON public.tab_base_conhecimento
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all items"
ON public.tab_base_conhecimento
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para histórico de versões
CREATE POLICY "Authenticated users can view versions"
ON public.tab_base_conhecimento_versao
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert versions"
ON public.tab_base_conhecimento_versao
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar dta_atualizacao
CREATE TRIGGER update_base_conhecimento_updated_at
BEFORE UPDATE ON public.tab_base_conhecimento
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();

-- Criar bucket para arquivos da base de conhecimento
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Anyone can view knowledge base files"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-base');

CREATE POLICY "Authenticated users can upload knowledge base files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-base' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update knowledge base files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'knowledge-base' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete knowledge base files"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-base' AND auth.uid() IS NOT NULL);