import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LoadingIcon } from '@/components/layout/GlobalLoadingIndicator';

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

  const hasAccess = !isLoading && isAuthenticated ? canAccess(location.pathname) : true;

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

  // Aguarda o carregamento completar - mostra loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <LoadingIcon size="lg" />
          <span className="text-sm text-muted-foreground">Verificando permissões...</span>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
