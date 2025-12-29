-- Função para criar permissões para todos os perfis quando uma nova tela é adicionada
CREATE OR REPLACE FUNCTION public.create_permissions_for_new_screen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_type RECORD;
  existing_count INTEGER;
BEGIN
  -- Verificar se já existem permissões para esta rota (para outros perfis)
  SELECT COUNT(*) INTO existing_count
  FROM public.tab_permissao_tela
  WHERE des_rota = NEW.des_rota AND des_role != NEW.des_role;
  
  -- Se não existem outras permissões para esta rota, é uma nova tela
  -- Criar permissões para todos os perfis existentes
  IF existing_count = 0 THEN
    FOR role_type IN 
      SELECT des_codigo FROM public.tab_perfil_tipo 
      WHERE des_codigo != NEW.des_role AND ind_ativo = true
    LOOP
      INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
      VALUES (role_type.des_codigo, NEW.des_rota, NEW.des_nome_tela, false, NEW.num_ordem)
      ON CONFLICT (des_role, des_rota) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar permissões quando uma nova tela é inserida
CREATE TRIGGER trigger_create_permissions_for_new_screen
AFTER INSERT ON public.tab_permissao_tela
FOR EACH ROW
EXECUTE FUNCTION public.create_permissions_for_new_screen();