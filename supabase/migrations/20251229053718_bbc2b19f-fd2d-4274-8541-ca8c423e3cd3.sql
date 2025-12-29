
-- ========================================
-- BASE DE CONHECIMENTO TI - NOVAS TABELAS
-- ========================================

-- 1) CATEGORIAS
CREATE TABLE IF NOT EXISTS public.tab_kb_categoria (
  cod_categoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  des_nome text NOT NULL UNIQUE,
  des_descricao text,
  ind_ativo boolean DEFAULT true,
  num_ordem integer DEFAULT 0,
  dta_cadastro timestamptz DEFAULT now(),
  dta_atualizacao timestamptz DEFAULT now()
);

ALTER TABLE public.tab_kb_categoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage KB categories"
ON public.tab_kb_categoria FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active KB categories"
ON public.tab_kb_categoria FOR SELECT
USING (ind_ativo = true);

-- 2) TAGS
CREATE TABLE IF NOT EXISTS public.tab_kb_tag (
  cod_tag uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  des_nome text NOT NULL UNIQUE,
  ind_ativo boolean DEFAULT true,
  num_ordem integer DEFAULT 0,
  dta_cadastro timestamptz DEFAULT now(),
  dta_atualizacao timestamptz DEFAULT now()
);

ALTER TABLE public.tab_kb_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage KB tags"
ON public.tab_kb_tag FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active KB tags"
ON public.tab_kb_tag FOR SELECT
USING (ind_ativo = true);

-- 3) ARTIGOS KB
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo (
  cod_artigo uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  des_titulo text NOT NULL,
  des_resumo text NOT NULL,
  des_tipo text NOT NULL CHECK (des_tipo IN ('FAQ', 'HOWTO', 'TROUBLESHOOT', 'RUNBOOK', 'POLITICA', 'POSTMORTEM')),
  cod_categoria uuid REFERENCES public.tab_kb_categoria(cod_categoria),
  des_sistema text,
  des_publico text DEFAULT 'TODOS',
  des_conteudo_md text NOT NULL,
  arr_sinonimos text[] DEFAULT ARRAY[]::text[],
  arr_pre_requisitos text[] DEFAULT ARRAY[]::text[],
  des_tempo_estimado text,
  des_link_ferramenta text,
  ind_status text DEFAULT 'RASCUNHO' CHECK (ind_status IN ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'ARQUIVADO')),
  cod_owner uuid,
  cod_revisor uuid,
  num_versao integer DEFAULT 1,
  ind_critico boolean DEFAULT false,
  num_helpful_up integer DEFAULT 0,
  num_helpful_down integer DEFAULT 0,
  num_views integer DEFAULT 0,
  ind_ativo boolean DEFAULT true,
  dta_criacao timestamptz DEFAULT now(),
  dta_atualizacao timestamptz DEFAULT now(),
  dta_publicacao timestamptz
);

ALTER TABLE public.tab_kb_artigo ENABLE ROW LEVEL SECURITY;

-- Admins e TI podem gerenciar todos
CREATE POLICY "Admins can manage KB articles"
ON public.tab_kb_artigo FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários autenticados podem ver artigos publicados
CREATE POLICY "Authenticated users can view published KB articles"
ON public.tab_kb_artigo FOR SELECT
USING (
  (ind_status = 'PUBLICADO' AND ind_ativo = true) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR cod_owner = auth.uid()
  OR cod_revisor = auth.uid()
);

-- Usuários autenticados podem criar artigos
CREATE POLICY "Authenticated users can create KB articles"
ON public.tab_kb_artigo FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Owner/Revisor podem atualizar seus artigos
CREATE POLICY "Owners can update their KB articles"
ON public.tab_kb_artigo FOR UPDATE
USING (
  cod_owner = auth.uid() 
  OR cod_revisor = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4) RELAÇÃO ARTIGO x TAG (N:N)
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo_tag (
  cod_artigo_tag uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  cod_tag uuid NOT NULL REFERENCES public.tab_kb_tag(cod_tag) ON DELETE CASCADE,
  dta_cadastro timestamptz DEFAULT now(),
  UNIQUE(cod_artigo, cod_tag)
);

ALTER TABLE public.tab_kb_artigo_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage KB article tags"
ON public.tab_kb_artigo_tag FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view KB article tags"
ON public.tab_kb_artigo_tag FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage KB article tags"
ON public.tab_kb_artigo_tag FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete KB article tags"
ON public.tab_kb_artigo_tag FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 5) ANEXOS
CREATE TABLE IF NOT EXISTS public.tab_kb_anexo (
  cod_anexo uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  des_nome text NOT NULL,
  des_url text NOT NULL,
  des_tipo text,
  num_tamanho_bytes bigint,
  seq_usuario uuid,
  dta_cadastro timestamptz DEFAULT now()
);

ALTER TABLE public.tab_kb_anexo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage KB attachments"
ON public.tab_kb_anexo FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view KB attachments"
ON public.tab_kb_anexo FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add KB attachments"
ON public.tab_kb_anexo FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 6) FEEDBACK (👍/👎 + comentário)
CREATE TABLE IF NOT EXISTS public.tab_kb_feedback (
  cod_feedback uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  seq_usuario uuid NOT NULL,
  ind_helpful boolean NOT NULL,
  des_comentario text,
  dta_cadastro timestamptz DEFAULT now(),
  UNIQUE(cod_artigo, seq_usuario)
);

ALTER TABLE public.tab_kb_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
ON public.tab_kb_feedback FOR INSERT
WITH CHECK (auth.uid() = seq_usuario);

