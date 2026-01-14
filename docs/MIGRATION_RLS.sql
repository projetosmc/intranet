-- =============================================
-- SCRIPT DE MIGRAÇÃO - ROW LEVEL SECURITY (RLS)
-- Intranet Monte Carlo
-- Gerado em: 2026-01-14
-- =============================================

-- =============================================
-- 1. CRIAR ENUM DE ROLES (se não existir)
-- =============================================
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. CRIAR FUNÇÃO DE VERIFICAÇÃO DE ROLE
-- (Security Definer para evitar recursão RLS)
-- =============================================
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

-- =============================================
-- 3. HABILITAR RLS EM TODAS AS TABELAS
-- =============================================
ALTER TABLE public.tab_base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_base_conhecimento_versao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado_comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado_popup_visto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_comunicado_visualizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_config_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_enquete_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_enquete_voto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_evento_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_anexo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo_relacionado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_artigo_versao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_favorito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_kb_visualizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_log_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_menu_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_perfil_tipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_perfil_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_permissao_tela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_reserva_sala ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_sala_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_tentativa_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_tipo_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_usuario_role ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. POLÍTICAS RLS - TAB_BASE_CONHECIMENTO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all items" ON public.tab_base_conhecimento;
CREATE POLICY "Admins can manage all items" ON public.tab_base_conhecimento
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.tab_base_conhecimento;
CREATE POLICY "Authenticated users can insert items" ON public.tab_base_conhecimento
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update items" ON public.tab_base_conhecimento;
CREATE POLICY "Authenticated users can update items" ON public.tab_base_conhecimento
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view active items" ON public.tab_base_conhecimento;
CREATE POLICY "Authenticated users can view active items" ON public.tab_base_conhecimento
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 5. POLÍTICAS RLS - TAB_BASE_CONHECIMENTO_VERSAO
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can insert versions" ON public.tab_base_conhecimento_versao;
CREATE POLICY "Authenticated users can insert versions" ON public.tab_base_conhecimento_versao
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view versions" ON public.tab_base_conhecimento_versao;
CREATE POLICY "Authenticated users can view versions" ON public.tab_base_conhecimento_versao
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 6. POLÍTICAS RLS - TAB_COMUNICADO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.tab_comunicado;
CREATE POLICY "Admins can manage announcements" ON public.tab_comunicado
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can read active announcements" ON public.tab_comunicado;
CREATE POLICY "Authenticated users can read active announcements" ON public.tab_comunicado
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 7. POLÍTICAS RLS - TAB_COMUNICADO_COMENTARIO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.tab_comunicado_comentario;
CREATE POLICY "Admins can manage all comments" ON public.tab_comunicado_comentario
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.tab_comunicado_comentario;
CREATE POLICY "Authenticated users can view comments" ON public.tab_comunicado_comentario
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create comments" ON public.tab_comunicado_comentario;
CREATE POLICY "Users can create comments" ON public.tab_comunicado_comentario
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.tab_comunicado_comentario;
CREATE POLICY "Users can delete their own comments" ON public.tab_comunicado_comentario
FOR DELETE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.tab_comunicado_comentario;
CREATE POLICY "Users can update their own comments" ON public.tab_comunicado_comentario
FOR UPDATE USING (auth.uid() = seq_usuario);

-- =============================================
-- 8. POLÍTICAS RLS - TAB_COMUNICADO_POPUP_VISTO
-- =============================================
DROP POLICY IF EXISTS "Users can mark popups as seen" ON public.tab_comunicado_popup_visto;
CREATE POLICY "Users can mark popups as seen" ON public.tab_comunicado_popup_visto
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can view their own popup views" ON public.tab_comunicado_popup_visto;
CREATE POLICY "Users can view their own popup views" ON public.tab_comunicado_popup_visto
FOR SELECT USING (auth.uid() = seq_usuario);

