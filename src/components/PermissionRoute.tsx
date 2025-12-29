import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface PermissionRouteProps {
  children: React.ReactNode;
}

/**
 * Componente de rota que verifica permissões de tela
 * 
 * Usa a tabela tab_permissao_tela para verificar se o usuário
 * tem acesso à rota atual baseado em seus perfis (roles)
 */
export function PermissionRoute({ children }: PermissionRouteProps) {
  const { isAuthenticated, isLoading, canAccess, getScreenName } = useAuthContext();
  const { toast } = useToast();
  const location = useLocation();
  const hasShownToast = useRef(false);

  const hasAccess = canAccess(location.pathname);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess && !hasShownToast.current) {
      hasShownToast.current = true;
      const screenName = getScreenName(location.pathname);
      toast({
        title: 'Acesso negado',
        description: screenName 
          ? `Você não tem permissão para acessar "${screenName}".`
          : 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [isLoading, isAuthenticated, hasAccess, toast, getScreenName, location.pathname]);

  // Reset toast flag quando navegar para outra página
  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, [location.pathname]);

  // Parent ProtectedRoute already handles loading, so no need to show loading here
  // Just check authentication (should already be authenticated due to parent route)
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
