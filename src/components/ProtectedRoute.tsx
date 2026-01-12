import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext, LoadingStage } from '@/contexts/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/profile/ProfileCompletionModal';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import loadingIcon from '@/assets/loading-icon.png';
import { useState, useCallback } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const stageMessages: Record<LoadingStage, string> = {
  idle: 'Preparando...',
  session: 'Verificando sessão...',
  roles: 'Carregando perfis...',
  permissions: 'Carregando permissões...',
  complete: 'Pronto!',
  timeout: 'Tempo esgotado',
  error: 'Erro ao carregar',
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loadingStage, hasTimedOut, hasError, retryLoading } = useAuthContext();
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();
  const location = useLocation();
  const [profileCompleted, setProfileCompleted] = useState(false);

  const handleProfileComplete = useCallback(() => {
    setProfileCompleted(true);
  }, []);

  // Show timeout/error state with retry button
  if (hasTimedOut || hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 max-w-md text-center px-4"
        >
          {hasTimedOut ? (
            <Clock className="w-12 h-12 text-amber-500" />
          ) : (
            <AlertCircle className="w-12 h-12 text-destructive" />
          )}
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {hasTimedOut ? 'Carregamento demorou muito' : 'Erro ao carregar dados'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasTimedOut 
                ? 'A conexão está lenta ou houve um problema de rede. Tente novamente.'
                : 'Não foi possível carregar suas informações. Verifique sua conexão e tente novamente.'}
            </p>
          </div>
          
          <Button 
            onClick={retryLoading}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading || isProfileLoading) {
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

  // Show profile completion modal if profile is incomplete
  // Skip this check if user is on /perfil page to allow manual editing
  if (!isProfileComplete && !profileCompleted && location.pathname !== '/perfil') {
    return <ProfileCompletionModal onComplete={handleProfileComplete} />;
  }

  return <>{children}</>;
}
