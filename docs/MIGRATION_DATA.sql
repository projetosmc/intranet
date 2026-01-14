-- ============================================================================
-- MC HUB - SCRIPT DE MIGRAÇÃO DE DADOS
-- Gerado em: 2026-01-14 (Atualizado)
-- Descrição: Dados iniciais para popular o banco de dados após criar o schema
-- Ordem de Execução: 3 (após MIGRATION_SCHEMA.sql e MIGRATION_RLS.sql)
-- ============================================================================

-- ============================================================================
-- 1. TIPOS DE PERFIL (tab_perfil_tipo)
-- ============================================================================
INSERT INTO public.tab_perfil_tipo (des_codigo, des_nome, des_descricao, des_cor, ind_sistema, num_ordem, ind_ativo) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', true, 1, true),
('moderator', 'Suporte', 'Pode gerenciar conteúdo', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', true, 2, true),
('user', 'Acesso Padrão', 'Acesso básico ao sistema', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', true, 3, true),
('fiscal', 'Analista Fiscal', NULL, 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', false, 4, true)
ON CONFLICT (cod_perfil_tipo) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_descricao = EXCLUDED.des_descricao,
  des_cor = EXCLUDED.des_cor;

-- ============================================================================
-- 2. TIPOS DE REUNIÃO (tab_tipo_reuniao)
-- ============================================================================
INSERT INTO public.tab_tipo_reuniao (des_nome, num_ordem, ind_ativo) VALUES
('Reunião de Equipe', 0, true),
('Reunião com Cliente', 1, true),
('Treinamento', 2, true),
('Entrevista', 3, true),
('Apresentação', 4, true),
('Videoconferência', 5, true),
('Workshop', 6, true),
('Alinhamento', 7, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. SALAS DE REUNIÃO (tab_sala_reuniao)
-- ============================================================================
INSERT INTO public.tab_sala_reuniao (des_nome, num_capacidade, des_roles_permitidos, num_ordem, ind_ativo) VALUES
('Sala de Reunião Recepção', 10, ARRAY['all'], 1, true),
('Sala de Reunião Diretoria', 10, ARRAY['admin'], 2, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. CATEGORIAS DA BASE DE CONHECIMENTO (tab_kb_categoria)
-- ============================================================================
INSERT INTO public.tab_kb_categoria (des_nome, des_descricao, num_ordem, ind_ativo) VALUES
('ACESSOS E SENHAS', 'Reset de senha, permissões, bloqueios, MFA e acessos a sistemas.', 10, true),
('REDE / INTERNET / WIFI', 'Conectividade, queda de link, Wi-Fi, VPN e problemas de rota.', 20, true),
('VPN / ACESSO REMOTO', 'VPN corporativa, acesso remoto, autenticação e troubleshooting.', 30, true),
('E-MAIL / MICROSOFT 365', 'Outlook, Teams, OneDrive e problemas comuns de M365.', 40, true),
('SISTEMAS INTERNOS', 'Portais internos, EMSys, integrações e erros de aplicação.', 50, true),
('IMPRESSORAS / PERIFÉRICOS', 'Impressoras, scanners, drivers e filas de impressão.', 60, true),
('NOTEBOOK / DESKTOP', 'Lentidão, travamentos, atualização e manutenção.', 70, true),
('SEGURANÇA', 'Boas práticas, phishing, bloqueios, dispositivos e compliance.', 80, true),
('GLPI / SUPORTE', 'Abertura de chamados, acompanhamento, categorias e SLA.', 90, true),
('RUNBOOK TI (INTERNO)', 'Procedimentos operacionais internos (apenas TI).', 100, true),
('STATUS / INCIDENTES', 'Incidentes, indisponibilidade, contingência e post-mortem.', 110, true),
('PADRÕES / POLÍTICAS', 'Políticas internas, padrões de uso e orientações oficiais.', 120, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. TAGS DA BASE DE CONHECIMENTO (tab_kb_tag)
-- ============================================================================
INSERT INTO public.tab_kb_tag (des_nome, num_ordem, ind_ativo) VALUES
('VPN', 10, true),
('WIFI', 20, true),
('REDE', 30, true),
('SENHA', 40, true),
('MFA', 50, true),
('BLOQUEIO', 60, true),
('OUTLOOK', 70, true),
('TEAMS', 80, true),
('ONEDRIVE', 90, true),
('IMPRESSORA', 100, true),
('DRIVER', 110, true),
('LENTIDÃO', 120, true),
('WINDOWS', 130, true),
('NAVEGADOR', 140, true),
('CACHE', 150, true),
('PORTAL', 160, true),
('EMSYS', 170, true),
('SUPABASE', 180, true),
('VERCEL', 190, true),
('GLPI', 200, true),
('SLA', 210, true),
('INCIDENTE', 220, true),
('CONTINGÊNCIA', 230, true),
('PHISHING', 240, true),
('SEGURANÇA', 250, true),
('ACESSO REMOTO', 260, true),
('CERTIFICADO', 270, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CONFIGURAÇÕES DE SUPORTE (tab_config_suporte)
-- ============================================================================
INSERT INTO public.tab_config_suporte (des_nome, des_descricao, des_tipo, des_valor, des_icone, num_ordem, ind_ativo) VALUES
('GLPI - Service Desk', 'Abra chamados de suporte técnico', 'link', 'https://glpi.montecarlo.com.br', 'MessageCircle', 0, true),
('E-mail', 'E-mail de suporte', 'contact', 'suporte@montecarlo.com.br', 'Mail', 0, true),
('Microsoft Teams', 'Canal de suporte TI', 'link', 'https://teams.microsoft.com', 'MessageCircle', 1, true),
('Ramal', 'Ramal de suporte', 'contact', '8001', 'Phone', 1, true),
('Base de Conhecimento', 'Documentação e tutoriais', 'link', '#', 'Book', 2, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ITENS DE MENU PRINCIPAL (tab_menu_item)
-- ============================================================================
INSERT INTO public.tab_menu_item (des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('Meu Dia', '/', 'LayoutDashboard', ARRAY[]::text[], false, false, 0, true, NULL),
('Fluig', '#', 'ExternalLink', ARRAY['fluig']::text[], false, false, 1, true, NULL),
('Tarefas', '#', 'ClipboardList', ARRAY['tarefas']::text[], false, false, 2, true, NULL),
('Faturamento', '#', 'Receipt', ARRAY['faturamento']::text[], false, false, 3, true, NULL),
('Cadastros', '#', 'Database', ARRAY['cadastro']::text[], false, false, 4, true, NULL),
('SAC', '#', 'Headphones', ARRAY['sac']::text[], false, false, 5, true, NULL),
('Financeiro', '#', 'DollarSign', ARRAY['financeiro']::text[], false, false, 6, true, NULL),
('Minha Conta', '#', 'User', ARRAY[]::text[], false, false, 7, true, NULL),
('Administração', '#', 'Settings', ARRAY[]::text[], false, true, 8, true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. PERMISSÕES BÁSICAS (tab_permissao_tela)
-- Nota: Permissões completas são criadas automaticamente via triggers
-- ============================================================================

-- Permissões para Home (/)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/', 'Home', true, 1),
('moderator', '/', 'Home', true, 1),
('user', '/', 'Home', true, 1),
('fiscal', '/', 'Home', true, 1)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Comunicados (/comunicados)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/comunicados', 'Comunicados', true, 2),
('moderator', '/comunicados', 'Comunicados', true, 2),
('user', '/comunicados', 'Comunicados', true, 2),
('fiscal', '/comunicados', 'Comunicados', true, 2)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Status (/status)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/status', 'Status dos Sistemas', true, 3),
('moderator', '/status', 'Status dos Sistemas', true, 3),
('user', '/status', 'Status dos Sistemas', true, 3),
('fiscal', '/status', 'Status dos Sistemas', true, 3)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Suporte (/suporte)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/suporte', 'Suporte', true, 4),
('moderator', '/suporte', 'Suporte', true, 4),
('user', '/suporte', 'Suporte', true, 4),
('fiscal', '/suporte', 'Suporte', true, 4)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Reserva de Salas (/reserva-salas)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/reserva-salas', 'Reserva de Salas', true, 5),
('moderator', '/reserva-salas', 'Reserva de Salas', true, 5),
('user', '/reserva-salas', 'Reserva de Salas', true, 5),
('fiscal', '/reserva-salas', 'Reserva de Salas', true, 5)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Meu Perfil (/perfil)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/perfil', 'Meu Perfil', true, 6),
('moderator', '/perfil', 'Meu Perfil', true, 6),
('user', '/perfil', 'Meu Perfil', true, 6),
('fiscal', '/perfil', 'Meu Perfil', true, 6)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin (apenas admin)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/configuracoes', 'Configurações', true, 10),
('admin', '/admin/comunicados', 'Gerenciar Comunicados', true, 11),
('admin', '/admin/usuarios', 'Gerenciar Usuários', true, 12),
('admin', '/admin/auditoria', 'Logs de Auditoria', true, 13),
('admin', '/admin/sistemas', 'Gerenciar Sistemas', true, 14),
('admin', '/admin/faqs', 'Gerenciar FAQs', true, 15),
('admin', '/admin/reserva-salas', 'Configurar Salas', true, 16),
('admin', '/admin/perfis', 'Gerenciar Perfis', true, 17)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões não-admin para áreas restritas (negadas por padrão)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('moderator', '/admin/configuracoes', 'Configurações', false, 10),
('user', '/admin/configuracoes', 'Configurações', false, 10),
('fiscal', '/admin/configuracoes', 'Configurações', false, 10),
('moderator', '/admin/comunicados', 'Gerenciar Comunicados', false, 11),
('user', '/admin/comunicados', 'Gerenciar Comunicados', false, 11),
('fiscal', '/admin/comunicados', 'Gerenciar Comunicados', false, 11),
('moderator', '/admin/usuarios', 'Gerenciar Usuários', false, 12),
('user', '/admin/usuarios', 'Gerenciar Usuários', false, 12),
('fiscal', '/admin/usuarios', 'Gerenciar Usuários', false, 12),
('moderator', '/admin/auditoria', 'Logs de Auditoria', false, 13),
('user', '/admin/auditoria', 'Logs de Auditoria', false, 13),
('fiscal', '/admin/auditoria', 'Logs de Auditoria', false, 13),
('moderator', '/admin/sistemas', 'Gerenciar Sistemas', false, 14),
('user', '/admin/sistemas', 'Gerenciar Sistemas', false, 14),
('fiscal', '/admin/sistemas', 'Gerenciar Sistemas', false, 14),
('moderator', '/admin/faqs', 'Gerenciar FAQs', false, 15),
('user', '/admin/faqs', 'Gerenciar FAQs', false, 15),
('fiscal', '/admin/faqs', 'Gerenciar FAQs', false, 15),
('moderator', '/admin/reserva-salas', 'Configurar Salas', false, 16),
('user', '/admin/reserva-salas', 'Configurar Salas', false, 16),
('fiscal', '/admin/reserva-salas', 'Configurar Salas', false, 16),
('moderator', '/admin/perfis', 'Gerenciar Perfis', false, 17),
('user', '/admin/perfis', 'Gerenciar Perfis', false, 17),
('fiscal', '/admin/perfis', 'Gerenciar Perfis', false, 17)
ON CONFLICT (des_role, des_rota) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- ============================================================================
-- 9. CRIAR STORAGE BUCKET PARA COMUNICADOS
-- ============================================================================
-- Execute este comando separadamente no SQL Editor do Supabase:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('announcements', 'announcements', true);

-- ============================================================================
-- FIM DO SCRIPT DE DADOS
-- ============================================================================
