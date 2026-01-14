-- ============================================================
-- MC Hub - Script de Migração: ESTRUTURA DO BANCO DE DADOS
-- Gerado em: 2026-01-14 (Atualizado)
-- Compatível com: Supabase (PostgreSQL 15+)
-- Ordem de Execução: 1 (executar primeiro)
-- ============================================================

-- ============================================================
-- PASSO 1: Criar ENUM para roles
-- ============================================================
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PASSO 2: Criar função has_role (SECURITY DEFINER)
-- Evita recursão de RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tab_usuario_role
    WHERE seq_usuario = _user_id
      AND des_role = _role
  )
$$;

-- ============================================================
-- PASSO 3: Criar TABELAS
-- ============================================================

-- Perfil de Usuário
CREATE TABLE IF NOT EXISTS public.tab_perfil_usuario (
    cod_usuario UUID NOT NULL PRIMARY KEY,
    des_nome_completo TEXT,
    des_email TEXT,
    des_cargo TEXT,
    des_departamento TEXT,
    des_unidade TEXT,
    des_telefone TEXT,
    des_avatar_url TEXT,
    dta_aniversario DATE,
    des_ad_object_id TEXT,
    dta_sincronizacao_ad TIMESTAMPTZ,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Roles de Usuário
CREATE TABLE IF NOT EXISTS public.tab_usuario_role (
    cod_usuario_role UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_usuario UUID NOT NULL,
    des_role app_role NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(seq_usuario, des_role)
);

-- Tipos de Perfil (admin, moderator, user, etc.)
CREATE TABLE IF NOT EXISTS public.tab_perfil_tipo (
    cod_perfil_tipo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_codigo TEXT NOT NULL,
    des_nome TEXT NOT NULL,
    des_descricao TEXT,
    des_cor TEXT DEFAULT 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    ind_sistema BOOLEAN DEFAULT false,
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Permissões por Tela
CREATE TABLE IF NOT EXISTS public.tab_permissao_tela (
    cod_permissao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_rota TEXT NOT NULL,
    des_nome_tela TEXT NOT NULL,
    des_role TEXT NOT NULL,
    ind_pode_acessar BOOLEAN DEFAULT false,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now(),
    UNIQUE(des_role, des_rota)
);

-- Comunicados
CREATE TABLE IF NOT EXISTS public.tab_comunicado (
    cod_comunicado UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_titulo TEXT NOT NULL,
    des_resumo TEXT NOT NULL,
    des_conteudo TEXT NOT NULL,
    des_tipo_template TEXT DEFAULT 'simple',
    des_imagem_url TEXT,
    des_posicao_imagem TEXT DEFAULT 'center',
    des_tipo_enquete TEXT,
    ind_fixado BOOLEAN DEFAULT false,
    ind_ativo BOOLEAN DEFAULT true,
    ind_permite_comentarios BOOLEAN DEFAULT false,
    ind_urgente BOOLEAN DEFAULT false,
    ind_popup BOOLEAN DEFAULT false,
    des_popup_modo TEXT DEFAULT 'proximo_login',
    seq_usuario_publicacao UUID,
    dta_publicacao TIMESTAMPTZ DEFAULT now(),
    dta_inicio TIMESTAMPTZ,
    dta_fim TIMESTAMPTZ,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Comentários de Comunicados
CREATE TABLE IF NOT EXISTS public.tab_comunicado_comentario (
    cod_comentario UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    seq_comentario_pai UUID REFERENCES public.tab_comunicado_comentario(cod_comentario) ON DELETE CASCADE,
    des_conteudo TEXT NOT NULL,
    ind_editado BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Visualizações de Comunicados
CREATE TABLE IF NOT EXISTS public.tab_comunicado_visualizacao (
    cod_visualizacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(seq_comunicado, seq_usuario)
);

-- Popups Vistos
CREATE TABLE IF NOT EXISTS public.tab_comunicado_popup_visto (
    cod_popup_visto UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(seq_comunicado, seq_usuario)
);

-- Opções de Enquete
CREATE TABLE IF NOT EXISTS public.tab_enquete_opcao (
    cod_opcao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_comunicado UUID NOT NULL REFERENCES public.tab_comunicado(cod_comunicado) ON DELETE CASCADE,
    des_texto_opcao TEXT NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Votos de Enquete
CREATE TABLE IF NOT EXISTS public.tab_enquete_voto (
    cod_voto UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_opcao UUID NOT NULL REFERENCES public.tab_enquete_opcao(cod_opcao) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(seq_opcao, seq_usuario)
);

-- Eventos do Calendário
CREATE TABLE IF NOT EXISTS public.tab_evento_calendario (
    cod_evento UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_titulo TEXT NOT NULL,
    des_descricao TEXT,
    des_tipo_evento TEXT DEFAULT 'general',
    dta_evento DATE NOT NULL,
    seq_criado_por UUID,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Itens de Menu
CREATE TABLE IF NOT EXISTS public.tab_menu_item (
    cod_menu_item UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    des_caminho TEXT NOT NULL,
    des_icone TEXT DEFAULT 'Circle',
    des_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    seq_menu_pai UUID REFERENCES public.tab_menu_item(cod_menu_item) ON DELETE SET NULL,
    ind_admin_only BOOLEAN DEFAULT false,
    ind_nova_aba BOOLEAN DEFAULT false,
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Sistemas (para página de status)
CREATE TABLE IF NOT EXISTS public.tab_sistema (
    cod_sistema UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    des_status TEXT DEFAULT 'operational',
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_ultima_verificacao TIMESTAMPTZ DEFAULT now(),
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- FAQs
CREATE TABLE IF NOT EXISTS public.tab_faq (
    cod_faq UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_pergunta TEXT NOT NULL,
    des_resposta TEXT NOT NULL,
    des_imagem_url TEXT,
    des_legenda_imagem TEXT,
    des_video_url TEXT,
    des_legenda_video TEXT,
    des_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Salas de Reunião
CREATE TABLE IF NOT EXISTS public.tab_sala_reuniao (
    cod_sala UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    num_capacidade INTEGER DEFAULT 10,
    des_roles_permitidos TEXT[] DEFAULT ARRAY['all'],
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Tipos de Reunião
CREATE TABLE IF NOT EXISTS public.tab_tipo_reuniao (
    cod_tipo_reuniao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Reservas de Sala
CREATE TABLE IF NOT EXISTS public.tab_reserva_sala (
    cod_reserva UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_sala UUID NOT NULL REFERENCES public.tab_sala_reuniao(cod_sala) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    seq_tipo_reuniao UUID REFERENCES public.tab_tipo_reuniao(cod_tipo_reuniao) ON DELETE SET NULL,
    des_nome_solicitante TEXT NOT NULL,
    des_observacao TEXT,
    dta_reserva DATE NOT NULL,
    hra_inicio TIME NOT NULL,
    hra_fim TIME NOT NULL,
    num_participantes INTEGER DEFAULT 1,
    ind_cancelado BOOLEAN DEFAULT false,
    des_motivo_cancelamento TEXT,
    dta_cancelamento TIMESTAMPTZ,
    des_historico_alteracoes JSONB DEFAULT '[]'::JSONB,
    ind_notificado BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.tab_log_auditoria (
    cod_log UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_usuario UUID,
    seq_usuario_alvo UUID,
    des_acao TEXT NOT NULL,
    des_tipo_entidade TEXT NOT NULL,
    des_id_entidade TEXT,
    des_valor_anterior JSONB,
    des_valor_novo JSONB,
    des_user_agent TEXT,
    des_ip TEXT,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.tab_notificacao (
    cod_notificacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_usuario UUID NOT NULL,
    seq_usuario_origem UUID,
    des_titulo TEXT NOT NULL,
    des_mensagem TEXT NOT NULL,
    des_tipo TEXT NOT NULL,
    des_link TEXT,
    ind_lida BOOLEAN DEFAULT false,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Configurações de Suporte
CREATE TABLE IF NOT EXISTS public.tab_config_suporte (
    cod_config UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    des_tipo TEXT NOT NULL,
    des_valor TEXT NOT NULL,
    des_descricao TEXT,
    des_icone TEXT DEFAULT 'Circle',
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Tentativas de Login (Rate Limiting)
CREATE TABLE IF NOT EXISTS public.tab_tentativa_login (
    cod_tentativa UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_username VARCHAR(255),
    des_ip_address VARCHAR(45) NOT NULL,
    des_user_agent TEXT,
    ind_sucesso BOOLEAN DEFAULT false,
    des_motivo_falha VARCHAR(255),
    dta_tentativa TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELAS DA BASE DE CONHECIMENTO (KB)
-- ============================================================

-- Categorias KB
CREATE TABLE IF NOT EXISTS public.tab_kb_categoria (
    cod_categoria UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    des_descricao TEXT,
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Tags KB
CREATE TABLE IF NOT EXISTS public.tab_kb_tag (
    cod_tag UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_nome TEXT NOT NULL,
    ind_ativo BOOLEAN DEFAULT true,
    num_ordem INTEGER DEFAULT 0,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Artigos KB
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo (
    cod_artigo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_categoria UUID REFERENCES public.tab_kb_categoria(cod_categoria) ON DELETE SET NULL,
    cod_owner UUID,
    cod_revisor UUID,
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
    ind_ativo BOOLEAN DEFAULT true,
    num_versao INTEGER DEFAULT 1,
    num_views INTEGER DEFAULT 0,
    num_helpful_up INTEGER DEFAULT 0,
    num_helpful_down INTEGER DEFAULT 0,
    dta_publicacao TIMESTAMPTZ,
    dta_criacao TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Tags de Artigos KB
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo_tag (
    cod_artigo_tag UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    cod_tag UUID NOT NULL REFERENCES public.tab_kb_tag(cod_tag) ON DELETE CASCADE,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cod_artigo, cod_tag)
);

-- Artigos Relacionados KB
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo_relacionado (
    cod_relacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    cod_artigo_relacionado UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cod_artigo, cod_artigo_relacionado)
);

-- Versões de Artigos KB
CREATE TABLE IF NOT EXISTS public.tab_kb_artigo_versao (
    cod_versao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    des_nome_usuario TEXT NOT NULL,
    des_titulo TEXT NOT NULL,
    des_resumo TEXT NOT NULL,
    des_conteudo_md TEXT NOT NULL,
    des_mudancas TEXT,
    num_versao INTEGER NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Anexos KB
CREATE TABLE IF NOT EXISTS public.tab_kb_anexo (
    cod_anexo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    seq_usuario UUID,
    des_nome TEXT NOT NULL,
    des_url TEXT NOT NULL,
    des_tipo TEXT,
    num_tamanho_bytes BIGINT,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Favoritos KB
CREATE TABLE IF NOT EXISTS public.tab_kb_favorito (
    cod_favorito UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cod_artigo, seq_usuario)
);

-- Feedback KB
CREATE TABLE IF NOT EXISTS public.tab_kb_feedback (
    cod_feedback UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    ind_helpful BOOLEAN NOT NULL,
    des_comentario TEXT,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Visualizações KB
CREATE TABLE IF NOT EXISTS public.tab_kb_visualizacao (
    cod_visualizacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_artigo UUID NOT NULL REFERENCES public.tab_kb_artigo(cod_artigo) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- Base de Conhecimento (arquivos)
CREATE TABLE IF NOT EXISTS public.tab_base_conhecimento (
    cod_item UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    des_titulo TEXT NOT NULL,
    des_descricao TEXT,
    des_tipo TEXT NOT NULL,
    des_arquivo_url TEXT NOT NULL,
    des_arquivo_nome TEXT NOT NULL,
    num_tamanho_bytes BIGINT,
    num_versao INTEGER DEFAULT 1,
    seq_usuario_criacao UUID NOT NULL,
    seq_usuario_atualizacao UUID NOT NULL,
    des_nome_usuario_atualizacao TEXT NOT NULL,
    ind_ativo BOOLEAN DEFAULT true,
    dta_cadastro TIMESTAMPTZ DEFAULT now(),
    dta_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- Versões Base de Conhecimento
CREATE TABLE IF NOT EXISTS public.tab_base_conhecimento_versao (
    cod_versao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_item UUID NOT NULL REFERENCES public.tab_base_conhecimento(cod_item) ON DELETE CASCADE,
    seq_usuario UUID NOT NULL,
    des_nome_usuario TEXT NOT NULL,
    des_arquivo_url TEXT NOT NULL,
    des_arquivo_nome TEXT NOT NULL,
    num_tamanho_bytes BIGINT,
    num_versao INTEGER NOT NULL,
    dta_cadastro TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PASSO 4: Criar VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.view_diretorio_publico AS
SELECT 
    cod_usuario,
    des_nome_completo,
    des_cargo,
    des_departamento,
    des_unidade,
    des_avatar_url
FROM public.tab_perfil_usuario
WHERE ind_ativo = true;

-- ============================================================
-- PASSO 5: Criar FUNÇÕES AUXILIARES
-- ============================================================

-- Buscar info pública do usuário
CREATE OR REPLACE FUNCTION public.get_user_public_info(user_id UUID)
RETURNS TABLE (nome TEXT, avatar_url TEXT, cargo TEXT, departamento TEXT, unidade TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT des_nome_completo, des_avatar_url, des_cargo, des_departamento, des_unidade
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id AND ind_ativo = true;
$$;

-- Buscar info de display do usuário
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_id UUID)
RETURNS TABLE (nome TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT des_nome_completo, des_avatar_url
  FROM public.tab_perfil_usuario
  WHERE cod_usuario = user_id AND ind_ativo = true;
$$;

-- Buscar usuários no diretório
CREATE OR REPLACE FUNCTION public.search_users_directory(search_term TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (id UUID, nome TEXT, avatar_url TEXT, cargo TEXT, departamento TEXT, unidade TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cod_usuario, des_nome_completo, des_avatar_url, des_cargo, des_departamento, des_unidade
  FROM public.tab_perfil_usuario
  WHERE ind_ativo = true
    AND (des_nome_completo ILIKE '%' || search_term || '%' OR des_departamento ILIKE '%' || search_term || '%')
  ORDER BY des_nome_completo
  LIMIT result_limit;
$$;

-- Configurar primeiro admin
CREATE OR REPLACE FUNCTION public.setup_first_admin(admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.tab_usuario_role WHERE des_role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin já existe no sistema';
  END IF;
  
  INSERT INTO public.tab_usuario_role (seq_usuario, des_role)
  VALUES (admin_user_id, 'admin');
END;
$$;

-- Limpar tentativas antigas de login
CREATE OR REPLACE FUNCTION public.limpar_tentativas_antigas()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tab_tentativa_login WHERE dta_tentativa < NOW() - INTERVAL '24 hours';
END;
$$;

-- Atualizar dta_atualizacao automaticamente
CREATE OR REPLACE FUNCTION public.update_dta_atualizacao_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.dta_atualizacao = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PASSO 6: Criar TRIGGERS para permissões automáticas
-- ============================================================

-- Criar permissões quando um novo menu for criado
CREATE OR REPLACE FUNCTION public.create_permissions_for_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_type RECORD;
  max_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(num_ordem), 0) INTO max_order FROM public.tab_permissao_tela;
  
  FOR role_type IN 
    SELECT des_codigo FROM public.tab_perfil_tipo WHERE ind_ativo = true
  LOOP
    INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
    VALUES (
      role_type.des_codigo, 
      NEW.des_caminho, 
      NEW.des_nome, 
      CASE WHEN role_type.des_codigo = 'admin' THEN true ELSE false END,
      max_order + 1
    )
    ON CONFLICT (des_role, des_rota) DO UPDATE 
    SET des_nome_tela = EXCLUDED.des_nome_tela,
        dta_atualizacao = now();
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Atualizar permissões quando menu for editado
CREATE OR REPLACE FUNCTION public.update_permissions_for_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.des_caminho IS DISTINCT FROM NEW.des_caminho OR OLD.des_nome IS DISTINCT FROM NEW.des_nome THEN
    UPDATE public.tab_permissao_tela 
    SET des_rota = NEW.des_caminho, 
        des_nome_tela = NEW.des_nome,
        dta_atualizacao = now()
    WHERE des_rota = OLD.des_caminho;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover permissões quando menu for deletado
CREATE OR REPLACE FUNCTION public.delete_permissions_for_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tab_permissao_tela WHERE des_rota = OLD.des_caminho;
  RETURN OLD;
END;
$$;

-- Criar permissões quando novo tipo de perfil for criado
CREATE OR REPLACE FUNCTION public.create_permissions_for_new_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  screen RECORD;
BEGIN
  FOR screen IN 
    SELECT DISTINCT des_rota, des_nome_tela, num_ordem 
    FROM public.tab_permissao_tela 
    WHERE des_role = 'admin'
    ORDER BY num_ordem
  LOOP
    INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
    VALUES (
      NEW.des_codigo, 
      screen.des_rota, 
      screen.des_nome_tela, 
      CASE WHEN NEW.des_codigo = 'admin' THEN true ELSE false END,
      screen.num_ordem
    )
    ON CONFLICT (des_role, des_rota) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Remover permissões quando tipo de perfil for deletado
CREATE OR REPLACE FUNCTION public.delete_permissions_for_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tab_permissao_tela WHERE des_role = OLD.des_codigo;
  RETURN OLD;
END;
$$;

-- Incrementar views de artigo KB
CREATE OR REPLACE FUNCTION public.increment_kb_article_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tab_kb_artigo SET num_views = num_views + 1 WHERE cod_artigo = NEW.cod_artigo;
  RETURN NULL;
END;
$$;

-- Atualizar contagem de helpful de artigo KB
CREATE OR REPLACE FUNCTION public.update_kb_article_helpful_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- ============================================================
-- PASSO 7: Criar TRIGGERS
-- ============================================================

-- Triggers de Menu
DROP TRIGGER IF EXISTS trigger_create_permissions_for_menu ON public.tab_menu_item;
CREATE TRIGGER trigger_create_permissions_for_menu
  AFTER INSERT ON public.tab_menu_item
  FOR EACH ROW EXECUTE FUNCTION public.create_permissions_for_menu_item();

DROP TRIGGER IF EXISTS trigger_update_permissions_for_menu ON public.tab_menu_item;
CREATE TRIGGER trigger_update_permissions_for_menu
  AFTER UPDATE ON public.tab_menu_item
  FOR EACH ROW EXECUTE FUNCTION public.update_permissions_for_menu_item();

DROP TRIGGER IF EXISTS trigger_delete_permissions_for_menu ON public.tab_menu_item;
CREATE TRIGGER trigger_delete_permissions_for_menu
  AFTER DELETE ON public.tab_menu_item
  FOR EACH ROW EXECUTE FUNCTION public.delete_permissions_for_menu_item();

-- Triggers de Tipo de Perfil
DROP TRIGGER IF EXISTS trigger_create_permissions_for_role ON public.tab_perfil_tipo;
CREATE TRIGGER trigger_create_permissions_for_role
  AFTER INSERT ON public.tab_perfil_tipo
  FOR EACH ROW EXECUTE FUNCTION public.create_permissions_for_new_role();

DROP TRIGGER IF EXISTS trigger_delete_permissions_for_role ON public.tab_perfil_tipo;
CREATE TRIGGER trigger_delete_permissions_for_role
  AFTER DELETE ON public.tab_perfil_tipo
  FOR EACH ROW EXECUTE FUNCTION public.delete_permissions_for_role();

-- Triggers KB
DROP TRIGGER IF EXISTS trigger_increment_kb_views ON public.tab_kb_visualizacao;
CREATE TRIGGER trigger_increment_kb_views
  AFTER INSERT ON public.tab_kb_visualizacao
  FOR EACH ROW EXECUTE FUNCTION public.increment_kb_article_views();

DROP TRIGGER IF EXISTS trigger_update_kb_helpful ON public.tab_kb_feedback;
CREATE TRIGGER trigger_update_kb_helpful
  AFTER INSERT OR UPDATE OR DELETE ON public.tab_kb_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_kb_article_helpful_counts();

-- ============================================================
-- FIM DO SCRIPT DE SCHEMA
-- ============================================================
