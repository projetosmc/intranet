import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

interface ScreenPermission {
  des_rota: string;
  des_nome_tela: string;
  ind_pode_acessar: boolean;
}

const CACHE_KEY = 'mc-hub-screen-permissions';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface CachedPermissions {
  roles: string[];
  permissions: ScreenPermission[];
  timestamp: number;
}

function getCachedPermissions(roles: string[]): ScreenPermission[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedPermissions = JSON.parse(cached);
    
    // Verifica se o cache é para as mesmas roles e não expirou
    if (
      JSON.stringify(data.roles.sort()) === JSON.stringify(roles.sort()) &&
      Date.now() - data.timestamp < CACHE_DURATION
    ) {
      return data.permissions;
    }
    
    return null;
  } catch {
    return null;
  }
}

function setCachedPermissions(roles: string[], permissions: ScreenPermission[]): void {
  try {
    const data: CachedPermissions = {
      roles,
      permissions,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignora erros de localStorage
  }
}

export function clearPermissionsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignora erros de localStorage
  }
}

/**
 * Hook para verificar permissões de acesso a telas
 * 
 * Verifica na tabela tab_permissao_tela se o usuário tem acesso à rota
 * baseado nos seus perfis (roles)
 */
export function useScreenPermission() {
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRole();
  const [permissions, setPermissions] = useState<ScreenPermission[]>([]);
  const [permissionsLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchPermissions = useCallback(async () => {
    // Aguarda roles carregarem antes de buscar permissões
    if (rolesLoading) {
      return;
    }

    // Admin tem acesso a tudo - não precisa buscar permissões
    if (isAdmin) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    // Usuário sem roles
    if (roles.length === 0) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    // Verifica cache primeiro
    const cached = getCachedPermissions(roles);
    if (cached) {
      setPermissions(cached);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tab_permissao_tela')
        .select('des_rota, des_nome_tela, ind_pode_acessar')
        .in('des_role', roles);

      if (error) throw error;

      const fetchedPermissions = (data || []) as ScreenPermission[];
      setPermissions(fetchedPermissions);
      setCachedPermissions(roles, fetchedPermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [roles, isAdmin, rolesLoading]);

  useEffect(() => {
    if (!rolesLoading && !hasFetched) {
      setIsLoading(true);
      setHasFetched(true);
      fetchPermissions();
    } else if (!rolesLoading && hasFetched) {
      // Re-fetch se roles mudaram
      fetchPermissions();
    }
  }, [rolesLoading, hasFetched, fetchPermissions]);

  /**
   * Verifica se o usuário pode acessar uma rota específica
   * Retorna true se QUALQUER uma das roles do usuário tiver acesso
   */
  const canAccess = useCallback((route: string): boolean => {
    // Admin sempre tem acesso
    if (isAdmin) return true;

    // Usuário sem roles não tem acesso a nada além das telas públicas
    if (roles.length === 0) {
      // Telas públicas básicas
      const publicRoutes = ['/', '/comunicados', '/status', '/suporte', '/reserva-salas', '/perfil'];
      return publicRoutes.some(r => route.startsWith(r) || route === r);
    }

    // Verifica se alguma permissão permite acesso
    const routePermissions = permissions.filter(p => {
      // Match exato ou rota começa com o padrão (para rotas com parâmetros)
      return p.des_rota === route || route.startsWith(p.des_rota + '/');
    });

    // Se não há permissões cadastradas para a rota, permite acesso (rota pública)
    if (routePermissions.length === 0) {
      return true;
    }

    // Retorna true se qualquer uma das roles tem acesso
    return routePermissions.some(p => p.ind_pode_acessar);
  }, [permissions, roles, isAdmin]);

  /**
   * Obtém o nome da tela para uma rota
   */
  const getScreenName = useCallback((route: string): string | null => {
    const permission = permissions.find(p => p.des_rota === route);
    return permission?.des_nome_tela || null;
  }, [permissions]);

  // isLoading é true apenas enquanto roles ou permissions estão sendo carregados
  const isLoading = rolesLoading || permissionsLoading;

  return {
    permissions,
    canAccess,
    getScreenName,
    isLoading,
    invalidateCache: () => {
      clearPermissionsCache();
      setHasFetched(false);
    },
  };
}
