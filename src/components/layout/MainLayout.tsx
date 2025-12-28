import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from '@/components/CommandPalette';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' }
};

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('mc-hub-sidebar', false);
  const [commandOpen, setCommandOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col min-h-screen"
      >
        <Topbar onSearchOpen={() => setCommandOpen(true)} />
        
        <main className="flex-1 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={pageTransition.transition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}