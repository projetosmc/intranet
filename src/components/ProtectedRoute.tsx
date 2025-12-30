import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext, LoadingStage } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import loadingIcon from '@/assets/loading-icon.png';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const stageMessages: Record<LoadingStage, string> = {
  idle: 'Preparando...',
  session: 'Verificando sessão...',
  roles: 'Carregando perfis...',
  permissions: 'Carregando permissões...',
  complete: 'Pronto!',
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loadingStage } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.img
            src={loadingIcon}
            alt="Carregando"
            className="w-16 h-16 object-contain"
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

  return <>{children}</>;
}
