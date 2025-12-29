import { useAuthContext } from '@/contexts/AuthContext';

export function clearPermissionsCache(): void {
  try {
    localStorage.removeItem('mc-hub-screen-permissions');
  } catch {
    // Ignora erros de localStorage
  }
}

/**
 * Hook wrapper para permissões de tela
 * Utiliza o AuthContext centralizado
 */
export function useScreenPermission() {
  const auth = useAuthContext();

  return {
    permissions: [],
    canAccess: auth.canAccess,
    getScreenName: auth.getScreenName,
    isLoading: auth.isLoading,
    invalidateCache: auth.invalidateCache,
  };
}

