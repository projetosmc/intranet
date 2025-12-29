import { createContext, useContext, ReactNode } from 'react';
import { useLoadingState } from '@/hooks/useLoadingState';

interface GlobalLoadingContextType {
  isLoading: boolean;
  isLoadingKey: (key: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, key?: string) => Promise<T>;
  loadingKeys: string[];
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(null);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const loadingState = useLoadingState();

  return (
    <GlobalLoadingContext.Provider value={loadingState}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

/**
 * Hook para acessar o estado de loading global
 * Útil para mostrar indicadores de loading em qualquer parte da aplicação
 */
export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}
