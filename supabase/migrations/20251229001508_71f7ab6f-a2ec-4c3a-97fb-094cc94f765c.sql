-- =====================================================
-- MIGRAÇÃO: PADRONIZAÇÃO DE NOMENCLATURA DO BANCO
-- =====================================================

-- 1. RENOMEAR TABELAS
ALTER TABLE public.announcements RENAME TO tab_comunicado;
ALTER TABLE public.audit_logs RENAME TO tab_log_auditoria;
ALTER TABLE public.calendar_events RENAME TO tab_evento_calendario;
ALTER TABLE public.menu_items RENAME TO tab_menu_item;
ALTER TABLE public.poll_options RENAME TO tab_enquete_opcao;
ALTER TABLE public.poll_votes RENAME TO tab_enquete_voto;
ALTER TABLE public.profiles RENAME TO tab_perfil_usuario;
ALTER TABLE public.user_roles RENAME TO tab_usuario_role;
ALTER TABLE public.systems RENAME TO tab_sistema;
ALTER TABLE public.faqs RENAME TO tab_faq;
ALTER TABLE public.meeting_rooms RENAME TO tab_sala_reuniao;
ALTER TABLE public.meeting_types RENAME TO tab_tipo_reuniao;
ALTER TABLE public.room_reservations RENAME TO tab_reserva_sala;

-- 2. RENOMEAR COLUNAS - tab_comunicado (ex-announcements)
ALTER TABLE public.tab_comunicado RENAME COLUMN id TO cod_comunicado;
ALTER TABLE public.tab_comunicado RENAME COLUMN title TO des_titulo;
ALTER TABLE public.tab_comunicado RENAME COLUMN summary TO des_resumo;
ALTER TABLE public.tab_comunicado RENAME COLUMN content TO des_conteudo;
ALTER TABLE public.tab_comunicado RENAME COLUMN image_url TO des_imagem_url;
ALTER TABLE public.tab_comunicado RENAME COLUMN poll_type TO des_tipo_enquete;
ALTER TABLE public.tab_comunicado RENAME COLUMN template_type TO des_tipo_template;
ALTER TABLE public.tab_comunicado RENAME COLUMN active TO ind_ativo;
ALTER TABLE public.tab_comunicado RENAME COLUMN pinned TO ind_fixado;
ALTER TABLE public.tab_comunicado RENAME COLUMN published_at TO dta_publicacao;
ALTER TABLE public.tab_comunicado RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_comunicado RENAME COLUMN updated_at TO dta_atualizacao;

-- 3. RENOMEAR COLUNAS - tab_log_auditoria (ex-audit_logs)
ALTER TABLE public.tab_log_auditoria RENAME COLUMN id TO cod_log;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN user_id TO seq_usuario;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN target_user_id TO seq_usuario_alvo;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN action TO des_acao;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN entity_type TO des_tipo_entidade;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN entity_id TO des_id_entidade;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN old_value TO des_valor_anterior;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN new_value TO des_valor_novo;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN ip_address TO des_ip;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN user_agent TO des_user_agent;
ALTER TABLE public.tab_log_auditoria RENAME COLUMN created_at TO dta_cadastro;

-- 4. RENOMEAR COLUNAS - tab_evento_calendario (ex-calendar_events)
ALTER TABLE public.tab_evento_calendario RENAME COLUMN id TO cod_evento;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN title TO des_titulo;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN description TO des_descricao;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN event_date TO dta_evento;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN event_type TO des_tipo_evento;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN created_by TO seq_criado_por;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_evento_calendario RENAME COLUMN updated_at TO dta_atualizacao;

-- 5. RENOMEAR COLUNAS - tab_menu_item (ex-menu_items)
ALTER TABLE public.tab_menu_item RENAME COLUMN id TO cod_menu_item;
ALTER TABLE public.tab_menu_item RENAME COLUMN name TO des_nome;
ALTER TABLE public.tab_menu_item RENAME COLUMN path TO des_caminho;
ALTER TABLE public.tab_menu_item RENAME COLUMN icon TO des_icone;
ALTER TABLE public.tab_menu_item RENAME COLUMN parent_id TO seq_menu_pai;
ALTER TABLE public.tab_menu_item RENAME COLUMN sort_order TO num_ordem;
ALTER TABLE public.tab_menu_item RENAME COLUMN active TO ind_ativo;
ALTER TABLE public.tab_menu_item RENAME COLUMN is_admin_only TO ind_admin_only;
ALTER TABLE public.tab_menu_item RENAME COLUMN open_in_new_tab TO ind_nova_aba;
ALTER TABLE public.tab_menu_item RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_menu_item RENAME COLUMN updated_at TO dta_atualizacao;

-- 6. RENOMEAR COLUNAS - tab_enquete_opcao (ex-poll_options)
ALTER TABLE public.tab_enquete_opcao RENAME COLUMN id TO cod_opcao;
ALTER TABLE public.tab_enquete_opcao RENAME COLUMN announcement_id TO seq_comunicado;
ALTER TABLE public.tab_enquete_opcao RENAME COLUMN option_text TO des_texto_opcao;
ALTER TABLE public.tab_enquete_opcao RENAME COLUMN created_at TO dta_cadastro;

