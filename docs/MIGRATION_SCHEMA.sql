-- =====================================================
-- MC HUB - SCRIPT DE MIGRAÇÃO COMPLETO
-- Gerado em: 2026-01-13
-- Para: Supabase Externo
-- =====================================================

-- IMPORTANTE: Execute este script em ordem no seu novo projeto Supabase
-- 1. Primeiro execute a seção de ENUM
-- 2. Depois as TABLES
-- 3. Em seguida as FUNCTIONS
-- 4. Por último os TRIGGERS e POLICIES

-- =====================================================
-- PARTE 1: ENUM TYPES
-- =====================================================

-- Tipo para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =====================================================
-- PARTE 2: TABELAS
-- =====================================================

-- Tabela: tab_perfil_usuario (Perfis de usuários)
CREATE TABLE public.tab_perfil_usuario (
    cod_usuario UUID NOT NULL PRIMARY KEY,
    des_nome_completo TEXT,
    des_email TEXT,
    des_telefone TEXT,
    des_departamento TEXT,
    des_cargo TEXT,
    des_unidade TEXT,
    des_avatar_url TEXT,
    des_ad_object_id TEXT,
    dta_aniversario DATE,
    dta_sincronizacao_ad TIMESTAMP WITH TIME ZONE,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ind_ativo BOOLEAN DEFAULT true
);

-- Tabela: tab_usuario_role (Roles de usuários)
CREATE TABLE public.tab_usuario_role (
    cod_usuario_role UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_usuario UUID NOT NULL,
    des_role public.app_role NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (seq_usuario, des_role)
);

