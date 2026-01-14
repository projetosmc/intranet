-- =====================================================
-- SCRIPT: Adicionar Administrador
-- Descrição: Adiciona o role 'admin' para um usuário
-- =====================================================

-- =====================================================
-- OPÇÃO 1: Por EMAIL (mais fácil)
-- =====================================================
-- Substitua 'email@exemplo.com' pelo email do usuário

DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'email@exemplo.com';  -- <-- ALTERE AQUI
BEGIN
    -- Busca o ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email "%" não encontrado', v_email;
    END IF;
    
    -- Verifica se já é admin
    IF EXISTS (
        SELECT 1 FROM public.tab_usuario_role
        WHERE seq_usuario = v_user_id AND des_role = 'admin'
    ) THEN
        RAISE NOTICE 'Usuário "%" já possui o role admin', v_email;
        RETURN;
    END IF;
    
    -- Adiciona o role admin
    INSERT INTO public.tab_usuario_role (seq_usuario, des_role)
    VALUES (v_user_id, 'admin');
    
    RAISE NOTICE 'Role admin adicionado com sucesso para: %', v_email;
END $$;


-- =====================================================
-- OPÇÃO 2: Por UUID (se já tiver o ID)
-- =====================================================
-- Substitua o UUID abaixo pelo ID do usuário

/*
INSERT INTO public.tab_usuario_role (seq_usuario, des_role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin')
ON CONFLICT DO NOTHING;
*/


-- =====================================================
-- CONSULTAS ÚTEIS
-- =====================================================

-- Ver todos os admins atuais
SELECT 
    ur.seq_usuario,
    u.email,
    p.des_nome_completo,
    ur.dta_cadastro as admin_desde
FROM public.tab_usuario_role ur
LEFT JOIN auth.users u ON u.id = ur.seq_usuario
LEFT JOIN public.tab_perfil_usuario p ON p.cod_usuario = ur.seq_usuario
WHERE ur.des_role = 'admin'
ORDER BY ur.dta_cadastro;


-- Buscar usuário por email
SELECT 
    u.id,
    u.email,
    p.des_nome_completo,
    array_agg(ur.des_role) as roles
FROM auth.users u
LEFT JOIN public.tab_perfil_usuario p ON p.cod_usuario = u.id
LEFT JOIN public.tab_usuario_role ur ON ur.seq_usuario = u.id
WHERE u.email ILIKE '%termo_busca%'  -- <-- ALTERE AQUI
GROUP BY u.id, u.email, p.des_nome_completo;


-- =====================================================
-- REMOVER ADMIN (se necessário)
-- =====================================================
/*
DELETE FROM public.tab_usuario_role
WHERE seq_usuario = '00000000-0000-0000-0000-000000000000'
  AND des_role = 'admin';
*/