-- 7. RENOMEAR COLUNAS - tab_enquete_voto (ex-poll_votes)
ALTER TABLE public.tab_enquete_voto RENAME COLUMN id TO cod_voto;
ALTER TABLE public.tab_enquete_voto RENAME COLUMN option_id TO seq_opcao;
ALTER TABLE public.tab_enquete_voto RENAME COLUMN user_id TO seq_usuario;
ALTER TABLE public.tab_enquete_voto RENAME COLUMN created_at TO dta_cadastro;

-- 8. RENOMEAR COLUNAS - tab_perfil_usuario (ex-profiles)
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN id TO cod_usuario;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN email TO des_email;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN full_name TO des_nome_completo;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN avatar_url TO des_avatar_url;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN phone TO des_telefone;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN job_title TO des_cargo;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN department TO des_departamento;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN unit TO des_unidade;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN birthday_date TO dta_aniversario;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN is_active TO ind_ativo;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN ad_object_id TO des_ad_object_id;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN ad_synced_at TO dta_sincronizacao_ad;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_perfil_usuario RENAME COLUMN updated_at TO dta_atualizacao;

-- 9. RENOMEAR COLUNAS - tab_usuario_role (ex-user_roles)
ALTER TABLE public.tab_usuario_role RENAME COLUMN id TO cod_usuario_role;
ALTER TABLE public.tab_usuario_role RENAME COLUMN user_id TO seq_usuario;
ALTER TABLE public.tab_usuario_role RENAME COLUMN role TO des_role;
ALTER TABLE public.tab_usuario_role RENAME COLUMN created_at TO dta_cadastro;

-- 10. RENOMEAR COLUNAS - tab_sistema (ex-systems)
ALTER TABLE public.tab_sistema RENAME COLUMN id TO cod_sistema;
ALTER TABLE public.tab_sistema RENAME COLUMN name TO des_nome;
ALTER TABLE public.tab_sistema RENAME COLUMN status TO des_status;
ALTER TABLE public.tab_sistema RENAME COLUMN last_check TO dta_ultima_verificacao;
ALTER TABLE public.tab_sistema RENAME COLUMN sort_order TO num_ordem;
ALTER TABLE public.tab_sistema RENAME COLUMN active TO ind_ativo;
ALTER TABLE public.tab_sistema RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_sistema RENAME COLUMN updated_at TO dta_atualizacao;

-- 11. RENOMEAR COLUNAS - tab_faq (ex-faqs)
ALTER TABLE public.tab_faq RENAME COLUMN id TO cod_faq;
ALTER TABLE public.tab_faq RENAME COLUMN question TO des_pergunta;
ALTER TABLE public.tab_faq RENAME COLUMN answer TO des_resposta;
ALTER TABLE public.tab_faq RENAME COLUMN sort_order TO num_ordem;
ALTER TABLE public.tab_faq RENAME COLUMN active TO ind_ativo;
ALTER TABLE public.tab_faq RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_faq RENAME COLUMN updated_at TO dta_atualizacao;

-- 12. RENOMEAR COLUNAS - tab_sala_reuniao (ex-meeting_rooms)
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN id TO cod_sala;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN name TO des_nome;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN capacity TO num_capacidade;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN allowed_roles TO des_roles_permitidos;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN sort_order TO num_ordem;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN active TO ind_ativo;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_sala_reuniao RENAME COLUMN updated_at TO dta_atualizacao;

-- 13. RENOMEAR COLUNAS - tab_tipo_reuniao (ex-meeting_types)
ALTER TABLE public.tab_tipo_reuniao RENAME COLUMN id TO cod_tipo_reuniao;
ALTER TABLE public.tab_tipo_reuniao RENAME COLUMN name TO des_nome;
ALTER TABLE public.tab_tipo_reuniao RENAME COLUMN sort_order TO num_ordem;
ALTER TABLE public.tab_tipo_reuniao RENAME COLUMN active TO ind_ativo;
ALTER TABLE public.tab_tipo_reuniao RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_tipo_reuniao RENAME COLUMN updated_at TO dta_atualizacao;

-- 14. RENOMEAR COLUNAS - tab_reserva_sala (ex-room_reservations)
ALTER TABLE public.tab_reserva_sala RENAME COLUMN id TO cod_reserva;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN room_id TO seq_sala;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN user_id TO seq_usuario;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN requester_name TO des_nome_solicitante;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN reservation_date TO dta_reserva;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN start_time TO hra_inicio;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN end_time TO hra_fim;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN meeting_type_id TO seq_tipo_reuniao;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN participants_count TO num_participantes;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN notes TO des_observacao;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN notified TO ind_notificado;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN created_at TO dta_cadastro;
ALTER TABLE public.tab_reserva_sala RENAME COLUMN updated_at TO dta_atualizacao;

-- 15. ATUALIZAR FUNÇÃO has_role PARA NOVA ESTRUTURA
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tab_usuario_role
    WHERE seq_usuario = _user_id
      AND des_role = _role
  )
$function$;

-- 16. ATUALIZAR FUNÇÃO handle_new_user PARA NOVA ESTRUTURA
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.tab_perfil_usuario (cod_usuario, des_email, des_nome_completo)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$function$;

-- 17. ATUALIZAR FUNÇÃO setup_first_admin PARA NOVA ESTRUTURA
CREATE OR REPLACE FUNCTION public.setup_first_admin(admin_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;