-- =============================================
-- 9. POLÍTICAS RLS - TAB_COMUNICADO_VISUALIZACAO
-- =============================================
DROP POLICY IF EXISTS "Admins can view all views" ON public.tab_comunicado_visualizacao;
CREATE POLICY "Admins can view all views" ON public.tab_comunicado_visualizacao
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their view" ON public.tab_comunicado_visualizacao;
CREATE POLICY "Users can insert their view" ON public.tab_comunicado_visualizacao
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can view their own views" ON public.tab_comunicado_visualizacao;
CREATE POLICY "Users can view their own views" ON public.tab_comunicado_visualizacao
FOR SELECT USING (auth.uid() = seq_usuario);

-- =============================================
-- 10. POLÍTICAS RLS - TAB_CONFIG_SUPORTE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage support config" ON public.tab_config_suporte;
CREATE POLICY "Admins can manage support config" ON public.tab_config_suporte
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active support config" ON public.tab_config_suporte;
CREATE POLICY "Authenticated users can view active support config" ON public.tab_config_suporte
FOR SELECT USING ((auth.uid() IS NOT NULL) AND (ind_ativo = true));

-- =============================================
-- 11. POLÍTICAS RLS - TAB_ENQUETE_OPCAO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage poll options" ON public.tab_enquete_opcao;
CREATE POLICY "Admins can manage poll options" ON public.tab_enquete_opcao
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Announcement creators can manage their poll options" ON public.tab_enquete_opcao;
CREATE POLICY "Announcement creators can manage their poll options" ON public.tab_enquete_opcao
FOR ALL USING (EXISTS (
  SELECT 1 FROM tab_comunicado
  WHERE tab_comunicado.cod_comunicado = tab_enquete_opcao.seq_comunicado
    AND tab_comunicado.seq_usuario_publicacao = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM tab_comunicado
  WHERE tab_comunicado.cod_comunicado = tab_enquete_opcao.seq_comunicado
    AND tab_comunicado.seq_usuario_publicacao = auth.uid()
));

DROP POLICY IF EXISTS "Anyone can read poll options" ON public.tab_enquete_opcao;
CREATE POLICY "Anyone can read poll options" ON public.tab_enquete_opcao
FOR SELECT USING (true);

-- =============================================
-- 12. POLÍTICAS RLS - TAB_ENQUETE_VOTO
-- =============================================
DROP POLICY IF EXISTS "Users can remove their vote" ON public.tab_enquete_voto;
CREATE POLICY "Users can remove their vote" ON public.tab_enquete_voto
FOR DELETE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can see vote counts" ON public.tab_enquete_voto;
CREATE POLICY "Users can see vote counts" ON public.tab_enquete_voto
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote" ON public.tab_enquete_voto;
CREATE POLICY "Users can vote" ON public.tab_enquete_voto
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

-- =============================================
-- 13. POLÍTICAS RLS - TAB_EVENTO_CALENDARIO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage events" ON public.tab_evento_calendario;
CREATE POLICY "Admins can manage events" ON public.tab_evento_calendario
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view events" ON public.tab_evento_calendario;
CREATE POLICY "Authenticated users can view events" ON public.tab_evento_calendario
FOR SELECT USING (true);

-- =============================================
-- 14. POLÍTICAS RLS - TAB_FAQ
-- =============================================
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.tab_faq;
CREATE POLICY "Admins can manage FAQs" ON public.tab_faq
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active FAQs" ON public.tab_faq;
CREATE POLICY "Authenticated users can view active FAQs" ON public.tab_faq
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 15. POLÍTICAS RLS - TAB_KB_ANEXO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage KB attachments" ON public.tab_kb_anexo;
CREATE POLICY "Admins can manage KB attachments" ON public.tab_kb_anexo
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can add KB attachments" ON public.tab_kb_anexo;
CREATE POLICY "Authenticated users can add KB attachments" ON public.tab_kb_anexo
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view KB attachments" ON public.tab_kb_anexo;
CREATE POLICY "Authenticated users can view KB attachments" ON public.tab_kb_anexo
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 16. POLÍTICAS RLS - TAB_KB_ARTIGO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage KB articles" ON public.tab_kb_artigo;
CREATE POLICY "Admins can manage KB articles" ON public.tab_kb_artigo
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can create KB articles" ON public.tab_kb_artigo;
CREATE POLICY "Authenticated users can create KB articles" ON public.tab_kb_artigo
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view published KB articles" ON public.tab_kb_artigo;
CREATE POLICY "Authenticated users can view published KB articles" ON public.tab_kb_artigo
FOR SELECT USING (
  ((ind_status = 'PUBLICADO') AND (ind_ativo = true))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (cod_owner = auth.uid())
  OR (cod_revisor = auth.uid())
);

