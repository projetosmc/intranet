-- =====================================================
-- Trigger: Liberar todas as telas para admin quando menu for criado
-- =====================================================

-- Atualizar a função existente para garantir que admin sempre tem acesso
CREATE OR REPLACE FUNCTION public.create_permissions_for_menu_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    -- Admin sempre tem acesso, outros perfis começam sem acesso
    INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
    VALUES (
      role_type.des_codigo, 
      NEW.des_caminho, 
      NEW.des_nome, 
      CASE WHEN role_type.des_codigo = 'admin' THEN true ELSE false END,  -- Admin sempre liberado
      max_order + 1
    )
    ON CONFLICT (des_role, des_rota) DO UPDATE 
    SET des_nome_tela = EXCLUDED.des_nome_tela,
        dta_atualizacao = now();
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS trigger_create_permissions_for_menu ON public.tab_menu_item;

CREATE TRIGGER trigger_create_permissions_for_menu
  AFTER INSERT ON public.tab_menu_item
  FOR EACH ROW
  EXECUTE FUNCTION public.create_permissions_for_menu_item();

-- =====================================================
-- Trigger: Atualizar permissões quando menu for editado
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_permissions_for_menu_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o caminho ou nome mudou, atualizar as permissões
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

DROP TRIGGER IF EXISTS trigger_update_permissions_for_menu ON public.tab_menu_item;

CREATE TRIGGER trigger_update_permissions_for_menu
  AFTER UPDATE ON public.tab_menu_item
  FOR EACH ROW
  EXECUTE FUNCTION public.update_permissions_for_menu_item();

-- =====================================================
-- Trigger: Remover permissões quando menu for deletado
-- =====================================================

CREATE OR REPLACE FUNCTION public.delete_permissions_for_menu_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remover todas as permissões associadas ao caminho do menu
  DELETE FROM public.tab_permissao_tela WHERE des_rota = OLD.des_caminho;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_delete_permissions_for_menu ON public.tab_menu_item;

CREATE TRIGGER trigger_delete_permissions_for_menu
  AFTER DELETE ON public.tab_menu_item
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_permissions_for_menu_item();

-- =====================================================
-- Trigger: Criar permissões para novo tipo de perfil
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_permissions_for_new_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  screen RECORD;
BEGIN
  -- Buscar todas as telas únicas existentes
  FOR screen IN 
    SELECT DISTINCT des_rota, des_nome_tela, num_ordem 
    FROM public.tab_permissao_tela 
    WHERE des_role = 'admin' -- Usa o perfil 'admin' como base (tem todas as telas)
    ORDER BY num_ordem
  LOOP
    -- Novo perfil começa sem acesso (exceto se for admin)
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

DROP TRIGGER IF EXISTS trigger_create_permissions_for_role ON public.tab_perfil_tipo;

CREATE TRIGGER trigger_create_permissions_for_role
  AFTER INSERT ON public.tab_perfil_tipo
  FOR EACH ROW
  EXECUTE FUNCTION public.create_permissions_for_new_role();