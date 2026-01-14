-- =====================================================
-- SCRIPT: Gerenciamento de Administradores
-- Descrição: Scripts para adicionar admin e corrigir permissões
-- =====================================================


-- =====================================================
-- DIAGNÓSTICO: Verificar se usuário é admin
-- =====================================================
-- Execute primeiro para diagnosticar o problema

-- 1. Ver todos os usuários e suas roles
SELECT 
    u.email,
    p.des_nome_completo,
    COALESCE(array_agg(ur.des_role ORDER BY ur.des_role), ARRAY[]::text[]) as roles,
    CASE WHEN 'admin' = ANY(array_agg(ur.des_role)) THEN 'SIM' ELSE 'NÃO' END as is_admin
FROM auth.users u
LEFT JOIN public.tab_perfil_usuario p ON p.cod_usuario = u.id
LEFT JOIN public.tab_usuario_role ur ON ur.seq_usuario = u.id
GROUP BY u.id, u.email, p.des_nome_completo
ORDER BY p.des_nome_completo;


-- 2. Verificar se a função has_role está funcionando
-- (substitua o email pelo email do usuário)
DO $$
DECLARE
    v_user_id uuid;
    v_is_admin boolean;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'email@exemplo.com';
    
    IF v_user_id IS NOT NULL THEN
        SELECT public.has_role(v_user_id, 'admin') INTO v_is_admin;
        RAISE NOTICE 'Usuário encontrado. ID: %. É admin: %', v_user_id, v_is_admin;
    ELSE
        RAISE NOTICE 'Usuário não encontrado';
    END IF;
END $$;


-- =====================================================
-- OPÇÃO 1: Adicionar Admin por EMAIL
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
-- OPÇÃO 2: Adicionar Admin por UUID
-- =====================================================
-- Substitua o UUID abaixo pelo ID do usuário

/*
INSERT INTO public.tab_usuario_role (seq_usuario, des_role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin')
ON CONFLICT DO NOTHING;
*/


-- =====================================================
-- CORREÇÃO: Liberar todas as telas para perfil admin
-- =====================================================
-- IMPORTANTE: O código já garante que admin vê tudo via código,
-- mas isso atualiza a tabela para consistência

UPDATE public.tab_permissao_tela 
SET ind_pode_acessar = true,
    dta_atualizacao = now()
WHERE des_role = 'admin';

-- Verificar quantas foram atualizadas
SELECT 'Permissões do admin atualizadas: ' || COUNT(*) as resultado
FROM public.tab_permissao_tela 
WHERE des_role = 'admin' AND ind_pode_acessar = true;


-- =====================================================
-- CORREÇÃO: Criar permissões faltantes para admin
-- =====================================================
-- Se alguma tela foi criada sem a permissão para admin

INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
SELECT 
    'admin', 
    m.des_caminho, 
    m.des_nome, 
    true,
    m.num_ordem
FROM public.tab_menu_item m
WHERE m.ind_ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.tab_permissao_tela p 
    WHERE p.des_role = 'admin' AND p.des_rota = m.des_caminho
  )
ON CONFLICT (des_role, des_rota) DO NOTHING;


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


-- Ver permissões do admin
SELECT des_rota, des_nome_tela, ind_pode_acessar
FROM public.tab_permissao_tela
WHERE des_role = 'admin'
ORDER BY des_rota;


-- Verificar se todas as telas estão liberadas para admin
SELECT 
    COUNT(*) as total_telas,
    SUM(CASE WHEN ind_pode_acessar THEN 1 ELSE 0 END) as liberadas,
    SUM(CASE WHEN NOT ind_pode_acessar THEN 1 ELSE 0 END) as bloqueadas
FROM public.tab_permissao_tela
WHERE des_role = 'admin';


-- =====================================================
-- REMOVER ADMIN (se necessário)
-- =====================================================
/*
DELETE FROM public.tab_usuario_role
WHERE seq_usuario = '00000000-0000-0000-0000-000000000000'
  AND des_role = 'admin';
*/