DROP POLICY IF EXISTS "Owners can update their KB articles" ON public.tab_kb_artigo;
CREATE POLICY "Owners can update their KB articles" ON public.tab_kb_artigo
FOR UPDATE USING (
  (cod_owner = auth.uid())
  OR (cod_revisor = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 17. POLÍTICAS RLS - TAB_KB_ARTIGO_RELACIONADO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage related articles" ON public.tab_kb_artigo_relacionado;
CREATE POLICY "Admins can manage related articles" ON public.tab_kb_artigo_relacionado
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view related articles" ON public.tab_kb_artigo_relacionado;
CREATE POLICY "Authenticated users can view related articles" ON public.tab_kb_artigo_relacionado
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 18. POLÍTICAS RLS - TAB_KB_ARTIGO_TAG
-- =============================================
DROP POLICY IF EXISTS "Admins can manage KB article tags" ON public.tab_kb_artigo_tag;
CREATE POLICY "Admins can manage KB article tags" ON public.tab_kb_artigo_tag
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can delete KB article tags" ON public.tab_kb_artigo_tag;
CREATE POLICY "Authenticated users can delete KB article tags" ON public.tab_kb_artigo_tag
FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can manage KB article tags" ON public.tab_kb_artigo_tag;
CREATE POLICY "Authenticated users can manage KB article tags" ON public.tab_kb_artigo_tag
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view KB article tags" ON public.tab_kb_artigo_tag;
CREATE POLICY "Authenticated users can view KB article tags" ON public.tab_kb_artigo_tag
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 19. POLÍTICAS RLS - TAB_KB_ARTIGO_VERSAO
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can insert KB article versions" ON public.tab_kb_artigo_versao;
CREATE POLICY "Authenticated users can insert KB article versions" ON public.tab_kb_artigo_versao
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view KB article versions" ON public.tab_kb_artigo_versao;
CREATE POLICY "Authenticated users can view KB article versions" ON public.tab_kb_artigo_versao
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 20. POLÍTICAS RLS - TAB_KB_CATEGORIA
-- =============================================
DROP POLICY IF EXISTS "Admins can manage KB categories" ON public.tab_kb_categoria;
CREATE POLICY "Admins can manage KB categories" ON public.tab_kb_categoria
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active KB categories" ON public.tab_kb_categoria;
CREATE POLICY "Authenticated users can view active KB categories" ON public.tab_kb_categoria
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 21. POLÍTICAS RLS - TAB_KB_FAVORITO
-- =============================================
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.tab_kb_favorito;
CREATE POLICY "Users can manage own favorites" ON public.tab_kb_favorito
FOR ALL USING (auth.uid() = seq_usuario)
WITH CHECK (auth.uid() = seq_usuario);

-- =============================================
-- 22. POLÍTICAS RLS - TAB_KB_FEEDBACK
-- =============================================
DROP POLICY IF EXISTS "Users can delete own feedback" ON public.tab_kb_feedback;
CREATE POLICY "Users can delete own feedback" ON public.tab_kb_feedback
FOR DELETE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can submit feedback" ON public.tab_kb_feedback;
CREATE POLICY "Users can submit feedback" ON public.tab_kb_feedback
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can update own feedback" ON public.tab_kb_feedback;
CREATE POLICY "Users can update own feedback" ON public.tab_kb_feedback
FOR UPDATE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can view own feedback" ON public.tab_kb_feedback;
CREATE POLICY "Users can view own feedback" ON public.tab_kb_feedback
FOR SELECT USING ((auth.uid() = seq_usuario) OR has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 23. POLÍTICAS RLS - TAB_KB_TAG
-- =============================================
DROP POLICY IF EXISTS "Admins can manage KB tags" ON public.tab_kb_tag;
CREATE POLICY "Admins can manage KB tags" ON public.tab_kb_tag
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active KB tags" ON public.tab_kb_tag;
CREATE POLICY "Authenticated users can view active KB tags" ON public.tab_kb_tag
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 24. POLÍTICAS RLS - TAB_KB_VISUALIZACAO
-- =============================================
DROP POLICY IF EXISTS "Admins can view all KB views" ON public.tab_kb_visualizacao;
CREATE POLICY "Admins can view all KB views" ON public.tab_kb_visualizacao
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can register views" ON public.tab_kb_visualizacao;
CREATE POLICY "Users can register views" ON public.tab_kb_visualizacao
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can view own KB views" ON public.tab_kb_visualizacao;
CREATE POLICY "Users can view own KB views" ON public.tab_kb_visualizacao
FOR SELECT USING (auth.uid() = seq_usuario);

-- =============================================
-- 25. POLÍTICAS RLS - TAB_LOG_AUDITORIA
-- =============================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.tab_log_auditoria;
CREATE POLICY "Admins can view audit logs" ON public.tab_log_auditoria
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.tab_log_auditoria;
CREATE POLICY "System can insert audit logs" ON public.tab_log_auditoria
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 26. POLÍTICAS RLS - TAB_MENU_ITEM
-- =============================================
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.tab_menu_item;
CREATE POLICY "Admins can manage menu items" ON public.tab_menu_item
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Everyone can view active menu items" ON public.tab_menu_item;
CREATE POLICY "Everyone can view active menu items" ON public.tab_menu_item
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 27. POLÍTICAS RLS - TAB_NOTIFICACAO
-- =============================================
DROP POLICY IF EXISTS "System can create notifications" ON public.tab_notificacao;
CREATE POLICY "System can create notifications" ON public.tab_notificacao
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.tab_notificacao;
CREATE POLICY "Users can delete their own notifications" ON public.tab_notificacao
FOR DELETE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.tab_notificacao;
CREATE POLICY "Users can update their own notifications" ON public.tab_notificacao
FOR UPDATE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.tab_notificacao;
CREATE POLICY "Users can view their own notifications" ON public.tab_notificacao
FOR SELECT USING (auth.uid() = seq_usuario);

-- =============================================
-- 28. POLÍTICAS RLS - TAB_PERFIL_TIPO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage role types" ON public.tab_perfil_tipo;
CREATE POLICY "Admins can manage role types" ON public.tab_perfil_tipo
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view role types" ON public.tab_perfil_tipo;
CREATE POLICY "Authenticated users can view role types" ON public.tab_perfil_tipo
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 29. POLÍTICAS RLS - TAB_PERFIL_USUARIO
-- =============================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.tab_perfil_usuario;
CREATE POLICY "Users can insert own profile" ON public.tab_perfil_usuario
FOR INSERT WITH CHECK (auth.uid() = cod_usuario);

DROP POLICY IF EXISTS "Users can update own profile" ON public.tab_perfil_usuario;
CREATE POLICY "Users can update own profile" ON public.tab_perfil_usuario
FOR UPDATE USING (auth.uid() = cod_usuario)
WITH CHECK (auth.uid() = cod_usuario);

DROP POLICY IF EXISTS "Users can view own profile" ON public.tab_perfil_usuario;
CREATE POLICY "Users can view own profile" ON public.tab_perfil_usuario
FOR SELECT USING (auth.uid() = cod_usuario);

-- =============================================
-- 30. POLÍTICAS RLS - TAB_PERMISSAO_TELA
-- =============================================
DROP POLICY IF EXISTS "Admins can manage screen permissions" ON public.tab_permissao_tela;
CREATE POLICY "Admins can manage screen permissions" ON public.tab_permissao_tela
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.tab_permissao_tela;
CREATE POLICY "Authenticated users can view permissions" ON public.tab_permissao_tela
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 31. POLÍTICAS RLS - TAB_RESERVA_SALA
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.tab_reserva_sala;
CREATE POLICY "Admins can manage all reservations" ON public.tab_reserva_sala
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.tab_reserva_sala;
CREATE POLICY "Authenticated users can view reservations" ON public.tab_reserva_sala
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create their own reservations" ON public.tab_reserva_sala;
CREATE POLICY "Users can create their own reservations" ON public.tab_reserva_sala
FOR INSERT WITH CHECK (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can delete their own reservations" ON public.tab_reserva_sala;
CREATE POLICY "Users can delete their own reservations" ON public.tab_reserva_sala
FOR DELETE USING (auth.uid() = seq_usuario);

DROP POLICY IF EXISTS "Users can update their own reservations" ON public.tab_reserva_sala;
CREATE POLICY "Users can update their own reservations" ON public.tab_reserva_sala
FOR UPDATE USING (auth.uid() = seq_usuario);

-- =============================================
-- 32. POLÍTICAS RLS - TAB_SALA_REUNIAO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage rooms" ON public.tab_sala_reuniao;
CREATE POLICY "Admins can manage rooms" ON public.tab_sala_reuniao
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active rooms" ON public.tab_sala_reuniao;
CREATE POLICY "Authenticated users can view active rooms" ON public.tab_sala_reuniao
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 33. POLÍTICAS RLS - TAB_SISTEMA
-- =============================================
DROP POLICY IF EXISTS "Admins can manage systems" ON public.tab_sistema;
CREATE POLICY "Admins can manage systems" ON public.tab_sistema
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active systems" ON public.tab_sistema;
CREATE POLICY "Authenticated users can view active systems" ON public.tab_sistema
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 34. POLÍTICAS RLS - TAB_TENTATIVA_LOGIN
-- =============================================
DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.tab_tentativa_login;
CREATE POLICY "Service role can manage login attempts" ON public.tab_tentativa_login
FOR ALL USING (true)
WITH CHECK (true);

-- =============================================
-- 35. POLÍTICAS RLS - TAB_TIPO_REUNIAO
-- =============================================
DROP POLICY IF EXISTS "Admins can manage meeting types" ON public.tab_tipo_reuniao;
CREATE POLICY "Admins can manage meeting types" ON public.tab_tipo_reuniao
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view active meeting types" ON public.tab_tipo_reuniao;
CREATE POLICY "Authenticated users can view active meeting types" ON public.tab_tipo_reuniao
FOR SELECT USING (ind_ativo = true);

-- =============================================
-- 36. POLÍTICAS RLS - TAB_USUARIO_ROLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.tab_usuario_role;
CREATE POLICY "Admins can manage all roles" ON public.tab_usuario_role
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own roles" ON public.tab_usuario_role;
CREATE POLICY "Users can view own roles" ON public.tab_usuario_role
FOR SELECT USING (auth.uid() = seq_usuario);

-- =============================================
-- 37. POLÍTICAS DE STORAGE - BUCKET ANNOUNCEMENTS
-- =============================================
-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Admins can upload announcement images" ON storage.objects;
CREATE POLICY "Admins can upload announcement images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'announcements' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update announcement images" ON storage.objects;
CREATE POLICY "Admins can update announcement images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'announcements' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can delete announcement images" ON storage.objects;
CREATE POLICY "Admins can delete announcement images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'announcements' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 38. GRANT PERMISSÕES PARA VIEW
-- =============================================
GRANT SELECT ON public.view_diretorio_publico TO authenticated;

-- =============================================
-- FIM DO SCRIPT DE MIGRAÇÃO RLS
-- =============================================
