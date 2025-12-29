-- Tabela para armazenar permissões de acesso por perfil às telas
CREATE TABLE public.tab_permissao_tela (
  cod_permissao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  des_role app_role NOT NULL,
  des_rota TEXT NOT NULL,
  des_nome_tela TEXT NOT NULL,
  ind_pode_acessar BOOLEAN NOT NULL DEFAULT false,
  dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(des_role, des_rota)
);

-- Habilitar RLS
ALTER TABLE public.tab_permissao_tela ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage screen permissions"
ON public.tab_permissao_tela
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view permissions"
ON public.tab_permissao_tela
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar dta_atualizacao
CREATE TRIGGER update_tab_permissao_tela_updated_at
BEFORE UPDATE ON public.tab_permissao_tela
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();

-- Inserir permissões padrão para as telas existentes
-- Admin tem acesso total a tudo
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar) VALUES
-- Telas públicas
('admin', '/', 'Home', true),
('admin', '/comunicados', 'Comunicados', true),
('admin', '/status', 'Status dos Sistemas', true),
('admin', '/suporte', 'Suporte', true),
('admin', '/reserva-salas', 'Reserva de Salas', true),
('admin', '/perfil', 'Meu Perfil', true),
-- Telas administrativas
('admin', '/admin/configuracoes', 'Configurações', true),
('admin', '/admin/comunicados', 'Gerenciar Comunicados', true),
('admin', '/admin/usuarios', 'Gerenciar Usuários', true),
('admin', '/admin/auditoria', 'Logs de Auditoria', true),
('admin', '/admin/sistemas', 'Gerenciar Sistemas', true),
('admin', '/admin/faqs', 'Gerenciar FAQs', true),
('admin', '/admin/reserva-salas', 'Configurar Salas', true),
('admin', '/admin/perfis', 'Gerenciar Perfis', true),

-- Moderator - acesso às telas públicas e algumas administrativas
('moderator', '/', 'Home', true),
('moderator', '/comunicados', 'Comunicados', true),
('moderator', '/status', 'Status dos Sistemas', true),
('moderator', '/suporte', 'Suporte', true),
('moderator', '/reserva-salas', 'Reserva de Salas', true),
('moderator', '/perfil', 'Meu Perfil', true),
('moderator', '/admin/configuracoes', 'Configurações', false),
('moderator', '/admin/comunicados', 'Gerenciar Comunicados', true),
('moderator', '/admin/usuarios', 'Gerenciar Usuários', false),
('moderator', '/admin/auditoria', 'Logs de Auditoria', false),
('moderator', '/admin/sistemas', 'Gerenciar Sistemas', true),
('moderator', '/admin/faqs', 'Gerenciar FAQs', true),
('moderator', '/admin/reserva-salas', 'Configurar Salas', false),
('moderator', '/admin/perfis', 'Gerenciar Perfis', false),

-- User - acesso apenas às telas públicas
('user', '/', 'Home', true),
('user', '/comunicados', 'Comunicados', true),
('user', '/status', 'Status dos Sistemas', true),
('user', '/suporte', 'Suporte', true),
('user', '/reserva-salas', 'Reserva de Salas', true),
('user', '/perfil', 'Meu Perfil', true),
('user', '/admin/configuracoes', 'Configurações', false),
('user', '/admin/comunicados', 'Gerenciar Comunicados', false),
('user', '/admin/usuarios', 'Gerenciar Usuários', false),
('user', '/admin/auditoria', 'Logs de Auditoria', false),
('user', '/admin/sistemas', 'Gerenciar Sistemas', false),
('user', '/admin/faqs', 'Gerenciar FAQs', false),
('user', '/admin/reserva-salas', 'Configurar Salas', false),
('user', '/admin/perfis', 'Gerenciar Perfis', false);