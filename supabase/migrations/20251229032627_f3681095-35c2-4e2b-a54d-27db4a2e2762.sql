-- 1. Criar tabela para tipos de perfil (roles)
CREATE TABLE public.tab_perfil_tipo (
  cod_perfil_tipo UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  des_codigo TEXT NOT NULL UNIQUE,
  des_nome TEXT NOT NULL,
  des_descricao TEXT,
  des_cor TEXT DEFAULT 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  ind_sistema BOOLEAN DEFAULT false, -- roles do sistema não podem ser excluídos
  num_ordem INTEGER DEFAULT 0,
  ind_ativo BOOLEAN DEFAULT true,
  dta_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dta_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tab_perfil_tipo ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage role types"
ON public.tab_perfil_tipo
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view role types"
ON public.tab_perfil_tipo
FOR SELECT
USING (ind_ativo = true);

-- Trigger para atualizar dta_atualizacao
CREATE TRIGGER update_tab_perfil_tipo_updated_at
BEFORE UPDATE ON public.tab_perfil_tipo
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();

-- 2. Inserir perfis padrão do sistema
INSERT INTO public.tab_perfil_tipo (des_codigo, des_nome, des_descricao, des_cor, ind_sistema, num_ordem) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', true, 1),
('moderator', 'Moderador', 'Pode gerenciar conteúdo', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', true, 2),
('user', 'Usuário', 'Acesso básico ao sistema', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', true, 3);

-- 3. Adicionar coluna de ordem na tabela de permissões
ALTER TABLE public.tab_permissao_tela ADD COLUMN IF NOT EXISTS num_ordem INTEGER DEFAULT 0;

-- Atualizar ordem inicial baseado na rota
UPDATE public.tab_permissao_tela SET num_ordem = CASE
  WHEN des_rota = '/' THEN 1
  WHEN des_rota = '/comunicados' THEN 2
  WHEN des_rota = '/status' THEN 3
  WHEN des_rota = '/suporte' THEN 4
  WHEN des_rota = '/reserva-salas' THEN 5
  WHEN des_rota = '/perfil' THEN 6
  WHEN des_rota = '/admin/configuracoes' THEN 10
  WHEN des_rota = '/admin/comunicados' THEN 11
  WHEN des_rota = '/admin/usuarios' THEN 12
  WHEN des_rota = '/admin/auditoria' THEN 13
  WHEN des_rota = '/admin/sistemas' THEN 14
  WHEN des_rota = '/admin/faqs' THEN 15
  WHEN des_rota = '/admin/reserva-salas' THEN 16
  WHEN des_rota = '/admin/perfis' THEN 17
  ELSE 100
END;