CREATE POLICY "Users can view own feedback"
ON public.tab_kb_feedback FOR SELECT
USING (auth.uid() = seq_usuario OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own feedback"
ON public.tab_kb_feedback FOR UPDATE
USING (auth.uid() = seq_usuario);

CREATE POLICY "Users can delete own feedback"
ON public.tab_kb_feedback FOR DELETE
USING (auth.uid() = seq_usuario);

-- 7) VISUALIZAÇÕES (para "mais vistos" e "recentes")
CREATE TABLE IF NOT EXISTS public.tab_kb_visualizacao (
  cod_visualizacao uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  seq_usuario uuid NOT NULL,
  dta_cadastro timestamptz DEFAULT now()
);

ALTER TABLE public.tab_kb_visualizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can register views"
ON public.tab_kb_visualizacao FOR INSERT
WITH CHECK (auth.uid() = seq_usuario);

CREATE POLICY "Admins can view all KB views"
ON public.tab_kb_visualizacao FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own KB views"
ON public.tab_kb_visualizacao FOR SELECT
USING (auth.uid() = seq_usuario);

-- 8) VERSÕES DE ARTIGO (histórico)
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo_versao (
  cod_versao uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  num_versao integer NOT NULL,
  des_titulo text NOT NULL,
  des_resumo text NOT NULL,
  des_conteudo_md text NOT NULL,
  seq_usuario uuid NOT NULL,
  des_nome_usuario text NOT NULL,
  des_mudancas text,
  dta_cadastro timestamptz DEFAULT now()
);

ALTER TABLE public.tab_kb_artigo_versao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view KB article versions"
ON public.tab_kb_artigo_versao FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert KB article versions"
ON public.tab_kb_artigo_versao FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 9) FAVORITOS
CREATE TABLE IF NOT EXISTS public.tab_kb_favorito (
  cod_favorito uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  seq_usuario uuid NOT NULL,
  dta_cadastro timestamptz DEFAULT now(),
  UNIQUE(cod_artigo, seq_usuario)
);

ALTER TABLE public.tab_kb_favorito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
ON public.tab_kb_favorito FOR ALL
USING (auth.uid() = seq_usuario)
WITH CHECK (auth.uid() = seq_usuario);

-- 10) ARTIGOS RELACIONADOS
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo_relacionado (
  cod_relacao uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_artigo uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  cod_artigo_relacionado uuid NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
  dta_cadastro timestamptz DEFAULT now(),
  UNIQUE(cod_artigo, cod_artigo_relacionado)
);

ALTER TABLE public.tab_kb_artigo_relacionado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view related articles"
ON public.tab_kb_artigo_relacionado FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage related articles"
ON public.tab_kb_artigo_relacionado FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_kb_artigo_categoria ON public.tab_kb_artigo(cod_categoria);
CREATE INDEX IF NOT EXISTS idx_kb_artigo_status ON public.tab_kb_artigo(ind_status);
CREATE INDEX IF NOT EXISTS idx_kb_artigo_tipo ON public.tab_kb_artigo(des_tipo);
CREATE INDEX IF NOT EXISTS idx_kb_artigo_publico ON public.tab_kb_artigo(des_publico);
CREATE INDEX IF NOT EXISTS idx_kb_artigo_owner ON public.tab_kb_artigo(cod_owner);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_artigo ON public.tab_kb_feedback(cod_artigo);
CREATE INDEX IF NOT EXISTS idx_kb_visualizacao_artigo ON public.tab_kb_visualizacao(cod_artigo);
CREATE INDEX IF NOT EXISTS idx_kb_favorito_usuario ON public.tab_kb_favorito(seq_usuario);

-- Função para atualizar contadores de helpful
CREATE OR REPLACE FUNCTION public.update_kb_article_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ind_helpful = true THEN
      UPDATE public.tab_kb_artigo SET num_helpful_up = num_helpful_up + 1 WHERE cod_artigo = NEW.cod_artigo;
    ELSE
      UPDATE public.tab_kb_artigo SET num_helpful_down = num_helpful_down + 1 WHERE cod_artigo = NEW.cod_artigo;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.ind_helpful = true THEN
      UPDATE public.tab_kb_artigo SET num_helpful_up = GREATEST(0, num_helpful_up - 1) WHERE cod_artigo = OLD.cod_artigo;
    ELSE
      UPDATE public.tab_kb_artigo SET num_helpful_down = GREATEST(0, num_helpful_down - 1) WHERE cod_artigo = OLD.cod_artigo;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.ind_helpful != NEW.ind_helpful THEN
      IF NEW.ind_helpful = true THEN
        UPDATE public.tab_kb_artigo SET num_helpful_up = num_helpful_up + 1, num_helpful_down = GREATEST(0, num_helpful_down - 1) WHERE cod_artigo = NEW.cod_artigo;
      ELSE
        UPDATE public.tab_kb_artigo SET num_helpful_down = num_helpful_down + 1, num_helpful_up = GREATEST(0, num_helpful_up - 1) WHERE cod_artigo = NEW.cod_artigo;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_kb_feedback_helpful_counts
AFTER INSERT OR UPDATE OR DELETE ON public.tab_kb_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_kb_article_helpful_counts();

-- Função para incrementar views
CREATE OR REPLACE FUNCTION public.increment_kb_article_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tab_kb_artigo SET num_views = num_views + 1 WHERE cod_artigo = NEW.cod_artigo;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_kb_visualizacao_increment_views
AFTER INSERT ON public.tab_kb_visualizacao
FOR EACH ROW EXECUTE FUNCTION public.increment_kb_article_views();
