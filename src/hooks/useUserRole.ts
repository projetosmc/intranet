import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook wrapper para roles de usuário
 * Utiliza o AuthContext centralizado com React Query
 */
export function useUserRole() {
  const auth = useAuthContext();

  return {
    roles: auth.roles,
    isAdmin: auth.isAdmin,
    isModerator: auth.isModerator,
    isLoading: auth.isLoading,
    loadingStage: auth.loadingStage,
    refetch: auth.invalidateCache,
    invalidateCache: auth.invalidateCache,
  };
}