-- Tabela: tab_perfil_tipo (Tipos de perfil/role)
CREATE TABLE public.tab_perfil_tipo (
    cod_perfil_tipo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_codigo TEXT NOT NULL UNIQUE,
    des_nome TEXT NOT NULL,
    des_descricao TEXT,
    des_cor TEXT DEFAULT 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    ind_sistema BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_permissao_tela (Permissões por tela)
CREATE TABLE public.tab_permissao_tela (
    cod_permissao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_role TEXT NOT NULL,
    des_rota TEXT NOT NULL,
    des_nome_tela TEXT NOT NULL,
    ind_pode_acessar BOOLEAN NOT NULL DEFAULT false,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (des_role, des_rota)
);

-- Tabela: tab_menu_item (Itens do menu)
CREATE TABLE public.tab_menu_item (
    cod_menu_item UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_menu_pai UUID REFERENCES public.tab_menu_item(cod_menu_item),
    des_nome TEXT NOT NULL,
    des_caminho TEXT NOT NULL,
    des_icone TEXT DEFAULT 'Circle',
    des_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    ind_admin_only BOOLEAN DEFAULT false,
    ind_nova_aba BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_comunicado (Comunicados/Anúncios)
CREATE TABLE public.tab_comunicado (
    cod_comunicado UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_titulo TEXT NOT NULL,
    des_resumo TEXT NOT NULL,
    des_conteudo TEXT NOT NULL,
    des_tipo_template TEXT DEFAULT 'simple',
    des_imagem_url TEXT,
    des_posicao_imagem TEXT DEFAULT 'center',
    des_tipo_enquete TEXT,
    seq_usuario_publicacao UUID,
    ind_ativo BOOLEAN DEFAULT true,
    ind_fixado BOOLEAN DEFAULT false,
    ind_urgente BOOLEAN DEFAULT false,
    ind_popup BOOLEAN DEFAULT false,
    des_popup_modo TEXT DEFAULT 'proximo_login',
    ind_permite_comentarios BOOLEAN DEFAULT false,
    dta_inicio TIMESTAMP WITH TIME ZONE,
    dta_fim TIMESTAMP WITH TIME ZONE,
    dta_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_comunicado_comentario (Comentários em comunicados)
CREATE TABLE public.tab_comunicado_comentario (
    cod_comentario UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    seq_comentario_pai UUID,
    des_conteudo TEXT NOT NULL,
    ind_editado BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_comunicado_popup_visto (Popups visualizados)
CREATE TABLE public.tab_comunicado_popup_visto (
    cod_popup_visto UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (seq_comunicado, seq_usuario)
);

-- Tabela: tab_comunicado_visualizacao (Visualizações de comunicados)
CREATE TABLE public.tab_comunicado_visualizacao (
    cod_visualizacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (seq_comunicado, seq_usuario)
);

-- Tabela: tab_enquete_opcao (Opções de enquete)
CREATE TABLE public.tab_enquete_opcao (
    cod_opcao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL,
    des_texto_opcao TEXT NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_enquete_voto (Votos em enquetes)
CREATE TABLE public.tab_enquete_voto (
    cod_voto UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_opcao UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (seq_opcao, seq_usuario)
);

-- Tabela: tab_evento_calendario (Eventos do calendário)
CREATE TABLE public.tab_evento_calendario (
    cod_evento UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_titulo TEXT NOT NULL,
    des_descricao TEXT,
    des_tipo_evento TEXT DEFAULT 'general',
    dta_evento DATE NOT NULL,
    seq_criado_por UUID,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_sala_reuniao (Salas de reunião)
CREATE TABLE public.tab_sala_reuniao (
    cod_sala UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    num_capacidade INTEGER NOT NULL DEFAULT 10,
    des_roles_permitidos TEXT[] DEFAULT ARRAY['all'],
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_tipo_reuniao (Tipos de reunião)
CREATE TABLE public.tab_tipo_reuniao (
    cod_tipo_reuniao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_reserva_sala (Reservas de salas)
CREATE TABLE public.tab_reserva_sala (
    cod_reserva UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_sala UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    seq_tipo_reuniao UUID,
    des_nome_solicitante TEXT NOT NULL,
    dta_reserva DATE NOT NULL,
    hra_inicio TIME NOT NULL,
    hra_fim TIME NOT NULL,
    num_participantes INTEGER DEFAULT 1,
    des_observacao TEXT,
    ind_cancelado BOOLEAN DEFAULT false,
    des_motivo_cancelamento TEXT,
    dta_cancelamento TIMESTAMP WITH TIME ZONE,
    ind_notificado BOOLEAN DEFAULT false,
    des_historico_alteracoes JSONB DEFAULT '[]'::jsonb,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_sistema (Status dos sistemas)
CREATE TABLE public.tab_sistema (
    cod_sistema UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    des_status TEXT NOT NULL DEFAULT 'operational',
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_ultima_verificacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_faq (Perguntas frequentes)
CREATE TABLE public.tab_faq (
    cod_faq UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_pergunta TEXT NOT NULL,
    des_resposta TEXT NOT NULL,
    des_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    des_imagem_url TEXT,
    des_legenda_imagem TEXT,
    des_video_url TEXT,
    des_legenda_video TEXT,
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_config_suporte (Configurações de suporte)
CREATE TABLE public.tab_config_suporte (
    cod_config UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_tipo TEXT NOT NULL,
    des_nome TEXT NOT NULL,
    des_valor TEXT NOT NULL,
    des_descricao TEXT,
    des_icone TEXT DEFAULT 'Circle',
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_notificacao (Notificações)
CREATE TABLE public.tab_notificacao (
    cod_notificacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_usuario UUID NOT NULL,
    seq_usuario_origem UUID,
    des_tipo TEXT NOT NULL,
    des_titulo TEXT NOT NULL,
    des_mensagem TEXT NOT NULL,
    des_link TEXT,
    ind_lida BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_log_auditoria (Logs de auditoria)
CREATE TABLE public.tab_log_auditoria (
    cod_log UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_usuario UUID,
    seq_usuario_alvo UUID,
    des_acao TEXT NOT NULL,
    des_tipo_entidade TEXT NOT NULL,
    des_id_entidade TEXT,
    des_valor_anterior JSONB,
    des_valor_novo JSONB,
    des_ip TEXT,
    des_user_agent TEXT,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_base_conhecimento (Base de conhecimento - arquivos)
CREATE TABLE public.tab_base_conhecimento (
    cod_item UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_titulo TEXT NOT NULL,
    des_descricao TEXT,
    des_tipo TEXT NOT NULL,
    des_arquivo_nome TEXT NOT NULL,
    des_arquivo_url TEXT NOT NULL,
    num_tamanho_bytes BIGINT,
    num_versao INTEGER NOT NULL DEFAULT 1,
    seq_usuario_criacao UUID NOT NULL,
    seq_usuario_atualizacao UUID NOT NULL,
    des_nome_usuario_atualizacao TEXT NOT NULL,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_base_conhecimento_versao (Versões da base de conhecimento)
CREATE TABLE public.tab_base_conhecimento_versao (
    cod_versao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_item UUID NOT NULL,
    num_versao INTEGER NOT NULL,
    des_arquivo_nome TEXT NOT NULL,
    des_arquivo_url TEXT NOT NULL,
    num_tamanho_bytes BIGINT,
    seq_usuario UUID NOT NULL,
    des_nome_usuario TEXT NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_kb_categoria (Categorias da KB)
CREATE TABLE public.tab_kb_categoria (
    cod_categoria UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    des_descricao TEXT,
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_kb_tag (Tags da KB)
CREATE TABLE public.tab_kb_tag (
    cod_tag UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    num_ordem INTEGER DEFAULT 0,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_kb_artigo (Artigos da KB)
CREATE TABLE public.tab_kb_artigo (
    cod_artigo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_categoria UUID,
    des_titulo TEXT NOT NULL,
    des_resumo TEXT NOT NULL,
    des_conteudo_md TEXT NOT NULL,
    des_tipo TEXT NOT NULL,
    des_sistema TEXT,
    des_publico TEXT DEFAULT 'TODOS',
    des_tempo_estimado TEXT,
    des_link_ferramenta TEXT,
    arr_pre_requisitos TEXT[] DEFAULT ARRAY[]::TEXT[],
    arr_sinonimos TEXT[] DEFAULT ARRAY[]::TEXT[],
    ind_status TEXT DEFAULT 'RASCUNHO',
    ind_critico BOOLEAN DEFAULT false,
    num_versao INTEGER DEFAULT 1,
    num_views INTEGER DEFAULT 0,
    num_helpful_up INTEGER DEFAULT 0,
    num_helpful_down INTEGER DEFAULT 0,
    cod_owner UUID,
    cod_revisor UUID,
    ind_ativo BOOLEAN DEFAULT true,
    dta_publicacao TIMESTAMP WITH TIME ZONE,
    dta_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_kb_artigo_tag (Relação artigo-tag)
CREATE TABLE public.tab_kb_artigo_tag (
    cod_artigo_tag UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    cod_tag UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (cod_artigo, cod_tag)
);

-- Tabela: tab_kb_artigo_relacionado (Artigos relacionados)
CREATE TABLE public.tab_kb_artigo_relacionado (
    cod_relacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    cod_artigo_relacionado UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (cod_artigo, cod_artigo_relacionado)
);

-- Tabela: tab_kb_artigo_versao (Versões de artigos)
CREATE TABLE public.tab_kb_artigo_versao (
    cod_versao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    num_versao INTEGER NOT NULL,
    des_titulo TEXT NOT NULL,
    des_resumo TEXT NOT NULL,
    des_conteudo_md TEXT NOT NULL,
    des_mudancas TEXT,
    seq_usuario UUID NOT NULL,
    des_nome_usuario TEXT NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_kb_anexo (Anexos de artigos KB)
CREATE TABLE public.tab_kb_anexo (
    cod_anexo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    des_nome TEXT NOT NULL,
    des_url TEXT NOT NULL,
    des_tipo TEXT,
    num_tamanho_bytes BIGINT,
    seq_usuario UUID,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: tab_kb_favorito (Favoritos KB)
CREATE TABLE public.tab_kb_favorito (
    cod_favorito UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (cod_artigo, seq_usuario)
);

-- Tabela: tab_kb_feedback (Feedback de artigos KB)
CREATE TABLE public.tab_kb_feedback (
    cod_feedback UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    ind_helpful BOOLEAN NOT NULL,
    des_comentario TEXT,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (cod_artigo, seq_usuario)
);

-- Tabela: tab_kb_visualizacao (Visualizações de artigos KB)
CREATE TABLE public.tab_kb_visualizacao (
    cod_visualizacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- PARTE 3: VIEWS
-- =====================================================

-- View pública do diretório de usuários (dados não sensíveis)
CREATE VIEW public.view_diretorio_publico 
WITH (security_invoker = true)
AS
SELECT 
    cod_usuario,
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
FROM public.tab_perfil_usuario
WHERE ind_ativo = true;

-- =====================================================
-- PARTE 4: FUNÇÕES
-- =====================================================

-- Função para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tab_usuario_role
    WHERE seq_usuario = _user_id
      AND des_role = _role
  )
$$;

-- Função para criar usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.tab_perfil_usuario (cod_usuario, des_email, des_nome_completo)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Função para configurar primeiro admin
CREATE OR REPLACE FUNCTION public.setup_first_admin(admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.tab_usuario_role WHERE des_role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'An admin already exists';
  END IF;
  
  INSERT INTO public.tab_usuario_role (seq_usuario, des_role)
  VALUES (admin_user_id, 'admin');
END;
$$;

-- Função para atualizar timestamp de atualização
CREATE OR REPLACE FUNCTION public.update_dta_atualizacao_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.dta_atualizacao = now();
  RETURN NEW;
END;
$$;

-- Função para buscar dados públicos de usuário
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_id UUID)
RETURNS TABLE(nome TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    des_nome_completo,
    des_avatar_url
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id
    AND ind_ativo = true;
$$;

-- Função para buscar dados públicos completos
CREATE OR REPLACE FUNCTION public.get_user_public_info(user_id UUID)
RETURNS TABLE(
    nome TEXT, 
    departamento TEXT, 
    cargo TEXT, 
    avatar_url TEXT, 
    unidade TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id
    AND ind_ativo = true;
$$;

-- Função para pesquisar diretório de usuários
CREATE OR REPLACE FUNCTION public.search_users_directory(search_term TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE(id UUID, nome TEXT, departamento TEXT, cargo TEXT, avatar_url TEXT, unidade TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    cod_usuario,
    des_nome_completo,
    des_departamento,
    des_cargo,
    des_avatar_url,
    des_unidade
  FROM public.tab_perfil_usuario
  WHERE ind_ativo = true
    AND (
      des_nome_completo ILIKE '%' || search_term || '%'
      OR des_departamento ILIKE '%' || search_term || '%'
    )
  ORDER BY des_nome_completo
  LIMIT result_limit;
$$;

-- Função para criar permissões para novo perfil
CREATE OR REPLACE FUNCTION public.create_permissions_for_new_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  screen RECORD;
BEGIN
  FOR screen IN 
    SELECT DISTINCT des_rota, des_nome_tela, num_ordem 
    FROM public.tab_permissao_tela 
    WHERE des_role = 'user'
    ORDER BY num_ordem
  LOOP
    INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
    VALUES (NEW.des_codigo, screen.des_rota, screen.des_nome_tela, false, screen.num_ordem)
    ON CONFLICT (des_role, des_rota) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Função para deletar permissões quando perfil é excluído
CREATE OR REPLACE FUNCTION public.delete_permissions_for_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.tab_permissao_tela 
  WHERE des_role = OLD.des_codigo;
  
  RETURN OLD;
END;
$$;

-- Função para atualizar contadores de feedback KB
CREATE OR REPLACE FUNCTION public.update_kb_article_helpful_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Função para incrementar views de artigo KB
CREATE OR REPLACE FUNCTION public.increment_kb_article_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.tab_kb_artigo SET num_views = num_views + 1 WHERE cod_artigo = NEW.cod_artigo;
  RETURN NULL;
END;
$$;

-- =====================================================
-- PARTE 5: TRIGGERS
-- =====================================================

-- Trigger para criar usuário automaticamente no signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para criar permissões quando novo perfil é criado
CREATE TRIGGER on_role_type_created
  AFTER INSERT ON public.tab_perfil_tipo
  FOR EACH ROW EXECUTE FUNCTION public.create_permissions_for_new_role();

-- Trigger para deletar permissões quando perfil é excluído
CREATE TRIGGER on_role_type_deleted
  BEFORE DELETE ON public.tab_perfil_tipo
  FOR EACH ROW EXECUTE FUNCTION public.delete_permissions_for_role();

-- Trigger para atualizar contadores de feedback KB
CREATE TRIGGER on_kb_feedback_change
  AFTER INSERT OR UPDATE OR DELETE ON public.tab_kb_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_kb_article_helpful_counts();

-- Trigger para incrementar views de artigo KB
CREATE TRIGGER on_kb_view_insert
  AFTER INSERT ON public.tab_kb_visualizacao
  FOR EACH ROW EXECUTE FUNCTION public.increment_kb_article_views();

-- =====================================================
-- PARTE 6: HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.tab_perfil_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_usuario_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_perfil_tipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_permissao_tela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_menu_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado_comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado_popup_visto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado_visualizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_enquete_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_enquete_voto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_evento_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_sala_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_tipo_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_reserva_sala ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_config_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_log_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_base_conhecimento_versao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo_relacionado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo_versao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_anexo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_favorito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_visualizacao ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 7: POLÍTICAS RLS
-- =====================================================

-- Políticas para tab_perfil_usuario
CREATE POLICY "Users can view own profile" ON public.tab_perfil_usuario FOR SELECT TO authenticated USING (auth.uid() = cod_usuario);
CREATE POLICY "Users can insert own profile" ON public.tab_perfil_usuario FOR INSERT TO authenticated WITH CHECK (auth.uid() = cod_usuario);
CREATE POLICY "Users can update own profile" ON public.tab_perfil_usuario FOR UPDATE TO authenticated USING (auth.uid() = cod_usuario) WITH CHECK (auth.uid() = cod_usuario);

-- Políticas para tab_usuario_role
CREATE POLICY "Admins can manage all roles" ON public.tab_usuario_role FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.tab_usuario_role FOR SELECT USING (auth.uid() = seq_usuario);

-- Políticas para tab_perfil_tipo
CREATE POLICY "Admins can manage role types" ON public.tab_perfil_tipo FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view role types" ON public.tab_perfil_tipo FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_permissao_tela
CREATE POLICY "Admins can manage screen permissions" ON public.tab_permissao_tela FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view permissions" ON public.tab_permissao_tela FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tab_menu_item
CREATE POLICY "Admins can manage menu items" ON public.tab_menu_item FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view active menu items" ON public.tab_menu_item FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_comunicado
CREATE POLICY "Admins can manage announcements" ON public.tab_comunicado FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can read active announcements" ON public.tab_comunicado FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_comunicado_comentario
CREATE POLICY "Admins can manage all comments" ON public.tab_comunicado_comentario FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view comments" ON public.tab_comunicado_comentario FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create comments" ON public.tab_comunicado_comentario FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can update their own comments" ON public.tab_comunicado_comentario FOR UPDATE USING (auth.uid() = seq_usuario);
CREATE POLICY "Users can delete their own comments" ON public.tab_comunicado_comentario FOR DELETE USING (auth.uid() = seq_usuario);

-- Políticas para tab_comunicado_popup_visto
CREATE POLICY "Users can mark popups as seen" ON public.tab_comunicado_popup_visto FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can view their own popup views" ON public.tab_comunicado_popup_visto FOR SELECT USING (auth.uid() = seq_usuario);

-- Políticas para tab_comunicado_visualizacao
CREATE POLICY "Users can insert their view" ON public.tab_comunicado_visualizacao FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can view their own views" ON public.tab_comunicado_visualizacao FOR SELECT USING (auth.uid() = seq_usuario);
CREATE POLICY "Admins can view all views" ON public.tab_comunicado_visualizacao FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Políticas para tab_enquete_opcao
CREATE POLICY "Admins can manage poll options" ON public.tab_enquete_opcao FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Announcement creators can manage their poll options" ON public.tab_enquete_opcao FOR ALL USING (
  EXISTS (SELECT 1 FROM tab_comunicado WHERE cod_comunicado = tab_enquete_opcao.seq_comunicado AND seq_usuario_publicacao = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM tab_comunicado WHERE cod_comunicado = tab_enquete_opcao.seq_comunicado AND seq_usuario_publicacao = auth.uid())
);
CREATE POLICY "Anyone can read poll options" ON public.tab_enquete_opcao FOR SELECT USING (true);

-- Políticas para tab_enquete_voto
CREATE POLICY "Users can vote" ON public.tab_enquete_voto FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can remove their vote" ON public.tab_enquete_voto FOR DELETE USING (auth.uid() = seq_usuario);
CREATE POLICY "Users can see vote counts" ON public.tab_enquete_voto FOR SELECT USING (true);

-- Políticas para tab_evento_calendario
CREATE POLICY "Admins can manage events" ON public.tab_evento_calendario FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view events" ON public.tab_evento_calendario FOR SELECT USING (true);

-- Políticas para tab_sala_reuniao
CREATE POLICY "Admins can manage rooms" ON public.tab_sala_reuniao FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active rooms" ON public.tab_sala_reuniao FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_tipo_reuniao
CREATE POLICY "Admins can manage meeting types" ON public.tab_tipo_reuniao FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active meeting types" ON public.tab_tipo_reuniao FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_reserva_sala
CREATE POLICY "Admins can manage all reservations" ON public.tab_reserva_sala FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view reservations" ON public.tab_reserva_sala FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create their own reservations" ON public.tab_reserva_sala FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can update their own reservations" ON public.tab_reserva_sala FOR UPDATE USING (auth.uid() = seq_usuario);
CREATE POLICY "Users can delete their own reservations" ON public.tab_reserva_sala FOR DELETE USING (auth.uid() = seq_usuario);

-- Políticas para tab_sistema
CREATE POLICY "Admins can manage systems" ON public.tab_sistema FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active systems" ON public.tab_sistema FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_faq
CREATE POLICY "Admins can manage FAQs" ON public.tab_faq FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active FAQs" ON public.tab_faq FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_config_suporte
CREATE POLICY "Admins can manage support config" ON public.tab_config_suporte FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active support config" ON public.tab_config_suporte FOR SELECT USING (auth.uid() IS NOT NULL AND ind_ativo = true);

-- Políticas para tab_notificacao
CREATE POLICY "System can create notifications" ON public.tab_notificacao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view their own notifications" ON public.tab_notificacao FOR SELECT USING (auth.uid() = seq_usuario);
CREATE POLICY "Users can update their own notifications" ON public.tab_notificacao FOR UPDATE USING (auth.uid() = seq_usuario);
CREATE POLICY "Users can delete their own notifications" ON public.tab_notificacao FOR DELETE USING (auth.uid() = seq_usuario);

-- Políticas para tab_log_auditoria
CREATE POLICY "System can insert audit logs" ON public.tab_log_auditoria FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view audit logs" ON public.tab_log_auditoria FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Políticas para tab_base_conhecimento
CREATE POLICY "Admins can manage all items" ON public.tab_base_conhecimento FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active items" ON public.tab_base_conhecimento FOR SELECT USING (ind_ativo = true);
CREATE POLICY "Authenticated users can insert items" ON public.tab_base_conhecimento FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update items" ON public.tab_base_conhecimento FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Políticas para tab_base_conhecimento_versao
CREATE POLICY "Authenticated users can insert versions" ON public.tab_base_conhecimento_versao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view versions" ON public.tab_base_conhecimento_versao FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tab_kb_categoria
CREATE POLICY "Admins can manage KB categories" ON public.tab_kb_categoria FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active KB categories" ON public.tab_kb_categoria FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_kb_tag
CREATE POLICY "Admins can manage KB tags" ON public.tab_kb_tag FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view active KB tags" ON public.tab_kb_tag FOR SELECT USING (ind_ativo = true);

-- Políticas para tab_kb_artigo
CREATE POLICY "Admins can manage KB articles" ON public.tab_kb_artigo FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view published KB articles" ON public.tab_kb_artigo FOR SELECT USING (
  (ind_status = 'PUBLICADO' AND ind_ativo = true) 
  OR has_role(auth.uid(), 'admin') 
  OR cod_owner = auth.uid() 
  OR cod_revisor = auth.uid()
);
CREATE POLICY "Authenticated users can create KB articles" ON public.tab_kb_artigo FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update their KB articles" ON public.tab_kb_artigo FOR UPDATE USING (
  cod_owner = auth.uid() OR cod_revisor = auth.uid() OR has_role(auth.uid(), 'admin')
);

-- Políticas para tab_kb_artigo_tag
CREATE POLICY "Admins can manage KB article tags" ON public.tab_kb_artigo_tag FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view KB article tags" ON public.tab_kb_artigo_tag FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage KB article tags" ON public.tab_kb_artigo_tag FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete KB article tags" ON public.tab_kb_artigo_tag FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para tab_kb_artigo_relacionado
CREATE POLICY "Admins can manage related articles" ON public.tab_kb_artigo_relacionado FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view related articles" ON public.tab_kb_artigo_relacionado FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tab_kb_artigo_versao
CREATE POLICY "Authenticated users can insert KB article versions" ON public.tab_kb_artigo_versao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view KB article versions" ON public.tab_kb_artigo_versao FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tab_kb_anexo
CREATE POLICY "Admins can manage KB attachments" ON public.tab_kb_anexo FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can add KB attachments" ON public.tab_kb_anexo FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view KB attachments" ON public.tab_kb_anexo FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tab_kb_favorito
CREATE POLICY "Users can manage own favorites" ON public.tab_kb_favorito FOR ALL USING (auth.uid() = seq_usuario) WITH CHECK (auth.uid() = seq_usuario);

-- Políticas para tab_kb_feedback
CREATE POLICY "Users can submit feedback" ON public.tab_kb_feedback FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can view own feedback" ON public.tab_kb_feedback FOR SELECT USING (auth.uid() = seq_usuario OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own feedback" ON public.tab_kb_feedback FOR UPDATE USING (auth.uid() = seq_usuario);
CREATE POLICY "Users can delete own feedback" ON public.tab_kb_feedback FOR DELETE USING (auth.uid() = seq_usuario);

-- Políticas para tab_kb_visualizacao
CREATE POLICY "Users can register views" ON public.tab_kb_visualizacao FOR INSERT WITH CHECK (auth.uid() = seq_usuario);
CREATE POLICY "Users can view own KB views" ON public.tab_kb_visualizacao FOR SELECT USING (auth.uid() = seq_usuario);
CREATE POLICY "Admins can view all KB views" ON public.tab_kb_visualizacao FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- PARTE 8: STORAGE BUCKETS
-- =====================================================

-- Bucket para anúncios (banners e avatares)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('announcements', 'announcements', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Política de upload para bucket announcements
CREATE POLICY "Authenticated users can upload to announcements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcements');

-- Política de leitura pública para bucket announcements
CREATE POLICY "Public can read announcements files"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

-- Política de atualização para bucket announcements
CREATE POLICY "Authenticated users can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'announcements');

-- Política de deleção para bucket announcements
CREATE POLICY "Authenticated users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'announcements');

-- =====================================================
-- PARTE 9: GRANTS
-- =====================================================

GRANT SELECT ON public.view_diretorio_publico TO authenticated;

-- =====================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- =====================================================
