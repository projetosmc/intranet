-- ============================================================================
-- MC HUB - SCRIPT DE MIGRAÇÃO DE DADOS
-- Gerado em: 2026-01-14
-- Descrição: Dados iniciais para popular o banco de dados após criar o schema
-- Ordem de Execução: 3 (após MIGRATION_SCHEMA.sql e MIGRATION_RLS.sql)
-- ============================================================================

-- ============================================================================
-- 1. TIPOS DE PERFIL (tab_perfil_tipo)
-- ============================================================================
INSERT INTO public.tab_perfil_tipo (cod_perfil_tipo, des_codigo, des_nome, des_descricao, des_cor, ind_sistema, num_ordem, ind_ativo) VALUES
('f022cf21-4f0d-478e-8eb0-ae69a9d90a48', 'admin', 'Administrador', 'Acesso total ao sistema', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', true, 1, true),
('4d885198-d36b-4a29-bf7a-6d6047a0f0eb', 'moderator', 'Suporte', 'Pode gerenciar conteúdo', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', true, 2, true),
('119d8ea1-15fb-43c5-864e-5af63778e15a', 'user', 'Acesso Padrão', 'Acesso básico ao sistema', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', true, 3, true),
('adee19fc-e09b-4128-bc26-0f0227cff240', 'fiscal', 'Analista Fiscal', NULL, 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', false, 4, true)
ON CONFLICT (cod_perfil_tipo) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_descricao = EXCLUDED.des_descricao,
  des_cor = EXCLUDED.des_cor;

-- ============================================================================
-- 2. TIPOS DE REUNIÃO (tab_tipo_reuniao)
-- ============================================================================
INSERT INTO public.tab_tipo_reuniao (cod_tipo_reuniao, des_nome, num_ordem, ind_ativo) VALUES
('4513bd46-4168-4be4-bdf2-5c1899fa67fa', 'Reunião de Equipe', 0, true),
('07b59c6b-4700-4070-ba26-38220fde3a3f', 'Reunião com Cliente', 1, true),
('35a8dfc7-9a69-4dd9-a762-89077f7ff035', 'Treinamento', 2, true),
('76847f57-838e-4929-9fd2-6a8544d0c3d8', 'Entrevista', 3, true),
('58ed606c-845f-4ce6-aac9-aef06f2ff674', 'Apresentação', 4, true),
('b459fdcb-93f0-4245-ab4f-7efdc4a4b102', 'Videoconferência', 5, true),
('98addd4b-d25f-4866-b11a-d724a95416c0', 'Workshop', 6, true),
('8647b048-7ce6-47d9-802f-7b6cea849806', 'Alinhamento', 7, true)
ON CONFLICT (cod_tipo_reuniao) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  num_ordem = EXCLUDED.num_ordem;

-- ============================================================================
-- 3. SALAS DE REUNIÃO (tab_sala_reuniao)
-- ============================================================================
INSERT INTO public.tab_sala_reuniao (cod_sala, des_nome, num_capacidade, des_roles_permitidos, num_ordem, ind_ativo) VALUES
('9debc190-6824-4105-920e-11bcc4f830f5', 'Sala de Reunião Recepção', 10, ARRAY['all'], 1, true),
('85e70625-a932-4a79-963e-0da3d4dad5ce', 'Sala de Reunião Diretoria', 10, ARRAY['admin'], 2, true)
ON CONFLICT (cod_sala) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  num_capacidade = EXCLUDED.num_capacidade,
  des_roles_permitidos = EXCLUDED.des_roles_permitidos;

-- ============================================================================
-- 4. CATEGORIAS DA BASE DE CONHECIMENTO (tab_kb_categoria)
-- ============================================================================
INSERT INTO public.tab_kb_categoria (cod_categoria, des_nome, des_descricao, num_ordem, ind_ativo) VALUES
('11111111-1111-1111-1111-111111111111', 'ACESSOS E SENHAS', 'Reset de senha, permissões, bloqueios, MFA e acessos a sistemas.', 10, true),
('22222222-2222-2222-2222-222222222222', 'REDE / INTERNET / WIFI', 'Conectividade, queda de link, Wi-Fi, VPN e problemas de rota.', 20, true),
('33333333-3333-3333-3333-333333333333', 'VPN / ACESSO REMOTO', 'VPN corporativa, acesso remoto, autenticação e troubleshooting.', 30, true),
('44444444-4444-4444-4444-444444444444', 'E-MAIL / MICROSOFT 365', 'Outlook, Teams, OneDrive e problemas comuns de M365.', 40, true),
('55555555-5555-5555-5555-555555555555', 'SISTEMAS INTERNOS', 'Portais internos, EMSys, integrações e erros de aplicação.', 50, true),
('66666666-6666-6666-6666-666666666666', 'IMPRESSORAS / PERIFÉRICOS', 'Impressoras, scanners, drivers e filas de impressão.', 60, true),
('77777777-7777-7777-7777-777777777777', 'NOTEBOOK / DESKTOP', 'Lentidão, travamentos, atualização e manutenção.', 70, true),
('88888888-8888-8888-8888-888888888888', 'SEGURANÇA', 'Boas práticas, phishing, bloqueios, dispositivos e compliance.', 80, true),
('99999999-9999-9999-9999-999999999999', 'GLPI / SUPORTE', 'Abertura de chamados, acompanhamento, categorias e SLA.', 90, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RUNBOOK TI (INTERNO)', 'Procedimentos operacionais internos (apenas TI).', 100, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'STATUS / INCIDENTES', 'Incidentes, indisponibilidade, contingência e post-mortem.', 110, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PADRÕES / POLÍTICAS', 'Políticas internas, padrões de uso e orientações oficiais.', 120, true)
ON CONFLICT (cod_categoria) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_descricao = EXCLUDED.des_descricao,
  num_ordem = EXCLUDED.num_ordem;

-- ============================================================================
-- 5. TAGS DA BASE DE CONHECIMENTO (tab_kb_tag)
-- ============================================================================
INSERT INTO public.tab_kb_tag (cod_tag, des_nome, num_ordem, ind_ativo) VALUES
('d0000000-0000-0000-0000-000000000010', 'VPN', 10, true),
('d0000000-0000-0000-0000-000000000020', 'WIFI', 20, true),
('d0000000-0000-0000-0000-000000000030', 'REDE', 30, true),
('d0000000-0000-0000-0000-000000000040', 'SENHA', 40, true),
('d0000000-0000-0000-0000-000000000050', 'MFA', 50, true),
('d0000000-0000-0000-0000-000000000060', 'BLOQUEIO', 60, true),
('d0000000-0000-0000-0000-000000000070', 'OUTLOOK', 70, true),
('d0000000-0000-0000-0000-000000000080', 'TEAMS', 80, true),
('d0000000-0000-0000-0000-000000000090', 'ONEDRIVE', 90, true),
('d0000000-0000-0000-0000-000000000100', 'IMPRESSORA', 100, true),
('d0000000-0000-0000-0000-000000000110', 'DRIVER', 110, true),
('d0000000-0000-0000-0000-000000000120', 'LENTIDÃO', 120, true),
('d0000000-0000-0000-0000-000000000130', 'WINDOWS', 130, true),
('d0000000-0000-0000-0000-000000000140', 'NAVEGADOR', 140, true),
('d0000000-0000-0000-0000-000000000150', 'CACHE', 150, true),
('d0000000-0000-0000-0000-000000000160', 'PORTAL', 160, true),
('d0000000-0000-0000-0000-000000000170', 'EMSYS', 170, true),
('d0000000-0000-0000-0000-000000000180', 'SUPABASE', 180, true),
('d0000000-0000-0000-0000-000000000190', 'VERCEL', 190, true),
('d0000000-0000-0000-0000-000000000200', 'GLPI', 200, true),
('d0000000-0000-0000-0000-000000000210', 'SLA', 210, true),
('d0000000-0000-0000-0000-000000000220', 'INCIDENTE', 220, true),
('d0000000-0000-0000-0000-000000000230', 'CONTINGÊNCIA', 230, true),
('d0000000-0000-0000-0000-000000000240', 'PHISHING', 240, true),
('d0000000-0000-0000-0000-000000000250', 'SEGURANÇA', 250, true),
('d0000000-0000-0000-0000-000000000260', 'ACESSO REMOTO', 260, true),
('d0000000-0000-0000-0000-000000000270', 'CERTIFICADO', 270, true)
ON CONFLICT (cod_tag) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  num_ordem = EXCLUDED.num_ordem;

-- ============================================================================
-- 6. CONFIGURAÇÕES DE SUPORTE (tab_config_suporte)
-- ============================================================================
INSERT INTO public.tab_config_suporte (cod_config, des_nome, des_descricao, des_tipo, des_valor, des_icone, num_ordem, ind_ativo) VALUES
('2d0bab8c-ef45-4f3d-9480-e0284e719073', 'GLPI - Service Desk', 'Abra chamados de suporte técnico', 'link', 'https://glpi.montecarlo.com.br', 'MessageCircle', 0, true),
('95621936-81c2-4523-a8de-db8eedb8151f', 'E-mail', 'E-mail de suporte', 'contact', 'suporte@montecarlo.com.br', 'Mail', 0, true),
('f0a05c0b-9323-474c-8ea3-9a1860072234', 'Microsoft Teams', 'Canal de suporte TI', 'link', 'https://teams.microsoft.com', 'MessageCircle', 1, true),
('45a82fd2-a336-4c6b-9d5e-699bd0594087', 'Ramal', 'Ramal de suporte', 'contact', '8001', 'Phone', 1, true),
('5105bb8d-8df8-44ae-ac73-d144feba17ad', 'Base de Conhecimento', 'Documentação e tutoriais', 'link', '#', 'Book', 2, true)
ON CONFLICT (cod_config) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_descricao = EXCLUDED.des_descricao,
  des_valor = EXCLUDED.des_valor;

-- ============================================================================
-- 7. ITENS DE MENU (tab_menu_item)
-- ============================================================================

-- Menu Principal (sem pai)
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('dedf2776-7d89-4833-b230-8658e79fe369', 'Meu Dia', '/', 'LayoutDashboard', ARRAY[]::text[], false, false, 0, true, NULL),
('18be1aac-c45c-4633-bc3a-9f6624993063', 'Fluig', '#', 'ExternalLink', ARRAY['fluig']::text[], false, false, 1, true, NULL),
('61223d4e-d219-4e7d-a025-58aa0b48d440', 'Tarefas', '#', 'ClipboardList', ARRAY['tarefas']::text[], false, false, 2, true, NULL),
('50058fff-2bf2-4c9d-ba3a-381d86b8c4aa', 'Faturamento', '#', 'Receipt', ARRAY['faturamento']::text[], false, false, 3, true, NULL),
('d27ad87a-56e2-44a8-bec2-3f00cdde915d', 'Cadastros', '#', 'Database', ARRAY['cadastro']::text[], false, false, 4, true, NULL),
('3072a18d-9dbd-4e6b-b6a4-b9f89b8c6f65', 'SAC', '#', 'Headphones', ARRAY['sac']::text[], false, false, 5, true, NULL),
('06269ade-aa4b-407c-82d5-3968101cde52', 'Financeiro', '#', 'DollarSign', ARRAY['financeiro']::text[], false, false, 6, true, NULL),
('a2f976de-809a-427b-80ca-baf3f8d85c26', 'Minha Conta', '#', 'User', ARRAY[]::text[], false, false, 7, true, NULL)
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho,
  des_icone = EXCLUDED.des_icone,
  num_ordem = EXCLUDED.num_ordem;

-- Submenus Fluig
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('2760e43a-5266-4f1d-90ac-01c3b2970ab1', 'Acessar Fluig', 'https://fluig.redemontecarlo.com.br/', 'Home', ARRAY['fluig']::text[], true, false, 0, true, '18be1aac-c45c-4633-bc3a-9f6624993063')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- Submenus Tarefas
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('2b7db3b7-dc50-4fc4-ba1f-0185b10f8bb8', 'Central de Tarefas', 'https://fluig.redemontecarlo.com.br/portal/p/1/pagecentraltask', 'ClipboardList', ARRAY['central', 'tarefas', 'fluig']::text[], true, false, 0, true, '61223d4e-d219-4e7d-a025-58aa0b48d440')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- Submenus Faturamento
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('660d8d45-895c-4183-ad9f-5717cdad5c34', 'Faturamento Automático', 'https://fluig.redemontecarlo.com.br/portal/p/1/page_fatura', 'Zap', ARRAY['faturamento', 'fatura', 'fluig']::text[], true, false, 0, true, '50058fff-2bf2-4c9d-ba3a-381d86b8c4aa')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- Submenus Cadastros
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('778ebefb-a484-4e2c-b0d9-b5eac55c87b2', 'Cadastro de Clientes', 'https://fluig.redemontecarlo.com.br/portal/p/1/pageworkflowview?processID=cadastro_cliente', 'UserPlus', ARRAY['cadastro', 'cliente', 'fluig']::text[], true, false, 0, true, 'd27ad87a-56e2-44a8-bec2-3f00cdde915d'),
('5d9f085b-cdd0-4f95-b918-ee24e3631dcd', 'Cadastro de Placas', 'https://fluig.redemontecarlo.com.br/portal/p/1/pageworkflowview?processID=alteracao_placa_motorista', 'RectangleEllipsis', ARRAY['placa', 'motorista', 'cadastro', 'fluig']::text[], true, false, 1, true, 'd27ad87a-56e2-44a8-bec2-3f00cdde915d'),
('7b019e8c-868b-4808-adaf-718117123e49', 'LMC Medições', 'https://fluig.redemontecarlo.com.br/portal/p/1/page_lmc_medicoes', 'Gauge', ARRAY['lmc', 'medição', 'medicao', 'tanque', 'fluig']::text[], true, false, 2, true, 'd27ad87a-56e2-44a8-bec2-3f00cdde915d'),
('d2928a7c-72ca-4bba-8cc5-af0acbbbf371', 'Medição Tanque', 'https://fluig.redemontecarlo.com.br/portal/p/1/page_medicao_tanque', 'Droplets', ARRAY['medicao', 'tanque', 'medição', 'lmc', 'fluig']::text[], true, false, 3, true, 'd27ad87a-56e2-44a8-bec2-3f00cdde915d')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- Submenus SAC
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('4d4cda23-58d8-4cea-a77a-4525e6873897', 'Registros SAC', 'https://fluig.redemontecarlo.com.br/portal/p/1/page_registro_atendimento_sac', 'ClipboardList', ARRAY['sac', 'registros', 'fluig']::text[], true, false, 0, true, '3072a18d-9dbd-4e6b-b6a4-b9f89b8c6f65')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- Submenus Financeiro
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('f3938669-f4e8-4400-8ff9-449c23322085', 'Carta Frete', 'https://fluig.redemontecarlo.com.br/portal/p/1/page_carta_frete_v2', 'FileSpreadsheet', ARRAY['carta', 'frete', 'fluig']::text[], true, false, 0, true, '06269ade-aa4b-407c-82d5-3968101cde52'),
('6d955b06-8ee2-417c-9dbe-34adf13f365c', 'Cobrança', '/financeiro/cobranca', 'BadgeDollarSign', ARRAY['cobrança', 'boleto', 'inadimplência']::text[], false, false, 1, true, '06269ade-aa4b-407c-82d5-3968101cde52')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- Submenus Minha Conta
INSERT INTO public.tab_menu_item (cod_menu_item, des_nome, des_caminho, des_icone, des_tags, ind_nova_aba, ind_admin_only, num_ordem, ind_ativo, seq_menu_pai) VALUES
('1c24b9ec-090a-406f-820a-075dc0e5ac49', 'Meu Perfil', '/perfil', 'User', ARRAY[]::text[], false, false, 0, true, 'a2f976de-809a-427b-80ca-baf3f8d85c26')
ON CONFLICT (cod_menu_item) DO UPDATE SET
  des_nome = EXCLUDED.des_nome,
  des_caminho = EXCLUDED.des_caminho;

-- ============================================================================
-- 8. PERMISSÕES DE TELA (tab_permissao_tela)
-- ============================================================================

-- Permissões para Home (/)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/', 'Home', true, 1),
('moderator', '/', 'Home', true, 1),
('user', '/', 'Home', true, 1),
('fiscal', '/', 'Home', true, 1)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Comunicados (/comunicados)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/comunicados', 'Comunicados', true, 2),
('moderator', '/comunicados', 'Comunicados', true, 2),
('user', '/comunicados', 'Comunicados', true, 2),
('fiscal', '/comunicados', 'Comunicados', true, 2)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Status (/status)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/status', 'Status dos Sistemas', true, 3),
('moderator', '/status', 'Status dos Sistemas', true, 3),
('user', '/status', 'Status dos Sistemas', true, 3),
('fiscal', '/status', 'Status dos Sistemas', true, 3)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Reserva de Salas (/reserva-salas)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/reserva-salas', 'Reserva de Salas', true, 4),
('moderator', '/reserva-salas', 'Reserva de Salas', true, 4),
('user', '/reserva-salas', 'Reserva de Salas', true, 4),
('fiscal', '/reserva-salas', 'Reserva de Salas', true, 4)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Meu Perfil (/perfil)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/perfil', 'Meu Perfil', true, 5),
('moderator', '/perfil', 'Meu Perfil', true, 5),
('user', '/perfil', 'Meu Perfil', true, 5),
('fiscal', '/perfil', 'Meu Perfil', true, 5)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Suporte (/suporte)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/suporte', 'Suporte', true, 6),
('moderator', '/suporte', 'Suporte', true, 6),
('user', '/suporte', 'Suporte', true, 6),
('fiscal', '/suporte', 'Suporte', true, 6)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Base de Conhecimento (/base-conhecimento)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/base-conhecimento', 'Base de Conhecimento', true, 7),
('moderator', '/base-conhecimento', 'Base de Conhecimento', true, 7),
('user', '/base-conhecimento', 'Base de Conhecimento', true, 7),
('fiscal', '/base-conhecimento', 'Base de Conhecimento', true, 7)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões para Diretório (/diretorio)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/diretorio', 'Diretório', true, 8),
('moderator', '/diretorio', 'Diretório', true, 8),
('user', '/diretorio', 'Diretório', true, 8),
('fiscal', '/diretorio', 'Diretório', true, 8)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin - Perfis
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/perfis', 'Gerenciar Perfis', true, 9),
('moderator', '/admin/perfis', 'Gerenciar Perfis', false, 9),
('user', '/admin/perfis', 'Gerenciar Perfis', false, 9),
('fiscal', '/admin/perfis', 'Gerenciar Perfis', false, 9)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin - Configurações
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/configuracoes', 'Configurações', true, 10),
('moderator', '/admin/configuracoes', 'Configurações', true, 10),
('user', '/admin/configuracoes', 'Configurações', false, 10),
('fiscal', '/admin/configuracoes', 'Configurações', false, 10)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin - Comunicados
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/comunicados', 'Gerenciar Comunicados', true, 11),
('moderator', '/admin/comunicados', 'Gerenciar Comunicados', false, 11),
('user', '/admin/comunicados', 'Gerenciar Comunicados', false, 11),
('fiscal', '/admin/comunicados', 'Gerenciar Comunicados', false, 11)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin - Base de Conhecimento
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/base-conhecimento', 'Gerenciar Base de Conhecimento', true, 12),
('moderator', '/admin/base-conhecimento', 'Gerenciar Base de Conhecimento', true, 12),
('user', '/admin/base-conhecimento', 'Gerenciar Base de Conhecimento', false, 12),
('fiscal', '/admin/base-conhecimento', 'Gerenciar Base de Conhecimento', false, 12)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin - Auditoria
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/auditoria', 'Logs de Auditoria', true, 13),
('moderator', '/admin/auditoria', 'Logs de Auditoria', false, 13),
('user', '/admin/auditoria', 'Logs de Auditoria', false, 13),
('fiscal', '/admin/auditoria', 'Logs de Auditoria', false, 13)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- Permissões Admin - Suporte
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/suporte', 'Gerenciar Suporte', true, 14),
('moderator', '/admin/suporte', 'Gerenciar Suporte', false, 14),
('user', '/admin/suporte', 'Gerenciar Suporte', false, 14),
('fiscal', '/admin/suporte', 'Gerenciar Suporte', false, 14)
ON CONFLICT (des_rota, des_role) DO UPDATE SET ind_pode_acessar = EXCLUDED.ind_pode_acessar;

-- ============================================================================
-- 9. FAQs (tab_faq) - Opcional
-- ============================================================================
-- Nota: URLs de arquivos devem ser atualizadas para o novo bucket de storage
INSERT INTO public.tab_faq (cod_faq, des_pergunta, des_resposta, des_tags, num_ordem, ind_ativo) VALUES
('f96dafe4-3ea2-4186-86d8-25b83bdc8994', 'como abre o chamado?', '<ul><li><p><strong>boa pergunta</strong><br>acesse<br><br><a target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline cursor-pointer" href="https://www.redemontecarlo.com.br">www.redemontecarlo.com.br</a><br><br>digite seu usuario<br>sua senha<br>clique em entrar</p></li></ul><p></p>', ARRAY['garrafa']::text[], 1, true)
ON CONFLICT (cod_faq) DO UPDATE SET
  des_pergunta = EXCLUDED.des_pergunta,
  des_resposta = EXCLUDED.des_resposta;

-- ============================================================================
-- 10. STORAGE BUCKETS (executar no Supabase Dashboard)
-- ============================================================================
-- Os buckets devem ser criados via Dashboard ou SQL:
-- 
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('announcements', 'announcements', true),
--   ('avatars', 'avatars', true),
--   ('faqs', 'faqs', true),
--   ('knowledge-base', 'knowledge-base', true),
--   ('knowledge-base-files', 'knowledge-base-files', false);

-- ============================================================================
-- 11. COMUNICADOS DE EXEMPLO (tab_comunicado)
-- ============================================================================
INSERT INTO public.tab_comunicado (cod_comunicado, des_titulo, des_resumo, des_conteudo, des_tipo_template, ind_ativo, ind_fixado, ind_popup) VALUES
('28831bed-bf9c-4ee4-8b17-a8f1eeb75839', 'Manutenção Programada', 'O Portal Cliente ficará indisponível no próximo final de semana.', 'Comunicamos que será realizada manutenção programada no Portal Cliente no dia 04/01 das 22h às 06h.', 'simple', true, false, false),
('67b29134-c06b-4fd9-8f90-1ea88f89e97c', 'Bem-vindo ao MC Hub!', 'Conheça a nova intranet da Monte Carlo com acesso centralizado às ferramentas.', 'O MC Hub é a nova plataforma unificada para acesso às ferramentas da Monte Carlo. Aqui você encontra favoritos, acessos recentes, comunicados e muito mais!', 'banner', true, true, false)
ON CONFLICT (cod_comunicado) DO UPDATE SET
  des_titulo = EXCLUDED.des_titulo,
  des_resumo = EXCLUDED.des_resumo;

-- ============================================================================
-- NOTA: MIGRAÇÃO DE USUÁRIOS
-- ============================================================================
-- Os usuários devem ser migrados manualmente após criar as contas no auth.users
-- 
-- Passos:
-- 1. Criar usuário no auth.users (via Dashboard ou API)
-- 2. Copiar o UUID gerado
-- 3. Inserir perfil e role:
--
-- INSERT INTO public.tab_perfil_usuario (
--   cod_usuario, des_nome_completo, des_email, des_cargo, 
--   des_departamento, des_unidade, des_telefone, dta_aniversario, ind_ativo
-- ) VALUES (
--   'UUID_DO_USUARIO_AUTH',
--   'Nome Completo',
--   'email@empresa.com.br',
--   'Cargo',
--   'Departamento',
--   'Unidade',
--   '(00) 00000-0000',
--   '1990-01-15',
--   true
-- );
--
-- INSERT INTO public.tab_usuario_role (seq_usuario, des_role) VALUES
--   ('UUID_DO_USUARIO_AUTH', 'admin');

-- ============================================================================
-- USUÁRIOS DE REFERÊNCIA (do banco atual)
-- ============================================================================
-- admin@redemontecarlo.com - Administrador MC Hub (admin)
-- berio.gabriel@redemontecarlo.com.br - Gabriel Berio (user)
-- robson.canossa@redemontecarlo.com.br - ROBSON HIROITO DE SOUZA CANOSSA (user)
-- raphael.jordao@redemontecarlo.com - Raphael Jordao (admin)

-- ============================================================================
-- FIM DO SCRIPT DE DADOS
-- ============================================================================
