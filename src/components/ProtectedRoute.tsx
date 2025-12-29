import { forwardRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  function ProtectedRoute({ children }, _ref) {
    const { isAuthenticated, isLoading } = useAuthContext();
    const location = useLocation();

    if (isLoading) {
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
);

ProtectedRoute.displayName = 'ProtectedRoute';
