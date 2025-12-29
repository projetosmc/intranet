import { useMemo } from 'react';
import { useScreenPermission } from './useScreenPermission';
import { useUserRole } from './useUserRole';

/**
 * Hook para verificar permissões de funcionalidades específicas
 * Utiliza as rotas de permissão como base para determinar acesso
 */
export function useFeaturePermission() {
  const { canAccess, isLoading: permissionLoading } = useScreenPermission();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const permissions = useMemo(() => ({
    // Edição de suporte (links e contatos)
    canEditSupport: isAdmin || canAccess('/suporte/editar'),
    
    // Menu Configurações Gerais
    canAccessSettings: isAdmin || canAccess('/admin/configuracoes'),
    
    // Logs de Auditoria
    canAccessAuditLogs: isAdmin || canAccess('/admin/auditoria'),
    
    // Aba Usuários na tela de perfis
    canAccessUsersTab: isAdmin || canAccess('/admin/perfis/usuarios'),
    
    // Aba Tipos de Perfil
    canAccessRoleTypesTab: isAdmin || canAccess('/admin/perfis/tipos'),
    
    // Aba Permissões por Perfil
    canAccessPermissionsTab: isAdmin || canAccess('/admin/perfis/permissoes'),
  }), [isAdmin, canAccess]);

  return {
    ...permissions,
    isLoading: permissionLoading || roleLoading,
  };
}
