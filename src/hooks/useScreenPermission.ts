import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function clearPermissionsCache(): void {
  // This is now handled by React Query
  // Keep for backward compatibility but does nothing
}

/**
 * Hook wrapper para permissões de tela
 * Utiliza o AuthContext centralizado com React Query
 */
export function useScreenPermission() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  const invalidateCache = () => {
    auth.invalidateCache();
    // Also clear React Query cache
    queryClient.invalidateQueries({ queryKey: ['screen-permissions'] });
  };

  return {
    permissions: [],
    canAccess: auth.canAccess,
    getScreenName: auth.getScreenName,
    isLoading: auth.isLoading,
    loadingStage: auth.loadingStage,
    invalidateCache,
  };
}

