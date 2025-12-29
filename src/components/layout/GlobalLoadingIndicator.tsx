import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlobalLoadingIndicatorProps {
  isLoading: boolean;
  className?: string;
}

/**
 * Componente de indicador de loading global
 * Exibe uma barra de progresso animada no topo da página
 */
export function GlobalLoadingIndicator({ isLoading, className }: GlobalLoadingIndicatorProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden",
            className
          )}
        >
          {/* Background track */}
          <div className="absolute inset-0 bg-primary/20" />
          
          {/* Animated progress bar */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary"
            initial={{ width: "0%", x: "0%" }}
            animate={{
              width: ["0%", "40%", "70%", "100%"],
              x: ["0%", "0%", "0%", "0%"],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "500%" }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Versão alternativa com spinner discreto no canto
 */
export function GlobalLoadingSpinner({ isLoading, className }: GlobalLoadingIndicatorProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "fixed top-4 right-4 z-[100] flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border shadow-lg",
            className
          )}
        >
          <motion.div
            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              ease: "linear",
              repeat: Infinity,
            }}
          />
          <span className="text-xs font-medium text-muted-foreground">Carregando...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
