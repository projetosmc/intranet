import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext, LoadingStage } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import loadingIcon from '@/assets/loading-icon.png';

interface AdminRouteProps {
  children: React.ReactNode;
}

const stageMessages: Record<LoadingStage, string> = {
  idle: 'Preparando...',
  session: 'Verificando sessão...',
  roles: 'Verificando administrador...',
  permissions: 'Carregando permissões...',
  complete: 'Pronto!',
};

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, loadingStage, isAdmin } = useAuthContext();
  const { toast } = useToast();
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [isLoading, isAuthenticated, isAdmin, toast]);

  // Reset toast flag when navigating away
  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.img
            src={loadingIcon}
            alt="Carregando"
            className="w-12 h-12 object-contain"
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          
          {/* Progress indicator */}
          <div className="flex flex-col items-center gap-2">
            <motion.p
              key={loadingStage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground font-medium text-sm"
            >
              {stageMessages[loadingStage]}
            </motion.p>
            
            {/* Stage dots */}
            <div className="flex gap-2">
              {(['session', 'roles', 'permissions'] as LoadingStage[]).map((stage, index) => {
                const stageIndex = ['session', 'roles', 'permissions'].indexOf(loadingStage);
                const isActive = index <= stageIndex;
                const isCurrent = stage === loadingStage;
                
                return (
                  <motion.div
                    key={stage}
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-primary' : 'bg-muted'
                    }`}
                    animate={isCurrent ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                    } : {}}
                    transition={{
                      duration: 0.8,
                      repeat: isCurrent ? Infinity : 0,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
