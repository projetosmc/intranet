-- Função para criar permissões automaticamente para um novo perfil
CREATE OR REPLACE FUNCTION public.create_permissions_for_new_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  screen RECORD;
BEGIN
  -- Buscar todas as telas únicas existentes
  FOR screen IN 
    SELECT DISTINCT des_rota, des_nome_tela, num_ordem 
    FROM public.tab_permissao_tela 
    WHERE des_role = 'user' -- Usa o perfil 'user' como base
    ORDER BY num_ordem
  LOOP
    -- Inserir permissão para o novo perfil (padrão: sem acesso)
    INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
    VALUES (NEW.des_codigo, screen.des_rota, screen.des_nome_tela, false, screen.num_ordem)
    ON CONFLICT (des_role, des_rota) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar permissões quando um novo perfil é inserido
CREATE TRIGGER trigger_create_permissions_for_new_role
AFTER INSERT ON public.tab_perfil_tipo
FOR EACH ROW
EXECUTE FUNCTION public.create_permissions_for_new_role();

-- Função para remover permissões quando um perfil é excluído
CREATE OR REPLACE FUNCTION public.delete_permissions_for_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remover todas as permissões do perfil excluído
  DELETE FROM public.tab_permissao_tela 
  WHERE des_role = OLD.des_codigo;
  
  RETURN OLD;
END;
$$;

-- Trigger para remover permissões quando um perfil é excluído
CREATE TRIGGER trigger_delete_permissions_for_role
BEFORE DELETE ON public.tab_perfil_tipo
FOR EACH ROW
EXECUTE FUNCTION public.delete_permissions_for_role();

-- Alterar coluna des_role de enum para text para suportar roles dinâmicos
-- Primeiro, remover a constraint de enum da coluna des_role em tab_permissao_tela
ALTER TABLE public.tab_permissao_tela 
ALTER COLUMN des_role TYPE TEXT;