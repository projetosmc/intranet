import { useState, useCallback, useMemo } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseLoadingStateReturn {
  isLoading: boolean;
  isLoadingKey: (key: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, key?: string) => Promise<T>;
  loadingKeys: string[];
}

/**
 * Hook centralizado para gerenciar estados de loading
 * 
 * Uso básico:
 * const { isLoading, startLoading, stopLoading } = useLoadingState();
 * 
 * Uso com múltiplas chaves:
 * const { isLoadingKey, startLoading, stopLoading } = useLoadingState();
 * startLoading('fetchUsers');
 * startLoading('fetchPosts');
 * 
 * Uso com wrapper async:
 * const { withLoading } = useLoadingState();
 * const data = await withLoading(() => fetchData(), 'fetch');
 */
export function useLoadingState(initialLoading = false): UseLoadingStateReturn {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(() => 
    initialLoading ? { default: true } : {}
  );

  const startLoading = useCallback((key = 'default') => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  }, []);

  const stopLoading = useCallback((key = 'default') => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const isLoadingKey = useCallback((key: string) => {
    return loadingStates[key] === true;
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    fn: () => Promise<T>, 
    key = 'default'
  ): Promise<T> => {
    startLoading(key);
    try {
      return await fn();
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const isLoading = useMemo(() => 
    Object.keys(loadingStates).length > 0,
    [loadingStates]
  );

  const loadingKeys = useMemo(() => 
    Object.keys(loadingStates),
    [loadingStates]
  );

  return {
    isLoading,
    isLoadingKey,
    startLoading,
    stopLoading,
    withLoading,
    loadingKeys,
  };
}

/**
 * Hook para gerenciar múltiplos estados de loading por contexto
 * Útil para páginas com múltiplas seções de carregamento independentes
 */
export function useMultiLoadingState(keys: string[]) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(() =>
    keys.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isAllLoading = useMemo(() => 
    Object.values(loadingStates).every(Boolean),
    [loadingStates]
  );

  const isAnyLoading = useMemo(() => 
    Object.values(loadingStates).some(Boolean),
    [loadingStates]
  );

  const isLoadingKey = useCallback((key: string) => 
    loadingStates[key] === true,
    [loadingStates]
  );

  return {
    loadingStates,
    setLoading,
    isAllLoading,
    isAnyLoading,
    isLoadingKey,
  };
}
