-- Função para configurar o primeiro admin (bypass RLS)
CREATE OR REPLACE FUNCTION public.setup_first_admin(admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'An admin already exists';
  END IF;
  
  -- Insert the first admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin');
END;
$$;

-- Inserir comunicados de exemplo (sem auth, direto no banco)
INSERT INTO public.announcements (title, summary, content, pinned, active, template_type, image_url, poll_type)
VALUES 
  (
    'Bem-vindo ao MC Hub!',
    'Conheça a nova intranet da Monte Carlo com acesso centralizado às ferramentas.',
    'O MC Hub é a nova plataforma unificada para acesso às ferramentas da Monte Carlo. Aqui você encontra favoritos, acessos recentes, comunicados e muito mais!',
    true,
    true,
    'banner',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop',
    NULL
  ),
  (
    'Nova Política de Despesas 2025',
    'Confira as atualizações nas regras de requisição de despesas.',
    'A partir de Janeiro de 2025, novas regras serão aplicadas ao processo de requisição de despesas. Acesse o portal para mais detalhes.',
    false,
    true,
    'banner',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=400&fit=crop',
    NULL
  ),
  (
    'Manutenção Programada',
    'O Portal Cliente ficará indisponível no próximo final de semana.',
    'Comunicamos que será realizada manutenção programada no Portal Cliente no dia 04/01 das 22h às 06h.',
    false,
    true,
    'simple',
    NULL,
    NULL
  );

-- Inserir enquete de exemplo
INSERT INTO public.announcements (title, summary, content, pinned, active, template_type, poll_type)
VALUES (
  'Qual ferramenta você mais utiliza?',
  'Ajude-nos a entender o uso das ferramentas para melhorar sua experiência.',
  'Sua opinião é importante para direcionarmos melhorias e novos desenvolvimentos.',
  false,
  true,
  'poll',
  'single'
);

-- Pegar o ID da enquete inserida e adicionar opções
DO $$
DECLARE
  poll_id UUID;
BEGIN
  SELECT id INTO poll_id FROM public.announcements 
  WHERE template_type = 'poll' AND title = 'Qual ferramenta você mais utiliza?'
  LIMIT 1;
  
  IF poll_id IS NOT NULL THEN
    INSERT INTO public.poll_options (announcement_id, option_text) VALUES
      (poll_id, 'Portal Requisição de Despesas'),
      (poll_id, 'Portal Cliente'),
      (poll_id, 'Pré-fatura'),
      (poll_id, 'Portal Regra de Preço'),
      (poll_id, 'Auditoria Preço x Bomba');
  END IF;
END $$;