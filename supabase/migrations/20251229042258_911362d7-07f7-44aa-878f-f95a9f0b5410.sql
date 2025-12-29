-- Inserir permissões separadas para cada funcionalidade de suporte
-- Para cada perfil existente, criar as 3 novas permissões

-- Primeiro, deletar a permissão antiga /suporte/editar se existir
DELETE FROM public.tab_permissao_tela WHERE des_rota = '/suporte/editar';

-- Inserir novas permissões para cada perfil
INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
SELECT 
  pt.des_codigo,
  '/suporte/editar-links',
  'Editar Links de Suporte',
  false,
  100
FROM public.tab_perfil_tipo pt
WHERE pt.ind_ativo = true
ON CONFLICT DO NOTHING;

INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
SELECT 
  pt.des_codigo,
  '/suporte/editar-contatos',
  'Editar Contatos de Suporte',
  false,
  101
FROM public.tab_perfil_tipo pt
WHERE pt.ind_ativo = true
ON CONFLICT DO NOTHING;

INSERT INTO public.tab_permissao_tela (des_role, des_rota, des_nome_tela, ind_pode_acessar, num_ordem)
SELECT 
  pt.des_codigo,
  '/suporte/editar-faqs',
  'Editar FAQs',
  false,
  102
FROM public.tab_perfil_tipo pt
WHERE pt.ind_ativo = true
ON CONFLICT DO NOTHING;