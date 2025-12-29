import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const MAX_LOADING_TIME = 10000; // 10 seconds max loading time

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);
  const [forceShow, setForceShow] = useState(false);

  // Handle loading state with timeout fallback
  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    // Set a timeout to force show content after MAX_LOADING_TIME
    const timeout = setTimeout(() => {
      console.warn('ProtectedRoute: Loading timeout reached, forcing content display');
      setForceShow(true);
    }, MAX_LOADING_TIME);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // If loading timed out, show content anyway (if authenticated)
  if (forceShow && isAuthenticated) {
    return <>{children}</>;
  }

  if (isLoading && showLoading && !forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              className="h-16 w-16 rounded-full border-4 border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <motion.p
            className="text-muted-foreground font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Carregando...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
