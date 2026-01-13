-- =====================================================
-- MC HUB - SCRIPT DE DADOS PARA IMPORTAÇÃO
-- Gerado em: 2026-01-13
-- Para: Supabase Externo
-- =====================================================

-- IMPORTANTE: Execute este script APÓS o schema (MIGRATION_SCHEMA.sql)
-- Os UUIDs de usuários precisarão ser ajustados após criar os usuários no auth.users

-- =====================================================
-- DADOS: tab_perfil_tipo (Tipos de Perfil)
-- =====================================================

INSERT INTO public.tab_perfil_tipo (cod_perfil_tipo, des_codigo, des_nome, des_descricao, des_cor, num_ordem, ind_ativo, ind_sistema) VALUES
('f022cf21-4f0d-478e-8eb0-ae69a9d90a48', 'admin', 'Administrador', 'Acesso total ao sistema', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', 1, true, true),
('4d885198-d36b-4a29-bf7a-6d6047a0f0eb', 'moderator', 'Suporte', 'Pode gerenciar conteúdo', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 2, true, true),
('119d8ea1-15fb-43c5-864e-5af63778e15a', 'user', 'Acesso Padrão', 'Acesso básico ao sistema', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 3, true, true),
('adee19fc-e09b-4128-bc26-0f0227cff240', 'fiscal', 'Analista Fiscal', NULL, 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', 4, true, false);

-- =====================================================
-- DADOS: tab_tipo_reuniao (Tipos de Reunião)
-- =====================================================

INSERT INTO public.tab_tipo_reuniao (cod_tipo_reuniao, des_nome, num_ordem, ind_ativo) VALUES
('4513bd46-4168-4be4-bdf2-5c1899fa67fa', 'Reunião de Equipe', 0, true),
('07b59c6b-4700-4070-ba26-38220fde3a3f', 'Reunião com Cliente', 1, true),
('35a8dfc7-9a69-4dd9-a762-89077f7ff035', 'Treinamento', 2, true),
('76847f57-838e-4929-9fd2-6a8544d0c3d8', 'Entrevista', 3, true),
('58ed606c-845f-4ce6-aac9-aef06f2ff674', 'Apresentação', 4, true),
('b459fdcb-93f0-4245-ab4f-7efdc4a4b102', 'Videoconferência', 5, true),
('98addd4b-d25f-4866-b11a-d724a95416c0', 'Workshop', 6, true),
('8647b048-7ce6-47d9-802f-7b6cea849806', 'Alinhamento', 7, true);

-- =====================================================
-- DADOS: tab_sala_reuniao (Salas de Reunião)
-- =====================================================

INSERT INTO public.tab_sala_reuniao (cod_sala, des_nome, num_capacidade, des_roles_permitidos, num_ordem, ind_ativo) VALUES
('9debc190-6824-4105-920e-11bcc4f830f5', 'Sala de Reunião Recepção', 10, ARRAY['all'], 1, true),
('85e70625-a932-4a79-963e-0da3d4dad5ce', 'Sala de Reunião Diretoria', 10, ARRAY['admin'], 2, true);

-- =====================================================
-- DADOS: tab_enquete_opcao (Opções de Enquete)
-- =====================================================

INSERT INTO public.tab_enquete_opcao (cod_opcao, seq_comunicado, des_texto_opcao) VALUES
('bbe1cdae-9e6a-4e83-8545-22d26fe9f9fa', '2f67d1a5-5561-40a1-ae91-ca618ab6ed76', 'Portal Requisição de Despesas'),
('ee6253a5-b15a-49bb-a0ff-1ac4a4ae88a6', '2f67d1a5-5561-40a1-ae91-ca618ab6ed76', 'Portal Cliente'),
('1511d462-8686-49c9-be39-2de91e059faa', '2f67d1a5-5561-40a1-ae91-ca618ab6ed76', 'Pré-fatura'),
('2e7c0538-751c-410b-9c30-8135640cdc9f', '2f67d1a5-5561-40a1-ae91-ca618ab6ed76', 'Portal Regra de Preço'),
('8ae0734e-b457-4375-adb7-8ba144a3cd75', '2f67d1a5-5561-40a1-ae91-ca618ab6ed76', 'Auditoria Preço x Bomba');

-- =====================================================
-- DADOS: tab_comunicado (Comunicados)
-- =====================================================

INSERT INTO public.tab_comunicado (cod_comunicado, des_titulo, des_resumo, des_conteudo, des_tipo_template, des_imagem_url, des_tipo_enquete, ind_ativo, ind_fixado, ind_popup) VALUES
('28831bed-bf9c-4ee4-8b17-a8f1eeb75839', 'Manutenção Programada', 'O Portal Cliente ficará indisponível no próximo final de semana.', 'Comunicamos que será realizada manutenção programada no Portal Cliente no dia 04/01 das 22h às 06h.', 'simple', NULL, NULL, true, false, false),
('2f67d1a5-5561-40a1-ae91-ca618ab6ed76', 'Qual ferramenta você mais utiliza?', 'Ajude-nos a entender o uso das ferramentas para melhorar sua experiência.', 'Sua opinião é importante para direcionarmos melhorias e novos desenvolvimentos.', 'poll', NULL, 'single', true, false, false),
('57da8a25-e09e-443f-858f-3848921c38d4', 'Nova Política de Despesas 2025', 'Confira as atualizações nas regras de requisição de despesas.', 'A partir de Janeiro de 2025, novas regras serão aplicadas ao processo de requisição de despesas. Acesse o portal para mais detalhes.', 'banner', 'https://haycuruhkzmhszwcmcpn.supabase.co/storage/v1/object/public/announcements/banners/1c467bc8-4751-4e16-9c43-f4432b6dc477.png', NULL, true, false, false),
('67b29134-c06b-4fd9-8f90-1ea88f89e97c', 'Bem-vindo ao MC Hub!', 'Conheça a nova intranet da Monte Carlo com acesso centralizado às ferramentas.', 'O MC Hub é a nova plataforma unificada para acesso às ferramentas da Monte Carlo. Aqui você encontra favoritos, acessos recentes, comunicados e muito mais!', 'banner', 'https://haycuruhkzmhszwcmcpn.supabase.co/storage/v1/object/public/announcements/banners/6b41c0df-4d5f-4e6d-9183-987cbeffbf77.jpg', NULL, true, true, false),
('be17a160-8a42-417f-a267-ad94226bc14f', '📢 Comunicado Importante', 'Este é um exemplo de comunicado popup. Os usuários podem marcar "não mostrar novamente" ou ele continuará aparecendo a cada login.', '<p>Este comunicado foi criado automaticamente para testar a funcionalidade de popup urgente.</p><p><strong>Importante:</strong> Se você está vendo este popup, significa que o sistema está funcionando corretamente!</p>', 'simple', NULL, NULL, true, false, true);

-- =====================================================
-- DADOS: tab_permissao_tela (Permissões por Tela)
-- Nota: Este é um subset das permissões. Ajuste conforme necessário.
-- =====================================================

-- Permissões para Home (/)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/', 'Home', true, 1),
('moderator', '/', 'Home', true, 1),
('user', '/', 'Home', true, 1),
('fiscal', '/', 'Home', true, 1);

-- Permissões para Comunicados (/comunicados)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/comunicados', 'Comunicados', true, 2),
('moderator', '/comunicados', 'Comunicados', true, 2),
('user', '/comunicados', 'Comunicados', true, 2),
('fiscal', '/comunicados', 'Comunicados', true, 2);

-- Permissões para Status (/status)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/status', 'Status dos Sistemas', false, 3),
('moderator', '/status', 'Status dos Sistemas', false, 3),
('user', '/status', 'Status dos Sistemas', false, 3),
('fiscal', '/status', 'Status dos Sistemas', false, 3);

-- Permissões para Reserva de Salas (/reserva-salas)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/reserva-salas', 'Reserva de Salas', true, 5),
('moderator', '/reserva-salas', 'Reserva de Salas', true, 5),
('user', '/reserva-salas', 'Reserva de Salas', true, 5),
('fiscal', '/reserva-salas', 'Reserva de Salas', true, 5);

-- Permissões para Meu Perfil (/perfil)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/perfil', 'Meu Perfil', true, 6),
('moderator', '/perfil', 'Meu Perfil', true, 6),
('user', '/perfil', 'Meu Perfil', true, 6),
('fiscal', '/perfil', 'Meu Perfil', true, 6);

-- Permissões para Admin (/admin/*)
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem) VALUES
('admin', '/admin/comunicados', 'Admin Comunicados', true, 10),
('admin', '/admin/perfis', 'Admin Perfis', true, 11),
('admin', '/admin/configuracoes', 'Admin Configurações', true, 12);

-- =====================================================
-- NOTA SOBRE USUÁRIOS
-- =====================================================
-- Os usuários precisam ser criados manualmente no auth.users do Supabase.
-- Depois de criar os usuários, use os UUIDs gerados para:
-- 1. Inserir em tab_perfil_usuario
-- 2. Inserir em tab_usuario_role

-- Exemplo de como inserir após criar usuários:
-- INSERT INTO public.tab_perfil_usuario (cod_usuario, des_nome_completo, des_email, des_telefone, ind_ativo)
-- VALUES ('UUID_DO_USUARIO', 'Nome Completo', 'email@empresa.com', '(99) 99999-9999', true);

-- INSERT INTO public.tab_usuario_role (seq_usuario, des_role)
-- VALUES ('UUID_DO_USUARIO', 'admin');

-- =====================================================
-- USUÁRIOS EXISTENTES (para referência)
-- Nota: Você precisará recriar estes usuários no auth.users
-- =====================================================

-- Administrador MC Hub
-- Email: admin@redemontecarlo.com
-- Nome: Administrador MC Hub
-- Role: admin

-- Gabriel Berio
-- Email: berio.gabriel@redemontecarlo.com.br
-- Nome: Gabriel Berio
-- Role: user

-- Robson Canossa
-- Email: robson.canossa@redemontecarlo.com.br
-- Nome: ROBSON HIROITO DE SOUZA CANOSSA
-- Role: user

-- Raphael Jordao
-- Email: raphael.jordao@redemontecarlo.com
-- Nome: Raphael Jordao
-- Role: admin

-- =====================================================
-- FIM DO SCRIPT DE DADOS
-- =====================================================
