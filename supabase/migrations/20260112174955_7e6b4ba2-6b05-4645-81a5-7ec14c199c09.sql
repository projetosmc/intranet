-- Função que cria permissões para todos os perfis quando um item de menu é criado
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
  -- Calcular próxima ordem
  SELECT COALESCE(MAX(num_ordem), 0) INTO max_order FROM public.tab_permissao_tela;
  
  -- Criar permissão para cada tipo de perfil ativo
  FOR role_type IN 
    SELECT des_codigo FROM public.tab_perfil_tipo WHERE ind_ativo = true
  LOOP
    -- Inserir permissão (padrão: não liberado)
    INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
    VALUES (role_type.des_codigo, NEW.des_caminho, NEW.des_nome, false, max_order + 1)
    ON CONFLICT (des_role, des_rota) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar quando um item de menu é criado
DROP TRIGGER IF EXISTS trigger_create_permissions_for_menu_item ON public.tab_menu_item;
CREATE TRIGGER trigger_create_permissions_for_menu_item
AFTER INSERT ON public.tab_menu_item
FOR EACH ROW
EXECUTE FUNCTION public.create_permissions_for_menu_item();

-- Função para atualizar nome da permissão quando o menu é atualizado
CREATE OR REPLACE FUNCTION public.update_permissions_for_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o caminho mudou, atualizar as permissões
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

-- Criar trigger para atualizar permissões quando menu é atualizado
DROP TRIGGER IF EXISTS trigger_update_permissions_for_menu_item ON public.tab_menu_item;
CREATE TRIGGER trigger_update_permissions_for_menu_item
AFTER UPDATE ON public.tab_menu_item
FOR EACH ROW
EXECUTE FUNCTION public.update_permissions_for_menu_item();

-- Função para remover permissões quando menu é excluído
CREATE OR REPLACE FUNCTION public.delete_permissions_for_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remover todas as permissões associadas ao caminho do menu
  DELETE FROM public.tab_permissao_tela WHERE des_rota = OLD.des_caminho;
  RETURN OLD;
END;
$$;

-- Criar trigger para remover permissões quando menu é excluído
DROP TRIGGER IF EXISTS trigger_delete_permissions_for_menu_item ON public.tab_menu_item;
CREATE TRIGGER trigger_delete_permissions_for_menu_item
AFTER DELETE ON public.tab_menu_item
FOR EACH ROW
EXECUTE FUNCTION public.delete_permissions_for_menu_item();

-- Criar permissões para itens de menu existentes que ainda não têm permissão
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
SELECT 
  pt.des_codigo,
  mi.des_caminho,
  mi.des_nome,
  false,
  ROW_NUMBER() OVER (ORDER BY mi.num_ordem) + COALESCE((SELECT MAX(num_ordem) FROM public.tab_permissao_tela), 0)
FROM public.tab_menu_item mi
CROSS JOIN public.tab_perfil_tipo pt
WHERE mi.ind_ativo = true 
  AND pt.ind_ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.tab_permissao_tela p 
    WHERE p.des_rota = mi.des_caminho AND p.des_role = pt.des_codigo
  )
ON CONFLICT (des_role, des_rota) DO NOTHING;